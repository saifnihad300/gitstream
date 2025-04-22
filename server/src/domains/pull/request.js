const Joi = require('joi')
const mongoose = require('mongoose')

const createSchema = Joi.object().keys({
    name: Joi.string().required(),
})

const updateSchema = Joi.object().keys({
    name: Joi.string(),
})

const idSchema = Joi.object().keys({
    id: Joi.string()
    .custom((value, helpers)=>{
        if(!mongoose.Types.ObjectId.isValid(value)){
            return helpers.error('any.invalid');
        }
        return value
    }, 'ObjectId validation'.required(),)
});

const seachSchema = Joi.object({
    keyword: Joi.string().allow('').optional().max(50),
    page: Joi.number().integer().min(0),
    orderBy: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
});


module.exports = {
    createSchema,
    updateSchema,
    idSchema,
    seachSchema,
}