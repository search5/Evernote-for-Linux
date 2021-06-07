"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardBootstrapDefinition = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const graphql_1 = require("graphql");
const BoardFeatureSchemaManager_1 = require("./Schema/BoardFeatureSchemaManager");
const Utilities = __importStar(require("./Utilities"));
// Bootstrap a Board and detect schema changes on upgrade.
const createBoardBootstrapDefinition = (di) => {
    const boardBootstrap = (autoResolverData) => {
        return {
            args: conduit_core_1.schemaToGraphQLArgs({
                /**
                 * Currently Home Boards are supported, which parent to the current User.
                 * However, in future, other parent types may be added, such as Workspace and Notebook.
                 */
                parent: conduit_utils_1.NullableEntityRef,
                resetLayout: conduit_utils_1.NullableBoolean,
                platform: conduit_utils_1.Nullable(en_home_data_model_1.DeviceFormFactorSchema),
                clientLayoutVersion: conduit_utils_1.NullableInt,
                clearContentOnReset: conduit_utils_1.NullableBoolean,
                features: conduit_utils_1.NullableStruct({
                    calendar: conduit_utils_1.NullableInt,
                    tasks: conduit_utils_1.NullableInt,
                    core: conduit_utils_1.NullableInt,
                    extra: conduit_utils_1.NullableInt,
                    filteredNotes: conduit_utils_1.NullableInt,
                }, 'BoardBootstrapFeatureArgs'),
            }),
            type: new graphql_1.GraphQLObjectType({
                name: 'BoardBootstrapResult',
                fields: () => {
                    const resultMap = {
                        success: { type: conduit_core_1.schemaToGraphQLType('boolean') },
                        result: { type: conduit_core_1.schemaToGraphQLType('string') },
                    };
                    conduit_core_1.schemaFieldToGraphQL(autoResolverData, resultMap, 'board', 'EntityRef', 'BoardBootstrapResult', [en_data_model_1.EntityTypes.Board], undefined);
                    return resultMap;
                },
            }),
            resolve: async function resolver(parent, args, context) {
                var _a;
                // Validate arguments...
                if (!args) {
                    throw new conduit_utils_1.MissingParameterError('Missing args for bootstrapBoard');
                }
                // Get the Board attached to the current User...
                const userNode = await Utilities.getCurrentUserNode(context);
                const boardID = en_data_model_1.DefaultDeterministicIdGenerator.createId({
                    entityType: en_data_model_1.EntityTypes.Board,
                    userID: userNode.NodeFields.internal_userID,
                    leadingSegments: en_home_data_model_1.BoardSchema.formDeterministicBoardIdParts(userNode.NodeFields.internal_userID),
                });
                conduit_core_1.validateDB(context);
                const { features: featuresParam, resetLayout, platform, clientLayoutVersion, clearContentOnReset, } = args;
                const boardNodeRef = { id: boardID, type: en_data_model_1.EntityTypes.Board };
                const board = await context.db.getNode(context, boardNodeRef);
                const schemaFeatures = Utilities.getBoardPluginFeatures(di).schema;
                const features = [];
                const featureVersions = [];
                if (featuresParam) {
                    for (const feature in featuresParam) {
                        if (!schemaFeatures[feature]) {
                            continue;
                        }
                        const featureVersion = featuresParam[feature];
                        if (typeof featureVersion === 'number' && featureVersion > 0) {
                            features.push(feature);
                            featureVersions.push(featureVersion);
                        }
                        else {
                            throw new conduit_utils_1.InvalidParameterError(`Invalid feature version for ${feature}`);
                        }
                    }
                }
                const serviceLevel = (_a = userNode.NodeFields.serviceLevelV2) !== null && _a !== void 0 ? _a : userNode.NodeFields.serviceLevel;
                if (!board) {
                    await context.db.runMutator(context.trc, 'boardCreateHome', { serviceLevel, features, featureVersions, clientLayoutVersion, clearContentOnReset });
                }
                else {
                    let upgradeDetected = false;
                    for (let i = 0; i < features.length; i++) {
                        const feature = features[i];
                        const featureVersion = featureVersions[i];
                        const currentVersion = board.NodeFields[BoardFeatureSchemaManager_1.BoardFeatureSchemaManager.formFeatureKey(feature)];
                        if (!currentVersion || currentVersion < featureVersion) {
                            upgradeDetected = true;
                            break;
                        }
                    }
                    // Can't do falsey for board.NodeFields.isCustomized, as we need to ensure we have upgraded the core data model first
                    if (upgradeDetected || resetLayout || (board.NodeFields.isCustomized === false && board.NodeFields.serviceLevel !== serviceLevel)) {
                        await context.db.runMutator(context.trc, 'boardCreateHome', {
                            serviceLevel,
                            features,
                            featureVersions,
                            resetLayout,
                            platform,
                            clientLayoutVersion,
                            clearContentOnReset,
                        });
                    }
                }
                // Return the Board ID...
                return {
                    success: true,
                    result: boardID,
                    board: boardNodeRef,
                };
            },
        };
    };
    return boardBootstrap;
};
exports.createBoardBootstrapDefinition = createBoardBootstrapDefinition;
//# sourceMappingURL=BoardBootstrap.js.map