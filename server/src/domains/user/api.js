const express = require('express')
const logger = require('../libraries/log/logger');
const {AppError} = require('../../libraries/error-handling/AppError');

const {
    create,
    search,
    getbyId,
    updateById,
    deleteByID,
    fetchGitHubPullRequest,
} = require('./service');

const {
    createSchema,
    updateSchema,
    idSchema,
    seachSchema
} = require('./request');

const {validateRequest} = require('../../middlewares/request-validate');
const {logRequest} = require('../../middlewares/log');
const schema = require('../../configs/config.schema');

const model = 'user';

const routes = ()=> {
    const router = express.Router();
    logger.info(`Setting up routes for ${model}`);
    
    router.get(
        '/search',
        logRequest({}),
        validateRequest({schema: seachSchema, isQuery: true}),
        async (req, res, next) => {
            try{
                const items = await search(req.query);
                res.json({items});
            }catch(error){
               next(error);
            }
        }
    );

    router.get(
        '/count',
        logRequest({}),
        validateRequest({schema: seachSchema, isQuery: true}),
        async (req, res, next) => {
            try{
                const total = await count(req.query);
                res.json({total});
            }catch(error){
               next(error);
            }
        }
    );

    router.get(
        '/fetch-updates', logRequest({}), async(req, res, next) => {
            try{
                const items = await fetchGitHubPullRequest(req.user);
                res.json(items);
            }catch(error){
               next(error);
            }
        }
    );


    router.get(
        '/:id',
        logRequest({}),
        validateRequest({schema: idSchema, isParam: true}),
        async (req, res, next) => {
            try{
                const item = await getbyId(req.params.id);
                if(!item){
                    throw new AppError (`${model} not found`, `${model} not found`, 404);
                }
                res.status(200).json(item);
            }catch(error){
               next(error);
            }
        }
    );

    return router;
}

module.exports = {routes}