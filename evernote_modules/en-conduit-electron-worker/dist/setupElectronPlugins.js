"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupElectronPlugins = void 0;
const clucene_1 = require("clucene");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const en_conduit_plugin_analytics_measurement_protocol_1 = require("en-conduit-plugin-analytics-measurement-protocol");
const en_conduit_plugin_board_1 = require("en-conduit-plugin-board");
const en_conduit_plugin_calendar_service_1 = require("en-conduit-plugin-calendar-service");
const en_conduit_plugin_common_queries_1 = require("en-conduit-plugin-common-queries");
const en_conduit_plugin_communication_engine_1 = require("en-conduit-plugin-communication-engine");
const en_conduit_plugin_cross_promotions_1 = require("en-conduit-plugin-cross-promotions");
const en_conduit_plugin_datadog_metrics_1 = require("en-conduit-plugin-datadog-metrics");
const en_conduit_plugin_event_recording_1 = require("en-conduit-plugin-event-recording");
const en_conduit_plugin_features_rollout_1 = require("en-conduit-plugin-features-rollout");
const en_conduit_plugin_gamification_1 = require("en-conduit-plugin-gamification");
const en_conduit_plugin_google_services_1 = require("en-conduit-plugin-google-services");
const en_conduit_plugin_in_app_purchasing_1 = require("en-conduit-plugin-in-app-purchasing");
const en_conduit_plugin_maestro_1 = require("en-conduit-plugin-maestro");
const en_conduit_plugin_monetization_1 = require("en-conduit-plugin-monetization");
const en_conduit_plugin_note_import_1 = require("en-conduit-plugin-note-import");
const en_conduit_plugin_notification_scheduler_1 = require("en-conduit-plugin-notification-scheduler");
const en_conduit_plugin_nsvc_authz_token_1 = require("en-conduit-plugin-nsvc-authz-token");
const en_conduit_plugin_scheduled_notification_1 = require("en-conduit-plugin-scheduled-notification");
const en_conduit_plugin_search_1 = require("en-conduit-plugin-search");
const en_conduit_plugin_support_ticket_1 = require("en-conduit-plugin-support-ticket");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
function setupElectronPlugins(conduitConfig, servicesConfig, customHeaders) {
    var _a, _b, _c, _d, _e;
    const httpClient = new en_conduit_electron_shared_1.ElectronRendererHttpClient(customHeaders);
    let isSearchPluginConfigured = false;
    const plugins = [
        ...conduitConfig.plugins,
        en_conduit_plugin_common_queries_1.getCommonQueryPlugin(),
        en_conduit_plugin_note_import_1.getNoteImportPlugin(),
        en_conduit_plugin_communication_engine_1.getENCommEnginePlugin(),
        en_conduit_plugin_in_app_purchasing_1.getENInAppPurchasingPlugin(httpClient),
        en_conduit_plugin_maestro_1.getENMaestroPlugin(),
        en_conduit_plugin_google_services_1.getGoogleServicesPlugin(httpClient),
        en_conduit_plugin_cross_promotions_1.setupENCrossPromotionPlugin(),
        en_conduit_plugin_support_ticket_1.getSupportTicketPlugin(null),
        en_conduit_plugin_nsvc_authz_token_1.getENNsvcAuthzToken(),
        en_conduit_plugin_features_rollout_1.getFeatureRolloutPlugin(httpClient),
        en_conduit_plugin_notification_scheduler_1.getENSchedulerPlugin(),
        en_conduit_plugin_board_1.getENBoardPlugin(),
        en_conduit_plugin_task_1.getENTaskPlugin(),
        en_conduit_plugin_scheduled_notification_1.getENScheduledNotificationPlugin(),
        en_conduit_plugin_gamification_1.getENGamificationPlugin(),
    ];
    // Configuration-based plug-ins...
    if (servicesConfig) {
        if (servicesConfig.CEC) {
            const { host, apiKey, secret, flushIntervalInSeconds } = servicesConfig.CEC;
            plugins.push(en_conduit_plugin_event_recording_1.setupClientEventCollectorPlugin(host, apiKey, secret, httpClient, flushIntervalInSeconds));
        }
        if (servicesConfig.GA) {
            const { apiKey, sandboxMode, flushIntervalInSeconds } = servicesConfig.GA;
            plugins.push(en_conduit_plugin_analytics_measurement_protocol_1.setupMeasurementProtocolPlugin(apiKey, httpClient, false, sandboxMode, flushIntervalInSeconds));
        }
        if (servicesConfig.DD) {
            const { source, flushIntervalInSeconds } = servicesConfig.DD;
            plugins.push(en_conduit_plugin_datadog_metrics_1.setupDatadogPlugin(false, source, httpClient, flushIntervalInSeconds));
        }
        // Plug-ins hidden behind feature flags...
        if ((_a = servicesConfig.featureFlags) === null || _a === void 0 ? void 0 : _a.isOfflineSearchEnabled) {
            isSearchPluginConfigured = true;
            const offlineSearchIndexingConfig = (_c = (_b = conduitConfig === null || conduitConfig === void 0 ? void 0 : conduitConfig.thriftComm) === null || _b === void 0 ? void 0 : _b.di) === null || _c === void 0 ? void 0 : _c.offlineSearchIndexingConfig;
            plugins.push(en_conduit_plugin_search_1.getENSearchPlugin(clucene_1.provideSearchIndexManager, conduitConfig.di, offlineSearchIndexingConfig));
        }
        if ((_d = servicesConfig.featureFlags) === null || _d === void 0 ? void 0 : _d.isMonetizationServiceEnabled) {
            plugins.push(en_conduit_plugin_monetization_1.getENMonetizationPlugin());
        }
        if ((_e = servicesConfig.featureFlags) === null || _e === void 0 ? void 0 : _e.isCalendarServiceEnabled) {
            plugins.push(en_conduit_plugin_calendar_service_1.getCalendarServicePlugin(httpClient));
        }
    }
    if (!isSearchPluginConfigured) {
        plugins.push(en_conduit_plugin_search_1.getENSearchPlugin(conduitConfig.di));
    }
    return plugins;
}
exports.setupElectronPlugins = setupElectronPlugins;
//# sourceMappingURL=setupElectronPlugins.js.map