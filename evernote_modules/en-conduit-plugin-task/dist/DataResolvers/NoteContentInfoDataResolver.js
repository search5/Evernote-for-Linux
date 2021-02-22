"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteContentInfoDataResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const NoteContentInfo_1 = require("../Mutators/Helpers/NoteContentInfo");
async function NoteContentInfoDataResolver(context, node) {
    conduit_core_1.validateDB(context);
    if (!conduit_storage_1.isGraphNode(node)) {
        const noteContentInfoID = NoteContentInfo_1.getNoteContentInfoIDByNoteID(node.id);
        const noteContentInfo = await context.db.getNode(context, { type: node.type, id: noteContentInfoID });
        if (noteContentInfo) {
            return noteContentInfo;
        }
        else {
            return null;
        }
    }
    return node;
}
exports.NoteContentInfoDataResolver = NoteContentInfoDataResolver;
//# sourceMappingURL=NoteContentInfoDataResolver.js.map