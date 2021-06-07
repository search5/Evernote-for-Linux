"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeErrorReturnObject = exports.ErrorSchema = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.ErrorSchema = conduit_utils_1.Struct({
    errorKey: conduit_utils_1.NullableString,
    errorType: conduit_utils_1.NullableString,
    id: 'string',
    marked: 'boolean',
    message: 'string',
    mutationName: 'string',
    mutationID: 'string',
    mutationArgsJson: 'string',
}, 'Error');
function makeErrorReturnObject(errObj) {
    let errorKey = '';
    let errorType = '';
    if (errObj.error instanceof conduit_utils_1.ServiceError) {
        errorKey = errObj.error.errorKey;
        errorType = errObj.error.errorType;
    }
    return {
        id: errObj.id,
        marked: errObj.marked,
        message: errObj.error.message,
        errorKey,
        errorType,
        mutationID: errObj.mutation.mutationID,
        mutationName: errObj.mutation.name,
        mutationArgsJson: conduit_utils_1.safeStringify(errObj.mutation.params),
    };
}
exports.makeErrorReturnObject = makeErrorReturnObject;
//# sourceMappingURL=ErrorSchema.js.map