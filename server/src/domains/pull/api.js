const express = require('express')
const logger = require('../../libraries/log/logger')
const {AppError} = require('../../libraries/error-handling/AppError')

const {
    create,
    search,
    getById,
    updateById,
    deleteById,
    fetchGithubPullRequests,
} = require('./service');

const{
    createSchema,
    updateSchema,
    idSchema,
    searchSchema,
} = require('./request');

const{validateRequest} = require('../../middlewares/request-validate');
const {logRequest} = require('../../middlewares/log');

const model = 'pull';

const routes =()=>{
    const router = express.Router();
    logger.info(`Setting up routes for ${model}`);

    router.get(
        '/search',
        logRequest({}),
        validateRequest({schema: searchSchema, isQuery: true}),
        
        async(req, res, next)=>{
            try{
                const items = await search(req.query);
                res.json(items);
            }catch(error){
                next(error);
            }
        }
    );

    router.get(
        '/count',
        logRequest({}),
        validateRequest({schema: searchSchema, isQuery: true}),

        async(req, res, next) =>{
            try{
                const total = await count(req.query);
                res.json({total});
            }catch(error){
                next(error);
            }
        }
    );

    router.get('/fetch-updates', logRequest({}), async(req, res,next) =>{
        try{
            const items = await fetchGithubPullRequests(req.user);
            res.json(items);
        }catch(error){
            next(error);
        }
    })



    router.get(
        '/:id',
        logRequest({}),
        validateRequest({schema: idSchema, isParam: true}),
        async(req, res, next) => {
            try{
                const item = await getById( req.params.id)
                
                if(!item){
                    throw new AppError(`${model} not found`, `${model} not found`, 404);
                }

                res.status(200).json(item);
            }catch(error){
                next(error);
            }
        }
    );

    return router;
}

module.exports = {routes};