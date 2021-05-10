"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarAccountNodeAndEdges = void 0;
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getCalendarAccountNodeAndEdges = async (trc, instance, context) => {
    const nodesToUpsert = [];
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return {};
    }
    const account = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.CalendarAccount, NodeFields: {
            isConnected: instance.isConnected,
            userIdFromExternalProvider: instance.userIdFromExternalProvider,
            provider: instance.provider,
        }, inputs: {}, outputs: {
            calendars: {},
        } });
    nodesToUpsert.push(account);
    return { nodes: { nodesToUpsert, nodesToDelete: [] } };
};
exports.getCalendarAccountNodeAndEdges = getCalendarAccountNodeAndEdges;
//# sourceMappingURL=CalendarAccountConverters.js.map