const mongoose = require('mongoose')
const {baseSchema} = require('../../libraries/db/base-schema');


const rersouceSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        default: '',
    },
    identifier: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        enum: ['api', 'client'],
        default: 'api',
        index: true
    },
    module: {
        type: String,
        required: true,
        index: true,
    },
    module: {
        type: String,
        required: true,
        index: true
    }
});

rersouceSchema.add(baseSchema);
module.exports = mongoose.model('Resource', resourceSchema);