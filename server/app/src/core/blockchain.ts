import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { FileSystemWallet, Gateway, Network, X509WalletMixin } from 'fabric-network';
import * as Fabric_Client from 'fabric-client';
import * as Fabric_CA_Client from 'fabric-ca-client';
import * as os from 'os';

import { config } from '../configuration';

/***************  ***************/
const STRING_ENCODING = config.Crypto.TextEncoding;
const SIGN_FORMAT = config.Crypto.Format; // 'ecdsa-with-SHA1', 'RSA-SHA256', 'SHA256', 'RS256'
const SupportAlgs: string[] = ['ecdsa-with-SHA1', 'RSA-SHA256', 'SHA256', 'RS256'];
/***************  ***************/

/***************  ***************/
const ccpPath = path.resolve(__dirname, '..', '..', '..', 'university-network', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const keyStorePath = path.resolve(__dirname, '..', '..', config.Blockchain.KeyStorePath);
/***************  ***************/

/***************  ***************/
const _LOCALHOST = config.Blockchain.IP;

const _ordererAddress = _LOCALHOST + ':' + config.Blockchain.OrdererPort; // TODO: remove, now using network object by from connection.json
const _peerAddress = _LOCALHOST + ':' + config.Blockchain.PeerPort; // TODO: remove, now using network object by from connection.json
const _eventPeerAddress = _LOCALHOST + ':' + config.Blockchain.EventPeerPort; // TODO: remove, now using network object by from connection.json
const _channel = config.Blockchain.Channel;
const _chainId = config.Blockchain.Channel;
const _chaincodeId = config.Blockchain.ChainCode;
const _mspid = config.Blockchain.MSPID;
/***************  ***************/

export var signupUser = async function (newUsername: string = '', baseUser: string = 'admin', role: string = 'client'): Promise<string> {
    try {
        // Create a new file system based wallet for managing identities.
        const walletPath = keyStorePath;
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(newUsername);
        if (userExists) {
            console.log('An identity for the user "' + newUsername + '" already exists in the wallet');
            throw new Error('An identity for the user "' + newUsername + '" already exists in the wallet');
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(baseUser);
        if (!adminExists) {
            console.log('An identity for the admin user "' + baseUser + '" does not exist in the wallet');
            console.log('Run the enrollAdmin.ts application before retrying');
            throw new Error('An identity for the admin user "' + baseUser + '" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: baseUser, discovery: { enabled: false } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: newUsername, role: role }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: newUsername, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity(_mspid, enrollment.certificate, enrollment.key.toBytes());
        wallet.import(newUsername, userIdentity);
        console.log('Successfully registered and enrolled admin user "' + newUsername + '" and imported it into the wallet');
        return secret;
    } catch (error) {
        console.error(`Failed to register user "` + newUsername + `": ${error}`);
        // process.exit(1);
        throw error;
    }
};

/************* ChainCode START *************/
export class ChainCodeConfig {

}
export class ChainCode {
    get role(): string {
        return this.claims.role;
    }
    get org(): string {
        return this.claims.org;
    }
    get user(): string {
        return this.claims.user.toLowerCase();
    }

    claims: any = {};

    /**
     * Creates chaincode instance for signed user
     * @param {BlockSigner} BlockkToken BlockkToken object
     */
    constructor(_BlockToken) {
        this.claims = _BlockToken;
        if (this.claims) {
            this.assert();
        }
    }

    Init(user, org, role) {
        this.claims = {
            user: user, // id
            org: org, // person/resource
            role: role // beneficiery/benefactor/mitte/aqtap
        };
        
        this.assert();
    }

    assert() {
        var isSystem = false;
        switch (this.role) {
            case config.Roles.ADMIN:
            case config.Roles.SITEADMIN:
                isSystem = true;
                break;
            case config.Roles.AdminUser:
            case config.Roles.CLIENT:
                break;
            default:
                throw new Error('Forbiden by blockchain network, role ' + this.role);
        }

        //if (!isSystem && (!this.org || this.org.length <= 0)) {
        //    throw new Error('Forbiden by blockchain network, org expected ' + this.role);
        //}
    }

    private async getGateway(): Promise<Gateway> {
        var user_id = this.user;
        // Create a new file system based wallet for managing identities.
        const walletPath = keyStorePath;
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user_id);
        if (!userExists) {
            console.log('An identity for the user "' + user_id + '" does not exist in the wallet');
            // console.log('Run the registerUser.ts application before retrying');
            throw new Error('An identity for the user "' + user_id + '" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user_id, discovery: { enabled: false } });

        return gateway;
    }

    private async getNetwork(): Promise<Network> {
        const gateway = await this.getGateway();
        const network = await gateway.getNetwork(_channel);
        return network;
    }

    async ExecuteQueryAsync(functionName: string, ...args: string[]): Promise<any> {
        try {
            const network = await this.getNetwork();

            // Get the contract from the network.
            const contract = network.getContract(_chaincodeId);

            // Evaluate the specified transaction.
            const result = await contract.evaluateTransaction(functionName, ...args);
            // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return JSON.parse(JSON.parse(result.toString()));

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            // process.exit(1);
            throw error;
        }
    }

    async ExecuteCommandAsync(functionName: string, ...args: string[]): Promise<any> {
        try {
            const gateway = await this.getGateway();
            const network = await gateway.getNetwork(_channel);

            // Get the contract from the network.
            const contract = network.getContract(_chaincodeId);

            // Submit the specified transaction.
            const result = await contract.submitTransaction(functionName, ...args);
            console.log(`Transaction has been submitted`);

            // Disconnect from the gateway.
            await gateway.disconnect();

            try {
                return JSON.parse(result.toString());
            } catch (er2) {
                return result.toString();
            }
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            // process.exit(1);
            throw error;
        }
    }

    async GetBlockByTransactionID(trxnID: string): Promise<Fabric_Client.Block> {
        try {
            const gateway = await this.getGateway();
            const network = await gateway.getNetwork(_channel);

            // Submit the specified transaction.
            const result = await network.getChannel().queryBlockByTxID(trxnID);
            console.log(`Transaction has been submitted`);

            // Disconnect from the gateway.
            await gateway.disconnect();

            return result;
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            // process.exit(1);
            throw error;
        }
    }
}
/************* ChainCode END *************/

/************* CRYPTO START *************/
export class BlockToken {
    get claims() { return this._claims; }
    get user() { return this.claims.user; }
    get userid() { return this.claims.userid; }
    get role() { return this.claims.role; }
    get org() { return this.claims.org; }
    get walletid() { return this.claims.walletid; }
    get email() { return this.claims.email; }
    get phone() { return this.claims.phone; }
    get token() { return this._token }
    _token: any = {};
    _claims: any = {};

    constructor(apiToken) {
        if (apiToken != null) {
            this._token = apiToken;
            this._claims = new BlockJwtProvider().Decode(apiToken);
        }
    }

    Init(user, org, role) {
        this._claims = {
            user: user,
            org: org,
            role: role
        };
    }
}
export class BlockSigner {
    priKeyFile: string;
    pubKeyFile: string;

    priv_keydata: string;
    pub_keydata: string;

    /**
     * Creates signer object to sign and/or verify data or document
     * @param {BlockSigner} blockToken blockToken object
     */
    constructor(_BlockToken) {
        if (_BlockToken) {
            this.Init(_BlockToken.user.toLowerCase());
        }
    }

    Init(userName) {
        let store_path = keyStorePath;
        let usercertpath = path.join(store_path, userName, userName);
        let rawdata = fs.readFileSync(usercertpath);
        let certFileJSON: any = JSON.parse(rawdata.toString());;
        this.priKeyFile = path.join(store_path, userName, certFileJSON.enrollment.signingIdentity + '-priv');
        this.pubKeyFile = path.join(store_path, userName, certFileJSON.enrollment.signingIdentity + '-pub');
    }

    GetPubKey() {
        let pub_keydata = this.pub_keydata ? this.pub_keydata : fs.readFileSync(this.pubKeyFile).toString();
        return pub_keydata;
    }

    GetPrivKey() {
        let priv_keydata = this.priv_keydata ? this.priv_keydata : fs.readFileSync(this.priKeyFile).toString();
        return priv_keydata;
    }

    Sign(data, signFormat = null) {
        let priv_keydata = this.priv_keydata ? this.priv_keydata : fs.readFileSync(this.priKeyFile).toString();

        var sgn_format = signFormat ? signFormat : SIGN_FORMAT;
        if (SupportAlgs.indexOf(sgn_format) < 0) {
            console.error('Algorithm not supported: ' + sgn_format);
            return undefined;
        }

        var sign = crypto.createSign(sgn_format);
        sign.update(data);
        var signature = sign.sign(priv_keydata);

        let signatureBase64 = signature.toString(STRING_ENCODING);
        return signatureBase64;
    }

    Validate(data, signature, signFormat = null) {
        let pub_keydata = this.GetPubKey();

        var sgn_format = signFormat ? signFormat : SIGN_FORMAT;
        if (SupportAlgs.indexOf(sgn_format) < 0) {
            console.error('Algorithm not supported: ' + sgn_format);
            return false;
        }

        var verify = crypto.createVerify(sgn_format);

        verify.update(data);

        let buffSignature = Buffer.from(signature, STRING_ENCODING);
        return verify.verify(pub_keydata, buffSignature);
    }

    SignFile(fileName) {
        let data = fs.readFileSync(fileName).toString();
        return this.Sign(data);
    }

    ValidateFile(fileName, signature) {
        let data = fs.readFileSync(fileName).toString();
        return this.Validate(data, signature);
    }
}
/************* CRYPTO END *************/

export class BlockJwtProvider {
    Sign(name = '', jclaims = {}) {
        var signer = new BlockSigner(null);
        signer.Init(name.toLocaleLowerCase());
        var signature = jwt.sign(jclaims, signer.GetPrivKey(), { algorithm: 'RS256' })
        return signature;
    }
    Verify(apiToken = '') {
        var signer = new BlockSigner(new BlockToken(apiToken));
        return jwt.verify(apiToken, signer.GetPubKey());
    }
    Decode(apiToken = '') {
        return jwt.decode(apiToken);
    }
}

