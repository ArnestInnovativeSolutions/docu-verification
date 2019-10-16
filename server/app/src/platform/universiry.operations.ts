import * as path from 'path';
import * as util from 'util';

import * as authorize from '../core/authorize';
import * as notify from '../core/notify';
import { BlockToken, ChainCode, BlockSigner, signupUser } from '../core/blockchain';
import { OperationsBase } from './common.operations';
import { config } from '../configuration';

const CCFuncs = {
    addOrgUser: 'addOrgUser',
    uploadCert: 'uploadCert',
    approveCert: 'approveCert',
    approveCertExternal: 'approveCertExternal',
    validateCert: 'validateCert',
    validateCertProof: 'validateCertProof',
    uploadCertProofs: 'uploadCertProofs',
    setCertStatus: 'setCertStatus',
};

export class UniversityOperations {
    
}

export class BlockTimeStamp {
    seconds: BlockTimeStampSec;
    nanos: number;
}

export class BlockTimeStampSec {
    low: number;
    high: number;
}
