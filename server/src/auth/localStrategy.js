const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const {
    getByUsername,
    getByEmail,
    create,
    updateById,
    findByVerificationToken,
    refreshVerificationToken,
    completeEmailVerification
} = require('../domains/user/service');

const {AppError} = require('../libraries/error-handling/AppError');
const {sendVerificationEmail} = require('../libraries/email/emailService');
const { resolve } = require('path');
const { userInfo } = require('os');
const { isDeepStrictEqual } = require('util');
const { threadId } = require('worker_threads');

const verifyCallback = async (username, password, done)=> {
    try{
        const user = await getByEmail(username);

        if(!user){
           return done(null, false, {message: 'Incorrect email.'});
        }

        if(user.authType !== 'local'){
            return done(null, false, {
                message: `Please use ${user.authType} authentication for this account`
            });
        }

        if(!user.isVerified) {
            return done(null, false, {message: 'Please verify your email address before signing in', reason: 'email-not-verified'});
        }

        const isValidPassword = await bcrypt.compare(password, user.local.password);
        if(!isValidPassword){
            return done(null, false, {message: 'Incorrect password'});
        }

        if(user.isDeactivated){
            return done(null, false, {message: 'Account is deactivated'});
        }

        return done(null, user);
    }catch(error){
        return done(error);
    }
};

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

const registerUser = async ({email, password})=> {
    try{
        const existingUser = await getByEmail(email);
        if(existingUser){
            throw new AppError('user-already-exists', 'Email already taken', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const verificaitonToken = generateVerificationToken();
        const verificaitonTokenExpiry = new Date(Date.now()+24*60*60*1000);

        const payload = {
            email,
            displayName : email,
            authType: 'local',
            local: {
                username: email,
                password: hashedPassword
            },

            isDemo: false,
            isVerified: false,
            isAdmin: false,
            verificaitonToken,
            verificaitonTokenExpiry,
            isDeactivated: false,
            rele: 'Visitor',
            roleId: null
        };

        const newUser = await create(payload);

        await sendVerificationEmail(email, verificaitonToken);

        const userObj = newUser.toObject();

        const trimmedPayloadForSession = {
            _id: userObj._id,
            email: userObj.email,
            authType: userObj.isAdmin,
            isDeactivated: userObj.isDeactivated,
            isDemo: userObj.isDemo,
            displayName: userObj.displayName
        };

        return trimmedPayloadForSession;
    }catch (error){
        throw new AppError('registration-failed', error.message, 400);
    }
};

const verifyEmail = async (token) => {
    try{
        const user = await findByVerificationToken(token);

        if(!user){
            throw new AppError('invalid-token', 'Invalid or expired verification token', 400);
        }

        await completeEmailVerification(user._id);

        return {message: 'Email verified successfully.'}
    }catch(error){
        if(error instanceof AppError){
            throw error;
        }

        throw new AppError('verification-failed', error.message, 400);
    }
}

const resendVerficationEmail = async(email) => {
    try{
        const{user, verificaitonToken} = await refreshVerificationToken(email);

        await sendVerificationEmail(email, verificaitonToken);

        return {
            message: 'Verification email sent successfully',
            email: user.email
        }
    }catch(error){
        if(error instanceof AppError){
            throw error
        }

        throw new AppError('resend-verification-failed', error.message, 400);
    }
};

const localStrategy = new LocalStrategy(verifyCallback);

module.exports = {
    localStrategy,
    registerUser,
    verifyEmail,
    resendVerficationEmail
}