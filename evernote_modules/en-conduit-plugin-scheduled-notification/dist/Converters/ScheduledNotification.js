"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const ScheduledNotificationSources = {
    // This might change when Tasks is sync with Nsync
    // Adding it as a placeholder for TS validation
    [en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.Task]: {
        schedulingType: 'Reminder',
        dataSourceType: 'Task',
    },
    [en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.Calendar]: {
        schedulingType: undefined,
        dataSourceType: undefined,
    },
};
async function getSnNodeAndEdges(trc, instance, context) {
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const nodesAndEdges = {
        nodes: { nodesToDelete: [], nodesToUpsert },
        edges: { edgesToDelete: [], edgesToCreate },
    };
    // Validate sources types
    const SNSources = ScheduledNotificationSources[instance.scheduledNotificationType];
    // Make sure Conduit ignores un-supported types, for backwards compatibility
    if (!en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes[instance.scheduledNotificationType]) {
        conduit_utils_1.logger.error(`Unsupported scheduledNotificationType type ${instance.scheduledNotificationType}`);
        return nodesAndEdges;
    }
    // Validate Instance
    if ((SNSources.dataSourceType && (!instance.dataSourceId ||
        !instance.dataSourceType)) ||
        (SNSources.schedulingType && (!instance.schedulingId ||
            !instance.schedulingType))) {
        conduit_utils_1.logger.error(`DataSource and Scheduling entities required for ${instance.scheduledNotificationType}`);
        return nodesAndEdges;
    }
    if (SNSources.dataSourceType !== instance.dataSourceType ||
        SNSources.schedulingType !== instance.schedulingType) {
        conduit_utils_1.logger.error(`DataSource ${instance.dataSourceType} and Scheduling ${instance.schedulingType} types do not match for ${instance.scheduledNotificationType}`);
        return nodesAndEdges;
    }
    // Perform type conversions
    const scheduledNotificationType = instance.scheduledNotificationType;
    const ownerId = instance.ownerId;
    const instanceRefId = instance.ref.id;
    const dataSourceId = instance.dataSourceId;
    const schedulingId = instance.schedulingId;
    const payload = instance.payload;
    const sn = {
        id: instanceRefId,
        type: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification,
        localChangeTimestamp: 0,
        label: '',
        syncContexts: [],
        version: 0,
        NodeFields: {
            scheduledNotificationType,
            mute: instance.mute,
            created: instance.created,
            updated: instance.updated,
            data: payload,
        },
        owner: ownerId,
        inputs: {
            scheduling: {},
        },
        outputs: {
            dataSource: {},
        },
    };
    nodesToUpsert.push(sn);
    if (SNSources.schedulingType) {
        edgesToCreate.push({
            srcID: schedulingId, srcType: SNSources.schedulingType, srcPort: 'scheduledNotification',
            dstID: instanceRefId, dstType: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification, dstPort: 'scheduling',
        });
    }
    if (SNSources.dataSourceType) {
        edgesToCreate.push({
            srcID: instanceRefId, srcType: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification, srcPort: 'dataSource',
            dstID: dataSourceId, dstType: SNSources.dataSourceType, dstPort: null,
        });
    }
    return nodesAndEdges;
}
exports.getSnNodeAndEdges = getSnNodeAndEdges;
//# sourceMappingURL=ScheduledNotification.js.map