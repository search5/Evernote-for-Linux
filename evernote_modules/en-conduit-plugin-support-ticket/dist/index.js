"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportTicketPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_thrift_connector_1 = require("en-thrift-connector");
function getSupportTicketPlugin(filesystemClient) {
    async function readLogFile(trc, logUri) {
        if (!logUri) {
            return undefined;
        }
        if (!filesystemClient) {
            throw new conduit_utils_1.InternalError('Must be provided with file system client');
        }
        let stream;
        try {
            stream = await filesystemClient.readFile(trc, logUri);
        }
        catch (error) {
            conduit_utils_1.logger.error('Error reading file:', error);
            return undefined;
        }
        return {
            body: stream,
        };
    }
    async function fillSupportTicketResolver(parent, args, context) {
        conduit_core_1.validateDB(context, 'Must be authenticated to file the support ticket');
        if (!args || !args.subject || !args.subject.trim() || !args.body || !args.body.trim()) {
            throw new conduit_utils_1.MissingParameterError('Missing argument for fileSupportTicket mutation');
        }
        if (args.logUri && !filesystemClient) {
            throw new conduit_utils_1.InternalError('Must be provided with file system client');
        }
        const authorizedToken = await conduit_core_1.retrieveAuthorizedToken(context);
        const authData = en_thrift_connector_1.decodeAuthData(authorizedToken);
        const utilityStore = context.thriftComm.getUtilityStore(authData.urls.utilityUrl);
        const logData = await readLogFile(context.trc, args.logUri);
        await utilityStore.fileSupportTicket(context.trc, authData.token, {
            logFile: logData,
            subject: args.subject,
            issueDescription: args.body,
            applicationVersion: args.appVersion,
            carrierInfo: args.carrierInfo,
            connectionInfo: args.connectionInfo,
            contactEmail: args.contactEmail,
            deviceInfo: args.deviceInfo,
            osInfo: args.osInfo,
            tags: args.tags,
        });
        return {
            success: true,
        };
    }
    return {
        name: 'SupportTicketPlugin',
        defineMutators: () => {
            const mutators = {
                fileSupportTicket: {
                    args: conduit_core_1.schemaToGraphQLArgs({
                        subject: 'string',
                        body: 'string',
                        logUri: conduit_utils_1.NullableString,
                        applicationVersion: conduit_utils_1.NullableString,
                        carrierInfo: conduit_utils_1.NullableString,
                        osInfo: conduit_utils_1.NullableString,
                        connectionInfo: conduit_utils_1.NullableString,
                        contactEmail: conduit_utils_1.NullableString,
                        deviceInfo: conduit_utils_1.NullableString,
                        tags: conduit_utils_1.NullableListOf('string'),
                    }),
                    type: conduit_core_1.GenericMutationResult,
                    resolve: fillSupportTicketResolver,
                    description: 'fill the support ticket',
                },
            };
            return mutators;
        },
    };
}
exports.getSupportTicketPlugin = getSupportTicketPlugin;
//# sourceMappingURL=index.js.map