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
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const Utilities = __importStar(require("./Utilities"));
const createNotePinDefinition = () => {
    return {
        args: conduit_core_1.schemaToGraphQLArgs({
            note: 'ID',
            widget: conduit_utils_1.NullableID,
        }),
        type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
            success: 'boolean',
            result: 'string',
        }, 'NotePinResult')),
        resolve: async function resolver(parent, args, context) {
            // Validate arguments...
            if ((!args) || (!args.note)) {
                throw new conduit_utils_1.MissingParameterError('Missing Note for notePin');
            }
            // Validate the database...
            conduit_core_1.validateDB(context);
            // Get the current User...
            const userNode = await Utilities.getCurrentUserNode(context);
            const boardID = en_data_model_1.DefaultDeterministicIdGenerator.createId({
                entityType: en_data_model_1.EntityTypes.Board,
                userID: userNode.NodeFields.internal_userID,
                leadingSegments: en_home_data_model_1.BoardSchema.formDeterministicBoardIdParts(userNode.NodeFields.internal_userID),
            });
            const widgetEdges = await context.db.traverseGraph(context, { type: en_data_model_1.EntityTypes.Board, id: boardID }, [{ edge: ['outputs', 'children'], type: en_data_model_1.EntityTypes.Widget }]);
            const matchingPinnedNote = (await context.db.batchGetNodes(context, en_data_model_1.EntityTypes.Widget, widgetEdges.map(widgetEdge => widgetEdge.id)))
                .find(w => !!w && (!args.widget && w.NodeFields.widgetType === en_home_data_model_1.WidgetType.Pinned || w.id === args.widget));
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