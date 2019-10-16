//Initiallising node modules
import * as bodyParser from "body-parser";
import * as express from "express";
import * as util from 'util';
import * as path from 'path';
import * as mime from 'mime';
import * as cache from 'memory-cache';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJSDoc from 'swagger-jsdoc';

import * as blockchain from './core/blockchain';
import * as notify from './core/notify';
import * as authorize from './core/authorize';
import { AuthUtil } from './platform/auth';
import { SystemOperations } from './platform/common.operations';
import { config } from './configuration';
import { AddressInfo } from "net";

const WEB_BASE_URL = config.Settings.WebUrl;
const test = false;

const app = express(), api = express.Router();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));

// Body Parser Middleware
app.use(bodyParser.json());
//// default options
//app.use(fileUpload());
////parse multipart/form-data    
//app.use(busboyBodyParser());

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");

    next();
});
let memCache = new cache.Cache();
let cacheMiddleware = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url
        let cacheContent = memCache.get(key);
        if (cacheContent) {
            res.send(cacheContent);
            return
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                if (!body.status) {
                    memCache.put(key, body, duration * 1000);
                }
                else if (body.status && body.status < 300) {
                    memCache.put(key, body, duration * 1000);
                }

                res.sendResponse(body)
            }
            next()
        }
    }
};

let tryGetCacheData = (key: string) => {
    let cachedContent = memCache.get(key);
    if (cachedContent) {
        return cachedContent;
    } else {
        return undefined;
    }
};

let setCacheData = (key: string, cacheContent: any, duration: number = 300) => {
    if (cacheContent == undefined || cacheContent == null) {
        memCache.del(key);
    }
    else {
        memCache.put(key, cacheContent, duration * 1000);
    }
};

app.use(function (req, res, next) {
    console.log(' ------>>>>>> new request for [%s] %s', new Date().toTimeString(), req.originalUrl);
    if (req.originalUrl.indexOf('/api/v1') >= 0) {
        return next();
    } else if (req.originalUrl.indexOf('/api/pub') >= 0) {
        return next();
    } else if (req.originalUrl.indexOf('/api-docs') >= 0 || req.originalUrl.indexOf('/swagger.json') >= 0) {
        return next();
    } else if (req.originalUrl.indexOf('/api') >= 0) {
        // require auth
    } else {
        const directoryPath = path.join(__dirname, "client");
        if (req.path.endsWith(".js") ||
            req.path == "/favicon.ico" ||
            req.path.endsWith("js.map") ||
            req.path.startsWith("/static") ||
            req.path.startsWith("/assets")) {
            res.sendFile(path.join(directoryPath + req.path));
        }
        else {
            res.sendFile(path.join(directoryPath + "/index.html"));
        }

        return;
    }
});

let port = 4000;
//Setting up server
var server = app.listen(process.env.PORT || 4000, function () {
    port = (server.address() as AddressInfo).port;
    console.log("App now running on port", port);
});

/**
 * @swagger
 *
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     operationId: Login
 *     summary: "Login user"
 *     requestBody:
 *       description: login user
 *       required: true
 *       content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login Response
 *         content:
 *          application/json:
 *                   schema:
 *                      $ref: '#/components/schemas/LoginResponse'
 *       400:
 *          description: "Invalid user data supplied"
 */
// Local Authentication
app.get('/api/v1/auth/login'
    , async function (req, res) {
        try {
            if (req.query.userid && req.query.role) {
                if (!test) {
                    var tokenResponse = await new AuthUtil().WWIssueToken(req.query.userid, req.query.role);
                    // res.send({ status: 200, data: tokenResponse });
                    res.redirect(`http://university.arnest.in/loginSuccess?access_token=${tokenResponse.access_token}&refresh_token=${tokenResponse.refresh_token}&role=${tokenResponse.role}`);
                    return;
                }
            }

            res.redirect(`http://university.arnest.in/loginSuccess?access_token=tokendata1&refresh_token=tokendata2&role=admin`);
        }
        catch (err) {
            res.statusCode = 500;
            res.send({ status: 500, data: { message: 'Unhandled error: ' + err } });
        }
    });

//creating a token 
app.post('/api/v1/auth/login'
    , async function (req, res) {
        try {
            if (req.query.userid && req.query.role) {
                if (!test) {
                    var tokenResponse = await new AuthUtil().WWIssueToken(req.query.userid, req.query.role);
                    res.send({ status: 200, data: tokenResponse });
                    // res.redirect(`http://university.arnest.in/loginSuccess?access_token=${tokenResponse.access_token}&refresh_token=${tokenResponse.refresh_token}&role=${tokenResponse.role}`);
                    return;
                }
            }

            res.redirect(`http://university.arnest.in/loginSuccess?access_token=tokendata1&refresh_token=tokendata2&role=admin`);
        }
        catch (err) {
            res.statusCode = 500;
            res.send({ status: 500, data: { message: 'Unhandled error: ' + err } });
        }
    });
//creating the refresh token
app.post("/api/v1/auth/refresh"
    , authorize.permit('*')
    , async function (req, res) {
        try {
            const apiToken = req.headers['authorization'];
            var tokenResponse = await new AuthUtil().WWRefreshsToken(apiToken);
            res.send({ status: 200, data: tokenResponse });
        } catch (err) {
            res.statusCode = 500;
            res.send({ status: 500, data: { message: err } });
        }
    });
// authenticate authorize

const swaggerDefinition = {
    openapi: "3.0.0",
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    info: {
      title: "REST API for CSLP", // Title of the documentation
      version: "0.0.1", // Version of the app
      description: "This is the REST API for Certificate Management System" // short description of the app
    },
    host: "localhost:" + port, // the host or url of the app
    basePath: "/", // the basepath of your endpoint,
    tags: [
      {
        name: "Auth",
        description: "All user related API's"
      }
    ]
  };
//options for the swagger docs
const options = {
    // import swaggerDefinitions
    swaggerDefinition,
    explorer: true,
  
    // path to the API docs
    apis: [
      "./**/swagger-definations/*.js",
      "./**/swagger-definations/*.yaml",
      "./**/server.ts"
    ]
  };
  // initialize swagger-jsdoc
  const swaggerSpec = swaggerJSDoc(options);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/swagger.json", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });