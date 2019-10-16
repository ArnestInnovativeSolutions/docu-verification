'use strict';

const { Contract } = require('fabric-contract-api');
const util = require('./coreutil.js');

/*
async function getQueryResult(stub, query) {
    let resultsIterator = await stub.getQueryResult(query);
    let results = await getAllResults(resultsIterator, false);
    return results;
}

async function getAllResults(iterator, isHistory = false) {
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

async function util.GetUserInfo(stub, docType = '', objType = '') {
    console.info('** START: util.GetUserInfo **');
    let cid = new ClientIdentity(stub);
    let mspid = cid.getMSPID();
    let my_id = cid.getID();
    let startIndex = my_id.indexOf("CN=") + 3;
    let lastIndex = my_id.indexOf("::", startIndex);
    let idVal = my_id.substring(startIndex, lastIndex).toLowerCase();
    console.log('Trying to get user information from request:' + idVal);
    let jresult = await util.GetJsonObject(stub, docType, objType, idVal);
    jresult.mspid = mspid;
    console.info('** END : util.GetUserInfo **');
    return jresult;
}

async function util.GetJsonObject(stub, docType = '', objType = '', idVal = '', throwIfNotExists = false) {
    let hkey = util.createKey(stub, docType, objType, idVal);
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
}

function newObject(docType = '', objType = '', idVal = '') {
    return {
        identity: util.createIdentity(docType, objType, id),
        docType: docType,
        objType: objType,
        id: idVal
    };
}

function util.createKey(stub, docType = '', objType = '', idVal = '') {
    return stub.createCompositeKey(util.constants.compKeyformat, [docType, objType, idVal]);
}

function util.createIdentity(docType = '', objType = '', idVal = '') {
    return `${docType}:${objType}:${idVal}`;
}


const util.constants =
{
    cert: "cert",
    person: "per",
    org: "org",
    user: "user",
    roles: {
        uploader: "uploader",
        approver: "approver",
        uploader: "publisher"
    },
    status: {
        draft: "draft",
        review: "review",
        external: "external",
        publish: "publish",
    },
    waterUnitCharge: 1000,
    compKeyformat: 'd~o~i',
    docPerson: 'person',
    objBeneficiary: 'beneficiary',
    objBenefactor: 'benefactor',
    objAdmin: 'admin',
    docResource: 'resource',
    docWallet: 'wallet',
    objMitte: 'mitte',
    objAQTap: 'aqtap',
    docTransaction: 'transaction',
    docAllTransactions: 'alltransactions',
    docAllDonateTransactions: 'alldonatetransactions',
    transactions: {
        consume: 'consume',
        topup: 'topup',
        donate: 'donate',
        allocate: 'allocate',
        // topupPending: 'topup-pending',
        thirdpartyTopup: 'thirdparty-topup'
    }
};
*/
class UCCC extends Contract {
    async uploadCert(ctx, certNumber, docHash, summary) {
        console.info('** START : uploadCert **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (uniUser.role != util.constants.roles.uploader || uniUser.role != util.constants.roles.approver) {
            throw new Error(`${uniUser.name} is not an uploader/reviewer`);
        }

        let reqidentity = util.createIdentity(util.constants.docTypes.cert, uniUser.mspid, certNumber);
        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber, false);
        if (reqJson) {
            if (reqJson.status != util.constants.status.draft) {
                throw new Error(`${reqidentity} cannot modify, not in draft`);
            }

            if ((reqJson.approvers && reqJson.approvers.length > 0) || (reqJson.externalApprovers && reqJson.externalApprovers.length > 0)) {
                throw new Error(`${reqidentity} already approved, no modification allowed`);
            }

            reqJson.docHash = docHash;
            reqJson.summary = JSON.parse(summary);
            reqJson.createdBy = uniUser.id;
            reqJson.status = util.constants.status.draft;
            reqJson.approvers = [];
        } else {
            reqJson = {
                identity: reqidentity,
                id: certNumber,
                docHash: docHash,
                summary: JSON.parse(summary),
                createdBy: uniUser.id,
                status: util.constants.status.draft,
                approvers: []
            };
        }

