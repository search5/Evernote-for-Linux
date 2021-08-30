"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarAccountNodeAndEdges = void 0;
const en_quasar_connector_1 = require("en-quasar-connector");
const getCalendarAccountNodeAndEdges = async (trc, instance, context) => {
    const account = en_quasar_connector_1.convertNsyncEntityToNode(instance, context);
    if (!account) {
        return {};
    }
    return { nodes: { nodesToUpsert: [account], nodesToDelete: [] } };
};
exports.getCalendarAccountNodeAndEdges = getCalendarAccountNodeAndEdges;
//# sourceMappingURL=CalendarAccountConverters.js.map