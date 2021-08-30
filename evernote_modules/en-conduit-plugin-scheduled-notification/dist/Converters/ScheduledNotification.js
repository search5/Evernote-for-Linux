"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const en_data_model_1 = require("en-data-model");
const en_notifications_data_model_1 = require("en-notifications-data-model");
const ScheduledNotificationSources = {
    // This might change when Tasks is sync with Nsync
    // Adding it as a placeholder for TS validation
    [en_notifications_data_model_1.ScheduledNotificationType.TaskReminder]: {
        schedulingType: en_data_model_1.EntityTypes.Reminder,
        dataSourceType: en_data_model_1.EntityTypes.Task,
    },
    [en_notifications_data_model_1.ScheduledNotificationType.Calendar]: {
        schedulingType: undefined,
        dataSourceType: undefined,
    },
};
async function getSnNodeAndEdges(trc, instance, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const nodesToUpsert = [];
    const edgesToCreate = [];
    const nodesAndEdges = {
        nodes: { nodesToDelete: [], nodesToUpsert },
        edges: { edgesToDelete: [], edgesToCreate },
    };
    // Validate sources types
    const SNSources = ScheduledNotificationSources[instance.scheduledNotificationType];
    // Make sure Conduit ignores un-supported types, for backwards compatibility
    if (!SNSources) {
        conduit_utils_1.logger.error(`Unsupported scheduledNotificationType type ${instance.scheduledNotificationType}`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, context);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `Unsupported scheduledNotificationType type ${instance.scheduledNotificationType}`,
                notificationType: instance.scheduledNotificationType,
            });
        }
        return nodesAndEdges;
    }
    // Validate Instance
    if ((SNSources.dataSourceType && !instance.dataSource) || (SNSources.schedulingType && !instance.scheduling)) {
        conduit_utils_1.logger.error(`DataSource and Scheduling entities required for ${instance.scheduledNotificationType}`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, context);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `DataSource and Scheduling entities required for ${instance.scheduledNotificationType}`,
                notificationType: instance.scheduledNotificationType,
            });
        }
        return nodesAndEdges;
    }
    if (SNSources.dataSourceType !== ((_a = instance.dataSource) === null || _a === void 0 ? void 0 : _a.type) || SNSources.schedulingType !== ((_b = instance.scheduling) === null || _b === void 0 ? void 0 : _b.type)) {
        conduit_utils_1.logger.error(`DataSource ${(_c = instance.dataSource) === null || _c === void 0 ? void 0 : _c.type} and Scheduling ${(_d = instance.scheduling) === null || _d === void 0 ? void 0 : _d.type} types do not match for ${instance.scheduledNotificationType}`);
        const notificationLogsEnabled = await en_conduit_plugin_scheduled_notification_shared_1.getNotificationLogsEnabledFlag(trc, context);
        if (notificationLogsEnabled) {
            conduit_utils_1.recordMetric({
                name: 'LOCAL_NOTIFICATION_LOG',
                date: Date.now(),
                duration: 0,
                error: `DataSource ${(_e = instance.dataSource) === null || _e === void 0 ? void 0 : _e.type} and Scheduling ${(_f = instance.scheduling) === null || _f === void 0 ? void 0 : _f.type} types do not match for ${instance.scheduledNotificationType}`,
                notificationType: instance.scheduledNotificationType,
                dataSourceType: (_g = instance.dataSource) === null || _g === void 0 ? void 0 : _g.type,
                scheduleingType: (_h = instance.scheduling) === null || _h === void 0 ? void 0 : _h.type,
            });
        }
        return nodesAndEdges;
    }
    // Perform type conversions
    const scheduledNotificationType = instance.scheduledNotificationType;
    const ownerId = instance.ownerId;
    const instanceRefId = instance.ref.id;
    const sn = {
        id: instanceRefId,
        type: en_data_model_1.EntityTypes.ScheduledNotification,
        localChangeTimestamp: 0,
        label: '',
        syncContexts: [],
        version: 0,
        NodeFields: {
            scheduledNotificationType,
            mute: instance.mute,
            created: instance.created,
            updated: instance.updated,
            payload: instance.payload,
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
    if (SNSources.schedulingType && instance.scheduling) {
        edgesToCreate.push({
            srcID: instance.scheduling.id,
            srcType: SNSources.schedulingType,
            srcPort: 'scheduledNotification',
            dstID: instanceRefId,
            dstType: en_data_model_1.EntityTypes.ScheduledNotification,
            dstPort: 'scheduling',
        });
    }
    if (SNSources.dataSourceType && instance.dataSource) {
        edgesToCreate.push({
            srcID: instanceRefId,
            srcType: en_data_model_1.EntityTypes.ScheduledNotification,
            srcPort: 'dataSource',
            dstID: instance.dataSource.id,
            dstType: SNSources.dataSourceType,
            dstPort: null,
        });
    }
    return nodesAndEdges;
}
exports.getSnNodeAndEdges = getSnNodeAndEdges;
//# sourceMappingURL=ScheduledNotification.js.map