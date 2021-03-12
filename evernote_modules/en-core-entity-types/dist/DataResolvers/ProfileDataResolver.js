"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileDataResolver = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
async function ProfileDataResolver(context, node) {
    conduit_core_1.validateDB(context);
    if (!conduit_storage_1.isGraphNode(node)) {
        return null;
    }
    if (node) {
        const parent = conduit_utils_1.firstStashEntry(node.inputs.parent);
        if (parent) {
            const parentNode = await context.db.getNode(context, { type: parent.srcType, id: parent.srcID });
            if (parentNode) {
                return parentNode;
            }
        }
    }
    return node;
}
exports.ProfileDataResolver = ProfileDataResolver;
//# sourceMappingURL=ProfileDataResolver.js.map