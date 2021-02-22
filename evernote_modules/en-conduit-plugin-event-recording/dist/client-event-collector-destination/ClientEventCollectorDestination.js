"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientEventCollectorDestination = void 0;
const conduit_utils_1 = require("conduit-utils");
const enc_base64_1 = __importDefault(require("crypto-js/enc-base64"));
const hmac_sha256_1 = __importDefault(require("crypto-js/hmac-sha256"));
const snakecase_keys_1 = __importDefault(require("snakecase-keys"));
const DataDictionaryEvent_1 = require("../DataDictionaryEvent");
class ClientEventCollectorDestination {
    constructor(host, apiKey, secret, cecClient, flushIntervalInSeconds) {
        this.host = host;
        this.apiKey = apiKey;
        this.secret = secret;
        this.cecClient = cecClient;
        this.name = 'ClientEventCollector';
        this.trc = conduit_utils_1.createTraceContext('ClientEventCollectorDestination');
        this.path = '/e';
        this.eventsBatch = [];
        this.flushTimer = null;
        this.batchMax = 20;
        this.defaultFlushInterval = 60000;
        this.onFlushRateError = conduit_utils_1.rateLimitErrorLog(10, `${this.name}: Error on batch event recording`);
        this.dimensions = {};
        this.flushInterval = flushIntervalInSeconds === undefined ? this.defaultFlushInterval : flushIntervalInSeconds * 1000;
    }
    onFlush() {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
        while (this.eventsBatch.length) {
            const eventChunk = this.eventsBatch.splice(0, this.batchMax);
            this.cecClient.request(this.trc, this.buildRequestParams(eventChunk))
                .then(() => {
                conduit_utils_1.logger.debug(`${this.name}: Flushed events batch`);
            })
                .catch(error => {
                this.onFlushRateError(error);
                if (!this.flushTimer) {
                    this.flushTimer = setTimeout(() => this.onFlush(), this.flushInterval);
                }
            });
        }
    }
    onRecordEvent(event, commonEventId) {
        try {
            this.eventsBatch.push(this.fillEvent(event, commonEventId));
            if (this.eventsBatch.length >= this.batchMax) {
                this.onFlush();
            }
            else if (!this.flushTimer) {
                this.flushTimer = setTimeout(() => this.onFlush(), this.flushInterval);
            }
        }
        catch (e) {
            conduit_utils_1.logger.warn(`${this.name}: Error on record`, e);
        }
    }
    onSetDimension(name, value) {
        this.setDimension(name, value);
    }
    onSetDimensions(dimensionsSet) {
        Object.entries(dimensionsSet).forEach(([key, value]) => this.setDimension(key, value));
    }
    // CON-830 don't filter any events
    // public onFilterEvent(event: ClientEvent): boolean {
    //   if (this.rules && this.rules.bucketed_arm_ids) {
    //     try {
    //       return this.rules.bucketed_arm_ids.some(bucketedArm =>
    //         bucketedArm.experiment_name === 'ion8856InstallWebClipperJourney' &&
    //         bucketedArm.experiment_arm_name === 'B_ShowModal',
    //       );
    //     } catch {
    //       return false;
    //     }
    //   }
    //   return false;
    // }
    onUpdateRules(rawRules) {
        try {
            this.rules = (!rawRules) ? {} : JSON.parse(rawRules);
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                this.rules = this.rules || {};
            }
            else {
                throw error;
            }
        }
    }
    setDimension(name, value) {
        if (value === undefined || value === '') {
            delete this.dimensions[name];
        }
        else {
            this.dimensions[name] = value;
        }
    }
    fillEvent(event, commonEventId) {
        const attributes = {};
        const baseEvent = DataDictionaryEvent_1.populateBaseEventProperties();
        const obj = Object.assign(Object.assign(Object.assign({}, this.dimensions), event), { eventId: commonEventId });
        for (const key in obj) {
            if (baseEvent.hasOwnProperty(key)) {
                baseEvent[key] = obj[key];
            }
            else {
                attributes[key] = obj[key];
            }
        }
        if (Object.keys(attributes).length) {
            baseEvent.attributes = JSON.stringify(attributes);
        }
        return baseEvent;
    }
    buildRequestParams(events) {
        const now = Date.now();
        events.forEach(event => event.sentTimestampUtc = now);
        const payload = {
            batch_id: conduit_utils_1.uuid(),
            sent_timestamp_utc: now,
            events,
        };
        const body = JSON.stringify(snakecase_keys_1.default(payload));
        return {
            method: 'POST',
            url: this.host,
            headers: this.buildHeaders(body),
            body,
            path: this.path,
        };
    }
    buildHeaders(payload) {
        return {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
            'X-Signature': this.buildSignature(payload),
        };
    }
    buildSignature(payload) {
        const hash = hmac_sha256_1.default(payload, this.secret || '');
        return enc_base64_1.default.stringify(hash);
    }
}
exports.ClientEventCollectorDestination = ClientEventCollectorDestination;
//# sourceMappingURL=ClientEventCollectorDestination.js.map