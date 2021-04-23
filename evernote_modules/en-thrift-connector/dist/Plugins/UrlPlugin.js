"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.getUrlPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Auth = __importStar(require("../Auth"));
const Converters_1 = require("../Converters/Converters");
function getUrlPlugin(tokenRefreshManager) {
    async function getNoteMetadata(args, context) {
        conduit_core_1.validateDB(context);
        if (!args.note) {
            throw new conduit_utils_1.NotFoundError(args.note, 'Missing note id argument');
        }
        const token = await conduit_core_1.retrieveAuthorizedToken(context);
        const authData = Auth.decodeAuthData(token);
        const serviceBaseUrl = authData.urlHost;
        const { node: note, syncContext } = await context.db.getNodeWithContext(context, { id: args.note, type: en_core_entity_types_1.CoreEntityTypes.Note });
        if (!note) {
            throw new conduit_utils_1.NotFoundError(args.note, 'Note argument not found');
        }
        const parentData = conduit_utils_1.firstStashEntry(note.inputs.parent);
        const parentId = parentData ? parentData.srcID : null;
        const metadata = await context.db.getSyncContextMetadata(context, syncContext);
        if (!metadata) {
            throw new Error('Unable to find metadata for note');
        }
        const shard = Auth.decodeAuthData(metadata.authToken).shard;
        const userSlot = Auth.decodeAuthData(metadata.authToken).userSlot;
        // ownerId is not used on the service backend, so we fallback to 1
        const ownerId = metadata.userID || 1;
        const noteTitle = note.label;
        return {
            business: metadata.isVaultUser,
            id: args.note,
            parentId,
            shard,
            ownerId,
            noteTitle,
            serviceBaseUrl,
            userSlot,
        };
    }
    async function webNoteLinkResolver(_, args, context) {
        const { serviceBaseUrl, shard, ownerId, id, noteTitle } = await getNoteMetadata(args, context);
        return `${serviceBaseUrl}/shard/${shard}/nl/${ownerId}/${id}?title=${encodeURI(noteTitle)}`;
    }
    async function evernoteNoteLinkResolver(_, args, context) {
        const { shard, ownerId, id, parentId } = await getNoteMetadata(args, context);
        if (!parentId) {
            throw new Error('Unable to generate note link. Missing notebook parent');
        }
        return `evernote:///view/${ownerId}/${shard}/${id}/${parentId}`;
    }
    async function noteHistoryUrlResolver(_, args, context) {
        if (!args.layout) {
            throw new Error('Missing layout argument');
        }
        const { business, id, serviceBaseUrl, shard, userSlot } = await getNoteMetadata(args, context);
        const noteGuid = Converters_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Note);
        const userSlotSegment = (userSlot === null || userSlot === undefined) ? '' : `/u/${userSlot}`;
        return business
            ? `${serviceBaseUrl}/shard/${shard}/business/dispatch/NoteVersions.action?layout=${args.layout}&guid=${noteGuid}`
            : `${serviceBaseUrl}${userSlotSegment}/shard/${shard}/NoteVersions.action?layout=${args.layout}&guid=${noteGuid}`;
    }
    function buildTargetUrl(origin, sessionToken, url, utmSource, utmMedium, urlParams) {
        // Make sure the urlParam is in the format of key=value&key=value&key=value if passed
        if (urlParams !== undefined) {
            if (urlParams.includes('?')) {
                throw new Error('buildTargetUrl() urlParams should not start with a "?". ');
            }
            // Check to make sure each URL param is in the right format
            urlParams.split('&').forEach(urlParam => {
                if (urlParam.split('=').length !== 2) {
                    throw new Error('buildTargetUrl() urlParams should in the format of "key=value" or "key=value&key=value&key=value...". ');
                }
            });
        }
        const utmParams = conduit_utils_1.toQueryString({
            utm_source: utmSource,
            utm_medium: utmMedium,
        });
        const authQuery = conduit_utils_1.toQueryString({
            auth: sessionToken,
            targetUrl: urlParams ? `/${url}?${utmParams}&${urlParams}` : `/${url}?${utmParams}`,
        });
        return `${origin}/setAuthToken?${authQuery}`;
    }
    async function targetUrlResolver(_, args, context) {
        if (!context) {
            throw new conduit_utils_1.InternalError('No context');
        }
        if (!args.url || !args.utm_source || !args.utm_medium) {
            throw new Error('Missing url argument');
        }
        let sessionToken;
        let origin;
        if (args.two_factor_token && args.host) {
            sessionToken = args.two_factor_token;
            origin = args.host;
        }
        else {
            const authAndState = await context.multiUserProvider.getAuthTokenAndState(context.trc, context.watcher);
            if (!(authAndState === null || authAndState === void 0 ? void 0 : authAndState.token)) {
                throw new Error('Not logged in');
            }
            sessionToken = await tokenRefreshManager.renewAndSaveAuthToken(context);
            origin = Auth.decodeAuthData(authAndState.token).urlHost;
        }
        return buildTargetUrl(origin, sessionToken, args.url, args.utm_source, args.utm_medium, args.url_params);
    }
    async function targetUrlCreateWithOAuthResolver(_, args, context) {
        if (context && context.clientCredentials) {
            if (!args.url || !args.utm_source || !args.utm_medium) {
                throw new Error('Missing url argument');
            }
            const openIdCredential = {
                tokenPayload: args.tokenPayload,
                serviceProvider: Auth.SERVICE_PROVIDER_STRING_TO_ENUM[args.serviceProvider],
            };
            const userStore = context.thriftComm.getUserStore(`${args.serviceHost}/edam/user`);
            const authResult = await userStore.authenticateOpenID(context.trc, openIdCredential, context.clientCredentials.consumerKey, context.clientCredentials.consumerSecret, context.clientCredentials.deviceIdentifier, context.clientCredentials.deviceDescription, false, // authLongSession. Long session is not required for this purpose.
            false);
            if (!authResult.authenticationToken) {
                throw new Error('Login Failed');
            }
            return buildTargetUrl(args.serviceHost, authResult.authenticationToken, args.url, args.utm_source, args.utm_medium, args.urlParams);
        }
    }
    return {
        name: 'Url',
        defineQueries: () => ({
            evernoteNoteLink: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    note: 'ID',
                }),
                type: conduit_core_1.schemaToGraphQLType('string'),
                resolve: evernoteNoteLinkResolver,
            },
            webNoteLink: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    note: 'ID',
                }),
                type: conduit_core_1.schemaToGraphQLType('string'),
                resolve: webNoteLinkResolver,
            },
            noteHistoryUrl: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    note: 'string',
                    layout: conduit_utils_1.Enum([
                        'EMBED', 'NATIVEEMBED', 'WEB', 'IPHONE', 'ANDROID', 'IPAD', 'WP7', 'APP',
                        'MICRO', 'OAUTHMICRO', 'SMALL', 'MOBILE', 'WEBEMBED', 'MAC',
                    ], 'NoteHistoryLayout'),
                }),
                type: conduit_core_1.schemaToGraphQLType('string'),
                resolve: noteHistoryUrlResolver,
            },
        }),
        defineMutators: () => ({
            targetUrlCreate: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    url: 'string',
                    utm_source: 'string',
                    utm_medium: 'string',
                    host: conduit_utils_1.NullableString,
                    two_factor_token: conduit_utils_1.NullableString,
                    url_params: conduit_utils_1.NullableString,
                }),
                type: conduit_core_1.schemaToGraphQLType('string'),
                resolve: targetUrlResolver,
            },
            targetUrlCreateWithOAuth: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    serviceHost: 'string',
                    tokenPayload: 'string',
                    serviceProvider: 'string',
                    url: 'string',
                    utm_source: 'string',
                    utm_medium: 'string',
                    urlParams: conduit_utils_1.NullableString,
                }),
                type: conduit_core_1.schemaToGraphQLType('string'),
                resolve: targetUrlCreateWithOAuthResolver,
            },
        }),
    };
}
exports.getUrlPlugin = getUrlPlugin;
//# sourceMappingURL=UrlPlugin.js.map