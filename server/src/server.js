const config = require("./config");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const passport = require("passport");
const session = require("express-session");

const MongoStore = require("connect-mongo");

const defineRoutes = require("./app");
const { errorHandler } = require("./libraries/error-handling");
const logger = require("./libraries/log/logger");
const {
  addRequestIdMiddleware,
} = require("./middlewares/request/request-context");
const { connectWithMongoDB } = require("./libraries/db");

const {
  getGitHubStrategy,
  clearAuthInfo,
  localStrategy,
  rigisterUser,
  getGoogleStrategy,
  verifyEmail,
  resendVerficationEmail,
} = require("./auth");

const { AppError } = require("./libraries/error-handling/AppError");
const {
  getClientPermissionByRoleIdentifierSync,
} = require("./domains/role/service");
const { configDotenv } = require("dotenv");
const { connect } = require("mongoose");

let connection;

const createTrimmedUser = (user) => ({
  _id: user._id,
  email: user.email,
  authType: user.authType,
  displayName: user.displayName,
  isAdmin: user.isAdmin,
  isSuperAdmin: user.isSuperAdmin,
  isDeactivated: user.isDeactivated,
  isDemo: user.isDemo,
  role: user.role,
  permission: user.permission,
});

const handleAuthCallback = (strategy) => {
  return [
    function (req, res, next) {
      passport.authenticate(
        strategy,
        {
          failureRedirect: `${config.CLIENT_HOST}/login`,
        },
        (err, user, info, status) => {
          if (err || !user) {
            logger.error("Failed to authenticate user", err);
            return res.redirect(
              `${config.CLIENT_HOST}/login? error=${err?.name}`
            );
          }

          const trimmedUser = createTrimmedUser(user);
          req.logIn(trimmedUser, function (err) {
            if (err) {
              return res.redirect(
                `${config.CLIENT_HOST}/login?error=failed-to-authenticate`
              );
            }

            logger.info("saving session for user", {
              user: trimmedUser,
            });
            req.session.userId = trimmedUser._id.toString();
            req.session.sessionId = req.sessionID;

            req.session.save((err) => {
              if (err) {
                logger.error("Failed to save session", err);
              } else {
                logger.info("Session saved");
              }
            });

            next();
          });
        }
      )(req, res, next);
    },

    function (req, res) {
      if (strategy === "github") {
        logger.info("/api/auth/github/callback", {
          username: req.user.username,
        });
      }

      const userId = req.user._id.toString();
      res.cookie("userId", userId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      res.redirect(`${config.CLIENT_HOST}/login-success`);
    },
  ];
};

const createExpressApp = () => {
  const expressApp = express();
  expressApp.use(addRequestIdMiddleware);
  expressApp.use(helmet());
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(express.json());
  expressApp.use(cookieParser());

  expressApp.use(
    cors({
      origin: config.CLIENT_HOST,
      credentials: true,
    })
  );

  passport.use(localStrategy);
  passport.use(getGitHubStrategy);
  passport.use(getGoogleStrategy);

  const sessionStore = MongoStore.create({
    mongoUrl: config.mongoUrl,
  });

  expressApp.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: sessionStore,
    })
  );

  expressApp.use(passport.initialize());
  expressApp.use(passport.session());

  passport.serializeUser(async function (user, done) {
    const trimmedUser = createTrimmedUser(user);
    done(null, trimmedUser);
  });

  express.use((req, res, next) => {
    logger.info("Express middleware are set up");

    expressApp.get("/api/auth/github", passport.authenticate("github"));
    expressApp.get(
      "/api/auth/github/callback",
      ...handleAuthCallback("github")
    );
    expressApp.get(
      "/api/auth/google/callback",
      ...handleAuthCallback("google")
    );

    expressApp.get("/api/user", (req, res) => {
      if (!req.user) {
        return res.status(401).send("Unauthorized");
      }

      const userResponse = createTrimmedUser(req.user);
      res.json(userResponse);
    });
  });

  expressApp.post("/api/register", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const newUser = await registerUser({ email, password });

      res
        .status(201)
        .json({ message: "Registration successful. please check your email" });
    } catch (err) {
      next(err);
    }
  });

  if (process.env.NODE_ENV === "development") {
    const {
      listDebugEmails,
      readDebugEmail,
      isDebugMode,
    } = require("./libraries/email/emailService");

    expressApp.get("/api/debug/emails", async (req, res) => {
      if (!isDebugMode) {
        return res
          .status(400)
          .json({ message: "Email debug mode is not enabled" });
      }

      const emails = await listDebugEmails();
      res.json(emails);
    });

    expressApp.get("/api/debug/emails/:filename", async (req, res) => {
      if (!isDebugMode) {
        return res.status(400).json({
          message: "Email debug mode is not enabled",
        });
      }

      try {
        const content = await readDebugEmail(req.params.filename);
        res.send(content);
      } catch (error) {
        res.status(404).json({ message: "Email not found" });
      }
    });
  }

  expressApp.get("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res
          .status(404)
          .json({ message: "verification token is required" });
      }

      const result = await verifyEmail(token);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          message: error.message,
          code: err.name,
        });
      }
      next(error);
    }
  });

  expressApp.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
      logger.info("login attempt", { err, user, info });

      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          message: info.message || "Authenticate failed",
          reason: info.reason,
        });
      }

      user.permission = {
        client: await getClientPermissionByRoleIdentifierSync(user.role),
      };

      req.logIn(user, (error) => {
        if (err) {
          return next(err);
        }
      });

      const trimmedUser = createTrimmedUser(user);

      req.session.userId = trimmedUser._id.toString();
      req.session.sessionID = req.sessionID;

      logger.info("saving session for user", { user: trimmedUser });

      req.session.save((err) => {
        if (err) {
          logger.error("Failed to save session", err);
          return next(err);
        }

        logger.info("Session saved successfully", {
          sessionID: req.sessionId,
          userId: trimmedUser._id,
        });

        return res.json({
          message: "Login Successfully",
          user: trimmedUser,
        });
      });
    })(req, res, next);
  });

  expressApp.get("/api/logout", async (req, res, next) => {
    const username = req.user?.username;
    const userId = req.user?._id;

    console.log("req.session", req.session);
    console.log("req.session.userId", req.session.userId);

    req.logout(async function (err) {
      if (err) {
        logger.error("Failed to log out user", err);
        return next(err);
      }

      req.session.destroy(function (err) {
        if (err) {
          logger.error("Failed to destroy session", err);
        } else {
          logger.info("Session destroyed");
        }
      });

      res.cookie("userId", "", {
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      await clearAuthInfo(userId);

      logger.info("User logged Out", { username });
      res.redirect(`${config.CLIENT_HOST}/login`);
    });
  });

  expressApp.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  expressApp.post("/api/resend-verification", async (req, res, next) => {
    try {
      const { email } = req.body;
      logger.info("resend-verificaiton", { email });
      if (!email) {
        return res.status(400).json({ message: "Emaili is required" });
      }

      const result = await resendVerficationEmail(email);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          message: err.message,
          code: err.name,
        });
      }
      next(err);
    }
  });

  defineRoutes(expressApp);
  defineErrorHandlingMiddleware(expressApp);
  return expressApp;
};

