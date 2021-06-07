"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCustomResolvers = void 0;
const AuxResolver = __importStar(require("./Custom/AuxResolver"));
const ErrorResolver = __importStar(require("./Custom/ErrorResolver"));
const LocalSettings = __importStar(require("./Custom/LocalSettingsResolver"));
const MultiUserResolver = __importStar(require("./Custom/MultiUserResolver"));
const MutationStatus = __importStar(require("./Custom/MutationStatusResolver"));
const SyncContextNodesResolver = __importStar(require("./Custom/SyncContextNodesResolver"));
function buildCustomResolvers() {
    const out = {};
    AuxResolver.addQueries(out);
    ErrorResolver.addQueries(out);
    LocalSettings.addQueries(out);
    MultiUserResolver.addQueries(out);
    MutationStatus.addQueries(out);
    SyncContextNodesResolver.addQueries(out);
    return out;
}
exports.buildCustomResolvers = buildCustomResolvers;
//# sourceMappingURL=CustomResolvers.js.map