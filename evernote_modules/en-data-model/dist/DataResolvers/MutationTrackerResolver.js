"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationTrackerResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const MutationTracker_1 = require("../NodeTypes/MutationTracker");
async function MutationTrackerResolver(context, node) {
    conduit_core_1.validateDB(context);
    if (!conduit_storage_1.isGraphNode(node)) {
        return Object.assign(Object.assign({}, MutationTracker_1.MUTATION_TRACKER_REF), { syncContexts: [], localChangeTimestamp: 0, label: 'EmptyMutationTracker', version: 0, inputs: {}, outputs: {}, NodeFields: {
                updated: 0,
            }, owner: conduit_utils_1.NullUserID });
    }
    return node;
}
exports.MutationTrackerResolver = MutationTrackerResolver;
//# sourceMappingURL=MutationTrackerResolver.js.map