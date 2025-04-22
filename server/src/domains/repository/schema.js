const mongoose = require('mongoose');
const {baseSchema} = require('../../libraries/db/base-schema');


const schema = new mongoose.Schema({
    id: {type: Number, unique: true},
    node_id: String,
    name: String,
    full_name: String,
    private: Boolean,
    owner: mongoose.Schema.Schema.Types.Mixed,
    html_url: String,
    description: String,
    fork: Boolean,
    url: String,
    created_at: Date,
    updated_at: Date,
    pushed_at: Date,
    homepage: String,
    size: Number,
    size: Number,
    stargazers_count: Number,
    watchers_count: Number,
    language: String,
    language: mongoose.Schema.Types.Mixed,
    fork_count: Number,
    archived: Boolean,
    disabled: Boolean,
    open_issues_count: Number,
    license: {
        key: String,
        name: String,
        spdx_id: String,
        url: String,
        node_id: String
    },
    topics: [String],
    visibility: String,
    default_branch: String,

    csFollowers: [
        {
            _id: {type: mongoose.Schema.Types.ObjectId},
            date: {type: Date, default: Date.now},
        },
    ],
});


schema.add(baseSchema);
module.export = mongoose.model('Repository', schema);