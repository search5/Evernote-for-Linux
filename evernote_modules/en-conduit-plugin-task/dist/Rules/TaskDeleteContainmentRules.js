"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDeleteContainmentRules = void 0;
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
const TaskConstants_1 = require("../TaskConstants");
exports.TaskDeleteContainmentRules = [{
        on: 'Node:DELETE',
        where: { type: en_core_entity_types_1.CoreEntityTypes.Note },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await onNoteDelete(ctx, trc, op.nodeRef, []);
        },
    }];
async function onNoteDelete(ctx, trc, nodeRef, ops) {
    // delete defaultTaskNote association
    const taskUserSettingsRefs = await ctx.traverseGraph(trc, nodeRef, [{ edge: ['inputs', 'taskUserSettingsForDefaultNote'], type: TaskConstants_1.TaskEntityTypes.TaskUserSettings }]);
    if (taskUserSettingsRefs.length) {
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete: taskUserSettingsRefs.map(userTaskSettingRef => {
                return {
                    dstID: nodeRef.id, dstType: nodeRef.type, dstPort: 'taskUserSettingsForDefaultNote',
                    srcID: userTaskSettingRef.id, srcType: userTaskSettingRef.type, srcPort: 'defaultTaskNote',
                };
            }),
        });
    }
    ops.push({
        changeType: 'Custom',
        commandName: 'taskNoteDelete',
        params: {
            noteID: nodeRef.id,
        },
    });
    return ops;
}
//# sourceMappingURL=TaskDeleteContainmentRules.js.map