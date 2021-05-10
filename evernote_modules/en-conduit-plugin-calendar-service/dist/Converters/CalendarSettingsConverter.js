"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarSettingsNode = void 0;
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getCalendarSettingsNode = async (trc, instance, context) => {
    const nodesToUpsert = [];
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        return {};
    }
    const calendarSettings = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.CalendarSettings, NodeFields: {
            useTemplateForNewNotes: instance.useTemplateForNewNotes,
            desktopReminders: instance.desktopReminders,
            mobileReminders: instance.mobileReminders,
        }, inputs: {}, outputs: {} });
    nodesToUpsert.push(calendarSettings);
    return { nodes: { nodesToUpsert, nodesToDelete: [] } };
};
exports.getCalendarSettingsNode = getCalendarSettingsNode;
//# sourceMappingURL=CalendarSettingsConverter.js.map