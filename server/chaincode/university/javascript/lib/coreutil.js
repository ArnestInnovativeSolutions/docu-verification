'use strict';

const ClientIdentity = require('fabric-shim').ClientIdentity;


const constants =
{
    compKeyformat: 'd-o-i',
    docTypes: {
        cert: "cert", // cert.{mspId}.{id}
        org: "org", // org.uc.{id}
        orgUser: "ou", // ou.user.{id}
    },
    objTypes: {
        user: "user",
        university: "uc",
    },
    roles: {
        admin: "admin",
        uploader: "uploader",
        approver: "approver",
        publisher: "publisher"
    },
    status: {
        draft: "draft",
        review: "review",
        external: "external",
        publish: "publish",
    },
};

var getQueryResult = async function (stub, query) {
    let resultsIterator = await stub.getQueryResult(query);
    let results = await getAllResults(resultsIterator, false);
    return results;
}

exports.getAllResults = async function (iterator, isHistory = false) {
    let allResults = [];
    while (true) {
        let res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            let jsonRes = {
                Key: '',
                TxId: '',
                Timestamp: '',
                IsDelete: false,
                Value: {}
            };

            jsonRes = {};
            console.log(res.value.value.toString('utf8'));

            if (isHistory && isHistory === true) {
                jsonRes.TxId = res.value.tx_id;
                jsonRes.Timestamp = res.value.timestamp;
                jsonRes.IsDelete = res.value.is_delete.toString();
                try {
                    jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Value = res.value.value.toString('utf8');
                }
            } else {
                jsonRes.Key = res.value.key;
                try {
                    jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Value = res.value.value.toString('utf8');
                }
            }

            allResults.push(jsonRes);
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return allResults;
        }
    }
}

var GetUserInfo = async function (stub, docType = '', objType = '') {
    console.info('** START: GetUserInfo **');
    let cid = new ClientIdentity(stub);
    let mspid = cid.getMSPID();
    let my_id = cid.getID();
    let startIndex = my_id.indexOf("CN=") + 3;
    let lastIndex = my_id.indexOf("::", startIndex);
    let idVal = my_id.substring(startIndex, lastIndex).toLowerCase();
    console.log('Trying to get user information from request:' + idVal);
    let jresult = await GetJsonObject(stub, docType, objType, idVal);
    jresult.mspid = mspid;
    console.info('** END : GetUserInfo **');
    return jresult;
};

var GetJsonObject = async function (stub, docType = '', objType = '', idVal = '', throwIfNotExists = false) {
    let hkey = createKey(stub, docType, objType, idVal);
    let dataBytes = await stub.getState(hkey);
    if (!dataBytes || dataBytes.length === 0) {
        if (throwIfNotExists) {
            throw new Error(`${docType}:${objType}:${idVal} does not exist`);
        }
        else {
            return null;
        }
    } else {
        console.log(`${docType}:${objType}:${idVal} exists`);
    }

    let results = dataBytes.toString();
    let jresult = JSON.parse(results);
    return jresult;
};

var newObject = function (docType = '', objType = '', idVal = '') {
    return {
        identity: createIdentity(docType, objType, idVal),
        docType: docType,
        objType: objType,
        id: idVal
    };
};

var createKey = function (stub, docType = '', objType = '', idVal = '') {
    return stub.createCompositeKey(constants.compKeyformat, [docType, objType, idVal]);
};

var createIdentity = function (docType = '', objType = '', idVal = '') {
    return `${docType}:${objType}:${idVal}`;
};

exports.constants = constants;
exports.getQueryResult;
exports.GetUserInfo;
exports.GetJsonObject;
exports.newObject = newObject;
exports.createKey = createKey;
exports.createIdentity = createIdentity;
