"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDeterministicIdGenerator = exports.getServiceLevelV2Summary = exports.ServiceLevelV2Summaries = exports.ClientNSyncTypes = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const EntityTypes_1 = require("./EntityTypes");
__exportStar(require("./schema-types"), exports);
exports.ClientNSyncTypes = __importStar(require("./sync-types"));
__exportStar(require("./EntityTypes"), exports);
var serviceLevelV2Schema_1 = require("./serviceLevelV2Schema");
Object.defineProperty(exports, "ServiceLevelV2Summaries", { enumerable: true, get: function () { return serviceLevelV2Schema_1.ServiceLevelV2Summaries; } });
Object.defineProperty(exports, "getServiceLevelV2Summary", { enumerable: true, get: function () { return serviceLevelV2Schema_1.getServiceLevelV2Summary; } });
exports.DefaultDeterministicIdGenerator = (() => {
    return new en_ts_utils_1.DeterministicIdGenerator(EntityTypes_1.EntityTypeToNsync);
})();
//# sourceMappingURL=index.js.map