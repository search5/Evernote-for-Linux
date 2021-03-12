"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipientSettingsNodesAndEdges = void 0;
const en_core_entity_types_1 = require("en-core-entity-types");
const simply_immutable_1 = require("simply-immutable");
const BaseConverter_1 = require("./BaseConverter");
const StackConverter_1 = require("./StackConverter");
function getNotebookIDFromRecipientSettingsID(recipientSettingsID) {
    const sections = recipientSettingsID.split('-');
    sections.pop();
    return sections.join('-');
}
const getRecipientSettingsNodesAndEdges = async (trc, instance, context) => {
    var _a;
    const settingsID = instance.ref.id;
    if (!settingsID) {
        throw new Error('Missing notebook id on recipient settings');
    }
    const notebookID = getNotebookIDFromRecipientSettingsID(settingsID);
    if (!notebookID) {
        throw new Error('Missing id on recipient settings');
    }
    const ref = { id: notebookID, type: en_core_entity_types_1.CoreEntityTypes.Notebook };
    let notebook = context.eventManager.getProcessingEntity(ref.id, en_core_entity_types_1.CoreEntityTypes.Notebook);
    if (!notebook) {
        notebook = await context.tx.getNode(trc, null, ref);
    }
    context.eventManager.addProcessingEntity(notebookID, 'RecipientSettings', instance);
    if (!notebook) {
        return null;
    }
    const update = {
        inMyList: instance.recipientStatus === 'IN_MY_LIST',
        reminderNotifyEmail: instance.reminderNotifyEmail === true,
        reminderNotifyInApp: instance.reminderNotifyInApp === true,
    };
    const newNotebook = simply_immutable_1.updateImmutable(notebook, ['NodeFields'], update);
    const notebookChanges = { nodes: { nodesToUpsert: [newNotebook], nodesToDelete: [] } };
    const stackChanges = await StackConverter_1.getStackEntity(trc, (_a = instance.stack) !== null && _a !== void 0 ? _a : null, newNotebook, context.tx);
    return BaseConverter_1.mergeNodesAndEdges(notebookChanges, stackChanges);
};
exports.getRecipientSettingsNodesAndEdges = getRecipientSettingsNodesAndEdges;
//# sourceMappingURL=RecipientSettingsConverter.js.map