        let reqkey = util.createKey(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber);
        await ctx.stub.putState(reqkey, Buffer.from(JSON.stringify(reqJson)));
        console.info('** END : uploadCert **');
        return (reqidentity);
    }

    async approveCert(ctx, certNumber) {
        console.info('** START : approveCert **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (uniUser.role != util.constants.roles.approver) {
            throw new Error(`${uniUser.name} is not an approver`);
        }

        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber, true);
        let reqidentity = util.createIdentity(util.constants.docTypes.cert, uniUser.mspid, certNumber);
        if (reqJson) {
            if (reqJson.status != util.constants.status.review) {
                throw new Error(`${reqidentity} cannot approve, not in review`);
            }

            if (!reqJson.approvers) {
                reqJson.approvers = [uniUser.id];
            }
            else if (reqJson.approvers.indexOf(uniUser.id) > -1) {
                throw new Error(`${reqidentity} already approved`);
            } else {
                reqJson.approvers.push(uniUser.id);
            }
        }

        let reqkey = util.createKey(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber);
        await ctx.stub.putState(reqkey, Buffer.from(JSON.stringify(reqJson)));
        console.info('** END : approveCert **');
        return (reqidentity);
    }

    async approveCertExternal(ctx, omspid, certNumber) {
        console.info('** START : approveCertExternal **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (uniUser.role != util.constants.roles.approver && uniUser.mspid == omspid) {
            throw new Error(`${uniUser.name} is not an approver`);
        }

        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, omspid, certNumber, true);
        let reqidentity = util.createIdentity(util.constants.docTypes.cert, omspid, certNumber);
        if (reqJson && reqJson.status == util.constants.status.review) {
            if (reqJson.status != util.constants.status.external || reqJson.status != util.constants.status.publish) {
                throw new Error(`${reqidentity} cannot approve external, not ready for external approval`);
            }

            if (!reqJson.externalApprovers) {
                reqJson.externalApprovers = [uniUser.id];
            }
            else if (reqJson.externalApprovers.indexOf(uniUser.id) > -1) {
                throw new Error(`${reqidentity} already approved`);
            } else {
                reqJson.externalApprovers.push(uniUser.id);
            }
        }

        let reqkey = util.createKey(ctx.stub, util.constants.docTypes.cert, omspid, certNumber);
        await ctx.stub.putState(reqkey, Buffer.from(JSON.stringify(reqJson)));
        console.info('** END : approveCertExternal **');
        return (reqidentity);
    }

    async validateCert(ctx, omspid, certNumber, docHash) {
        console.info('** START : validateCert **');
        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, omspid, certNumber, true);
        let reqidentity = util.createIdentity(util.constants.docTypes.cert, omspid, certNumber);
        if (reqJson) {
            if (reqJson.docHash != docHash) {
                throw new Error(`${reqidentity} not matched`);
            }
        }

        let approved = reqJson.approvers ? reqJson.approvers.length : 0;
        let extApproved = reqJson.approvers ? reqJson.externalApprovers.length : 0;
        console.info('** END : validateCert **');
        return ({
            id: reqJson.id,
            summary: reqJson.summary,
            approvers: approved,
            externalApprovers: extApproved,
        });
    }

    async validateCertProof(ctx, omspid, certNumber, docNumber, docHash) {
        console.info('** START : validateCert **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (omspid == undefined || omspid.length == 0) {
            omspid = uniUser.mspid;
        }

        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, omspid, certNumber, true);
        let reqidentity = util.createIdentity(util.constants.docTypes.cert, omspid, certNumber);
        var summary = {};
        if (reqJson) {
            var validated = false;
            for (var i = 0; i < reqJson.proofs.length; i++) {
                if (reqJson.proofs[i].docNumber == docNumber) {
                    if (reqJson.proofs[i].docHash == docHash) {
                        summary = reqJson.proofs[i].summary;
                        validated = true;
                        break;
                    } else {
                        throw new Error(`${reqidentity} ${docNumber} not matched`);
                    }
                }
            }

            if (!validated) {
                throw new Error(`${reqidentity} not matched`);
            }
        }

        let approved = reqJson.approvers ? reqJson.approvers.length : 0;
        let extApproved = reqJson.approvers ? reqJson.externalApprovers.length : 0;
        console.info('** END : validateCert **');
        return ({
            id: reqJson.id,
            summary: summary,
            approvers: approved,
            externalApprovers: extApproved,
        });
    }

    async uploadCertProofs(ctx, certNumber, docNumber, docHash, summary) {
        console.info('** START : uploadCertProofs **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (uniUser.role != util.constants.roles.uploader) {
            throw new Error(`${uniUser.name} is not an uploader`);
        }

        let reqidentity = util.createIdentity(util.constants.docTypes.cert, uniUser.mspid, certNumber);
        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber, true);
        if (reqJson) {
            if (reqJson.status != util.constants.status.draft) {
                throw new Error(`${reqidentity} cannot modify, not in draft`);
            }

            if ((reqJson.approvers && reqJson.approvers.length > 0) || (reqJson.externalApprovers && reqJson.externalApprovers.length > 0)) {
                throw new Error(`${reqidentity} already approved, no modification allowed`);
            }

            if (!reqJson.proofs) reqJson.proofs = [];
            var updated = false;
            for (var i = 0; i < reqJson.proofs.length; i++) {
                if (reqJson.proofs[i].docNumber == docNumber) {
                    reqJson.proofs[i].docHash = docHash;
                    reqJson.proofs[i].summary = JSON.parse(summary);
                    reqJson.proofs[i].createdBy = uniUser.id;
                    updated = true;
                    break;
                }
            }

            if (!updated) {
                reqJson.proofs.push({
                    docHash: docHash,
                    summary: JSON.parse(summary),
                    createdBy: uniUser.id
                });
            }
        }

        await ctx.stub.putState(reqkey, Buffer.from(JSON.stringify(reqJson)));
        console.info('** END : uploadCertProofs **');
        return (reqidentity);
    }

    async setCertStatus(ctx, certNumber, status) {
        console.info('** START : approveCert **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        if (uniUser.role != util.constants.roles.approver) {
            throw new Error(`${uniUser.name} is not an approver`);
        }

        let reqJson = await util.GetJsonObject(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber, true);
        let reqidentity = util.createIdentity(util.constants.docTypes.cert, uniUser.mspid, certNumber);
        status = status.toLowerCase();
        if (reqJson && reqJson.status != util.constants.status.publish) {
            switch (status) {
                case util.constants.status.draft:
                    if (reqJson.status == util.constants.status.review || reqJson.status == util.constants.status.external) {
                        if (reqJson.status == util.constants.status.external && (reqJson.approvers && reqJson.approvers.length > 0)) {
                            throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}, progress with external reviews`);
                        }

                        reqJson.status == util.constants.status.draft;
                    }
                    break;
                case util.constants.status.review:
                    if (reqJson.status == util.constants.status.draft || reqJson.status == util.constants.status.external) {
                        if (reqJson.status == util.constants.status.external && (reqJson.approvers && reqJson.approvers.length > 0)) {
                            throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}, progress with external reviews`);
                        }

                        reqJson.status == util.constants.status.review;
                    }
                    else {
                        throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}`);
                    }

                    break;
                case util.constants.status.external:
                    if (reqJson.status == util.constants.status.review) {
                        reqJson.status == util.constants.status.external;
                    }
                    else {
                        throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}`);
                    }

                    break;
                case util.constants.status.publish:
                    if (reqJson.status == util.constants.status.external || reqJson.status == util.constants.status.review) {
                        reqJson.status == util.constants.status.publish;
                    }
                    else {
                        throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}`);
                    }

                    break;
                default:
            }
        } else {
            throw new Error(`${reqidentity} cannot set ${status}, current status ${reqJson.status}`);
        }

        let reqkey = util.createKey(ctx.stub, util.constants.docTypes.cert, uniUser.mspid, certNumber);
        await ctx.stub.putState(reqkey, Buffer.from(JSON.stringify(reqJson)));
        console.info('** END : approveCert **');
        return (reqidentity);
    }

    async initLedger(ctx) {
        console.info('** START : Initialize Ledger JS NODE **');
        await ctx.stub.putState('revision', Buffer.from('v1.0.0'));
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

        for (var i = 0; i < orgs.length; i++) {
            let orgkey = util.createKey(ctx.stub, util.constants.docTypes.org, util.constants.objTypes.university, orgs[i].mspId);
            let org = util.newObject(util.constants.docTypes.org, util.constants.objTypes.university, orgs[i].mspId);
            org.name = orgs[i].name;
            await ctx.stub.putState(orgkey, Buffer.from(JSON.stringify(org)));
            console.info('org created');
            console.info(org);

            for (var j = 0; j < orgs[i].admins.length; j++) {
                let adminkey = util.createKey(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].admins[j].id);
                let admin = util.newObject(util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].admins[j].id);
                admin.org = orgs[i].mspId;
                admin.role = util.constants.roles.admin;
                admin.name = orgs[i].admins[j].name;
                admin.email = orgs[i].admins[j].email;
                await ctx.stub.putState(adminkey, Buffer.from(JSON.stringify(admin)));
                console.info('org admin created');
                console.info(admin);
            }
            for (var j = 0; j < orgs[i].uploaders.length; j++) {
                let uploaderkey = util.createKey(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].uploaders[j].id);
                let uploader = util.newObject(util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].uploaders[j].id);
                uploader.org = orgs[i].mspId;
                uploader.role = util.constants.roles.uploader;
                uploader.name = orgs[i].uploaders[j].name;
                uploader.email = orgs[i].uploaders[j].email;
                await ctx.stub.putState(uploaderkey, Buffer.from(JSON.stringify(uploader)));
                console.info('org uploader created');
                console.info(uploader);
            }
            for (var j = 0; j < orgs[i].approvers.length; j++) {
                let approverkey = util.createKey(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].approvers[j].id);
                let approver = util.newObject(util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].approvers[j].id);
                approver.org = orgs[i].mspId;
                approver.role = util.constants.roles.approver;
                approver.name = orgs[i].approvers[j].name;
                approver.email = orgs[i].approvers[j].email;
                await ctx.stub.putState(approverkey, Buffer.from(JSON.stringify(approver)));
                console.info('org approver created');
                console.info(approver);
            }
            for (var j = 0; j < orgs[i].publishers.length; j++) {
                let publisherkey = util.createKey(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].publishers[j].id);
                let publisher = util.newObject(util.constants.docTypes.orgUser, util.constants.objTypes.user, orgs[i].publishers[j].id);
                publisher.org = orgs[i].mspId;
                publisher.role = util.constants.roles.publisher;
                publisher.name = orgs[i].publishers[j].name;
                publisher.email = orgs[i].publishers[j].email;
                await ctx.stub.putState(publisherkey, Buffer.from(JSON.stringify(publisher)));
                console.info('org publisher created');
                console.info(publisher);
            }
        }

        console.info('** END : Initialize Ledger **');
    }

    async addOrgUser(ctx, role, userid, name, email) {
        console.info('** START : addOrgUser **');
        let uniUser = await util.GetUserInfo(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user);
        role = role.toLowerCase();
        if (uniUser.role == util.constants.roles.admin
            && (role == util.constants.roles.admin ||
                role == util.constants.roles.uploader ||
                role == util.constants.roles.approver ||
                role == util.constants.roles.publisher)) {
            userid = userid.toLowerCase();
            email = email.toLowerCase();
            let ouserkey = util.createKey(ctx.stub, util.constants.docTypes.orgUser, util.constants.objTypes.user, userid);
            let ouser = util.newObject(util.constants.docTypes.orgUser, util.constants.objTypes.user, userid);
            ouser.org = uniUser.mspid;
            ouser.role = role;
            ouser.name = name;
            ouser.email = email;
            await ctx.stub.putState(ouserkey, Buffer.from(JSON.stringify(ouser)));
            console.info(`org ${role} created`);
            console.info(ouser);
            console.info('** END : addOrgUser **');
            return (ouserkey);
        }

        throw new Error(`not allowed`);
    }

    /**
     * Create: Person, Resource, Wallet | Update: Person, Resource
     * @param {any} ctx
     * @param {any} docType - document type
     * @param {any} objType - object type
     * @param {any} idVal - id
     * @param {any} valJson - actual object, maynot need base attributes
     * @param {any} act -- action: d: to delete, otherwise provide empty ''
     */
    async save(ctx, docType, objType, idVal, valJson, act) {
        console.info('** START : save **');
        let hkey = null;
        if (docType.length > 0) {
            // hkey = `${docType}:${objType}:${idVal}`;
            hkey = util.createKey(ctx.stub, docType, objType, idVal);
        } else {
            hkey = objType;
        }

        if (docType === util.constants.docTypes.cert) {
            throw new Error(`${docType} - ${hkey} not allowed - generic save`);
            // not allowed
        }

        let reqJson = JSON.parse(valJson);
        reqJson.identity = util.createIdentity(docType, objType, idVal);

        let dataBytes = await ctx.stub.getState(hkey);
        if (act !== 'd' && !dataBytes || dataBytes.length === 0) {
            console.info(`** save - do not exist ${hkey} **`);
            reqJson.id = idVal;
            reqJson.docType = docType;
            reqJson.objType = objType;
            await ctx.stub.putState(hkey, Buffer.from(JSON.stringify(reqJson)));
            console.info(`** saved - new ${hkey} **`);
        }
        else {
            if (docType === util.constants.docWallet) {
                throw new Error(`${docType} - ${hkey} update not allowed - generic save`);
                // not allowed
            }
            else {
                console.info(`** save - exists ${hkey} **`);
                if (act === 'd') {
                    await ctx.stub.delState(hkey);
                    console.info(`** save - deleted ${hkey} **`);
                } else {
                    valJson.identity = reqJson.identity;
                    valJson.id = idVal;
                    valJson.docType = docType;
                    valJson.objType = objType;

                    await ctx.stub.putState(hkey, Buffer.from(valJson));
                    console.info(`** save - updated ${hkey} **`);
                }
            }
        }
    }

    /**
     * Query: Person, Resource, Wallet, ..
     * @param {any} ctx
     * @param {any} docType - document type
     * @param {any} objType - object type
     * @param {any} idVal - id
     */
    async query(ctx, docType, objType, idVal) {
        console.info('** START : query **');
        var resJson = await util.GetJsonObject(ctx.stub, docType, objType, idVal, true);
        let resStr = JSON.stringify(resJson);
        console.info('** END : query **');
        return resStr;
    }
}

module.exports = UCCC;
