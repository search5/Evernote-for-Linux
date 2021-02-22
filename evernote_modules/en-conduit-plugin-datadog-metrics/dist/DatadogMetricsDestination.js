"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatadogMetricsDestination = void 0;
const conduit_utils_1 = require("conduit-utils");
class DatadogMetricsDestination {
    constructor(batchMode, ddsource, httpClient, flushIntervalInSeconds) {
        this.batchMode = batchMode;
        this.ddsource = ddsource;
        this.httpClient = httpClient;
        this.name = 'datadog';
        this.trc = conduit_utils_1.createTraceContext('DatadogMetricsDestination');
        this.bufferCountToFlush = 100;
        this.datadogUrl = 'https://browser-http-intake.logs.datadoghq.com/v1/input/pubeea8f9472a6c69012d7c63a4b390425f';
        this.defaultFlushInterval = 60000;
        this.buffer = [];
        this.onRecordMetric = (metric) => {
            if (metric.ddsource) {
                conduit_utils_1.logger.warn(`Overwriting ddsource: ${metric.ddsource} with ${this.ddsource}`);
            }
            const body = Object.assign(Object.assign({}, metric), { ddsource: this.ddsource });
            this.buffer.push(conduit_utils_1.safeStringify(body));
            if (this.buffer.length >= this.bufferCountToFlush || !this.batchMode) {
                this.onFlush();
            }
            else if (!this.timer) {
                this.timer = setTimeout(this.onFlush, this.flushInterval);
            }
        };
        this.onFlush = () => {
            clearTimeout(this.timer);
            this.timer = null;
            if (!this.buffer.length) {
                return;
            }
            const params = {
                method: 'POST',
                url: this.datadogUrl,
                body: '[' + this.buffer.join(',') + ']\n',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            this.buffer = [];
            this.httpClient.request(this.trc, params).catch(error => {
                if (error.message !== 'Failed to fetch') {
                    conduit_utils_1.logger.warn(`Failed to push datadog analytics batch, reason: ${error}`);
                }
            });
        };
        this.flushInterval = flushIntervalInSeconds ? flushIntervalInSeconds * 1000 : this.defaultFlushInterval;
    }
}
exports.DatadogMetricsDestination = DatadogMetricsDestination;
//# sourceMappingURL=DatadogMetricsDestination.js.map