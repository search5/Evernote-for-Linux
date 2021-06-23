"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRolloutClientTypes = exports.convertMutationGuids = exports.ResourceProxyType = exports.NSYNC_CONTEXT = void 0;
exports.NSYNC_CONTEXT = 'NSyncContext';
var ResourceProxyType;
(function (ResourceProxyType) {
    ResourceProxyType["None"] = "None";
    ResourceProxyType["CookieAuth"] = "CookieAuth";
    ResourceProxyType["NativeLayerCache"] = "NativeLayerCache";
})(ResourceProxyType = exports.ResourceProxyType || (exports.ResourceProxyType = {}));
function convertMutationGuids(conduitGuids) {
    const serviceGuids = {};
    for (const type in conduitGuids) {
        serviceGuids[type] = conduitGuids[type].map(idGen => {
            return [
                idGen[0],
                idGen[1],
                idGen[2],
            ];
        });
    }
    return serviceGuids;
}
exports.convertMutationGuids = convertMutationGuids;
var FeatureRolloutClientTypes;
(function (FeatureRolloutClientTypes) {
    FeatureRolloutClientTypes["Unknown"] = "unknown";
    FeatureRolloutClientTypes["Desktop"] = "desktop";
    FeatureRolloutClientTypes["Mobile"] = "mobile";
})(FeatureRolloutClientTypes = exports.FeatureRolloutClientTypes || (exports.FeatureRolloutClientTypes = {}));
//# sourceMappingURL=Types.js.map