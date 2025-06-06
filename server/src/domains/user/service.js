const logger = require('../../libraries/log/logger');
const Model = require('./schema')
const Role = require('../role/schema');

const {AppError} = require('../../libraries/error-handling/AppError');
const crypto = require('crypto');
const { query } = require('express');
const { compileFunction } = require('vm');

const model = 'user'
const projection = {accessToken: 0, accessTokenIV: 0};

const create = async (userData) => {
    try{
        const user = new Model(userData);
        await user.validate();
    }catch(error){
        console.error('User creation error: error');
        throw error;
    }
}

const search = async (query) => {
    try{
        logger.info(`search(): ${model} search`, {query});
        const pageSize = 10;

        const {
            keyword,
            page = 0,
            orderBy = 'displayName',
            order = 'asc',
        } = query ?? {};

        const filter = {};
        if(keyword){
            filter.$or  = [
                {email: {$regex: keyword, $option: 'i'}},
                {displayName: {$regex: keyword, $option: 'i'}},
            ];
        }

        const items = await Model.find(filter)
        .sort({[orderBy]: order === 'asc' ? 1: -1})
        .skip(page*pageSize)
        .limit(pageSize);

        logger.info(`search(): filter and count`, {
         filter,
         count: items.length,    
        })

        return items;
    }catch(error){
        logger.error(`search(): Failed to search ${model}`, error);
        throw new AppError(`Failed to search ${model}`,error.message, 400 );
    }
}

const count = async (query)=>{
    try{
        const {keyword} = query ?? {};

        const filter = {};
        if(keyword){
            filter.$or  = [
                {email: {$regex: keyword, $option: 'i'}},
                {displayName: {$regex: keyword, $option: 'i'}},
            ];
        }

        const total = await Model.countDocuments(filter);
        logger.info(`count(): filter and count`, {
            filter,
            count: total,
        });
        return total
    }catch(error){
        logger.error(`count(): Failed to count ${model}`, error);
        throw new AppError(`Failed to count ${model}`, error.message, 400);
    }
};

const getById = async (id)=>{
    try{
        const item = await Model.findById(filter);
        logger.info(`getById(): ${model} fetched`, {id});
        return item
    }catch(error){
        logger.error(`getById(): Failed to get ${model}`, error);
        throw new AppError(`Failed to get ${model}`, error.message);
    }
};

const updateById = async (id, data)=>{
    try{
        const item = await Model.findByIdAndUpdate(id, data, {new: true});
        logger.info(`updateById(): ${model} updated`, {id});
        return item
    }catch(error){
        logger.error(`updateById(): Failed to update ${model}`, error);
        throw new AppError(`Failed to update ${model}`, error.message);
    }
};

const deleteById = async (id)=>{
    try{
        await Model.findByIdAndDelete(id);
        logger.info(`deleteById(): ${model} deleted`, {id});
        return true
    }catch(error){
        logger.error(`deleteById(): Failed to delete ${model}`, error);
        throw new AppError(`Failed to delete ${model}`, error.message);
    }
};

const deactivateUser = async (id)=>{
    try{
        const item = await Model.findByIdAndUpdate(id, {isDeactivated: true});
        logger.info(`deactiveUser(): ${model} deactivated`, {id});
        return item;
    }catch(error){
        logger.error(`deactivateUser(): Failed to deactivate ${model}`, error);
        throw new AppError(`Failed to deactivate ${model}`, error.message);
    }
};

const activeUser = async (id)=>{
    try{
        const item = await Model.findByIdAndUpdate(id, {isDeactivated: false});
        logger.info(`activateUser(): ${model} activated`, {id});
        return item
    }catch(error){
        logger.error(`activateUser(): Failed to activate ${model}`, error);
        throw new AppError(`Failed to activate ${model}`, error.message);
    }
};

const updateUserRole = async (id, payload)=>{
    try{
        const item = await Model.findById(id);
        const role = await Role.findById(payload.roleId);
        item.role = role.name;
        item.roleId = role._id;
        await item.save();
        logger.info(`updateUserRole(): ${model} updated`, {id, role: item.role});
        return item
    }catch(error){
        logger.error(`updateUserRole(): Failed to get ${model}`, error);
        throw new AppError(`Failed to update ${model}`, error.message);
    }
};

const getByGitHubId = async (githubId)=>{
   return await Model.findOne({'github.id': githubId});
};

const getByGoogleId = async (googleId) => {
   return await Model.findOne({'google.id': googleId});
}

