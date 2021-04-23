"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToByteArr = exports.getFallbackSignInMethodValue = exports.isSignInMethodEnum = exports.determineSignInMethod = exports.SignInMethodSchema = exports.SignInMethodEnum = void 0;
const conduit_utils_1 = require("conduit-utils");
var SignInMethodEnum;
(function (SignInMethodEnum) {
    SignInMethodEnum["NAP"] = "NAP";
    SignInMethodEnum["Legacy"] = "Legacy";
})(SignInMethodEnum = exports.SignInMethodEnum || (exports.SignInMethodEnum = {}));
exports.SignInMethodSchema = conduit_utils_1.Enum(SignInMethodEnum, 'SignInMethod');
const SignInMethodType = Object.keys(SignInMethodEnum);
function determineSignInMethod(md5String, data) {
    const bytes = stringToByteArr(md5String !== null && md5String !== void 0 ? md5String : '');
    const num = bytes ? bytes[0] / 256 : 1;
    return {
        siwg: data.siwg_percentage !== 0 && data.siwg_percentage >= num * 100 ? SignInMethodEnum.NAP : SignInMethodEnum.Legacy,
        siwa: data.siwa_enabled ? SignInMethodEnum.NAP : SignInMethodEnum.Legacy,
    };
}
exports.determineSignInMethod = determineSignInMethod;
function isSignInMethodEnum(a) {
    return SignInMethodType.includes(a);
}
exports.isSignInMethodEnum = isSignInMethodEnum;
async function getFallbackSignInMethodValue(trc, localSettings) {
    const defaultRes = {
        siwg: SignInMethodEnum.Legacy,
        siwa: SignInMethodEnum.Legacy,
    };
    try {
        const siwgMethod = await localSettings.getSystemValue(trc, null, 'siwgMethod');
        const siwaMethod = await localSettings.getSystemValue(trc, null, 'siwaMethod');
        return {
            siwg: isSignInMethodEnum(siwgMethod) ? siwgMethod : defaultRes.siwg,
            siwa: isSignInMethodEnum(siwaMethod) ? siwaMethod : defaultRes.siwa,
        };
    }
    catch (_a) {
        return defaultRes;
    }
}
exports.getFallbackSignInMethodValue = getFallbackSignInMethodValue;
function stringToByteArr(str) {
    const chunks = conduit_utils_1.chunkArray(str.split(''), 2).filter(x => x.length >= 2);
    return chunks.length ? new Uint8Array(chunks.map(chunk => parseInt(chunk.join(''), 16))) : null;
}
exports.stringToByteArr = stringToByteArr;
//# sourceMappingURL=SignInMethod.js.map