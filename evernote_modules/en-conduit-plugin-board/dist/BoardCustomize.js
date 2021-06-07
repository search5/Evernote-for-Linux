"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardCustomizeDefinition = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_home_data_model_1 = require("en-home-data-model");
const types_1 = require("./Schema/types");
// TODO: Remove from Conduit after both clients are migrated to the V2 definition.
const createBoardCustomizeDefinition = () => {
    return {
        args: conduit_core_1.schemaToGraphQLArgs({
            boardMutations: types_1.BoardCustomizeParams,
            widgetMutations: conduit_utils_1.Nullable(conduit_utils_1.ListOfStructs({
                widget: 'ID',
                desktopSortWeight: conduit_utils_1.NullableString,
                desktopWidth: conduit_utils_1.NullableInt,
                mobileSortWeight: conduit_utils_1.NullableString,
                isEnabled: conduit_utils_1.NullableBoolean,
                noteToPin: conduit_utils_1.NullableID,
                noteToUnpin: conduit_utils_1.NullableID,
                mutableWidgetType: conduit_utils_1.Nullable(en_home_data_model_1.MutableWidgetTypeSchema),
                filteredNotesQueryString: conduit_utils_1.NullableString,
                label: conduit_utils_1.NullableString,
                lightBGColor: conduit_utils_1.NullableString,
                darkBGColor: conduit_utils_1.NullableString,
            }, 'WidgetCustomizeParams')),
        }),
        type: conduit_core_1.GenericMutationResult,
        resolve: async function resolver(parent, args, context) {
            // Validate arguments...
            if (!args || (!args.widgetMutations && !args.boardMutations)) {
                throw new conduit_utils_1.MissingParameterError('Missing mutations for boardCustomize');
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
                    promises.push(context.db.runMutator(context.trc, 'widgetCustomize', widgetCustomParams));
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
exports.createBoardCustomizeDefinition = createBoardCustomizeDefinition;
//# sourceMappingURL=BoardCustomize.js.map