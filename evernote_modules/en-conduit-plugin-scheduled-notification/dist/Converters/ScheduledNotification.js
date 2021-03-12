"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
/**
 * Only Scheduled Notification types listed here that are
 * coming from NSync will get converted to Conduit Scheduled Notification.
 */
const ScheduledNotificationTypes = {
    Calendar: 'Calendar',
};
const ScheduledNotificationSources = {
    // This will change to Calendar Entity Types, when implemented
    [ScheduledNotificationTypes.Calendar]: {
        schedulingType: 'Reminder',
        dataSourceType: 'Task',
    },
};
async function getSnNodeAndEdges(trc, instance, context) {
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const nodesAndEdges = {
        nodes: { nodesToDelete: [], nodesToUpsert },
        edges: { edgesToDelete: [], edgesToCreate },
    };
    // Make sure Conduit ignores un-supported types, for backwards compatibility
    if (!ScheduledNotificationTypes[instance.scheduledNotificationType]) {
        conduit_utils_1.logger.error(`Unsupported scheduledNotificationType type ${instance.scheduledNotificationType}`);
        return nodesAndEdges;
    }
    // Validate Instance
    if (!instance.dataSourceId ||
        !instance.dataSourceType ||
        !instance.schedulingId ||
        !instance.schedulingType) {
        conduit_utils_1.logger.error(`DataSource and Scheduling entities required for ${instance.scheduledNotificationType}`);
        return nodesAndEdges;
    }
    // Validate sources types
    const SNSources = ScheduledNotificationSources[instance.scheduledNotificationType];
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
            created: Number((instance.created || Date.now())),
            updated: Number((instance.updated || Date.now())),
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
    edgesToCreate.push({
        srcID: schedulingId, srcType: SNSources.schedulingType, srcPort: 'scheduledNotification',
        dstID: instanceRefId, dstType: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification, dstPort: 'scheduling',
    });
    edgesToCreate.push({
        srcID: instanceRefId, srcType: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.ScheduledNotification, srcPort: 'dataSource',
        dstID: dataSourceId, dstType: SNSources.dataSourceType, dstPort: null,
    });
    return nodesAndEdges;
}
exports.getSnNodeAndEdges = getSnNodeAndEdges;
//# sourceMappingURL=ScheduledNotification.js.map