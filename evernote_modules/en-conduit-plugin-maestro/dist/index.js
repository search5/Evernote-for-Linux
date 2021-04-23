"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENMaestroPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const EnMaestroServiceRequest_1 = require("./EnMaestroServiceRequest");
const POLL_INTERVAL = conduit_utils_1.MILLIS_IN_ONE_DAY / 2;
function getENMaestroPlugin() {
    let gMaestroProps;
    const maestroPropsResolver = async (parent, args, context) => {
        EnMaestroServiceRequest_1.validateResolverArgs(['clientType'], args);
        conduit_core_1.validateDB(context);
        const user = await context.db.getUserNode(context);
        if (!user) {
            throw new conduit_utils_1.NotFoundError('', 'user not found');
        }
        const authData = en_thrift_connector_1.decodeAuthData(await conduit_core_1.retrieveAuthorizedToken(context));
        const currentTime = Date.now();
        const { clientType, overridingArmIds, platform } = args;
        if (userAttrChanged(user, gMaestroProps.user) ||
            !gMaestroProps.timestamp ||
            gMaestroProps.timestamp <= currentTime - POLL_INTERVAL ||
            gMaestroProps.overridingArmIds !== JSON.stringify(overridingArmIds)) {
            context && context.watcher && context.watcher.triggerAfterTime(POLL_INTERVAL);
            const userInfo = en_thrift_connector_1.toUserClientInfo({
                clientType,
                platform,
                host: authData.thriftHost,
                user,
            });
            gMaestroProps = {
                props: await EnMaestroServiceRequest_1.maestroRequest(context.thriftComm, 'getProps2', { clientType, overridingArmIds, userInfo }, context),
                user,
                timestamp: currentTime,
                overridingArmIds: JSON.stringify(overridingArmIds),
            };
            conduit_utils_1.updateTelemetryFilterRules(gMaestroProps.props);
        }
        else {
            // Next refresh after POLL_INTERVAL millis from cached timestamp
            const nextTriggerTime = POLL_INTERVAL - currentTime + gMaestroProps.timestamp;
            context && context.watcher && context.watcher.triggerAfterTime(nextTriggerTime);
        }
        return {
            props: gMaestroProps.props,
        };
    };
    const maestroServiceStateResolver = async (parent, args, context) => {
        EnMaestroServiceRequest_1.validateResolverArgs(['clientType'], args);
        return {
            serviceState: EnMaestroServiceRequest_1.maestroRequest(context.thriftComm, 'getServiceState2', args, context),
        };
    };
    const clearMaestroPropsCache = async () => {
        gMaestroProps = {
            user: undefined,
            props: undefined,
            timestamp: undefined,
        };
    };
    // Check if any user attributes requiring a maestro props refresh have changed
    const userAttrChanged = (before, after) => {
        if (!before || !after) {
            return true;
        }
        if (before.NodeFields.internal_userID !== after.NodeFields.internal_userID) {
            return true;
        }
        if (before.NodeFields.serviceLevel !== after.NodeFields.serviceLevel) {
            return true;
        }
        return false;
    };
    return {
        name: 'ENMaestro',
        init: clearMaestroPropsCache,
        defineQueries: () => ({
            getMaestroProps: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({ props: conduit_utils_1.NullableString }, 'getMaestroProps')),
                args: conduit_core_1.schemaToGraphQLArgs({
                    // TGetPropsRequest
                    clientType: conduit_utils_1.EnumWithKeys({
                        ION: 6,
                        NEUTRON: 8,
                        BORON: 9,
                    }, 'MaestroClientType'),
                    overridingArmIds: conduit_utils_1.ListOf(conduit_utils_1.NullableStruct({
                        experimentName: 'string',
                        experimentArmName: 'string',
                    }, 'MaestroOverridingArmIds')),
                    platform: conduit_utils_1.Enum([
                        'PLATFORM_UNKNOWN',
                        'PLATFORM_ANDROID',
                        'PLATFORM_IOS',
                        'PLATFORM_LINUX',
                        'PLATFORM_MAC',
                        'PLATFORM_WINDOWS',
                    ], 'MaestroPlatform'),
                    requestingEnvironment: conduit_utils_1.NullableEnumWithKeys({
                        LOCALHOST: 'localhost',
                        PREPROD: 'preprod',
                        STAGE: 'stage',
                        PRODUCTION: 'production',
                        ETNC: 'etnc',
                    }, 'MaestroRequestingEnvironment'),
                }),
                resolve: maestroPropsResolver,
                deprecationReason: 'MaestroProps moved to graph. Kept only for QA purposes\nThis plugin allows to query with overridingArmIds',
            },
            getMaestroServiceState: {
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({ serviceState: conduit_utils_1.NullableString }, 'getMaestroServiceState')),
                args: conduit_core_1.schemaToGraphQLArgs({ clientType: 'number' }),
                resolve: maestroServiceStateResolver,
            },
        }),
    };
}
exports.getENMaestroPlugin = getENMaestroPlugin;
//# sourceMappingURL=index.js.map