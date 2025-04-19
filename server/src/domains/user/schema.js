const mongoose = require('mongoose')
const {baseSchema} = require('../../libraries/db/base-schmea')

const schmea = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        requied: false
    },
    authType: {
        type: String,
        requied: true,
        enum: ['local', 'google', 'github'],
    },

    local: {
        username: {
            type: String,
            sparse: true
        },
        password: {
            type: String
        }
    },

    google: {
        id: { type: String},
        email: {type: String},
        picture: {type: String},
    },

    github: {
        id: {
            type: String,
        },
        nodeId: {
            type: String,
        },
        profileUrl: {
            type: String
        },
        avatarUrl: {
            type: String,
        },
        apiUrl: {
            type: String,
        },
        company: {
            type: String,
        },
        blog: {
            type: String,
        },
        location: {
            type: String,
        },
        hireable: {
            type: Boolean,
        },
        bio: {
            type: String,
        },
        public_repos: {
            type: Number,
        },
        public_gists: {
            type: Number,
        },

        followers: {type: Number},
        following: {type: Number},
        created_at: {type: Date},
        updated_at: {type: Date},

        accessToken: {
            type: String,
        },
        accessTokenIV: {
            type: String,
        }
    },

    verificationToken: {
        type: String,
        sparse: true
    },
    verificationTokenExpiry: {
        type: Date,
    },
    verificationEmailSentAt: {
        type: Date
    },
    verifiedAt: {
        type: Date,
    },
    isDemo: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    isDeactivated: {
        type: Boolean,
        default: false
    },
    csFollowers: [
        {
            _id: {type: mongoose.Schema.Types.ObjectId},
            date: {type: Date, default: Date.now},
        },
    ],
    csFollowing: [
        {
            _id: {type: mongoose.Schema.Types.ObjectId},
            date: {type: Date, default: Date.now}
        }
    ],
    csFollowingRepositories: [
        {
            _id: {type: mongoose.Schema.Types.ObjectId},
            date: {type: Date, default: Date.now}
        }
    ],
    role: {
        type: String,
        requied: true,
        default: 'Visitor',
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    },

});

schema.add(baseSchema);

schmea.pre('save', function(next){
    const authMethods = ['local', 'google', 'github'];

    const populateMethods = authMethods.filter((method)=>{
        const authData = this[method];

        return(
            authData && 
            typeof authData==='object' && 
            Object.values(authData).some((value)=>{
                if(typeof value==='object'){
                    return value !== null && Object.keys(value).length>0;
                }

                return value !== null && value !== undefined && value !== '';
            })
        )
    });

    if(!this.authType || !authMethods.includes(this.authType)){
        return next(new Error('Invalid auth type'))
    }

    if(!this[this.authType]){
        return next(new Error(`Missing data for auth type: ${this.authType}`));
    }

    if(populateMethods.length > 1){
        return next(new Error('Multiple auth methods detected'));
    }

    next();
});

schmea.index({'github.id': 1}, {unique: true, sparse: true});
schmea.index({'google.id': 1}, {unique: true, sparse: true});
schmea.index({'local.username': 1}, {unique: true});
schmea.index({'verificationToken': 1}, {sparse: true});

module.exports = mongoose.model('User', schema);