"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRolloutData = exports.ClientTypeSchema = exports.ClientTypeEnum = void 0;
const conduit_utils_1 = require("conduit-utils");
var ClientTypeEnum;
(function (ClientTypeEnum) {
    ClientTypeEnum["mobile"] = "mobile";
    ClientTypeEnum["desktop"] = "desktop";
})(ClientTypeEnum = exports.ClientTypeEnum || (exports.ClientTypeEnum = {}));
exports.ClientTypeSchema = conduit_utils_1.Enum(ClientTypeEnum, 'FeatureRolloutClientType');
function isFeatureRolloutData(obj) {
    return obj.hasOwnProperty('host_name') && obj.hasOwnProperty('siwg_percentage') && obj.hasOwnProperty('siwa_enabled');
}
async function fetchRolloutData(trc, httpClient, clientType) {
    const address = `https://update.evernote.com/enclients/${clientType}/features_rollout.json`;
    const resp = await httpClient.request(trc, {
        method: 'GET',
        url: address,
        headers: {
            'Cache-Control': 'no-cache',
        },
    });
    if (resp.status >= 300) {
        throw new Error(`Failed to fetch Rollout data. status: ${resp.statusText}, statusText: ${resp.statusText}.`);
    }
    conduit_utils_1.logger.debug('Rollout data is recieved', resp.result);
    const data = conduit_utils_1.safeParse(resp.result);
    if (!data || !Array.isArray(data)) {
        return [];
    }
    return data.filter(datum => isFeatureRolloutData(datum));
}
exports.fetchRolloutData = fetchRolloutData;
//# sourceMappingURL=RolloutData.js.map