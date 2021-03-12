"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testError = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
exports.testError = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    requiredParams: {},
    optionalParams: {
        grpcErrorCode: 'number',
        httpErrorCode: 'number',
    },
    execute: async (trc, ctx, params) => {
        if (params.grpcErrorCode && params.httpErrorCode) {
            throw new Error('Only 1 error code can be defined');
        }
        else if (!params.grpcErrorCode && !params.httpErrorCode) {
            throw new Error('1 error code must be provided!');
        }
        conduit_utils_1.logger.debug(ctx.toString());
        return {
            ops: [],
            results: {},
        };
    },
};
//# sourceMappingURL=TestMutators.js.map