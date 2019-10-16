/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSystemWallet, Gateway } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../configuration';

const ccpPath = path.resolve(__dirname, '..', '..', '..', 'university-network', config.Blockchain.BlockchainGatewayConfigFile);
const keyStorePath = path.resolve(__dirname, '..', '..', config.Blockchain.KeyStorePath);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

var methodName = 'query';
var q_params = [];

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

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction(methodName, ...q_params);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        // process.exit(1);
    }
}

main();
