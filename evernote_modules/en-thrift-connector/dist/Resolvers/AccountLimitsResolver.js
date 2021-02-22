"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLimitsResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const ShareAllowanceResolver_1 = require("./ShareAllowanceResolver");
function AccountLimitsResolver(thriftComm) {
    function genericRatioResolverFactory(countName, limitName) {
        return async (nodeRef, _, context) => {
            conduit_core_1.validateDB(context);
            const node = await context.db.getNode(context, nodeRef, true);
            if (!node) {
                throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing AccountLimits node');
            }
            const numerator = node.NodeFields.Counts[countName];
            const denominator = node.NodeFields.Limits[limitName];
            if (!denominator) {
                return null;
            }
            return Math.round(100 * numerator / denominator) / 100;
        };
    }
    const userNotesAndNotebookSharesSentResolver = async (nodeRef, _, context) => {
        conduit_core_1.validateDB(context);
        const node = await context.db.getNode(context, nodeRef, true);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, 'Missing AccountLimits node');
        }
        const numerator = node.NodeFields.Counts.userNoteAndNotebookSharesSentCount;
        const denominator = await ShareAllowanceResolver_1.getShareAllowance(thriftComm, context);
        if (!denominator || denominator === ShareAllowanceResolver_1.UNLIMITED_SHARES) {
            return null;
        }
        return Math.round(100 * numerator / denominator) / 100;
    };
    return {
        ['AccountLimits.userNoteRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userNoteCount', 'userNoteCountMax'),
        },
        ['AccountLimits.userNotebookRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userNotebookCount', 'userNotebookCountMax'),
        },
        ['AccountLimits.userLinkedNotebookRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userLinkedNotebookCount', 'userLinkedNotebookMax'),
        },
        ['AccountLimits.userTagRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userTagCount', 'userTagCountMax'),
        },
        ['AccountLimits.userSavedSearchesRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userSavedSearchesCount', 'userSavedSearchesMax'),
        },
        ['AccountLimits.userDeviceRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userDeviceCount', 'userDeviceLimit'),
        },
        ['AccountLimits.userWorkspaceRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userWorkspaceCount', 'userWorkspaceCountMax'),
        },
        ['AccountLimits.userUploadedRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: genericRatioResolverFactory('userUploadedAmount', 'uploadLimit'),
        },
        ['AccountLimits.userNoteAndNotebookSharesSentRatio']: {
            type: conduit_core_1.schemaToGraphQLType('number?'),
            resolve: userNotesAndNotebookSharesSentResolver,
        },
    };
}
exports.AccountLimitsResolver = AccountLimitsResolver;
//# sourceMappingURL=AccountLimitsResolver.js.map