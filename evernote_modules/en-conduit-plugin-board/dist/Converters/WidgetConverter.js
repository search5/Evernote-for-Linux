"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_nsync_connector_1 = require("en-nsync-connector");
const BoardConstants_1 = require("../BoardConstants");
const getWidgetNode = async (trc, instance, context) => {
    var _a, _b, _c, _d;
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    let selectedTab;
    if (instance.widgetType === BoardConstants_1.WidgetType.Clipped) {
        // Fall back to a supported tab for forwards compatibility.
        selectedTab = (_b = BoardConstants_1.ClippedTabs[(_a = instance.selectedTab) !== null && _a !== void 0 ? _a : '']) !== null && _b !== void 0 ? _b : BoardConstants_1.ClippedTabs.WebClips;
    }
    else if (instance.widgetType === BoardConstants_1.WidgetType.Notebooks || instance.widgetType === BoardConstants_1.WidgetType.Notes) {
        // Fall back to a supported tab for forwards compatibility.
        selectedTab = (_d = BoardConstants_1.CommonTabs[(_c = instance.selectedTab) !== null && _c !== void 0 ? _c : '']) !== null && _d !== void 0 ? _d : BoardConstants_1.CommonTabs.Recent;
    }
    const widget = Object.assign(Object.assign({}, initial), { type: BoardConstants_1.BoardEntityTypes.Widget, NodeFields: {
            boardType: instance.boardType,
            widgetType: instance.widgetType,
            created: en_nsync_connector_1.convertLong(instance.created || 0),
            updated: en_nsync_connector_1.convertLong(instance.updated || 0),
            isEnabled: instance.isEnabled,
            mobile: Object.assign({}, instance.mobile),
            desktop: Object.assign({}, instance.desktop),
            selectedTab,
            content: en_nsync_connector_1.toBlobV2WithContentFields(instance.content),
        }, inputs: {
            parent: {},
        }, outputs: {
            contentProvider: {},
            conflicts: {},
        }, CacheFields: undefined, CacheState: undefined });
    const edgesToCreate = [];
    if (instance.parentEntity) {
        edgesToCreate.push({
            srcID: instance.parentEntity.id,
            srcType: BoardConstants_1.BoardEntityTypes.Board,
            srcPort: 'children',
            dstID: instance.ref.id,
            dstType: BoardConstants_1.BoardEntityTypes.Widget,
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