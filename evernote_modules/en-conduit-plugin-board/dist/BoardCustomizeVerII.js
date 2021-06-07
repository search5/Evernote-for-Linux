"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardCustomizeVerIIDefinition = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const types_1 = require("./Schema/types");
const createBoardCustomizeVerIIDefinition = () => {
    return {
        args: conduit_core_1.schemaToGraphQLArgs({
            boardMutations: types_1.BoardCustomizeParams,
            widgetMutations: conduit_utils_1.Nullable(conduit_utils_1.ListOfStructs({
                widget: 'ID',
                associations: types_1.WidgetCustomizeAssociationsInput,
                fields: types_1.WidgetCustomizeFieldsInput,
            }, 'WidgetCustomizeVerIIParams')),
        }),
        type: conduit_core_1.GenericMutationResult,
        resolve: async function resolver(parent, args, context) {
            // Validate arguments...
            if (!args || (!args.widgetMutations && !args.boardMutations)) {
                throw new conduit_utils_1.MissingParameterError('Missing mutations for boardCustomizeVerTwo');
            }
            // Validate database...
            conduit_core_1.validateDB(context);
            const promises = [];
            const { boardMutations, widgetMutations } = args;
            if (widgetMutations) {
                const widgetIds = new Set();
                // Validate that there are no duplicates first.  If the Ids are invalid, the mutators will catch that.
                for (const widgetCustomParams of widgetMutations) {
                    if (widgetIds.has(widgetCustomParams.widget)) {
                        throw new Error(`Duplicate widget found in in widgetMutations array: ${widgetCustomParams.widget}`);
                    }
                    else {
                        widgetIds.add(widgetCustomParams.widget);
                    }
                }
                for (const widgetCustomParams of widgetMutations) {
                    promises.push(context.db.runMutator(context.trc, 'widgetCustomizeVerII', widgetCustomParams));
                }
            }
            if (boardMutations) {
                if (typeof boardMutations.isCustomized === 'boolean') {
                    promises.push(context.db.runMutator(context.trc, 'boardSetIsCustomized', { board: boardMutations.board, isCustomized: boardMutations.isCustomized }));
                }
                if (boardMutations.headerFields) {
                    promises.push(context.db.runMutator(context.trc, 'boardHeaderCustomize', { board: boardMutations.board, fields: boardMutations.headerFields }));
                }
            }
            if (promises.length) {
                await conduit_utils_1.allSettled(promises);
            }
            return { success: true };
        },
    };
};
exports.createBoardCustomizeVerIIDefinition = createBoardCustomizeVerIIDefinition;
//# sourceMappingURL=BoardCustomizeVerII.js.map