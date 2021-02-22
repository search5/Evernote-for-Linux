"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedSearchNodesAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const BaseConverter_1 = require("./BaseConverter");
const getSavedSearchNodesAndEdges = async (trc, instance) => {
    const initial = BaseConverter_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const node = Object.assign(Object.assign({}, initial), { type: en_data_model_1.CoreEntityTypes.SavedSearch, NodeFields: {
            query: instance.query,
        }, inputs: {}, outputs: {
            shortcut: {},
        } });
    return { nodes: { nodesToUpsert: [node], nodesToDelete: [] } };
};
exports.getSavedSearchNodesAndEdges = getSavedSearchNodesAndEdges;
//# sourceMappingURL=SavedSearchConverter.js.map