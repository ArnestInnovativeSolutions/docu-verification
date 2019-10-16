export var config = {
    Settings: {
        WebUrl: 'http://localhost:4200/#/' // TODO:
    },
    Crypto: {
        TextEncoding: 'base64',
        Format: 'ecdsa-with-SHA1'
    },
    Blockchain: {
        Channel: 'mychannel',
        CA: 'ca.arnest.in',
        Org1: 'university',
        ChainCode: 'university',
        MSPID: 'UniversityMSP',
        // IP: 'grpc://localhost',
        IP: 'grpc://127.0.0.1', // TODO: localhost
        CAServer: 'http://localhost:7054', // this ,maynot need to change now
        OrdererPort: '7050',
        PeerPort: '7051',
        EventPeerPort: '7053',
        KeyStorePath: 'wallet',
        BlockchainGatewayConfigFile: 'connection.json'
    },
    sms: {
        accountSid: 'accountSid', // Your Account SID from www.twilio.com/console
        authToken: 'authToken',   // Your Auth Token from www.twilio.com/console
        testAuthToken: 'testAuthToken',   // Your Auth Token from www.twilio.com/console
        from: '+4561926924',
        documentUpdatedMessage: 'sample sms %s. amount %sL',
    },
    smtp: {
        config: {
            pool: true,
            host: 'outlook.com',
            port: 465,
            secure: true,
            auth: {
                user: 'contactus@arnest.in',
                pass: 'Admin01*'
            }
        },
        defaultFrom: "noreply@arnest.in",
        defaultCC: "noreply@arnest.in"
    },
    sqlConnection: {
        connectionLimit: 200, //important
        host: "localhost",
        user: "projectxuser",
        password: "admin01*",
        database: 'dbuniversity',
        port: 3306
    },
    Roles: {
        SITEADMIN: 'siteadmin',
        ADMIN: 'administrator',
        CLIENT: 'client',
        AdminUser: 'admin'
    },
    OrgTypes: {
        Standard: 'std'
    },
    appConstants:
    {
        compKeyformat: 'd~o~i',
        docPerson: 'person',
        transactions: {
            sign: 'sign'
        }
    }
};
