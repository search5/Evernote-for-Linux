"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteUpdateContainmentRules = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const en_tasks_data_model_1 = require("en-tasks-data-model");
const NoteContentInfo_1 = require("../Mutators/Helpers/NoteContentInfo");
const Reminder_1 = require("../Mutators/Helpers/Reminder");
exports.NoteUpdateContainmentRules = [{
        on: 'Node:UPDATE',
        where: { type: en_core_entity_types_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNoteUpdate(ctx, trc, op, []);
        },
    }];
async function onNoteUpdate(ctx, trc, op, ops) {
    var _a;
    const deleted = (_a = op.node.NodeFields) === null || _a === void 0 ? void 0 : _a.deleted;
    if (deleted === null) {
        await updateAllReminderStatuses(ctx, trc, op.nodeRef, ops, en_tasks_data_model_1.ReminderStatus.active);
        await NoteContentInfo_1.updateDeletedOnTaskByNote(ctx, trc, op.nodeRef.id, ops, false);
        ops.push({
            changeType: 'Custom',
            commandName: 'taskNoteMoveFromTrash',
            params: {
                noteID: op.nodeRef.id,
            },
        });
    }
    else if (deleted) {
        await noteMoveToTrashOps(ctx, trc, op.nodeRef, ops);
    }
    return ops;
}
async function updateAllReminderStatuses(ctx, trc, nodeRef, ops, status) {
    const tasks = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['outputs', 'tasks'], type: en_data_model_1.EntityTypes.Task }]);
    const ps = [];
    for (const task of tasks) {
        ps.push(Reminder_1.updateReminderStatus(ctx, trc, task.id, ops, status));
    }
    await conduit_utils_1.allSettled(ps);
}
async function noteMoveToTrashOps(ctx, trc, noteRef, ops) {
    await updateAllReminderStatuses(ctx, trc, noteRef, ops, en_tasks_data_model_1.ReminderStatus.muted);
    await NoteContentInfo_1.updateDeletedOnTaskByNote(ctx, trc, noteRef.id, ops, true);
    ops.push({
        changeType: 'Custom',
        commandName: 'taskNoteMoveToTrash',
        params: {
            noteID: noteRef.id,
        },
    });
}
//# sourceMappingURL=NoteUpdateContainmentRules.js.map