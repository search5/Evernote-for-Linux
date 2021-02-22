"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMeasurementProtocolPlugin = exports.ANALYTICS_HIT = void 0;
const conduit_utils_1 = require("conduit-utils");
const MeasurementProtocolDestination_1 = require("./MeasurementProtocolDestination");
const MeasurementProtocolInterfaces_1 = require("./MeasurementProtocolInterfaces");
Object.defineProperty(exports, "ANALYTICS_HIT", { enumerable: true, get: function () { return MeasurementProtocolInterfaces_1.ANALYTICS_HIT; } });
const PLUGIN_NAME = 'ENMeasurementProtocolPlugin';
const buildTelemetryDestinationPlugin = (name, destination) => ({
    name,
    init: async () => await conduit_utils_1.applyTelemetryDestination(destination),
});
const setupMeasurementProtocolPlugin = (gaTrackingId, httpClient, batchMode, devMode, flushIntervalInSeconds) => buildTelemetryDestinationPlugin(PLUGIN_NAME, new MeasurementProtocolDestination_1.MeasurementProtocolDestination(gaTrackingId, httpClient, batchMode, devMode, flushIntervalInSeconds));
exports.setupMeasurementProtocolPlugin = setupMeasurementProtocolPlugin;
//# sourceMappingURL=index.js.map