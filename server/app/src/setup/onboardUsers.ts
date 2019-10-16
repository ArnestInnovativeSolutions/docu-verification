import * as bc from '../core/blockchain';

let orgs = [
    {
        name: "ABC University", mspId: "UniversityMSP",
        admins: [
            { id: "user1", name: "User1", email: "user1@abc.in.test" },
        ],
        uploaders: [
            { id: "mohan", name: "Mohan", email: "mohan@abc.in.test" },
            { id: "mohan", name: "Mohan", email: "mohan@abc.in.test" },
            { id: "prakasan", name: "Prakash", email: "prakasan@abc.in.test" },
            { id: "suresh", name: "Suresh", email: "suresh@abc.in.test" },
        ],
        approvers: [
            { id: "shiju", name: "Shiju", email: "shiju@abc.in.test" },
            { id: "mahesh", name: "Mahesh", email: "mahesh@abc.in.test" },
        ],
        publishers: [
            { id: "arnest", name: "Arnest", email: "arnest@abc.in.test" },
        ]
    },
    {
        name: "XYZ University", mspId: "XYZMSP",
        admins: [
            { id: "user1", name: "User1", email: "user1@xyz.in.test" },
        ],
        uploaders: [
            { id: "das", name: "Das", email: "das@xyz.in.test" },
            { id: "rajan", name: "Rajan", email: "rajan@xyz.in.test" },
            { id: "prajosh", name: "Prajosh", email: "prajosh@xyz.in.test" },
        ],
        approvers: [
            { id: "shubha", name: "Shubha", email: "shubha@xyz.in.test" },
            { id: "priya", name: "Priya", email: "priya@xyz.in.test" },
        ],
        publishers: [
            { id: "arnest", name: "Arnest", email: "arnest@xyz.in.test" },
        ]
    }
];

let u1 = bc.signupUser(orgs[0].admins[0].name).then(x=>console.log(x));
let uu1 = bc.signupUser(orgs[0].uploaders[0].name).then(x=>console.log(x));
let uu2 = bc.signupUser(orgs[0].uploaders[1].name).then(x=>console.log(x));
let uu3 = bc.signupUser(orgs[0].uploaders[2].name).then(x=>console.log(x));
let uu4 = bc.signupUser(orgs[0].uploaders[3].name).then(x=>console.log(x));
let ua1 = bc.signupUser(orgs[0].approvers[0].name).then(x=>console.log(x));
let ua2 = bc.signupUser(orgs[0].approvers[1].name).then(x=>console.log(x));
let up1 = bc.signupUser(orgs[0].publishers[0].name).then(x=>console.log(x));
Promise.all([u1, uu1, uu2, uu3, uu4, ua1, ua2, up1]).then(x=> console.log('users created'));
// let u1 = bc.signupUser(orgs[1].admins[0].name).then(x=>console.log(x));
// let uu1 = bc.signupUser(orgs[1].uploaders[0].name).then(x=>console.log(x));
// let uu2 = bc.signupUser(orgs[1].uploaders[1].name).then(x=>console.log(x));
// let uu3 = bc.signupUser(orgs[1].uploaders[2].name).then(x=>console.log(x));
// let ua1 = bc.signupUser(orgs[1].approvers[0].name).then(x=>console.log(x));
// let ua2 = bc.signupUser(orgs[1].approvers[1].name).then(x=>console.log(x));
// let up1 = bc.signupUser(orgs[1].publishers[0].name).then(x=>console.log(x));
// Promise.all([u1, uu1, uu2, uu3, ua1, ua2, up1]).then(x=> console.log('users created'));