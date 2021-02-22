"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSession = void 0;
const conduit_utils_1 = require("conduit-utils");
const Query_1 = require("../Query");
let gLastBlockCache = 0;
const recordSessionMutation = Query_1.gql `mutation RecordSession {
  recordSession { latestSessionBlock }
}`;
const rateError = conduit_utils_1.rateLimitErrorLog(15, 'Unable to record session');
function recordSession() {
    const currentSessionBlock = conduit_utils_1.getSessionBlock(Date.now());
    if (currentSessionBlock > gLastBlockCache) {
        recordSessionMutation.execute().then(result => {
            gLastBlockCache = result;
        }).catch(rateError);
    }
}
exports.recordSession = recordSession;
//# sourceMappingURL=recordSessionOverIPC.js.map