const logger = require('../log/logger')
const util = require('util')
const {AppError} = require('./AppError');
const { listenerCount } = require('process');
const { profile } = require('console');
const { normalize, resolve } = require('path');
const { appendFile } = require('fs');
const { json } = require('stream/consumers');

let httpServerRef;

const errorHandler = {
    listenToErrorEvents: (httpServer) => {
        httpServerRef = httpServer;

        process.on('uncaughtException', async(error) => {
            await errorHandler.handleError(error);
        })

        process.on('unhandledRejection', async(reason)=>{
            await errorHandler.handleError(reason);
        })

        process.on('SIGTERM', async()=>{
            logger.error(
                'App received SIGTERM event, try to gracefully close the server '
            );

            await terminateHttpServerAndExit();
        })

        process.on('SIGINT', async()=> {
            logger.error(
                'App received SIGINT event, try to gracefully close the server '
            )

            await terminateHttpServerAndExit();
        })
    },
    handleError: async(errorToHandle) => {
        try{
            const appError = normalizeError(errorHandle);
            logger.error(appError.message, appError);
    
    
            if(!appError){
                terminateHttpServerAndExit();
            }
            return appError;
        }catch(handlingError){
         process.stdout.write(
            'The error handler failed. Here are the handler failure and then the origin error that it tried to handle.'
         )
    
         process.stdout.write(JSON.stringify(handlingError));
         process.stdout.write(JSON.stringify(errorHandle));
        }
    }
}

const terminateHttpServerAndExit = async()=>{
    if(httpServerRef){
        await new Promise((resolve)=> httpServerRef.close(resolve));
    }
    process.exit();
}

const normalizeError = (errorHandle)=>{
    if(errorHandle instanceof AppError){
        return errorHandle;
    }


    if(errorHandle instanceof Error){
        const appError = new AppError(errorHandle.name, errorToHandle.message);
        appError.stack = errorHandle.stack;
        return appError;
    }

    const inputType = typeof errorToHandle;
    return new AppError(
        'general-error',
        `Error Handler received a none error instace with type- ${inputType}, value - ${util.inspect(
            errorHandle
        )}`
    )
}

module.exports = {errorHandler};