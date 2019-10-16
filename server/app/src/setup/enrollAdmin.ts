import * as FabricCAServices from 'fabric-ca-client';
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../configuration';

const _mspid = config.Blockchain.MSPID;
const _org = config.Blockchain.Org1;
const ccpPath = path.resolve(__dirname, '..', '..', '..', 'university-network', config.Blockchain.BlockchainGatewayConfigFile);
const keyStorePath = path.resolve(__dirname, '..', '..', config.Blockchain.KeyStorePath);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main() {
    try {

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities[config.Blockchain.CA].url;
        console.log(caURL);
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = keyStorePath;
        console.log(`Wallet path: ${walletPath}`);
        const wallet = new FileSystemWallet(walletPath);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const identity = X509WalletMixin.createIdentity(_mspid, enrollment.certificate, enrollment.key.toBytes());
        wallet.import('admin', identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();
