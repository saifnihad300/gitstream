const config = require('../config');
const githubStrategy = require('passport-github2').Strategy;


const {encryptToken} = require('./util')

const {
    getByGithubId,
    create,
    updateById
} = require('../domains/user/service');

const { AppError } = require('../libraries/error-handling/AppError');

const getGitHubStrategy = () => {
    return new GithubStrategy({
        clientID: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        callbackURL : `${config.Host}/api/auth/github/callback`
    },
    
    async (accessToken, refreshToken, profile, cb) => {

        try{
            const trimmedPayloadForSession = await getOrCreateUserFromGithubProfile({
                profile,
                accessToken
            })

            cb(null, trimmedPayloadForSession);
        }catch (error){
            cb(error, null);
        }
    }
)
};

async function getOrCreateUserFromGithubProfile({profile, accessToken}) {
    const isAdmin = config.ADMIN_USERNAMES.includes(profile.username);

    const payload = {
        email: profile._json.email,
        displayName: profile.displayName,
        authType: 'github',

        github: {
            id: profile.id,
            nodeId: profile.nodeId,
            profileUrl: profile._json.avatar_url,
            avatarUrl: profile._json.avatar_url,
            apiUrl: profile._json.company,
            company: profile._json.company,
            blog: profile._json.blog,
            location: profile._json.location,
            hireable: profile._json.hireable,
            bio: profile._json.bio,
            public_repos: profile._json.public_repos,
            public_gists: profile._json.public_gists,
            followers: profile._json.followers,
            following: profile._following,
            created_at: profile._json.created_at,
            updated_at: profile._json.updated_at
        },

        isDemo: false,
        isVerified: true,
        isAdmin
    }

    let user = await getByGithubId(profile.id);

    const tokenInfo = encryptToken(accessToken);

    if(user){
        if(user.isDeactivated){
            throw new AppError('user-is-deactivated', 'User is deactivated', 401);
        }

        user = Object.assign(user, payload, {
            github: {
                ...payload.github,
                accessToken: tokenInfo.token,
                accessTokenIV: tokenInfo.iv,
            },
            updated_at: new Date(),
        });

        await updateById(user._id, user);
    }else{
        user = await create({
            ...payload,
            github: {
                ...payload.github,
                accessToken: tokenInfo.token,
                accessTokenIV: tokenInfo.iv
            }
        });
    }

    const userObj = user.toObject();
    const trimmedPayloadForSession = {

        _id: userObj._id,
        email: userObj.email,
        authType: userObj.authType,
        isAdmin: userObj.isAdmin,
        isDeactivated: userObj.isDeactivated,
        isDemo: userObj.isDemo,
        displayName: userObj.displayName,
        avatarUrl: userObj.github.avatarUrl,
    };

    return trimmedPayloadForSession;
}

module.exports = {
    getGitHubStrategy,
    getOrCreateUserFromGithubProfile
}