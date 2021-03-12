"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotebookNodesAndEdges = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const BaseConverter_1 = require("./BaseConverter");
const StackConverter_1 = require("./StackConverter");
const getNotebookNodesAndEdges = async (trc, instance, context) => {
    const initial = BaseConverter_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const settings = context.eventManager.getProcessingEntity(initial.id, 'RecipientSettings');
    const isExternal = context.currentUserID !== instance.ownerId;
    const notebook = Object.assign(Object.assign({}, initial), { type: en_core_entity_types_1.CoreEntityTypes.Notebook, NodeFields: {
            created: instance.created,
            updated: instance.updated,
            isPartialNotebook: false,
            isPublished: instance.published === true,
            inWorkspace: instance.inWorkspace === true,
            isExternal,
            internal_shareCountProfiles: {},
            internal_linkedNotebookParams: {},
            markedForOffline: false,
            reminderNotifyEmail: (settings === null || settings === void 0 ? void 0 : settings.reminderNotifyEmail) === false,
            reminderNotifyInApp: (settings === null || settings === void 0 ? void 0 : settings.reminderNotifyInApp) === false,
        }, inputs: {
            parent: {},
            stack: {},
            userForDefaultNotebook: {},
            userForUserNotebook: {},
        }, outputs: {
            children: {},
            childrenInTrash: {},
            creator: {},
            memberships: {},
            shortcut: {},
        }, CacheFields: undefined, CacheState: undefined });
    const edgesToCreate = [];
    const edgesToDelete = [];
    const isDefault = instance.isDefault === true;
    const isOwner = context.currentUserID === instance.ownerId;
    context.eventManager.addProcessingEntity(notebook.id, en_core_entity_types_1.CoreEntityTypes.Notebook, notebook);
    if (isDefault && isOwner) {
        edgesToDelete.push({
            srcID: conduit_core_1.PERSONAL_USER_ID, srcType: en_core_entity_types_1.CoreEntityTypes.User, srcPort: 'defaultNotebook',
        });
        edgesToCreate.push({
            srcID: conduit_core_1.PERSONAL_USER_ID, srcType: en_core_entity_types_1.CoreEntityTypes.User, srcPort: 'defaultNotebook',
            dstID: notebook.id, dstType: en_core_entity_types_1.CoreEntityTypes.Notebook, dstPort: 'userForDefaultNotebook',
        });
    }
    let stackName = null;
    if (isOwner && instance.stack) {
        stackName = instance.stack;
    }
    else if (!isOwner && (settings === null || settings === void 0 ? void 0 : settings.stack)) {
        stackName = settings.stack;
    }
    const stackChanges = await StackConverter_1.getStackEntity(trc, stackName, notebook, context.tx);
    conduit_utils_1.logger.debug(notebook.id);
    conduit_utils_1.logger.debug(notebook.label || '');
    const notebookChanges = {
        nodes: { nodesToUpsert: [notebook], nodesToDelete: [] },
        edges: { edgesToCreate, edgesToDelete },
    };
    return BaseConverter_1.mergeNodesAndEdges(notebookChanges, stackChanges);
};
exports.getNotebookNodesAndEdges = getNotebookNodesAndEdges;
//# sourceMappingURL=NotebookConverter.js.map