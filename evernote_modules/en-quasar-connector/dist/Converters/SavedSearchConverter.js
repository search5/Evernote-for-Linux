"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedSearchNodesAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const BaseConverter_1 = require("./BaseConverter");
const getSavedSearchNodesAndEdges = async (trc, instance, context) => {
    const savedSearch = BaseConverter_1.convertNsyncEntityToNode(instance, context);
    if (!savedSearch) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    return { nodes: { nodesToUpsert: [savedSearch], nodesToDelete: [] } };
};
exports.getSavedSearchNodesAndEdges = getSavedSearchNodesAndEdges;
//# sourceMappingURL=SavedSearchConverter.js.map