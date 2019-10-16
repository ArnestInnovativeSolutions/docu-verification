import * as path from 'path';
import * as util from 'util';

import * as authorize from '../core/authorize';
import { BlockToken, ChainCode, BlockSigner, signupUser } from '../core/blockchain';
import { config } from '../configuration';


const CCFuncs = {
    save: 'save',
    query: 'query',
};

export class OperationsBase {
    _claims: any = {};

    get claims() { return this._claims; }

    constructor(blockToken) {
        this._claims = blockToken;
    }
}

export class SystemOperations implements OperationsBase {
    _claims: any = {};

    get claims() { return this._claims; }

    constructor(blockToken) {
        this._claims = blockToken;
    }

    async getUser(role: string, userName: string): Promise<User> {
        try {
            var user = await this.query(config.appConstants.docPerson, role, userName);
            if (user) {
                return {
                    userName: user.id,
                    fullName: user.name,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    walletId: user.walletId,
                    role: user.objType, // same as role
                } as User;
            } else {
                return undefined;
            }
        } catch (err) {
            return undefined;
        }
    }

    private async query(docType: string, objType: string, idVal: string): Promise<any> {
        try {
            var resultData = await new ChainCode(this.claims).ExecuteQueryAsync(CCFuncs.query, docType, objType, idVal);
            return resultData;
        } catch (err) {
            return undefined;
        }
    }
}

export class User {
    // identity: string;
    // id
    userName: string;
    role: string;
    // docType: string;
    // objType: string;
    walletId: string;
    // name
    fullName: string;
    email: string;
    phone: string;
    status: number;
}


export function extractId(key = '') {
    return Number.parseInt(key.substr(key.indexOf("#") + 1));
};
