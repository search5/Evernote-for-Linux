"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetContentConflictNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_nsync_connector_1 = require("en-nsync-connector");
const BoardConstants_1 = require("../BoardConstants");
const getWidgetContentConflictNodeAndEdges = async (trc, instance, context) => {
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const widgetContentConflict = Object.assign(Object.assign({}, initial), { type: BoardConstants_1.BoardEntityTypes.WidgetContentConflict, NodeFields: {
            created: instance.created,
            updated: instance.updated,
            content: en_nsync_connector_1.toBlobV2WithContentFields(instance.content),
        }, inputs: {
            parent: {},
        }, outputs: {}, CacheFields: undefined, CacheState: undefined });
    const edgesToCreate = [];
    if (instance.parentEntity) {
        edgesToCreate.push({
            srcID: instance.parentEntity.id,
            srcType: BoardConstants_1.BoardEntityTypes.Widget,
            srcPort: 'conflicts',
            dstID: instance.ref.id,
            dstType: BoardConstants_1.BoardEntityTypes.WidgetContentConflict,
            dstPort: 'parent',
        });
    }
    return {
        edges: {
            edgesToCreate,
            edgesToDelete: [],
        },
        nodes: {
            nodesToUpsert: [widgetContentConflict],
            nodesToDelete: [],
        },
    };
};
exports.getWidgetContentConflictNodeAndEdges = getWidgetContentConflictNodeAndEdges;
//# sourceMappingURL=WidgetContentConflictConverter.js.map