const mongoose = require('mongoose');
const {faker} = require('@faker-js/faker');
const short = require('short-uuid')
const User = require('../../src/domains/user/schema');


async function populateUsers() {
    console.log('Populating users...........');

    for(let i=0; i<100; i++){
        const user = new User({
            githubId: short.generate(),
            nodeId: short.generate(),
            displayName: faker.person.fullName(),
            username: faker.internet.userName(),
            profileUrl: faker.image.avatar(),
            apiUrl: faker.company.name(),
            company: faker.company.url(),
            location: faker.location.city(),
            email: faker.internet.email(),
            bio: faker.internet.email(),
            public_repos: faker.number.int({min: 0, max: 100}),
            public_gists: faker.number.int({min: 0, max: 100}),
            followers: faker.number.int({min: 0, max: 100}),
            following: faker.number.int(),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
            is_Demo: true,
            isVerified: false
        })

        await user.save();
        console.log(`User ${i} created`);
    }

    console.log("Data populated");
}

mongoose.connect('mongodb://localhost:27017/commitstream').then(()=>{
    console.log('Connected to MongoDB');
    populateUsers().then(()=>{
        mongoose.connection.close();
    })
})