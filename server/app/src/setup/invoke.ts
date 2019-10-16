/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWallet, Gateway } from 'fabric-network';
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

        // Create a new file system based wallet for managing identities.
        const walletPath = keyStorePath;
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.ts application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(config.Blockchain.Channel);

        // Get the contract from the network.
        const contract = network.getContract(config.Blockchain.ChainCode);
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')


        ////////////////////
        // add beneficiary 1
        var beneficiary1 = {
            walletId: 'user1w1', // userid+w1
            name: 'user 1', // :: optional (admin maynot have walletId)
            status: 1, // 1:active/0:inavtive
        };
        var docType = 'person';
        var objType = 'beneficiary';
        var idVal = 'user1';
        await contract.submitTransaction('save', docType, objType, idVal, JSON.stringify(beneficiary1), 'no test');
        ////////////////////

        console.log(`Transaction has been submitted`);

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
