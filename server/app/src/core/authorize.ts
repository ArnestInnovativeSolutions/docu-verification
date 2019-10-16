import * as bcrypt from 'bcrypt';
import * as uuidv1 from 'uuid/v1';
import * as jsonwebtoken from 'jsonwebtoken';
import { BlockJwtProvider } from './blockchain';

export var permit = function permit(...allowed) {
    const isAllowed = role => (!allowed || allowed.indexOf("*") > -1 || allowed.indexOf(role) > -1);

    // return a middleware
    return (req, res, next) => {
        try {
            const apiToken = req.headers['authorization'];
            if (!apiToken) {
                res.status(400).json({ message: 'missing authorization header' }); // auth toekn not found
            }
            else {
                var jwtProvider = new BlockJwtProvider();
                var decoded = jwtProvider.Verify(apiToken);
                //  && isAllowed(decoded.role)
                var _isallowed = isAllowed(decoded.role);
                if (decoded && _isallowed) {
                    // req.body._identity = decoded.user;
                    next(); // role is allowed, so continue on the next middleware
                }
                else {
                    res.status(403).json({ message: "Forbidden" }); // user is forbidden
                    // return next('router')
                }
            }
        } catch (err) {
            res.status(403).json({ message: "Forbidden" });
            // return next('router')
        }
    }
}

//TODO: move hashStrSync somewhere else??
export var hashStrSync = function (str) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(str, salt);
    return { hash: hash, salt: salt };
};
//TODO: move compareHashSync somewhere else??
export var compareHashSync = function (str, encrypted, salt) {
    let hashres = bcrypt.hashSync(str, salt);
    // console.log('pwd hash: ' + encrypted);
    // console.log('given pwd hash: ' + hashres);
    if (hashres == encrypted) {
        return true;
    } else {
        return false;
    }
};
//TODO: move generateGUID somewhere else??
export var generateGUID = function () {
    return uuidv1();
    // return new Date().getTime(); // we can do better with crypto
}
