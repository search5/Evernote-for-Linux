"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCalendarSettingsNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getUserCalendarSettingsNodeAndEdges = async (trc, instance, context) => {
    var _a, _b;
    const userCalendarSettings = en_nsync_connector_1.convertNsyncEntityToNode(instance, context);
    if (!userCalendarSettings) {
        return {};
    }
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const edgesToDelete = [];
    nodesToUpsert.push(userCalendarSettings);
    const parentID = (_a = instance.parentEntity) === null || _a === void 0 ? void 0 : _a.id;
    const parentType = en_conduit_sync_types_1.entityTypeAsNodeType(context.eventManager.di, (_b = instance.parentEntity) === null || _b === void 0 ? void 0 : _b.type, en_data_model_1.EntityTypes.CalendarAccount);
    if (parentID && parentType) {
        const currentCalendar = await context.tx.getNode(trc, null, { type: en_data_model_1.EntityTypes.UserCalendarSettings, id: userCalendarSettings.id });
        const currentParentEdge = conduit_utils_1.firstStashEntry(currentCalendar === null || currentCalendar === void 0 ? void 0 : currentCalendar.inputs.parent);
        if (currentParentEdge) {
            const currentParentID = currentParentEdge.srcID;
            if (parentID !== currentParentID) {
                edgesToDelete.push({
                    dstID: userCalendarSettings.id, dstType: en_data_model_1.EntityTypes.UserCalendarSettings, dstPort: 'parent',
                });
            }
        }
        edgesToCreate.push({
            srcType: parentType,
            srcID: parentID,
            srcPort: 'calendars',
            dstType: en_data_model_1.EntityTypes.UserCalendarSettings,
            dstID: userCalendarSettings.id,
            dstPort: 'parent',
        });
    }
    return { nodes: { nodesToUpsert, nodesToDelete: [] }, edges: { edgesToDelete, edgesToCreate } };
};
exports.getUserCalendarSettingsNodeAndEdges = getUserCalendarSettingsNodeAndEdges;
//# sourceMappingURL=UserCalendarSettingsConverter.js.map