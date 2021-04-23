"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPendingMutationsPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
async function hasPendingMutationsResolver(parent, args, context) {
    var _a;
    if (!context || !context.db) {
        return {
            result: false,
        };
    }
    // Need to debounce this watcher as it can otherwise get noisy
    (_a = context.watcher) === null || _a === void 0 ? void 0 : _a.setDebounceTime(conduit_utils_1.MILLIS_IN_ONE_SECOND);
    return {
        result: await context.db.hasPendingMutations(context.trc, context.watcher),
    };
}
exports.hasPendingMutationsPlugin = {
    args: {},
    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Struct({
        result: 'boolean',
    }, 'HasPendingMutationsResult')),
    resolve: hasPendingMutationsResolver,
};
//# sourceMappingURL=PendingMutations.js.map