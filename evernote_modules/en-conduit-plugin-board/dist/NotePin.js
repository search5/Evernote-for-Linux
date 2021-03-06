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
exports.createNotePinDefinition = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const BoardConstants_1 = require("./BoardConstants");
const BoardFeatureSchemaManager_1 = require("./Schema/BoardFeatureSchemaManager");
const Utilities = __importStar(require("./Utilities"));
const createNotePinDefinition = () => {
    return {
        args: {
            note: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            widget: { type: graphql_1.GraphQLString },
        },
        type: new graphql_1.GraphQLObjectType({
            name: 'NotePinResult',
            fields: () => {
                return {
                    success: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean) },
                    result: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                };
            },
        }),
        resolve: async function resolver(parent, args, context) {
            // Validate arguments...
            if ((!args) || (!args.note)) {
                throw new conduit_utils_1.MissingParameterError('Missing Note for notePin');
            }
            // Validate the database...
            conduit_core_1.validateDB(context);
            // Get the current User...
            const userNode = await Utilities.getCurrentUserNode(context);
            const boardID = BoardConstants_1.BoardDeterministicIdGenerator.createId({
                entityType: 'Board',
                userID: userNode.NodeFields.internal_userID,
                leadingSegments: BoardFeatureSchemaManager_1.BoardFeatureSchemaManager.formDeterministicBoardIdParts(),
            });
            const widgetEdges = await context.db.traverseGraph(context, { type: BoardConstants_1.BoardEntityTypes.Board, id: boardID }, [{ edge: ['outputs', 'children'], type: BoardConstants_1.BoardEntityTypes.Widget }]);
            const matchingPinnedNote = (await context.db.batchGetNodes(context, BoardConstants_1.BoardEntityTypes.Widget, widgetEdges.map(widgetEdge => widgetEdge.id)))
                .find(w => !!w && ((!args.widget || w.id === args.widget) && (w.NodeFields.widgetType === BoardConstants_1.WidgetType.Pinned)));
            // Check that a matching widget was found
            if (!matchingPinnedNote) {
                throw new conduit_utils_1.InternalError('Could not find Pinned Widget');
            }
            const params = {
                widget: matchingPinnedNote.id,
                isEnabled: true,
                noteToPin: args.note,
            };
            await context.db.runMutator(context.trc, 'widgetCustomize', params);
            return {
                success: true,
                result: matchingPinnedNote.id,
            };
        },
    };
};
exports.createNotePinDefinition = createNotePinDefinition;
//# sourceMappingURL=NotePin.js.map