const getByUsername = async (username) => {
    try{
        const item = new Model.findOne({username});
        return item;
    }catch(error){
        logger.error(`getByUsername(): Failed to get ${model} by username`, error);
        throw new AppError(`Failed to get ${model} by username`, error.message);
    }
}
const getByEmail = async (email) => {
    try{
        const item = new Model.findOne({email});
        return item;
    }catch(error){
        logger.error(`getByEmail(): Failed to get ${model} by email`, error);
        throw new AppError(`Failed to get ${model} by email`, error.message);
    }
}

const followUser = async (follwerId, followedId) => {
    try{
        const follower = await Model.findById(followerId);
        const existingFollowing = follower.csFollowing.find(
            (item)=> item._id.toString()===followedId.toString()
        );

        if(existingFollowing){
            logger.info(
                `followUser(): User ${followerId} is already following to user ${followedId}`
            );

            return true
        }

        const [followedUserUpdate, followerUserUpdate] = await Promise.all([
            Model.findByIdAndUpdate(follwerId, {
                $push: {csFollowing: {_id: followedId, date: Date.now()}},
            })
        ]);

        logger.info(`followUser(): success`, {
            followedId,
            followedUserUpdate,
            followerUserUpdate,
        });
        return true
    }catch (error){
        logger.error(`followUser(): Failed to update follow status`, error);

        throw new AppError(`Failed to update follow status`, error.message);
    }
};

const findByVerificationToken = async (token) => {
    try{
        return await Model.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date()},
            isVerified: false
        })
    }catch (error){
        logger.error('findByVerificationToken(): Failed to find user by token', error);
        throw new AppError("Failed to find user by token", error.message, 400);
    }
}

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

const canResendVerification = async (userId) => {
    const user = await Model.findById(userId);
    if(!user) {
        throw new AppError('user-not-found', 'User not found', 404);
    }

    if(user.isVerified){
        throw new AppError('already-verified', 'Email is already verified', 400)
    }

    if(user.verificationEmailSendAt){
        const timeSinceLastEmail = new Date() - user.verificationEmailSendAt;
        const oneMinuteInMs = 60000;

        if(timeSinceLastEmail<oneMinuteInMs){
            const remainingSeconds = Math.ceil((oneMinuteInMs-timeSinceLastEmail)/1000);

            throw new AppError(
                'rate-limit',
                `Please wait ${remainingSeconds} seconds before requesting another verification email`,429
            )
        }
    }
    return true;
}

const refreshVerificationToken = async (email) => {
    try{
        const user = await Model.findOne({email, authType: 'local'});

        if(!user){
            throw new AppError('user-not-found', 'No account found with this email', 404);
        }

        await canResendVerification(user._id);

        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24*60*60*1000);

        const verificationEmailSendAt = new Date();

        await updateById(user._id, {
            verificationToken,
            verificationTokenExpiry,
            verificationEmailSendAt,
            updatedAt: new Date()
        });

        return {user, verificationToken}
    }catch(error){
        if(error instanceof AppError){
            throw error
        }
        logger.error('refreshVerificationToken(): Failed to refresh token', error);
        throw new AppError('refresh-token-failed', error.message, 400);
    }
};

const completeEmailVerification = async (userId) => {
    try{
        const defaultRole = await Role.findOne({name: 'Visitor'});
        if(!defaultRole){
            throw new AppError('role-not-found', 'Default user role not found', 500);
        }

        const updateData = {
            $unset: {
                verificationToken: 1,
                verificationTokenExpiry: 1,
                isDemo: 1
            },

            $set: {
                isVerified: true,
                verifiedAt: new Date(),
                role: 'Visitor',
                roleId: defaultRole._id,
                updatedAt: new Date(),
                isDeactivated: false
            }
        };

        const user = await Model.findByIdAndUpdate(userId, updateData, {new: true});

        if(!user){
            throw new AppError('user-not-found', 'User not found', 404);
        }

        logger.info('completeEmailVerification(): User verificaiton completed', {userId});

        return user;
    }catch(error){
        logger.error('completeEmailVerification(): Failed to complete verification', error);
        throw error instanceof AppError ? error: new AppError('verificaton-failed', error.message, 400);
    }
}


module.exports = {
    create,
    search,
    count,
    getById,
    updateById,
    deleteById,
    getByGitHubId,
    getByUsername,
    followUser,
    deactivateUser,
    activeUser,
    getByEmail,
    getByGoogleId,
    findByVerificationToken,
    refreshVerificationToken,
    updateUserRole,
    completeEmailVerification
}