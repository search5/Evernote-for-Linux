"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTaskUserSettingsID = exports.getNewTaskUserSettingsOps = void 0;
const en_data_model_1 = require("en-data-model");
async function getNewTaskUserSettingsOps(trc, ctx, id, ref, defaultRemindersOffsets, taskAssignDate, taskAssignCount) {
    const settingsGenID = await ensureTaskUserSettingsID(trc, ctx);
    if (settingsGenID[1] !== id) {
        throw new Error(`Inconsistent taskUserSettingsID: expected<${id}>, but actual<${settingsGenID[1]}>`);
    }
    const taskUserSettingsEntity = ctx.createEntity(ref, {
        label: 'TASK_USER_SETTINGS_LABEL',
        created: ctx.timestamp,
        updated: ctx.timestamp,
        defaultRemindersOffsets,
        taskAssignDate,
        taskAssignCount,
    }, ctx.userID);
    return {
        changeType: 'Node:CREATE',
        node: taskUserSettingsEntity,
        id: settingsGenID,
    };
}
exports.getNewTaskUserSettingsOps = getNewTaskUserSettingsOps;
async function ensureTaskUserSettingsID(trc, ctx) {
    return ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.TaskUserSettings, en_data_model_1.DefaultDeterministicIdGenerator);
}
exports.ensureTaskUserSettingsID = ensureTaskUserSettingsID;
//# sourceMappingURL=TaskUserSettings.js.map