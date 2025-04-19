const {encryptToken, decryptToken} = require('./util')
const {updateById} = require('../domain/user/service')

const {
     getGithubStrategy, 
     getOrCreateUserFromGithubProfile,
} = require('./gihubStrategy')

const {
    localStrategy,
    registerUser,
    verifyEmail,
    resendVerificationEmail
} = require('./localStrategy');

const {
    getGoogleStrategy,
    getOrCreateUserFromGoogleProfile,
} = require('./googleStrategy');

const clearAuthInfo = async (userId) => {
    return await updateById(userId, {
        accessToken: null,
        accessTokenIV: null,
        updatedAt: new Date(),
    });
};

module.exports = {
    getGithubStrategy,
    getOrCreateUserFromGithubProfile,
    clearAuthInfo,
    encryptToken,
    decryptToken,
    localStrategy,
    registerUser,
    getGoogleStrategy,
    getOrCreateUserFromGoogleProfile,
    verifyEmail,
    resendVerificationEmail
}