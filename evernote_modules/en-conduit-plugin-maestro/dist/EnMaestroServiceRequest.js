"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResolverArgs = exports.maestroRequest = void 0;
const conduit_core_1 = require("conduit-core");
const en_thrift_connector_1 = require("en-thrift-connector");
function createMaestroUrl(prefix) {
    if ((!prefix.includes('https') && !prefix.includes('http://localhost')) || !prefix.includes('shard')) {
        throw new Error(`Incorrect webPrefixUrl: ${prefix}`);
    }
    return `${prefix}experiments`;
}
async function getInitializedMaestroService(thriftComm, authData) {
    return thriftComm.getMaestroService(createMaestroUrl(authData.urls.webApiUrlPrefix));
}
async function maestroRequest(thriftComm, method, args, context) {
    const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
    const maestroService = await getInitializedMaestroService(thriftComm, authData);
    const response = await maestroService[method](context.trc, authData.token, args);
    return response.jsonResponse;
}
exports.maestroRequest = maestroRequest;
function validateResolverArgs(expectedKeys, args) {
    const missing = expectedKeys.filter(key => !args.hasOwnProperty(key));
    if (missing.length > 0) {
        throw new Error(`Missing query arguments: ${missing.join(', ')}`);
    }
}
exports.validateResolverArgs = validateResolverArgs;
//# sourceMappingURL=EnMaestroServiceRequest.js.map