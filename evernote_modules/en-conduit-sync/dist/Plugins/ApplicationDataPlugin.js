"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
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
exports.getApplicationDataPlugin = void 0;
const Auth = __importStar(require("conduit-auth-shared"));
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
async function resolveAuthTokenFromNodeID(id, type, context) {
    conduit_core_1.validateDB(context);
    if (!id) {
        throw new conduit_utils_1.NotFoundError(id, 'Missing node id argument');
    }
    const { node, syncContext } = await context.db.getNodeWithContext(context, { id, type });
    if (!node) {
        throw new conduit_utils_1.NotFoundError(id, 'Node not found');
    }
    const metadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!metadata) {
        throw new Error('Unable to find metadata for node');
    }
    const noteAuthToken = metadata.authToken;
    return noteAuthToken || '';
}
function getApplicationDataPlugin() {
    async function noteApplicationDataEntryResolver(_, args, context) {
        conduit_core_1.validateDB(context);
        const authToken = await resolveAuthTokenFromNodeID(args.id, en_core_entity_types_1.CoreEntityTypes.Note, context);
        const authData = Auth.decodeAuthData(authToken);
        const notestore = context.comm.getNoteStore(authData.urls.noteStoreUrl);
        const guid = en_thrift_connector_1.convertGuidToService(args.id, en_core_entity_types_1.CoreEntityTypes.Note);
        const value = await notestore.getNoteApplicationDataEntry(context.trc, authData.token, guid, args.key);
        return { value };
    }
    async function attachmentApplicationDataEntryResolver(_, args, context) {
        conduit_core_1.validateDB(context);
        const authToken = await resolveAuthTokenFromNodeID(args.id, en_core_entity_types_1.CoreEntityTypes.Attachment, context);
        const authData = Auth.decodeAuthData(authToken);
        const notestore = context.comm.getNoteStore(authData.urls.noteStoreUrl);
        const guid = en_thrift_connector_1.convertGuidToService(args.id, en_core_entity_types_1.CoreEntityTypes.Attachment);
        const value = await notestore.getResourceApplicationDataEntry(context.trc, authData.token, guid, args.key);
        return { value };
    }
    return {
        name: 'applicationdata',
        defineQueries: () => ({
            noteGetApplicationDataEntry: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    id: 'ID',
                    key: 'string',
                }),
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({ value: conduit_utils_1.NullableString }, 'noteGetApplicationDataEntryResult')),
                resolve: noteApplicationDataEntryResolver,
            },
            attachmentGetApplicationDataEntry: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    id: 'ID',
                    key: 'string',
                }),
                type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({ value: conduit_utils_1.NullableString }, 'attachmentGetApplicationDataEntryResult')),
                resolve: attachmentApplicationDataEntryResolver,
            },
        }),
    };
}
exports.getApplicationDataPlugin = getApplicationDataPlugin;
//# sourceMappingURL=ApplicationDataPlugin.js.map