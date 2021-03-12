"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataForQualtricsPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
async function dataForQualtrics(parent, args, context) {
    if (!args) {
        throw new Error('Missing args');
    }
    conduit_core_1.validateDB(context);
    const personalMetadata = await context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT);
    if (!personalMetadata || !personalMetadata.userID) {
        throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_CONTEXT, 'metadata or userID not found');
    }
    return {
        userId: personalMetadata.userID,
    };
}
exports.dataForQualtricsPlugin = {
    args: {},
    type: conduit_core_1.schemaToGraphQLType({
        userId: 'number',
    }, 'DataForQualtrics', false),
    resolve: dataForQualtrics,
};
//# sourceMappingURL=DataForQualtrics.js.map