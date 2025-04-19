const Joi = require('joi');
const schema = Joi.object({
    NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

    MONGODB_URI: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    RATE: Joi.number().min(0).required(),
    PORT: Joi.number().min(1000).required(),

    LOGGY_TOKEN: Joi.string().when('NODE_ENV', {
        is: 'production',
        then: Joi.required(),
    }),
    LOGGY_SUBDOMAIN: Joi.string().when('NODE_ENV', {
        is: 'production',
        then: Joi.required()
    }),
    GITHUB_CLIENT_ID: Joi.string().required(),
    GITHUB_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string.required(),

    HOST: Joi.string().pattern(/^(http:\/\/|https:\/\/)/).required(),
    CLIENT_HOST: Joi.string().pattern(/^(http:\/\/|https:\/\/)/).required(),

    SESSION_SECRET: Joi.string().required(),
    ENCRYPTION_KEY: Joi.string().required(),
    ADMIN_USERNAMES: Joi.array().items(Joi.string()).required(),
    SUPERADMIN_EMAIL: Joi.string().email().required(),
    SENDGRID_API_KEY: Joi.string().required(),
    SENDGRID_FROM_EMAIL: Joi.string().email().required(),
});

module.exports = schema;