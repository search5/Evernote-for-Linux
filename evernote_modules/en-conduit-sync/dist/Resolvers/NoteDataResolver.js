"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteDataResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const DemandFetchNoteActivity_1 = require("../SyncManagement/DemandFetchNoteActivity");
// these are the fields not available with just metadata
const NOTE_NON_META_FIELDS = {
    // fields:
    shareCount: true,
    noteResourceCountMax: true,
    uploadLimit: true,
    resourceSizeMax: true,
    noteSizeMax: true,
    uploaded: true,
    // edges:
    attachments: true,
    inactiveAttachments: true,
    memberships: true,
};
function needsFullData(fieldSelection) {
    // technically all of the content blob fields are missing, but only require a demand fetch if the actual content is requested
    if (needsContent(fieldSelection)) {
        return 'content.content';
    }
    for (const key in fieldSelection) {
        if (conduit_core_1.shouldIgnoreFieldSelection(fieldSelection, key)) {
            continue;
        }
        if (NOTE_NON_META_FIELDS.hasOwnProperty(key)) {
            return key;
        }
    }
    return null;
}
function needsContent(fieldSelection) {
    return Boolean(fieldSelection.content && fieldSelection.content.content);
}
function isNoteQueryUnbounded(context, info) {
    var _a;
    const path = info ? conduit_core_1.responsePathToSelectionPath(info.path) : undefined;
    if (path && ((_a = path[0]) === null || _a === void 0 ? void 0 : _a.includes('List')) && path[0] !== 'ShortcutList' && path[1] && path[1] === 'list') {
        return true;
    }
    return false;
}
function getNoteDataResolver() {
    async function NoteDataResolver(context, nodeOrRef, fieldSelection, info) {
        conduit_core_1.validateDB(context);
        if (!nodeOrRef || !fieldSelection) {
            return conduit_storage_1.isGraphNode(nodeOrRef) ? nodeOrRef : null;
        }
        let keyRequiringFetch = null;
        if (conduit_storage_1.isGraphNode(nodeOrRef)) {
            if (!nodeOrRef.NodeFields.isMetadata) {
                return nodeOrRef;
            }
            keyRequiringFetch = needsFullData(fieldSelection);
            if (!keyRequiringFetch) {
                return nodeOrRef;
            }
        }
        else {
            // attempting to fetch note on demand from service.
            keyRequiringFetch = 'FullNode';
        }
        if (isNoteQueryUnbounded(context, info)) {
            conduit_utils_1.logger.warn(`Demand fetch not supported for list queries. Skipping ${nodeOrRef.id}`);
            return null;
        }
        DemandFetchNoteActivity_1.addNoteToDemandFetchActivity(nodeOrRef.id, needsContent(fieldSelection));
        const fetchedNote = await DemandFetchNoteActivity_1.awaitNoteDemandFetchActivity(context, nodeOrRef.id);
        return fetchedNote ? await context.db.getNode(context, nodeOrRef, true) : null;
    }
    return NoteDataResolver;
}
exports.getNoteDataResolver = getNoteDataResolver;
//# sourceMappingURL=NoteDataResolver.js.map