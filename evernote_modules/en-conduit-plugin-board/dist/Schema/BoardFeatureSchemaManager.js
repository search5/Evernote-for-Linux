"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardFeatureSchemaManager = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const Utilities = __importStar(require("../Utilities"));
const calendar_1 = require("./calendar");
const core_1 = require("./core");
const extra_1 = require("./extra");
const filteredNotes_1 = require("./filteredNotes");
const tasks_1 = require("./tasks");
const WidgetDefaultsFactory_1 = require("./WidgetDefaultsFactory");
class BoardFeatureSchemaManager {
    constructor(di) {
        this.di = di;
        this.featureVersionPiplines = this.createFeatureVersionPipelines();
    }
    static createHomeGAWidgetTypes() {
        return [
            en_home_data_model_1.WidgetType.Clipped,
            en_home_data_model_1.WidgetType.Notebooks,
            en_home_data_model_1.WidgetType.Notes,
            en_home_data_model_1.WidgetType.OnboardingChecklist,
            en_home_data_model_1.WidgetType.Pinned,
            en_home_data_model_1.WidgetType.ScratchPad,
            en_home_data_model_1.WidgetType.Shortcuts,
            en_home_data_model_1.WidgetType.Tags,
        ];
    }
    getUpgradePipeline(board, feature, requestedVersion) {
        const featurePipeline = this.featureVersionPiplines.get(feature);
        if (!featurePipeline || featurePipeline.length === 0) {
            throw new conduit_utils_1.NotFoundError(feature, `No feature pipeline for ${feature}`);
        }
        if (requestedVersion - 1 >= featurePipeline.length || requestedVersion <= 0) {
            throw new conduit_utils_1.NotFoundError(feature, `Feature pipeline for ${feature} does not support version ${requestedVersion}`);
        }
        let currentVersion = 0;
        if (board) {
            const currentVersionFromKey = board.NodeFields[BoardFeatureSchemaManager.formFeatureKey(feature)];
            if (typeof currentVersionFromKey === 'number') {
                currentVersion = currentVersionFromKey;
            }
        }
        if (currentVersion >= requestedVersion) {
            return [];
        }
        return featurePipeline.slice(currentVersion, requestedVersion);
    }
    static formFeatureKey(feature) {
        return `${feature}Version`;
    }
    createFeatureVersionPipelines() {
        return new Map([
            [en_home_data_model_1.BoardFeature.Calendar, [calendar_1.calendarFeatureVersionOne]],
            [en_home_data_model_1.BoardFeature.Tasks, [tasks_1.tasksFeatureVersionOne]],
            [en_home_data_model_1.BoardFeature.FilteredNotes, [filteredNotes_1.filteredNotesFeatureVersionOne]],
            [en_home_data_model_1.BoardFeature.Core, [core_1.coreFeatureVersionOne]],
            [en_home_data_model_1.BoardFeature.Extra, [extra_1.extraFeatureVersionOne]],
        ]);
    }
    filterFeaturesRequested(featuresRequested, featureVersionsRequested) {
        const schemaFeatures = Utilities.getBoardPluginFeatures(this.di).schema;
        const featuresRequestedResult = [];
        const featureVersionsRequestedResult = [];
        for (let i = 0; i < featuresRequested.length; i++) {
            const feature = featuresRequested[i];
            if (!schemaFeatures[feature]) {
                continue; // The client does not support this feature and we need to skip it.
            }
            featuresRequestedResult.push(feature);
            featureVersionsRequestedResult.push(featureVersionsRequested[i]);
        }
        return {
            features: featuresRequestedResult,
            featureVersions: featureVersionsRequestedResult,
        };
    }
    mergeToMinimumFeatureVersions(featuresRequested, featureVersionsRequested, board) {
        if (!board) {
            return {
                features: featuresRequested,
                featureVersions: featureVersionsRequested,
            };
        }
        const featuresRequestedResult = [];
        const featureVersionsRequestedResult = [];
        for (const feature of Object.values(en_home_data_model_1.BoardFeature)) {
            const currentVersion = board.NodeFields[BoardFeatureSchemaManager.formFeatureKey(feature)];
            const indexOfFeature = featuresRequested.indexOf(feature);
            // The board already has a feature version number, and we need to run a comparison.
            if (typeof currentVersion === 'number') {
                let featureVersionToUse = currentVersion; // Take the board's version as a default.
                if (indexOfFeature > -1) { // If there is a requested version, compare to figure out which is greater.
                    const featureVersionRequested = featureVersionsRequested[indexOfFeature];
                    // We cannot downgrade, so only take the requested version if it is greater.
                    if (featureVersionRequested > featureVersionToUse) {
                        featureVersionToUse = featureVersionRequested;
                    }
                }
                featuresRequestedResult.push(feature);
                featureVersionsRequestedResult.push(featureVersionToUse);
            }
            else if (indexOfFeature > -1) {
                // The board does not have this feature or version, so we add it as passed in to trigger an upgrade.
                featuresRequestedResult.push(featuresRequested[indexOfFeature]);
                featureVersionsRequestedResult.push(featureVersionsRequested[indexOfFeature]);
            }
        }
        return {
            features: featuresRequestedResult,
            featureVersions: featureVersionsRequestedResult,
        };
    }
    async generateDefaultLayout(trc, ctx, userAdjustedServiceLevelV2, features, featureVersions, boardType, boardInternalID, clientLayoutVersion = 0) {
        // This is the original list of widgets determined at Home Feature launch and is part of the Core Board Schema Definition.
        const widgetTypes = BoardFeatureSchemaManager.createHomeGAWidgetTypes();
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            const featureVersion = featureVersions[i];
            /*
            * For this effort, we just pass an empty board, as we always calculate this from start to current version.
            * Because we call mergeToMinimumFeatureVersions before this, we always get the available Board widgetTypes
            *  no matter the version numbers passed in by the client.  This solves part of our compatibility problems.
            */
            const featureWidgetTypesSteps = this.getUpgradePipeline(null, feature, featureVersion);
            if (featureWidgetTypesSteps) {
                const steps = featureWidgetTypesSteps.slice(0, featureVersion);
                for (const step of steps) {
                    widgetTypes.push(...step.widgetTypeGenerator());
                }
            }
        }
        const widgetDefaultsFactory = new WidgetDefaultsFactory_1.WidgetDefaultsFactory();
        return await widgetDefaultsFactory.create(trc, ctx, userAdjustedServiceLevelV2, clientLayoutVersion, boardType, widgetTypes, boardInternalID);
    }
    applyWidgetDefaults(widget, defaults, platform) {
        widget.widgetType = defaults.widgetType;
        widget.boardType = defaults.boardType;
        widget.isEnabled = defaults.isEnabled;
        widget.internalID = defaults.internalID;
        widget.mutableWidgetType = defaults.mutableWidgetType;
        if (!platform || platform === en_home_data_model_1.DeviceFormFactor.Desktop) {
            if (!widget.desktop) {
                widget.desktop = {
                    panelKey: undefined,
                    height: 1,
                };
            }
            widget.desktop.width = defaults.desktopWidth;
            widget.desktop.sortWeight = defaults.desktopSortWeight;
        }
        if (!platform || platform === en_home_data_model_1.DeviceFormFactor.Mobile) {
            if (!widget.mobile) {
                widget.mobile = {
                    panelKey: undefined,
                    height: 1,
                    width: 1,
                };
            }
            widget.mobile.sortWeight = defaults.mobileSortWeight;
        }
    }
    adjustBoardLayoutSummary(boardLayoutSummary, widget) {
        if (widget.NodeFields.desktop.sortWeight > boardLayoutSummary.maxDesktopSortWeight) {
            boardLayoutSummary.maxDesktopSortWeight = widget.NodeFields.desktop.sortWeight;
        }
        if (widget.NodeFields.mobile.sortWeight > boardLayoutSummary.maxMobileSortWeight) {
            boardLayoutSummary.maxMobileSortWeight = widget.NodeFields.mobile.sortWeight;
        }
    }
    async createWidgetAndEdge(ctx, boardID, boardLayoutSummary, widgetID, defaults, isCustomized) {
        const { selectedTab, } = defaults;
        const [, widgetNodeID] = widgetID;
        const widgetStash = {
            created: ctx.timestamp,
            updated: ctx.timestamp,
            selectedTab,
            content: {
                localChangeTimestamp: 0,
                size: 0,
                hash: ctx.md5(''),
                content: '',
                path: '',
            },
        };
        const defaultRankingsToUse = {
            mobileSortWeight: defaults.mobileSortWeight,
            desktopSortWeight: defaults.desktopSortWeight,
        };
        if (defaults.autoPosition) {
            if (defaultRankingsToUse.mobileSortWeight <= boardLayoutSummary.maxMobileSortWeight) {
                try {
                    defaultRankingsToUse.mobileSortWeight = boardLayoutSummary.lexoRankHandler.between(boardLayoutSummary.maxMobileSortWeight, conduit_utils_1.LexoRankEndWeight);
                }
                catch ( // Almost impossible to hit, but provides a fallback in case we cannot find room at the end of the sorted array.
                _a) { // Almost impossible to hit, but provides a fallback in case we cannot find room at the end of the sorted array.
                    defaultRankingsToUse.mobileSortWeight = conduit_utils_1.LexoRankMaxChar.repeat(boardLayoutSummary.lexoRankHandler.maxLength());
                }
            }
            if (defaultRankingsToUse.desktopSortWeight <= boardLayoutSummary.maxDesktopSortWeight) {
                try {
                    defaultRankingsToUse.desktopSortWeight = boardLayoutSummary.lexoRankHandler.between(boardLayoutSummary.maxDesktopSortWeight, conduit_utils_1.LexoRankEndWeight);
                }
                catch ( // Almost impossible to hit, but provides a fallback in case we cannot find room at the end of the sorted array.
                _b) { // Almost impossible to hit, but provides a fallback in case we cannot find room at the end of the sorted array.
                    defaultRankingsToUse.desktopSortWeight = conduit_utils_1.LexoRankMaxChar.repeat(boardLayoutSummary.lexoRankHandler.maxLength());
                }
            }
            boardLayoutSummary.maxDesktopSortWeight = defaultRankingsToUse.desktopSortWeight;
            boardLayoutSummary.maxMobileSortWeight = defaultRankingsToUse.mobileSortWeight;
        }
        this.applyWidgetDefaults(widgetStash, Object.assign(Object.assign(Object.assign({}, defaults), defaultRankingsToUse), { isEnabled: !isCustomized || defaults.autoPosition ? defaults.isEnabled : false }));
        return {
            widget: widgetStash,
            edge: {
                srcID: boardID, srcType: en_data_model_1.EntityTypes.Board, srcPort: 'children',
                dstID: widgetNodeID, dstType: en_data_model_1.EntityTypes.Widget, dstPort: 'parent',
            },
        };
    }
    async upgradeSchema(params) {
        const { feature, featureVersion, widgetMutations, boardMutation, board, } = params;
        /*
         * For this effort, we just pass in the actual Board, which will grab only the required pipeline steps to actually
         *  perform Schema mutation operations.  This prevents this logic from firing twice.
         */
        const upgradePipeline = this.getUpgradePipeline(board, feature, featureVersion);
        if (upgradePipeline.length === 0) {
            return;
        }
        const edges = [];
        for (const step of upgradePipeline) {
            const stepParams = Object.assign(Object.assign({}, params), { widgetMutations,
                boardMutation });
            const stepResults = await step.schemeUpgradeConverter(this, stepParams);
            if (stepResults.edges) {
                // Currently, this only happens on the first step, and we only ever expect one.
                for (const association of stepResults.edges) {
                    edges.push(association);
                }
            }
            if (stepResults.widgets) {
                for (const widget of stepResults.widgets) {
                    const rootWidget = widgetMutations.get(widget.ref.id);
                    if (rootWidget) {
                        // This will concate arrays, but we also don't have any arrays in the data model atm.
                        conduit_utils_1.deepUpdateMutable(rootWidget, widget.mutation);
                    }
                }
            }
            if (stepResults.board) {
                // This will concate arrays, but we also don't have any arrays in the data model atm.
                conduit_utils_1.deepUpdateMutable(boardMutation, stepResults.board.mutation);
            }
        }
        boardMutation[BoardFeatureSchemaManager.formFeatureKey(feature)] = featureVersion;
    }
}
exports.BoardFeatureSchemaManager = BoardFeatureSchemaManager;
//# sourceMappingURL=BoardFeatureSchemaManager.js.map