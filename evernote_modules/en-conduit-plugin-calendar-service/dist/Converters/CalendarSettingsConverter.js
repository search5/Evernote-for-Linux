"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarSettingsNode = void 0;
const en_quasar_connector_1 = require("en-quasar-connector");
const getCalendarSettingsNode = async (trc, instance, context) => {
    const calendarSettings = en_quasar_connector_1.convertNsyncEntityToNode(instance, context);
    if (!calendarSettings) {
        return {};
    }
    return { nodes: { nodesToUpsert: [calendarSettings], nodesToDelete: [] } };
};
exports.getCalendarSettingsNode = getCalendarSettingsNode;
//# sourceMappingURL=CalendarSettingsConverter.js.map