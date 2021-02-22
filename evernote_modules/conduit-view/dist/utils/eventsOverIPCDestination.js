"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsOverIPCDestination = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const Connector_1 = require("../Connector");
const logger = conduit_utils_1.createLogger('conduit:eventsOverIPC');
const eventQuery = graphql_tag_1.default `mutation EventsRecord($propertiesJsonStr: String!, $selectiveDestinations: String) {
  EventsRecord(propertiesJsonStr: $propertiesJsonStr, selectiveDestinations: $selectiveDestinations) { success }
}`;
const metricQuery = graphql_tag_1.default `mutation EventsRecord($propertiesJsonStr: String!, $selectiveDestinations: String) {
  MetricsRecord(propertiesJsonStr: $propertiesJsonStr, selectiveDestinations: $selectiveDestinations) { success }
}`;
async function recordEvent(event, commontEventId, selectiveDestinations) {
    const eventWithId = Object.assign(Object.assign({}, event), { eventId: commontEventId });
    const ipcEvent = {
        propertiesJsonStr: JSON.stringify(eventWithId),
    };
    if (selectiveDestinations) {
        ipcEvent.selectiveDestinations = JSON.stringify(selectiveDestinations);
    }
    try {
        const result = await Connector_1.connector.query(eventQuery, ipcEvent);
        if (result.error) {
            result.error.errorList.forEach(e => logger.error('Unable to record event', e));
            return false;
        }
    }
    catch (e) {
        logger.error('Unable to record event', e);
        return false;
    }
    return true;
}
async function recordMetric(metric, selectiveDestinations) {
    const ipcEvent = {
        propertiesJsonStr: JSON.stringify(metric),
    };
    if (selectiveDestinations) {
        ipcEvent.selectiveDestinations = JSON.stringify(selectiveDestinations);
    }
    try {
        const result = await Connector_1.connector.query(metricQuery, ipcEvent);
        if (result.error) {
            result.error.errorList.forEach(e => logger.error('Unable to record metric', e));
            return false;
        }
    }
    catch (e) {
        logger.error('Unable to record metric', e);
        return false;
    }
    return true;
}
const flushQuery = graphql_tag_1.default `mutation EventsFlush { EventsFlush { success } }`;
function flushEvents() {
    Connector_1.connector.query(flushQuery, {}).then(result => {
        if (result.error) {
            result.error.errorList.forEach(e => logger.error('Unable to flush batched events'));
        }
    }).catch(error => logger.error('Unable to flush batched events', error));
}
const exceptionQuery = graphql_tag_1.default `mutation ExceptionRecord($message: String!, $fatal: Boolean, $callstack: String) {
  ExceptionRecord(message: $message, fatal: $fatal, callstack: $callstack) { success }
}`;
function recordException(exception, commontEventId) {
    Connector_1.connector.query(exceptionQuery, exception).then(result => {
        if (result.error) {
            result.error.errorList.forEach(e => logger.error('Unable to record exception', e));
        }
    }).catch(error => logger.error('Unable to record exception', error));
}
const dimensionsQuery = graphql_tag_1.default `mutation DimensionSet($name: String!, $value: String!) {
  DimensionSet(name: $name, value: $value) { success }
}`;
async function setDimension(name, value) {
    try {
        if (!value || value === '') {
            return false;
        }
        const result = await Connector_1.connector.query(dimensionsQuery, { name, value });
        if (result.error) {
            result.error.errorList.forEach(e => logger.error('Unable to set dimension', e));
            return false;
        }
    }
    catch (e) {
        logger.error('Unable to set dimension event', e);
        return false;
    }
    return true;
}
exports.eventsOverIPCDestination = {
    name: 'EventsIPC-View',
    onException: recordException,
    onFlush: flushEvents,
    onRecordEvent: recordEvent,
    onRecordMetric: recordMetric,
    onSetDimension: setDimension,
};
//# sourceMappingURL=eventsOverIPCDestination.js.map