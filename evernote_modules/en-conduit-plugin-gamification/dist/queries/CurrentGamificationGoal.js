"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationCurrentGoalQuery = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const graphql_1 = require("graphql");
;
const gamificationCurrentGoalQuery = (autoResolverData) => {
    return {
        args: {},
        description: `Get the Gamification goal the user currently has selected.`,
        type: new graphql_1.GraphQLObjectType({
            name: 'GamificationCurrentGoalResult',
            fields: () => {
                const resultMap = {};
                conduit_core_1.schemaFieldToGraphQL(autoResolverData, resultMap, 'goal', conduit_utils_1.NullableEntityRef, 'GamificationCurrentGoalResult', [en_data_model_1.EntityTypes.GamificationGoal], undefined);
                return resultMap;
            },
        }),
        resolve: async function resolver(parent, args, context) {
            conduit_core_1.validateDB(context, 'Could not validate DB in currentGamificationGoalResolver(). You must be authenticated to load this data.');
            const userID = await context.db.getCurrentUserID(context);
            if (conduit_utils_1.isNullish(userID)) {
                throw new conduit_utils_1.NotFoundError('userID not found in currentGamificationGoalResolver()');
            }
            const gamificationSummaryId = en_data_model_1.DefaultDeterministicIdGenerator.createId({ userID, entityType: en_data_model_1.EntityTypes.GamificationSummary });
            const gamificationSummary = await context.db.getNode(context, { id: gamificationSummaryId, type: en_data_model_1.EntityTypes.GamificationSummary });
            const gamificationCurrentGoalType = gamificationSummary === null || gamificationSummary === void 0 ? void 0 : gamificationSummary.NodeFields.selectedGoalType;
            if (gamificationCurrentGoalType === undefined) {
                return {};
            }
            const gamificationGoalId = en_data_model_1.DefaultDeterministicIdGenerator.createId({
                userID,
                entityType: en_data_model_1.EntityTypes.GamificationGoal,
                leadingSegments: [{ parts: [gamificationCurrentGoalType] }],
            });
            return {
                goal: {
                    id: gamificationGoalId,
                    type: en_data_model_1.EntityTypes.GamificationGoal,
                },
            };
        },
    };
};
exports.gamificationCurrentGoalQuery = gamificationCurrentGoalQuery;
//# sourceMappingURL=CurrentGamificationGoal.js.map