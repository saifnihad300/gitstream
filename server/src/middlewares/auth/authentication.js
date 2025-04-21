const logger = require('../../libraries/log/logger')

const isAuthenticated = async (req, res, next)=>{
    if(req.isAuthenticated()){
        return next();
    }else{
        logger.warn('User is not authenticated');

        return res.status(401).json({message: 'Unauthorized'});
    }
}

module.exports = {isAuthenticated}