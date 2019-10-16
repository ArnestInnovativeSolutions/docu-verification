import * as  util from 'util';
import * as  authorize from '../core/authorize';
import { ChainCode, BlockJwtProvider } from '../core/blockchain';
import { config } from '../configuration';
import { SystemOperations, User } from './common.operations';

export class AuthUtil {
    constructor() {
    }
    async WWRefreshsToken(apiToken: string) {
        var loginRequest = { user: '', role: '' };

        if (!apiToken) {
            let status = 403;
            let message = 'missing authorization header';
            return { status: status, message: message };
        }
        else {
            loginRequest = new BlockJwtProvider().Verify(apiToken);
            if (!loginRequest) {
                let status = 403;
                let message = 'Forbidden';
                return { status: status, message: message };
            }
        }

        return await this.WWIssueToken(loginRequest.user, loginRequest.role);
    }

    async WWIssueToken(userid: string, role: string) {
        try {

            let ops = new SystemOperations({ user: userid, role: config.Roles.CLIENT });
            let userObj = await ops.getUser(role, userid);
            var res = this.WWCreateTokenResponseObject(userObj);
            return res;
        }
        catch (err) {
            console.log('errl1' + err);
            throw err;
        }
    }

    private WWCreateTokenResponseObject(user: User) {
        const GUID_access = authorize.generateGUID();
        const iat_val = Math.floor(Date.now() / 1000);
        // 7 days from now
        const exp_val = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7);
        var tokenPayload = {
            role: user.role,
            user: user.userName,
            name: user.fullName,
            email: user.email,
            walletid: user.walletId,
            sub: "access",
            iss: "bloc",
            aud: "bloc:university",
            nbf: iat_val,
            iat: iat_val,
            exp: exp_val,
            jti: GUID_access,
        };

        // 356 days from now
        const refresh_exp_val = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 356);
        const GUID_refresh = authorize.generateGUID();
        const jrefreshTokenClaims = {
            role: user.role,
            user: user.userName,
            jti: GUID_refresh,
            nbf: iat_val,
            iat: iat_val,
            exp: refresh_exp_val,
            sub: "refresh",
            iss: "bloc",
            aud: "bloc:university",
        };

        const token = new BlockJwtProvider().Sign(user.userName, tokenPayload);
        const refresh_token = new BlockJwtProvider().Sign(user.userName, jrefreshTokenClaims);

        return {
            access_token: token,
            refresh_token: refresh_token,
            role: user.role
        };
    }
}
