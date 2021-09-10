"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpTransport = exports.isRestMethod = void 0;
const conduit_utils_1 = require("conduit-utils");
function isRestMethod(str) {
    if (str === 'POST' || str === 'GET' || str === 'PUT' || str === 'DELETE') {
        return true;
    }
    return false;
}
exports.isRestMethod = isRestMethod;
class HttpTransport {
    request(trc, httpParams, timebox = 20000, retryAfter = 5000) {
        return conduit_utils_1.timeboxExecution(this.requestImpl(trc, httpParams), timebox, new conduit_utils_1.RetryError('request not responding', retryAfter));
    }
    uploadFile(trc, httpParams, filePath) {
        throw new conduit_utils_1.InternalError('NOT IMPLEMENTED');
    }
}
exports.HttpTransport = HttpTransport;
//# sourceMappingURL=HttpTransport.js.map