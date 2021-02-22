"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMutationGuids = exports.ResourceProxyType = void 0;
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
//# sourceMappingURL=Types.js.map