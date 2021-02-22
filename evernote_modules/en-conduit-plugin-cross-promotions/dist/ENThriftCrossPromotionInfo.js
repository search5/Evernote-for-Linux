"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCrossPromotionsInfo = void 0;
async function getCrossPromotionsInfo(trc, thriftComm, authData) {
    const utilityStore = thriftComm.getUtilityStore(authData.urls.utilityUrl);
    const results = await utilityStore.getCrossPromotionInfo(trc, authData.token);
    Object.keys(results).forEach(key => {
        if (results[key] === null) {
            results[key] = false;
        }
    });
    return results;
}
exports.getCrossPromotionsInfo = getCrossPromotionsInfo;
//# sourceMappingURL=ENThriftCrossPromotionInfo.js.map