"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_quasar_connector_1 = require("en-quasar-connector");
const getWidgetNode = async (trc, instance, context) => {
    const widget = en_quasar_connector_1.convertNsyncEntityToNode(instance, context);
    if (!widget) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const edgesToCreate = [];
    if (instance.parentEntity) {
        edgesToCreate.push({
            srcID: instance.parentEntity.id,
            srcType: en_data_model_1.EntityTypes.Board,
            srcPort: 'children',
            dstID: instance.ref.id,
            dstType: en_data_model_1.EntityTypes.Widget,
            dstPort: 'parent',
        });
    }
    return {
        nodes: {
            nodesToUpsert: [widget],
            nodesToDelete: [],
        },
        edges: {
            edgesToDelete: [],
            edgesToCreate,
        },
    };
};
exports.getWidgetNode = getWidgetNode;
//# sourceMappingURL=WidgetConverter.js.map