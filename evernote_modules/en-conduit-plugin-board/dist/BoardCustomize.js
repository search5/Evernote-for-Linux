"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardCustomizeDefinition = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const WidgetCustomizeInput = new graphql_1.GraphQLInputObjectType({
    name: 'WidgetCustomizeInput',
    fields: {
        widget: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        desktopSortWeight: { type: graphql_1.GraphQLString },
        desktopWidth: { type: graphql_1.GraphQLFloat },
        mobileSortWeight: { type: graphql_1.GraphQLString },
        isEnabled: { type: graphql_1.GraphQLBoolean },
        noteToPin: { type: graphql_1.GraphQLString },
        noteToUnpin: { type: graphql_1.GraphQLString },
    },
});
const createBoardCustomizeDefinition = () => {
    return {
        args: {
            widgetMutations: { type: new graphql_1.GraphQLList(WidgetCustomizeInput) },
        },
        type: conduit_core_1.GenericMutationResult,
        resolve: async function resolver(parent, args, context) {
            // Validate arguments...
            if ((!args) || (!args.widgetMutations)) {
                throw new conduit_utils_1.MissingParameterError('Missing mutations for boardCustomize');
            }
            // Validate database...
            conduit_core_1.validateDB(context);
            const promises = [];
            const { widgetMutations } = args;
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
            if (promises.length) {
                await conduit_utils_1.allSettled(promises);
            }
            return { success: true };
        },
    };
};
exports.createBoardCustomizeDefinition = createBoardCustomizeDefinition;
//# sourceMappingURL=BoardCustomize.js.map