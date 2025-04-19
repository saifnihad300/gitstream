const mongoose = require('mongoose')

const baseSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: new Date(),
        index: true
    },
    updatedAt: {
        type: Date,
        default: new Date(),
        index: true
    },
});

module.exports = {
    baseSchema,
}