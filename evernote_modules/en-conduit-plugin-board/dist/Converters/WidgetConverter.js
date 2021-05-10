"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getWidgetNode = async (trc, instance, context) => {
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    let selectedTab = null;
    if (instance.widgetType === en_home_data_model_1.WidgetType.Clipped) {
        // Fall back to a supported tab for forwards compatibility.
        selectedTab = conduit_utils_1.isNullish(instance.selectedTab) ? null : (en_home_data_model_1.BoardSchema.ClippedTabsSet.has(instance.selectedTab)
            ? instance.selectedTab
            : en_home_data_model_1.WidgetSelectedTab.WebClips);
    }
    else if (instance.widgetType === en_home_data_model_1.WidgetType.Notebooks || instance.widgetType === en_home_data_model_1.WidgetType.Notes) {
        // Fall back to a supported tab for forwards compatibility.
        selectedTab = conduit_utils_1.isNullish(instance.selectedTab) ? null : (en_home_data_model_1.BoardSchema.CommonTabsSet.has(instance.selectedTab)
            ? instance.selectedTab
            : en_home_data_model_1.WidgetSelectedTab.Recent);
    }
    const widget = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.Widget, NodeFields: {
            boardType: instance.boardType,
            widgetType: instance.widgetType,
            internalID: instance.internalID,
            mutableWidgetType: instance.mutableWidgetType,
            created: instance.created,
            updated: instance.updated,
            isEnabled: instance.isEnabled,
            /*
             * This is fine at this time, as Ion/Boron always filters the OnboardingChecklist widget out
             *  and this is needed for Neutron, which is just about to hit Beta and can launch without
             */
            softDelete: instance.softDelete,
            mobile: Object.assign({}, instance.mobile),
            desktop: Object.assign({}, instance.desktop),
            selectedTab,
            content: en_nsync_connector_1.toBlobV2WithContentFields(instance.content),
            filteredNotesQuery: instance.filteredNotesQuery,
            backgroundColor: instance.backgroundColor,
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