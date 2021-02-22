"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledNotificationRules = void 0;
const conduit_core_1 = require("conduit-core");
const ScheduledNotificationHelpers_1 = require("../Mutators/Helpers/ScheduledNotificationHelpers");
const ScheduledNotificationUtils_1 = require("../ScheduledNotifications/ScheduledNotificationUtils");
const TaskConstants_1 = require("../TaskConstants");
exports.ScheduledNotificationRules = [{
        on: 'Node:UPDATE',
        where: { type: TaskConstants_1.TaskEntityTypes.Reminder },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await updateAssociatedSNs(trc, ctx, op.nodeRef, { scheduling: true });
        },
    }, {
        on: 'Node:UPDATE',
        where: { type: TaskConstants_1.TaskEntityTypes.Task },
        when: conduit_core_1.GraphMutationRuleWhen.Always,
        getExtraOps: async (trc, ctx, op) => {
            return await updateAssociatedSNs(trc, ctx, op.nodeRef, { dataSource: true });
        },
    },
];
async function updateAssociatedSNs(trc, ctx, assocRef, updated) {
    const ops = [];
    const fields = {
        updated: ctx.timestamp,
    };
    if (updated.scheduling) {
        fields.schedulingUpdatedAt = ctx.timestamp;
    }
    if (updated.dataSource) {
        fields.dataSourceUpdatedAt = ctx.timestamp;
    }
    await ScheduledNotificationUtils_1.forEachTaskReminderScheduledNotification(trc, ctx, assocRef, async (snRef, reminderRef) => {
        await ScheduledNotificationHelpers_1.addOpsForTaskReminderSNUpsert(trc, ctx, ops, fields, reminderRef, snRef);
    });
    return ops;
}
//# sourceMappingURL=ScheduledNotificationRules.js.map