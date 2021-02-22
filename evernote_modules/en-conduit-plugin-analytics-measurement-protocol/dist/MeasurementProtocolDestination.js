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
exports.MeasurementProtocolDestination = void 0;
const conduit_utils_1 = require("conduit-utils");
const queryString = __importStar(require("querystring"));
const simply_immutable_1 = require("simply-immutable");
const MeasurementProtocolInterfaces_1 = require("./MeasurementProtocolInterfaces");
class MeasurementProtocolDestination {
    constructor(gaTrackingId, analyticsClient, batchMode, debugMode, flushIntervalInSeconds) {
        this.gaTrackingId = gaTrackingId;
        this.analyticsClient = analyticsClient;
        this.trc = conduit_utils_1.createTraceContext('MeasurementProtocolDestination');
        this.batchMax = 20;
        this.defaultFlushInterval = 60000;
        this.measurementAPIVersion = '1';
        this.name = 'MeasurementProtocol';
        this.method = 'POST';
        this.gaUrl = 'https://www.google-analytics.com';
        this.userIdDimensionKey = 'authenticatedGlobalUserId';
        this.basePath = '/collect';
        this.batchPath = '/batch';
        this.debugPath = '/debug/collect';
        this.batchMode = false;
        this.flushTimer = null;
        this.dimensions = {};
        this.debugMode = false;
        this.eventsBatch = [];
        if (batchMode) {
            this.batchMode = batchMode;
        }
        if (debugMode) {
            this.debugMode = debugMode;
        }
        this.flushInterval = flushIntervalInSeconds ? flushIntervalInSeconds * 1000 : this.defaultFlushInterval;
    }
    destructor() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }
    onFlush() {
        const batchToPost = this.eventsBatch.splice(0, this.batchMax);
        this.analyticsClient.request(this.trc, this.buildBatchRequest(batchToPost))
            .then(() => {
            conduit_utils_1.logger.debug(`${this.name}: Flushed events batch`);
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        })
            .catch(error => {
            this.eventsBatch.unshift(...batchToPost);
            conduit_utils_1.logger.warn(`${this.name}: Error on event recording`, error);
        });
    }
    onRecordEvent(event, commonEventId) {
        const hitPayload = this.fillMessage(event, commonEventId);
        if (this.batchMode) {
            this.recordEventOnBatching(hitPayload);
        }
        else {
            this.analyticsClient.request(this.trc, this.buildSingleEventRequest(hitPayload))
                .then(() => conduit_utils_1.logger.debug(`${this.name}: Recorded event`))
                .catch(error => conduit_utils_1.logger.warn(`${this.name}: Error on event recording`, error));
        }
    }
    recordEventOnBatching(event) {
        this.eventsBatch.push(event);
        if (this.eventsBatch.length >= 20) {
            this.onFlush();
        }
        else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.onFlush(), this.flushInterval);
        }
    }
    async onException(exception, commonEventId) {
        const hitPayload = this.fillMessage(exception, commonEventId, MeasurementProtocolInterfaces_1.ANALYTICS_HIT.EXCEPTION);
        try {
            await this.analyticsClient.request(this.trc, this.buildSingleEventRequest(hitPayload));
            conduit_utils_1.logger.debug(`${this.name}: Exception recorded`);
        }
        catch (error) {
            conduit_utils_1.logger.warn(`${this.name}: Error on exception recording`, error);
        }
    }
    onSetDimension(name, value) {
        this.setDimension(name, value);
    }
    onSetDimensions(dimensionsSet) {
        Object.entries(dimensionsSet).forEach(([key, value]) => this.setDimension(key, value));
    }
    buildBatchRequest(events) {
        return Object.assign(Object.assign({}, this.buildRequestParams()), { body: this.buildBatchBody(events) });
    }
    buildSingleEventRequest(event) {
        return Object.assign(Object.assign({}, this.buildRequestParams()), { body: this.buildBody(event) });
    }
    buildRequestParams() {
        return {
            method: this.method,
            url: this.gaUrl,
            path: this.getPath(),
        };
    }
    getPath() {
        if (this.debugMode) {
            return this.debugPath;
        }
        if (this.batchMode) {
            return this.batchPath;
        }
        return this.basePath;
    }
    buildBatchBody(events) {
        return events.map(event => {
            return queryString.stringify(this.cleanEvent(event)).toString();
        }).join('\n');
    }
    buildBody(event) {
        return `${queryString.stringify(this.cleanEvent(event))}`;
    }
    cleanEvent(event) {
        return simply_immutable_1.filterImmutable(event, value => !this.isEmptyValue(value));
    }
    setDimension(key, value) {
        this.dimensions[key] = value;
        if (key === this.userIdDimensionKey) {
            if (value !== this.gUserID) {
                this.assignNewUserAttributes(value);
            }
        }
    }
    assignNewUserAttributes(userID) {
        this.gClientID = conduit_utils_1.uuid();
        this.gUserID = userID;
    }
    isEmptyValue(value) {
        return value === undefined || value === '';
    }
    fillMessage(record, eventId, hitType) {
        const hitPayload = Object.assign(Object.assign({}, this.translateFields(Object.assign(Object.assign(Object.assign({}, this.dimensions), record), { eventId }))), this.baseMessageProps(hitType));
        this.dimensions = {};
        return hitPayload;
    }
    baseMessageProps(hitType) {
        return {
            tid: this.gaTrackingId,
            v: this.measurementAPIVersion,
            t: hitType || MeasurementProtocolInterfaces_1.ANALYTICS_HIT.EVENT,
        };
    }
    translateFields(record) {
        return {
            cid: this.gClientID,
            uid: (record.userId) ? record.userId : this.gUserID,
            ec: record.category || '',
            ea: record.action || '',
            el: record.label,
            ev: record.value,
            exd: record.callstack
                ? [record.message, record.callstack].join('\n')
                : record.message,
            exf: record.fatal,
            cd1: record.timezoneOffset,
            cd2: record.platform,
            cd3: record.client,
            cd4: record.userAge,
            cd5: (record.userId) ? record.userId : this.gUserID,
            cd6: record.userTier,
            cd7: record.deviceId,
            cd8: record.exportToDb,
            cd9: record.editorVersion,
            cd10: record.editorHitFlag,
            cd11: record.numNotesTotal,
            cd12: record.numNotesSelfCreated,
            cd13: record.numNotebooksTotal,
            cd14: record.numNotebooksSelfCreated,
            cd15: record.numSpacesTotal,
            cd16: record.numSpacesSelfCreated,
            cd17: record.numTags,
            cd18: record.numShortcuts,
            cd19: record.numSavedsearches,
            cd20: record.numStacks,
            cd21: record.isContentOwner,
            cd22: record.noteTier,
            cd23: record.noteGuid,
            cd24: record.notebookGuid,
            cd25: record.spaceGuid,
            cd26: record.journeyId,
            cd27: record.messageId,
            cd28: record.linkUrl,
            cd29: record.loadTime,
            cd31: record.searchSessionId,
            cd32: record.searchSuggestionType,
            cd33: record.searchSuggestionRank,
            cd34: record.searchCharLength,
            cd35: record.searchSuggestionItems,
            cd36: record.searchResultRank,
            cd37: record.addSavedSearchShortcut,
            cd38: record.filterType,
            cd39: record.filterCount,
            cd43: record.clientVersion,
            cd53: record.eventId,
        };
    }
}
exports.MeasurementProtocolDestination = MeasurementProtocolDestination;
//# sourceMappingURL=MeasurementProtocolDestination.js.map