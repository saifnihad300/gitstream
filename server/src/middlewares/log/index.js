const logger = require('../../libraries/log/logger')

const logRequest = ({fields = {}})=>{
    return (req, res, next)=>{
        const logData = {};
        if(req.params){
            logData.params = req.params
        }
        if(req.query){
            logData.query = req.query;
        }
        
        if(req.body){
            if(fields && fields.length){
                fields.forEach((field)=>{
                    logData[field] = req.body[field]
                });
            }else{
                logData.body = req.body
            }
        }
        logger.info(`${req.method} ${req.originalUrl}`, logData);

        const oldEnd = res.end;

        res.end = function(...args){
            logger.info(`${req.method} ${req.originalUrl} `, {
                statusCode: res.statusCode
            });

            oldEnd.apply(this.args)
        }

        next();
    }
}

module.exports = {logRequest}