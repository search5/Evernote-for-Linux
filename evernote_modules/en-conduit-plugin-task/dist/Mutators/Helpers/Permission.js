"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNoteEditPermissionByNoteId = exports.checkNoteEditPermissionByTask = exports.checkTaskEditPermission = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
async function checkTaskEditPermission(trc, ctx, task) {
    const edge = conduit_utils_1.firstStashEntry(task.inputs.parent);
    if (!edge) {
        throw new conduit_utils_1.InvalidParameterError(`Task ${task.id} does not have parent note`);
    }
    const noteEditPermission = await getNoteEditPermissionByNoteId(trc, ctx, edge.srcID);
    if (noteEditPermission) {
        return;
    }
    const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
    const permission = await en_core_entity_types_1.computePermission(task, permContext);
    if (permission === en_core_entity_types_1.MembershipPrivilege.COMPLETE) {
        return;
    }
    else {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
}
exports.checkTaskEditPermission = checkTaskEditPermission;
async function checkNoteEditPermissionByTask(trc, ctx, task) {
    const edge = conduit_utils_1.firstStashEntry(task.inputs.parent);
    if (!edge) {
        throw new conduit_utils_1.InvalidParameterError(`Task ${task.id} does not have parent note`);
    }
    await checkNoteEditPermissionByNoteId(trc, ctx, edge.srcID);
}
exports.checkNoteEditPermissionByTask = checkNoteEditPermissionByTask;
async function checkNoteEditPermissionByNoteId(trc, ctx, noteId) {
    const noteEditPermission = await getNoteEditPermissionByNoteId(trc, ctx, noteId);
    if (!noteEditPermission) {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
}
exports.checkNoteEditPermissionByNoteId = checkNoteEditPermissionByNoteId;
async function getNoteEditPermissionByNoteId(trc, ctx, noteId) {
    const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
    const policy = await en_core_entity_types_1.commandPolicyOfNote(noteId, permContext);
    return !!policy.canEditContent;
}
//# sourceMappingURL=Permission.js.map