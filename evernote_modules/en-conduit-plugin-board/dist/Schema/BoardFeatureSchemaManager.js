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
const BoardConstants_1 = require("../BoardConstants");
const Utilities = __importStar(require("../Utilities"));
const calendar_1 = require("./calendar");
const tasks_1 = require("./tasks");
class BoardFeatureSchemaManager {
    constructor(di) {
        this.di = di;
        this.featureVersionPiplines = this.createFeatureVersionPipelines();
    }
    getUpgradePipeline(board, feature, requestedVersion) {
        const featurePipeline = this.featureVersionPiplines.get(feature);
        if (!featurePipeline || featurePipeline.length === 0) {
            throw new conduit_utils_1.NotFoundError(`No feature pipeline for ${feature}`);
        }
        if (requestedVersion - 1 >= featurePipeline.length) {
            throw new conduit_utils_1.NotFoundError(`Feature pipeline for ${feature} does not support version ${requestedVersion}`);
        }
        let currentVersion = 0;
        if (board) {
            const currentVersionFromKey = board[BoardFeatureSchemaManager.formFeatureKey(feature)];
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
    static formDeterministicBoardIdParts(boardType = BoardConstants_1.BoardType.Home, boardIndex = 0, widgetType, widgetIndex = 0) {
        const boardNumber = BoardConstants_1.boardTypeNumberMap.get(boardType);
        if (boardNumber === undefined) {
            throw new conduit_utils_1.InvalidParameterError('BoardType not mapped to number');
        }
        const boardParts = { parts: [boardNumber, boardIndex] };
        if (!widgetType) {
            return [boardParts];
        }
        const widgetNumber = BoardConstants_1.widgetTypeNumberMap.get(widgetType);
        if (widgetNumber === undefined) {
            throw new conduit_utils_1.InvalidParameterError('WidgetType not mapped to number');
        }
        return [
            {
                parts: [widgetNumber, widgetIndex],
            },
            boardParts,
        ];
    }
    createFeatureVersionPipelines() {
        return new Map([
            [BoardConstants_1.Feature.Calendar, [calendar_1.calendarFeatureVersionOne]],
            [BoardConstants_1.Feature.Tasks, [tasks_1.tasksFeatureVersionOne]],
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
        for (const feature of Object.values(BoardConstants_1.Feature)) {
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
    async generateDefaultLayout(trc, ctx, isBasicLayout, features, featureVersions, boardType = BoardConstants_1.BoardType.Home, boardIndex = 0) {
        var _a;
        const lexoRankHandler = new conduit_utils_1.LexoRankHandler(50);
        const featureWidgetTypeConfig = [];
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            const featureVersion = featureVersions[i];
            // For this effort, we just pass an empty board, as we always calculate this from start to current version.
            const featureWidgetTypesSteps = this.getUpgradePipeline(null, feature, featureVersion);
            if (featureWidgetTypesSteps) {
                const steps = featureWidgetTypesSteps.slice(0, featureVersion);
                for (const step of steps) {
                    const widgetTypes = step.widgetTypeGenerator();
                    for (const widgetType of widgetTypes) {
                        featureWidgetTypeConfig.push(widgetType);
                    }
                }
            }
        }
        const mobileRankings = lexoRankHandler.distribute(8 + featureWidgetTypeConfig.length);
        const desktopRankings = lexoRankHandler.distribute(7 + featureWidgetTypeConfig.length);
        const widgetDefaults = [
            {
                boardType,
                widgetType: BoardConstants_1.WidgetType.OnboardingChecklist,
                mobileSortWeight: mobileRankings[0],
                // Purposefully offsetting this one until Product decides this belongs in Boron/Neutron; if it is ever enabled will have to lazily distribute
                desktopSortWeight: conduit_utils_1.LexoRankMinChar,
                desktopWidth: 1,
                isEnabled: true,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Notes,
                mobileSortWeight: mobileRankings[1],
                desktopSortWeight: desktopRankings[0],
                desktopWidth: isBasicLayout ? 3 : 2,
                isEnabled: true,
                selectedTab: BoardConstants_1.CommonTabs.Recent,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.ScratchPad,
                mobileSortWeight: mobileRankings[2],
                desktopSortWeight: desktopRankings[1],
                desktopWidth: 1,
                isEnabled: true,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Pinned,
                mobileSortWeight: mobileRankings[3],
                desktopSortWeight: desktopRankings[2],
                desktopWidth: 1,
                isEnabled: !isBasicLayout,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Clipped,
                mobileSortWeight: mobileRankings[4],
                desktopSortWeight: desktopRankings[3],
                desktopWidth: 2,
                isEnabled: true,
                selectedTab: BoardConstants_1.ClippedTabs.WebClips,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Notebooks,
                mobileSortWeight: mobileRankings[5],
                desktopSortWeight: desktopRankings[4],
                desktopWidth: 1,
                isEnabled: !isBasicLayout,
                selectedTab: BoardConstants_1.CommonTabs.Recent,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Tags,
                mobileSortWeight: mobileRankings[6],
                desktopSortWeight: desktopRankings[5],
                desktopWidth: 1,
                isEnabled: !isBasicLayout,
                widgetIndex: 0,
            }, {
                boardType,
                widgetType: BoardConstants_1.WidgetType.Shortcuts,
                mobileSortWeight: mobileRankings[7],
                desktopSortWeight: desktopRankings[6],
                desktopWidth: 1,
                isEnabled: !isBasicLayout,
                widgetIndex: 0,
            },
        ];
        // The default board counts by widget for Widget Indexes.
        const widgetCountsByWidgetType = new Map([
            [BoardConstants_1.WidgetType.OnboardingChecklist, 1],
            [BoardConstants_1.WidgetType.Pinned, 1],
            [BoardConstants_1.WidgetType.Shortcuts, 1],
            [BoardConstants_1.WidgetType.ScratchPad, 1],
            [BoardConstants_1.WidgetType.Notes, 1],
            [BoardConstants_1.WidgetType.Notebooks, 1],
            [BoardConstants_1.WidgetType.Tags, 1],
            [BoardConstants_1.WidgetType.Clipped, 1],
        ]);
        // Capture these before we get into the feature widgets.
        const maxDesktopSortWeight = desktopRankings[widgetDefaults.length - 2];
        const maxMobileSortWeight = mobileRankings[widgetDefaults.length - 1];
        for (const widgetTypeConfig of featureWidgetTypeConfig) {
            const { widgetType, isPremiumWidget, } = widgetTypeConfig;
            let countByWidgetType = (_a = widgetCountsByWidgetType.get(widgetType)) !== null && _a !== void 0 ? _a : 1;
            // For now, just put these at the end.
            widgetDefaults.push({
                boardType,
                widgetType,
                mobileSortWeight: mobileRankings[widgetDefaults.length],
                desktopSortWeight: desktopRankings[widgetDefaults.length - 1],
                desktopWidth: 1,
                isEnabled: isPremiumWidget ? !isBasicLayout : true,
                widgetIndex: countByWidgetType - 1,
                appendToEnd: true,
            });
            countByWidgetType++;
            widgetCountsByWidgetType.set(widgetType, countByWidgetType);
        }
        const ret = new Map();
        for (const defaults of widgetDefaults) {
            const idGen = await ctx.generateDeterministicID(trc, ctx.userID, BoardConstants_1.BoardEntityTypes.Widget, BoardConstants_1.BoardDeterministicIdGenerator, BoardFeatureSchemaManager.formDeterministicBoardIdParts(boardType, boardIndex, defaults.widgetType, defaults.widgetIndex));
            ret.set(idGen[1], {
                defaults,
                idGen,
            });
        }
        return {
            widgetDefaultsById: ret,
            maxDesktopSortWeight,
            maxMobileSortWeight,
            lexoRankHandler,
        };
    }
    applyWidgetDefaults(widget, defaults, platform) {
        widget.widgetType = defaults.widgetType;
        widget.boardType = defaults.boardType;
        widget.isEnabled = defaults.isEnabled;
        if (!platform || platform === BoardConstants_1.FormFactor.Desktop) {
            if (!widget.desktop) {
                widget.desktop = {
                    panelKey: undefined,
                    height: 1,
                };
            }
            widget.desktop.width = defaults.desktopWidth;
            widget.desktop.sortWeight = defaults.desktopSortWeight;
        }
        if (!platform || platform === BoardConstants_1.FormFactor.Mobile) {
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
    async createWidgetAndEdge(ctx, boardID, boardLayoutSummary, widgetID, defaults) {
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
        if (defaults.appendToEnd) {
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
        this.applyWidgetDefaults(widgetStash, Object.assign(Object.assign({}, defaults), defaultRankingsToUse));
        return {
            widget: widgetStash,
            edge: {
                srcID: boardID, srcType: BoardConstants_1.BoardEntityTypes.Board, srcPort: 'children',
                dstID: widgetNodeID, dstType: BoardConstants_1.BoardEntityTypes.Widget, dstPort: 'parent',
            },
        };
    }
    async upgradeSchema(params) {
        const { feature, featureVersion, widgetMutations, boardMutation, board, } = params;
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