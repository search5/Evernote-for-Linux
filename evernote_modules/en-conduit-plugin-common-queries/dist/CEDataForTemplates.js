"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ceDataForTemplatesPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
async function ceDataForTemplates(parent, args, context) {
    conduit_core_1.validateDB(context);
    if (!args || !args.noteID) {
        const token = await conduit_core_1.retrieveAuthorizedToken(context);
        const tokenData = en_thrift_connector_1.decodeAuthData(token);
        return {
            shard: tokenData.shard,
            authToken: tokenData.token,
            userId: tokenData.userID,
        };
    }
    const { node, syncContext } = await context.db.getNodeWithContext(context, { id: args.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note });
    if (!node) {
        throw new conduit_utils_1.NotFoundError(args.noteID, 'Note not found');
    }
    const [metadata, personalMetadata] = await conduit_utils_1.allSettled([
        context.db.getSyncContextMetadata(context, syncContext),
        context.db.getSyncContextMetadata(context, conduit_core_1.PERSONAL_USER_CONTEXT),
    ]);
    if (!metadata || !personalMetadata) {
        throw new conduit_utils_1.NotFoundError(args.noteID, 'Bad syncContext for note');
    }
    const authData = en_thrift_connector_1.decodeAuthData(metadata.authToken);
    const personalAuthData = en_thrift_connector_1.decodeAuthData(personalMetadata.authToken);
    return {
        noteGuid: en_thrift_connector_1.convertGuidToService(args.noteID, en_core_entity_types_1.CoreEntityTypes.Note),
        shard: authData.shard,
        authToken: personalAuthData.token,
        userId: (personalMetadata || metadata).userID,
    };
}
exports.ceDataForTemplatesPlugin = {
    args: conduit_core_1.schemaToGraphQLArgs({ noteID: 'ID?' }),
    type: conduit_core_1.schemaToGraphQLType({
        noteGuid: 'string?',
        shard: 'string',
        authToken: 'string',
        userId: 'number',
    }, 'CEDataForTemplates', false),
    resolve: ceDataForTemplates,
};
//# sourceMappingURL=CEDataForTemplates.js.map