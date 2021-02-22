"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatadogPlugin = void 0;
const conduit_utils_1 = require("conduit-utils");
const DatadogMetricsDestination_1 = require("./DatadogMetricsDestination");
const PLUGIN_NAME = 'ENDatadogMetricsPlugin';
const buildTelemetryDestinationPlugin = (name, destination) => ({
    name,
    init: async () => await conduit_utils_1.applyTelemetryDestination(destination),
});
const setupDatadogPlugin = (batchMode, datadogSource, httpClient, flushIntervalInSeconds) => buildTelemetryDestinationPlugin(PLUGIN_NAME, new DatadogMetricsDestination_1.DatadogMetricsDestination(batchMode, datadogSource, httpClient, flushIntervalInSeconds));
exports.setupDatadogPlugin = setupDatadogPlugin;
//# sourceMappingURL=index.js.map