async function startWebServer() {
    logger.info('Starting web server');
    const expressApp = createExpressApp();
    const APIAddress = await openconnection(expressApp)
    logger.info(`Server is running on ${APIAddress.address}: ${APIAddress.port}`);
    await connectWithMongoDB();
    return expressApp;
}

async function stopWebServer() {
    return new Promise ((resolve) => {
        if(connection!==undefined){
            connection.close(()=>{
                resolve();
            })
        }
    })
}

async function openconnection() {
    return new Promise ((resolve)=>{
        const webServerPort = config.PORT ;
        logger.info(`Server is about to listen to port ${webServerPort}`);
  

    connection = expressApp.listen(wenbServerPort, ()=>{
        errorHandler.listenToErrorEvents(connection);
        resolve(connection.address());
    })

  })
}

function defineErrorHandlingMiddleware(expressApp){
    expressApp.use(async(error, req, res, next)=>{
        if(error && typeof error === 'object'){
            if(error.isTrusted === undefined || error.isTrusted === null){
                error.isTrusted = true;
            }
        }

        const appError = await errorHandler.handleError(error);
        res.status(error?.HTTPStatus || 500).json(
            {...appError, errorMessage: appError.message} || {
                message: 'Internal Server error'
            }
        ).end();
    });
}

module.exports = {createExpressApp, startWebServer, stopWebServer};

