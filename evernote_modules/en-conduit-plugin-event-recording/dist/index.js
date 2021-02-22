"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupClientEventCollectorPlugin = exports.ClientEventCollectorDestination = void 0;
const conduit_utils_1 = require("conduit-utils");
const ClientEventCollectorDestination_1 = require("./client-event-collector-destination/ClientEventCollectorDestination");
Object.defineProperty(exports, "ClientEventCollectorDestination", { enumerable: true, get: function () { return ClientEventCollectorDestination_1.ClientEventCollectorDestination; } });
function buildTelemetryDestinationPlugin(name, destination) {
    return {
        name,
        init: async () => await conduit_utils_1.applyTelemetryDestination(destination),
    };
}
function setupClientEventCollectorPlugin(host, apiKey, secret, httpCECClient, flushIntervalInSeconds) {
    if (!host || !apiKey || !secret || !httpCECClient) {
        conduit_utils_1.logger.error(`Invalid options for CEC plugin`, { host, apiKey, secret, httpCECClient });
        return null;
    }
    const destination = new ClientEventCollectorDestination_1.ClientEventCollectorDestination(host, apiKey, secret, httpCECClient, flushIntervalInSeconds);
    return buildTelemetryDestinationPlugin('ENClientEventCollectorPlugin', destination);
}
exports.setupClientEventCollectorPlugin = setupClientEventCollectorPlugin;
//# sourceMappingURL=index.js.map