"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleServicesPlugin = exports.transformOAuthToServiceCredential = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
const GoogleDrive_1 = require("./GoogleDrive");
const GoogleServicesTypes_1 = require("./GoogleServicesTypes");
function transformOAuthToServiceCredential(credential) {
    // Thrift returns partial URIs for Google Auth Scopes; parse them out with proper values
    const scopeKeys = [];
    if (!!credential && !!credential.scope) {
        credential.scope.split(' ').forEach(thriftScope => {
            for (const key of Object.keys(GoogleServicesTypes_1.GoogleScopes)) {
                if (thriftScope.includes(GoogleServicesTypes_1.GoogleScopes[key.toLowerCase()].scope)) {
                    scopeKeys.push(key);
                }
            }
        });
    }
    const gapiScopes = [];
    const gapiServicesEnum = [];
    scopeKeys.forEach((key) => {
        gapiServicesEnum.push(GoogleServicesTypes_1.GoogleScopes[key].enum);
        gapiScopes.push(GoogleServicesTypes_1.GoogleScopes[key].scopeUri);
    });
    const gapiCredential = {
        accessToken: credential.accessToken || '',
        oAuthVersion: credential.oAuthVersion || 0,
        services: gapiServicesEnum,
        scopeUris: gapiScopes,
        refreshesAfter: credential.refreshAfter || 0,
        expiresAfter: credential.expires || 0,
    };
    return gapiCredential;
}
exports.transformOAuthToServiceCredential = transformOAuthToServiceCredential;
function getGoogleServicesPlugin(httpClient) {
    async function getGoogleApiCredentialResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google API credentials.');
        if (!httpClient) {
            throw new Error('Unable to retrieve credentials without an HttpTransport instance.');
        }
        if (!args || !args.service) {
            throw new Error('Missing argument for getGoogleAuthCredential query');
        }
        // Parse out the services argument and transform them into the abbreviated Google Auth Scopes that Thrift expects.
        const thriftService = GoogleServicesTypes_1.GoogleScopes[GoogleServicesTypes_1.GoogleServicesEnum[args.service.toUpperCase()].toLowerCase()].scope;
        // TODO
        // See GraphStorageDB.setNodeCachedField(trc: TracingContext, nodeRef: Readonly<GraphNodeRef>, cacheField: string,
        //  cacheValue: any, dependentFieldValues: Stash) for field caching.
        // If CDT is supposed to be the center for all business logic going forward, then concerns with having a valid
        //  and unexpired token without having to constantly ask Thrift for a new token would make sense.
        //  ... well, EDAM Thrift API must be responsible for generating Authorization Codes and Access Tokens
        //  because the validation on the Refresh Token uses the Client ID (and Secret) that EDAM Thrift API has;
        //  Conduit *must* use this same Client ID if we want it to be capable of this functionality moving forward.
        // TODO Investigate feasibility of getting EDAM Thrift API to expose (somehow) its Client IDs and relevant
        //   API Keys to Conduit.
        // Get EN Auth Token, then ask Thrift for scoped OAuth credentials.
        const authToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const googleOAuth = await en_thrift_connector_1.getScopedGoogleOAuthCredential(context.trc, context.thriftComm, authToken || '', thriftService);
        const gapiCredential = transformOAuthToServiceCredential(googleOAuth);
        return gapiCredential;
    }
    async function getGoogleDriveFilesResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Drive File data.');
        if (!httpClient) {
            throw new Error('Unable to make Google Drive API requests without an HttpTransport instance.');
        }
        if (!args || !args.resourceIds) {
            throw new Error('Cannot retrieve Google Drive File data if there are no resourceIds.');
        }
        const googleFileIds = args.resourceIds;
        // Get EN Auth Token, then ask Thrift for scoped OAuth credentials.
        const authToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const googleOAuth = await en_thrift_connector_1.getScopedGoogleOAuthCredential(context.trc, context.thriftComm, authToken || '', GoogleServicesTypes_1.GoogleScopes.drive.scope);
        const gapiCredential = transformOAuthToServiceCredential(googleOAuth);
        // Make Google Drive API Request
        const driveFiles = await GoogleDrive_1.getFiles(context.trc, httpClient, gapiCredential.accessToken, googleFileIds);
        return driveFiles;
    }
    /*
    async function setOAuthCredentialResolver(parent?: any, args?: Stash, context?: GraphQLContext): Promise<OAuthCredential> {
      validateDB(context, 'Must be authenticated to retrieve Google Drive File data.');
  
      if (!args || !args.authCode) {
        throw new Error('Cannot set OAuthCredentials without a new OAuthCredential.');
      }
  
      // Get EN Auth Token, then ask Thrift for scoped OAuth credentials.
      const authToken: string = await retrieveAuthorizedToken(context);
  
      // New credential
      const newCreds: OAuthCredential = {
        accessToken: args.authCode,
        serviceId: 1,
        oAuthVersion: 2,
      };
      const resultCredential: OAuthCredential = await setOAuthCredential(context.trc, context.thriftComm, authToken || '', newCreds);
  
      return resultCredential;
    }
    */
    return {
        name: GoogleServicesTypes_1.GoogleServicesGQLEndpoint,
        defineQueries: () => {
            const queries = {
                getGoogleAuthCredential: {
                    args: conduit_core_1.schemaToGraphQLArgs({ service: 'string' }),
                    type: conduit_core_1.schemaToGraphQLType(GoogleServicesTypes_1.GoogleApiCredentialSchema),
                    resolve: getGoogleApiCredentialResolver,
                    description: 'Retrieves credentials that will include a GAPI access token.',
                },
                getGoogleDriveFiles: {
                    args: conduit_core_1.schemaToGraphQLArgs({ resourceIds: conduit_utils_1.ListOf('string') }),
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.ListOf(GoogleServicesTypes_1.GoogleDriveResponseSchema)),
                    resolve: getGoogleDriveFilesResolver,
                    description: 'Retrieves response metadata for file resources hosted and managed by Google Drive.',
                },
            };
            return queries;
        },
    };
}
exports.getGoogleServicesPlugin = getGoogleServicesPlugin;
//# sourceMappingURL=index.js.map