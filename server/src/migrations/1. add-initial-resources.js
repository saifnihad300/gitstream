const Resource = require('../domains/resource/schema')

const data = {
    resources: [
        {
            label: 'Search Resources',
            type: 'api',
            identifier: '/api/v1/resources/search',
            module: 'rosources'
        },
        {
            label: 'Count Resources',
            type: 'api',
            identifier: '/api/v1/resources/count',
            module: 'resources'
        },
        {
            label: 'Get Resource',
            type: 'api',
            identifier: '/api/v1/resources/:id',
            module: 'resources'
        },
        {
            label: 'Search Roles',
            type: 'api',
            identifier: '/api/v1/roles/search',
            module: 'roles'
        },
        {
            label: 'Count Roles',
            type: 'api',
            identifier: '/api/v1/roles/count',
            module: 'roles'
        },
        {
            label: 'Get Roles',
            type: 'api',
            identifier: '/api/v1/roles/:id',
            module: 'roles'
        },
        {
            label: 'Search Users',
            type: 'api',
            identifier: '/api/v1/users/search',
            module: 'users'
        },
        {
            label: 'Count Users',
            type: 'api',
            identifier: '/api/v1/users/count',
            module: 'users'
        },
        {
            label: 'Get User',
            type: 'api',
            identifier: '/api/v1/users/details/:id',
            module: 'users'
        },
        {
            label: 'Delete User',
            type: 'api',
            identifier: '/api/v1/users/remove/:id',
            module: 'users'
        },
        {
            label: 'Active User',
            type: 'api',
            identifier: '/api/v1/users/activate/:id',
            module: 'users'
        },
        {
            label: 'Search Pull Requests',
            type: 'api',
            identifier: '/api/v1/pulls/search',
            module: 'pulls'
        },
        {
            label: 'Count Pull Requests',
            type: 'api',
            identifier: '/api/v1/pulls/count',
            module: 'pulls'
        },
        {
            label: 'Fetch Pull Request Updates',
            type: 'api',
            identifier: '/api/v1/pulls/fetch-updates',
            module: 'pulls'
        },
        {
            label: 'Get Pull Request',
            type: 'api',
            identifier: '/api/v1/pulls/:id',
            module: 'pulls'
        },
        {
            label: 'Search Repositories',
            type: 'api',
            identifier: '/api/v1/repositories/search',
            module: 'repositories'
        },
        {
            label: 'Count Repositories',
            type: 'api',
            identifier: '/api/v1/repositories/count',
            module: 'repositories'
        },
        {
            label: 'Search Single Repository',
            type: 'api',
            identifier: '/api/v1/repositories/search-one',
            module: 'repositories'
        },
        {
            label: 'Fetch From Github',
            type: 'api',
            identifier: '/api/v1/repositories/fetch-from-github',
            module: 'repositories'
        },
        {
            label: 'Follow Repository',
            type: 'api',
            identifier: '/api/v1/repositories/follow/:id',
            module: 'repositories'
        },
        {
            label: 'Get Repository',
            type: 'api',
            identifier: '/api/v1/repositories/:id',
            module: 'repositories'
        },
        {
            label: 'Show roles sidebar',
            type: 'client',
            identifier: 'sidebar-roles',
            module: 'roles'
        },
        {
            label: 'Show users sidebar',
            type: 'client',
            identifier: 'sidebar-users',
            module: 'users'
        }
    ]
};

async function inserResource(resource) {
    try{
        const existingResource = await Resource.findOne({
            identifier: resource.identifier,
        });
        if(existingResource){
            console.log(`Resource already exists: ${resource.identifier}`);
            return;
        }
        const result = await Resource.create(resource);
        console.log(`Inserted resource: ${resource.identifier}`);
        return result;
    }catch(error){
        console.error(`Error inserting resource ${resource.id}:`, error);
        throw error;
    }
}

async function runMigration(){
    console.log(`Running migration: add intial resources`);

    try{
        for(const resource of data.resources){
            await insertResouce(resource);
        }
        console.log(`Successfully completed migration 001`)
    }catch(error){
        console.error('Failed to complete migration 001: ', error);
        throw error;
    }
}

module.exports = {runMigration}