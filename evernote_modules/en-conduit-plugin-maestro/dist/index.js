"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENMaestroPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const graphql_1 = require("graphql");
const EnMaestroServiceRequest_1 = require("./EnMaestroServiceRequest");
const POLL_INTERVAL = conduit_utils_1.MILLIS_IN_ONE_DAY / 2;
function getENMaestroPlugin(thriftComm) {
    let gMaestroProps;
    const maestroPropsResolver = async (parent, args = {}, context) => {
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
                props: await EnMaestroServiceRequest_1.maestroRequest(thriftComm, 'getProps2', { clientType, overridingArmIds, userInfo }, context),
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
    const maestroServiceStateResolver = async (parent, args = {}, context) => {
        EnMaestroServiceRequest_1.validateResolverArgs(['clientType'], args);
        return {
            serviceState: EnMaestroServiceRequest_1.maestroRequest(thriftComm, 'getServiceState2', args, context),
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
                type: conduit_core_1.schemaToGraphQLType({ props: 'string?' }, 'getMaestroProps', true),
                args: {
                    // TGetPropsRequest
                    clientType: {
                        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
                            name: 'MaestroClientType',
                            values: {
                                ION: { value: 6 },
                                NEUTRON: { value: 8 },
                                BORON: { value: 9 },
                            },
                        })),
                    },
                    overridingArmIds: {
                        type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(new graphql_1.GraphQLInputObjectType({
                            name: 'MaestroOverridingArmIds',
                            fields: {
                                experimentName: {
                                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                                },
                                experimentArmName: {
                                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                                },
                            },
                        }))),
                    },
                    platform: {
                        type: new graphql_1.GraphQLEnumType({
                            name: 'MaestroPlatform',
                            values: {
                                PLATFORM_UNKNOWN: { value: 'PLATFORM_UNKNOWN' },
                                PLATFORM_ANDROID: { value: 'PLATFORM_ANDROID' },
                                PLATFORM_IOS: { value: 'PLATFORM_IOS' },
                                PLATFORM_LINUX: { value: 'PLATFORM_LINUX' },
                                PLATFORM_MAC: { value: 'PLATFORM_MAC' },
                                PLATFORM_WINDOWS: { value: 'PLATFORM_WINDOWS' },
                            },
                        }),
                    },
                    requestingEnvironment: {
                        type: new graphql_1.GraphQLEnumType({
                            name: 'MaestroRequestingEnvironment',
                            values: {
                                LOCALHOST: { value: 'localhost' },
                                PREPROD: { value: 'preprod' },
                                STAGE: { value: 'stage' },
                                PRODUCTION: { value: 'production' },
                                ETNC: { value: 'etnc ' },
                            },
                        }),
                    },
                },
                resolve: maestroPropsResolver,
                deprecationReason: 'MaestroProps moved to graph. Kept only for QA purposes\nThis plugin allows to query with overridingArmIds',
            },
            getMaestroServiceState: {
                type: conduit_core_1.schemaToGraphQLType({ serviceState: 'string?' }, 'getMaestroServiceState', true),
                args: conduit_core_1.schemaToGraphQLArgs({ clientType: 'number' }),
                resolve: maestroServiceStateResolver,
            },
        }),
    };
}
exports.getENMaestroPlugin = getENMaestroPlugin;
//# sourceMappingURL=index.js.map