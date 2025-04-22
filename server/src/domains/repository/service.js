const logger = require('../../libraries/log/logger');
const Model = require('./schema')
const User = require('../user/schema')

const {AppError} = require('../../libraries/error-handling/AppError');
const github = require('../../libraries/util/githubUtils');
const {decryptToken} = require('../../auth');
const { followUser } = require('../user/service');

const model = 'repository'
const projection = {};

const create = async (data) => {
    try{
        const item = new Model(data);
        const saved = await item.save();

        logger.info(`create(): ${model} created`, {
            id: saved._id,
        });
        return saved;
    }catch(error){
        console.error(`create(): Failed to create ${model}`, error);
        throw new AppError(`Failed to create ${model}`, error.message);
    }
}

const search = async (query) => {
    try{
        logger.info(`search(): ${model} search`, {query});
        const pageSize = 10;

        const {
            keyword,
            page = 0,
            orderBy = 'full_name',
            order = 'asc',
        } = query ?? {};

        const filter = {};
        if(keyword){
            filter.$or  = [
                {full_name: {$regex: keyword, $option: 'i'}},
                {language: {$regex: keyword, $option: 'i'}},
            ];
        }

        const items = await Model.find(filter, projection)
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
                {full_name: {$regex: keyword, $option: 'i'}},
                {language: {$regex: keyword, $option: 'i'}},
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

const searchOne = async (searchPayload) => {
    try{
        const {username, repository} = searchPayload ?? {};

        if(!username || !repository){
            throw new AppError(
                'Username and Repository are required',
                'Bad Request',
                400
            )
        }

        let filter = {};
        if(username && repository) {
            filter = {
                full_name: `${username}/${repository}`,
            };
        }

        const item = await Model.findOne(filter).exec();
        logger.info('search (): filter and count', {
            filter,
            count: Boolean(item) ? 1: 0,
        });
        return item;
    }catch(error){
        logger.error(`search(): Failed to search ${model}`, error);
        throw new AppError(`Failed to search ${model}`, error.message, 400);
    }
}


const getById = async (id)=>{
    try{
        const item = await Model.findById(id);
        logger.info(`getById(): ${model} fetched`, {id, _id: item?._id});
        return item
    }catch(error){
        logger.error(`getById(): Failed to get ${model}`, error);
        throw new AppError(`Failed to get ${model}`, error.message, 
            error.HTTPStatus || 400
        );
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

const mapGithubResponseToSchema = (response) => {
    return{
        id: response.id,
        node_id: response.node_id,
        name: response.name,
        full_name: response.full_name,
        private: response.private,

        owner: {
            login: response.owner.login,
            id: response.owner.id,
            avatar_url: response.owner.avatar_url,
            type: response.owner.type
        },

        html_url: response.html_url,
        description: response.description,
        fork: response.fork,
        url: response.url,
        created_at: new Date(response.created_at),
        updated_at: new Date(response.updated_at),
        pushed_at: new Date(response.pushed_at),
        homepage: response.homepage,
        size: response.size,
        startgazers_count: response.startgazers_count,
        watchers_count: response.watchers_count,
        language: response.language,
        languages: response.languages,
        forks_count: response.forks_count,
        archived: response.archived,
        disabled: response.disabled,
        open_issues_count: response.open_issues_count,
        license: {
            key: response.license.key,
            name: response.license.name,
            spdx_id: response.license.spdx_id,
            url: response.license.url,
            node_id: response.license.node_id
        },
        topics: response.topics,
        visibility: response.visibility,
        default_branch: response.default_branch
    }
}

const mapSelectedGithubResponseToSchema = (response) => {
    return {
        description: response.description,
        updated_at: new Date(response.updated_at),
        pushed_at: new Date(response.pushed_at),
        homepage: response.homepage,
        size: response.size,
        startgazers_count: response.startgazers_count,
        watchers_count: response.watchers_count,
        language: response.language,
        languages: response.languages,
        forks_count:response.forks_count,
        archived: response.archived,
        disabled: response.disabled,
        open_issues_count: response.open_issues_count,
        topics: response.topics
    }
}

const fetchGithubRepoDetails = async (owner, reportError, user) => {
    try{
        const {_id} = user;
        const dbUser = await User.findById(_id).exec();
        const {accessToken, accessTokenIV} = dbUser;
        const token = decryptToken(accessToken, accessTokenIV);

        const response = await github.fetchRepoDetails(owner, reportError, token);

        const {id} = response;

        const existingRepository = await Model.findOne({id}).exec();

        if(existingRepository){
            const data = mapSelectedGithubResponseToSchema(response);
            const updatedRepository = await updateById(existingRepository._id, data);
            return updatedRepository;
        }

        const data = mapGithubResponseToSchema(response);
        const repository = await create(data);
        return repository;
    }catch(error){
        logger.error(
            'fetchGithubRepoDetails(): Failed to fetch repository details', error
        );

        throw new AppError('Failed to fetch repository details', error.message);
    }
}

const followRepository = async (followerId, repositoryId) => {
    try{
        const follower = await User.findById(followerId);
        const existingFollowing = follower.csFollowingRepositories.find((item)=> item._id.equals(repositoryId))

        if(existingFollowing){
            logger.info(`followRepository(): User ${followerId} is already following repository ${repositoryId}`);
    
            return false;
        }

        const [repositoryUpdate, followerUpdate] = await Promise.all([
            Model.findByIdAndUpdate(repositoryId, {
                $push: {csFollowers: {_id: followerId, date: Date.now()}},
            }),

            User.findByIdAndUpdate(followerId, {
                $push: {
                    csFollowingRepositories: {_id: repositoryId, date: Date.now()}
                },
            }),
        ])

        logger.info(`followRepository(): success`, {
            repositoryId,
            repositoryUpdate,
            followerUserUpdate
        })

        return true
    }catch(error){
        logger.error(`followRepository(): Failed to update follow status`, error)
        throw new AppError(`Failed to update follow status`, error.message);
    }

    
}

module.exports = {
    create,
    search,
    count,
    searchOne,
    getById,
    updateById,
    deleteById,
    fetchGithubRepoDetails,
    followRepository
}