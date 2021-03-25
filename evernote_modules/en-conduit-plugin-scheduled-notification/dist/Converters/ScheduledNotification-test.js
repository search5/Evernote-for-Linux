"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
// tslint:disable:import-blacklist
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
const sinon_1 = __importDefault(require("sinon"));
const sinon_chai_1 = __importDefault(require("sinon-chai"));
const ScheduledNotification_1 = require("./ScheduledNotification");
chai_1.default.use(sinon_chai_1.default);
chai_1.default.use(chai_as_promised_1.default);
const trc = conduit_utils_1.createTraceContext('ScheduledNotificationConverter Tests');
const getNodeStub = sinon_1.default.stub();
const traverseGraphStub = sinon_1.default.stub();
const setNodeCachedFieldStub = sinon_1.default.stub();
const userID = 7777;
const syncContext = {
    currentUserID: userID,
    tx: {
        getNode: getNodeStub,
        traverseGraph: traverseGraphStub,
        setNodeCachedField: setNodeCachedFieldStub,
    },
};
describe('ScheduledNotificationConverter', () => {
    beforeEach(() => {
        sinon_1.default.reset();
    });
    describe('Calendar', () => {
        function createCalendarInstance() {
            return {
                // Properties from Nsync message
                ref: { id: '60cc8da9-a7d0-4110-8f6f-086565ccfa4d', type: 19 },
                mute: false,
                ownerId: 1000,
                scheduledNotificationType: en_conduit_plugin_scheduled_notification_shared_1.ScheduledNotificationEntityTypes.Calendar,
                payload: {
                    platform: 'mobile',
                },
                created: 1,
                updated: 2,
                version: 2,
                // Default properties
                type: 1,
                label: '',
                lastEditor: '1000',
                shardId: 's0',
                creator: 1000,
                deleted: null,
                parentEntity: null,
            };
        }
        describe('with correct data', () => {
            it('creates calendar scheduled notification', async () => {
                var _a;
                const calendarInstance = createCalendarInstance();
                const nodesAndEdges = await ScheduledNotification_1.getSnNodeAndEdges(trc, calendarInstance, syncContext);
                const sn = (_a = nodesAndEdges.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert[0];
                chai_1.expect(sn.id).to.eq('60cc8da9-a7d0-4110-8f6f-086565ccfa4d');
            });
        });
        describe('with scheduling or dataSource', () => {
            it('does not create calendar scheduled notifcation with dataSource', async () => {
                var _a;
                const calendarInstance = createCalendarInstance();
                calendarInstance.dataSourceId = '1';
                calendarInstance.dataSourceType = 'Calendar';
                const nodesAndEdges = await ScheduledNotification_1.getSnNodeAndEdges(trc, calendarInstance, syncContext);
                const sn = (_a = nodesAndEdges.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert[0];
                chai_1.expect(sn).not.to.exist;
            });
            it('does not create calendar scheduled notifcation with scheduling', async () => {
                var _a;
                const calendarInstance = createCalendarInstance();
                calendarInstance.schedulingId = '1';
                calendarInstance.schedulingType = 'Calendar';
                const nodesAndEdges = await ScheduledNotification_1.getSnNodeAndEdges(trc, calendarInstance, syncContext);
                const sn = (_a = nodesAndEdges.nodes) === null || _a === void 0 ? void 0 : _a.nodesToUpsert[0];
                chai_1.expect(sn).not.to.exist;
            });
        });
    });
});
//# sourceMappingURL=ScheduledNotification-test.js.map