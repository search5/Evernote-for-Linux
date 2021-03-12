"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMessages = void 0;
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
async function syncMessages(trc, thriftComm, auth, args) {
    const commEngine = thriftComm.getCommunicationEngine(auth.urls.communicationEngineUrl);
    const { guid, supportedPlacements, locale, clientType, uiLanguage, commEngineJsVersion, nativeClientVersion, events, } = args;
    const messageRequest = new en_conduit_sync_types_1.TCommEngineMessageRequest({
        guid,
        knownMessages: args.knownMessages ? args.knownMessages.map((key) => new en_conduit_sync_types_1.TCommEngineInAppMessageIdentifier({
            key,
        })) : null,
        supportedPlacements,
        locale,
        clientType,
        uiLanguage,
        commEngineJsVersion,
        nativeClientVersion,
        events,
    });
    return commEngine.syncMessages(trc, auth.token, messageRequest);
}
exports.syncMessages = syncMessages;
//# sourceMappingURL=EnThriftCommEngine.js.map