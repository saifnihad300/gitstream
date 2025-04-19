const dotenv = require('dotenv');
const fs = require('fs');

const path = require('path')
const logger = require('../libraries/log/logger');
const schema = require('../configs.schema');
const { error } = require('console');
const { json } = require('stream/consumers');
const { SlowBuffer } = require('buffer');
const { Socket } = require('dgram');
const { Schema, Error } = require('mongoose');

class Config{
    constructor(){
        if(!Config.instance){
            logger.info('Loading and validating config for the first time...');
            this.config = this.loadAndValidateConfig();

            Config.instance = this;
            logger.info('Config loaded and validated', {
                NODE_ENV: this.config.NODE_ENV,
                PORT: this.config.PORT,
                HOST: this.config.HOST,
                CLIENT_HOST: this.config.CLIENT_HOST
            });
            logger.info('Config keys: ', Object.keys(this.config));
        }
        return Config.instance
    }

    loadAndValidateConfig(){
        const environment = process.env.NODE_ENV || 'development';

        const envFile = `.env.${environment}`;
        const envPath = path.join(__dirname, '..', envFile);

        if(!fs.existsSync(envPath)){
            throw new Error(`Environment file no found: ${envPath}`);
        }

        dotenv.config({path: envPath});
        const configFile = path.join(__dirname, `config.${environment}.json`);

        if(!fs.existsSync(configFile)){
            throw new Error(`Config file not found: ${configFile}`);
        }

        let config = JSON.parse(fs.readFileSync(configFile));

        const sharedConfigFile = path.join(__dirname, 'config.shared.json');

        if(fs.existsSync(sharedConfigFile)){
            const sharedConfig = JSON.parse(fs.readFileSync(sharedConfigFile));
            config = {...sharedConfig, ...config};
        }

        const finalConfig = {};
        for(const key in schema.describe().keys){
            if(process.env.hasOwnProperty(key)){
                finalConfig[key] = process.env[key];
            }else if(config.hasOwnProperty(key)){
                finalConfig[key] = config[key];
            }
        }

        if(!Schema){
            throw new Error(`Schema file not found`);
        }

        const {error, value: validatedConfig} = schema.validate(finalConfig);

        if(error){
            const missingProperties = error.details.map((detail) => detail.path[0]);

            throw new Error(
                `Config validation error: missing properties ${missingProperties}`
            );
        }
        return validatedConfig;
    }
    static getInstance(){
        if(!Config.instance){
            new Config();
        }
        return Config.instance
    }
}

module.exports = Config.getInstance().config;