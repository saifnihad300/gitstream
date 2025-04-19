const mongoose = require('mongoose');
const {baseSchema} = require('../../libraries/db/base-schema');

const permissionsSchema = new mongoose.Schema({
   api: {
    type: Array,
    required: true
   },
   client: {
    type: Array,
    required: true
   }
})

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    identifier: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    isSystemManaged: {
        type: Boolean,
        default: true
    },
    permissions: permissionsSchema
})

roleSchema.add(baseSchema);
module.exports = mongoose.model('Role', roleSchema);