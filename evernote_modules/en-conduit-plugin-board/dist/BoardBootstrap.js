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
const graphql_1 = require("graphql");
const BoardConstants_1 = require("./BoardConstants");
const BoardFeatureSchemaManager_1 = require("./Schema/BoardFeatureSchemaManager");
const Utilities = __importStar(require("./Utilities"));
// Bootstrap a Board and detect schema changes on upgrade.
const createBoardBootstrapDefinition = (di) => {
    const boardBootstrap = (autoResolverData) => {
        return {
            args: {
                /**
                 * Currently Home Boards are supported, which parent to the current User.
                 * However, in future, other parent types may be added, such as Workspace and Notebook.
                 */
                parent: { type: conduit_core_1.schemaToGraphQLType('EntityRef?', 'parent', false) },
                resetLayout: { type: graphql_1.GraphQLBoolean },
                platform: { type: conduit_core_1.schemaToGraphQLType([...Object.keys(BoardConstants_1.FormFactor), '?'], 'BoardBootstrapPlatform') },
                features: { type: new graphql_1.GraphQLInputObjectType({
                        name: 'BoardBootstrapFeatureArgs',
                        fields: {
                            calendar: { type: graphql_1.GraphQLInt },
                            tasks: { type: graphql_1.GraphQLInt },
                        },
                    }) },
            },
            type: new graphql_1.GraphQLObjectType({
                name: 'BoardBootstrapResult',
                fields: () => {
                    return {
                        success: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean) },
                        result: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                        board: { type: new graphql_1.GraphQLNonNull(autoResolverData.NodeGraphQLTypes.Board), resolve: async (parent, args, context, info) => {
                                if (!info || !info.fieldName) {
                                    throw new Error('Invalid info block');
                                }
                                conduit_core_1.validateDB(context);
                                const nodeRef = parent[info.fieldName];
                                return await conduit_core_1.resolveNode(nodeRef, context, info);
                            },
                        },
                    };
                },
            }),
            resolve: async function resolver(parent, args, context) {
                // Validate arguments...
                if (!args) {
                    throw new conduit_utils_1.MissingParameterError('Missing args for bootstrapBoard');
                }
                // Get the Board attached to the current User...
                const userNode = await Utilities.getCurrentUserNode(context);
                const boardID = BoardConstants_1.BoardDeterministicIdGenerator.createId({
                    entityType: 'Board',
                    userID: userNode.NodeFields.internal_userID,
                    leadingSegments: BoardFeatureSchemaManager_1.BoardFeatureSchemaManager.formDeterministicBoardIdParts(),
                });
                conduit_core_1.validateDB(context);
                const { features: featuresParam, resetLayout, platform, } = args;
                const boardNodeRef = { id: boardID, type: BoardConstants_1.BoardEntityTypes.Board };
                const board = await context.db.getNode(context, boardNodeRef);
                const schemaFeatures = Utilities.getBoardPluginFeatures(di).schema;
                const features = [];
                const featureVersions = [];
                if (featuresParam) {
                    for (const feature of Object.keys(featuresParam)) {
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
                if (!board) {
                    const serviceLevel = userNode.NodeFields.serviceLevel;
                    await context.db.runMutator(context.trc, 'boardCreateHome', { serviceLevel, features, featureVersions });
                }
                else if (features.length > 0) {
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
                    if (upgradeDetected || resetLayout) {
                        const serviceLevel = userNode.NodeFields.serviceLevel;
                        await context.db.runMutator(context.trc, 'boardCreateHome', { serviceLevel, features, featureVersions, resetLayout, platform });
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