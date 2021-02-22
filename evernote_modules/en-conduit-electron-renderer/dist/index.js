"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearGraph = exports.deInit = exports.init = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_1 = require("conduit-view");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
let gConduitIPC;
function init(noFreezeImmutable) {
    if (gConduitIPC) {
        throw new Error('en-conduit-electron-renderer already initialized');
    }
    gConduitIPC = new en_conduit_electron_shared_1.ConduitRendererIPC();
    conduit_utils_1.applyTelemetryDestination(conduit_view_1.eventsOverIPCDestination);
    conduit_view_1.connector.init(gConduitIPC, noFreezeImmutable);
}
exports.init = init;
function deInit() {
    if (!gConduitIPC) {
        throw new Error('en-conduit-electron-renderer not yet initialized');
    }
    gConduitIPC.deInit();
    gConduitIPC = undefined;
}
exports.deInit = deInit;
async function clearGraph(clearAuth) {
    if (!gConduitIPC) {
        throw new Error('en-conduit-electron-renderer is not initialized');
    }
    return gConduitIPC.clearGraph(clearAuth);
}
exports.clearGraph = clearGraph;
//# sourceMappingURL=index.js.map