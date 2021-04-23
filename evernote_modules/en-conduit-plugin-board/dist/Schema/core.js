"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
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
exports.coreFeatureVersionOne = void 0;
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
const Utilities = __importStar(require("../Utilities"));
const WidgetDefaultsFactory_1 = require("./WidgetDefaultsFactory");
exports.coreFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [];
    },
    schemeUpgradeConverter: async (schemaManager, params) => {
        var _a, _b, _c, _d, _e;
        const { boardRef, board, boardType, widgets, widgetMutations, boardLayoutSummary: { widgetDefaultsById, }, } = params;
        /*
         * Redunant because it exists in boardCreateHome,
         *  but placing it here records when we started doing this by putting it into this block of code.
         */
        const boardMutation = {
            ref: boardRef,
            mutation: {
                internalID: 0,
                serviceLevel: params.serviceLevel,
            },
        };
        // We must compare this against a user's current Board values to get the most accurate value.
        let isCustomized = false;
        /*
         * This was the only Board level customization before this launch;
         *  it is worth noting that headerBGPreviousUpload can happen with an actual apply customization.
         */
        if (board && board.NodeFields.headerBG.size > 0) {
            isCustomized = true;
        }
        const widgetMutationsRet = [];
        if (widgets) {
            // It is possible due to release schedules we catch the Board Service Level ahead of this upgrade, so lets use it if it exists.
            const userAdjustedServiceLevelV2 = en_data_model_1.BoardSchema.calculateUserAdjustedServiceLevel((_a = board === null || board === void 0 ? void 0 : board.NodeFields.serviceLevel) !== null && _a !== void 0 ? _a : params.serviceLevel);
            const v1Factory = new WidgetDefaultsFactory_1.WidgetDefaultsFactory(false);
            const v2Factory = new WidgetDefaultsFactory_1.WidgetDefaultsFactory(true);
            const widgetTypes = [...Object.values(en_data_model_1.WidgetType), ...new Array(en_data_model_1.BoardSchema.MaxExtraWidgets - 1).fill(en_data_model_1.WidgetType.Extra)];
            const v1Config = await v1Factory.create(params.trc, params.ctx, userAdjustedServiceLevelV2, params.boardType, widgetTypes);
            const v2Config = await v2Factory.create(params.trc, params.ctx, userAdjustedServiceLevelV2, params.boardType, widgetTypes);
            // We must do an order check, as LexoRankHandler will generate new sort weights as the length of default widgets changes.
            const expectedV1FlattenedLayout = [];
            const expectedV2FlattenedLayout = [];
            const missingExepectedConfig = new Set();
            const actualWidgetLayoutSummary = new Map();
            for (const widget of widgets) {
                if (!widget) {
                    continue;
                }
                const expectedV1Config = v1Config.widgetDefaultsById.get(widget.id);
                const expectedV2Config = v2Config.widgetDefaultsById.get(widget.id);
                /*
                 * Technically not possible to be missing from one config and not the other unless there is a programming error.
                 *  Protected through unit tests.
                 */
                if (!expectedV1Config || !expectedV2Config) {
                    // Unlikely this code would ever be hit as they would have already upgraded Core version.
                    missingExepectedConfig.add(widget.id);
                }
                else {
                    expectedV1FlattenedLayout.push(expectedV1Config.defaults);
                    expectedV2FlattenedLayout.push(expectedV2Config.defaults);
                }
                const defaults = (_b = widgetDefaultsById.get(widget.id)) === null || _b === void 0 ? void 0 : _b.defaults;
                if (defaults) {
                    widgetMutationsRet.push({
                        ref: { type: BoardConstants_1.BoardEntityTypes.Widget, id: widget.id },
                        mutation: {
                            internalID: defaults.internalID,
                        },
                    });
                }
                actualWidgetLayoutSummary.set(widget.id, {
                    id: widget.id,
                    boardType,
                    widgetType: widget.NodeFields.widgetType,
                    mobileSortWeight: widget.NodeFields.mobile.sortWeight,
                    desktopSortWeight: widget.NodeFields.desktop.sortWeight,
                    desktopWidth: widget.NodeFields.desktop.width,
                    isEnabled: widget.NodeFields.isEnabled,
                    internalID: 0,
                    mutableWidgetType: widget.NodeFields.mutableWidgetType,
                });
            }
            for (const [id, mutation] of widgetMutations.entries()) {
                const exists = actualWidgetLayoutSummary.get(id);
                if (exists) {
                    if ((_c = mutation.desktop) === null || _c === void 0 ? void 0 : _c.sortWeight) {
                        exists.desktopSortWeight = mutation.desktop.sortWeight;
                    }
                    if ((_d = mutation.desktop) === null || _d === void 0 ? void 0 : _d.width) {
                        exists.desktopWidth = mutation.desktop.width;
                    }
                    if ((_e = mutation.mobile) === null || _e === void 0 ? void 0 : _e.sortWeight) {
                        exists.mobileSortWeight = mutation.mobile.sortWeight;
                    }
                    if ('mutableWidgetType' in mutation) {
                        exists.mutableWidgetType = mutation.mutableWidgetType;
                    }
                    if (typeof mutation.isEnabled === 'boolean') {
                        exists.isEnabled = mutation.isEnabled;
                    }
                }
                else {
                    const expectedV1Config = v1Config.widgetDefaultsById.get(id);
                    const expectedV2Config = v2Config.widgetDefaultsById.get(id);
                    /*
                     * Technically not possible to be missing from one config and not the other unless there is a programming error.
                     * Protected through unit tests.
                     */
                    if (!expectedV1Config || !expectedV2Config) {
                        // Unlikely this code would ever be hit as they would have already upgraded Core version.
                        missingExepectedConfig.add(id);
                    }
                    else {
                        expectedV1FlattenedLayout.push(expectedV1Config.defaults);
                        expectedV2FlattenedLayout.push(expectedV2Config.defaults);
                    }
                    // Only possible in creates, so we can assume full layout fields.
                    actualWidgetLayoutSummary.set(id, {
                        id,
                        boardType,
                        widgetType: mutation.widgetType,
                        mobileSortWeight: mutation.mobile.sortWeight,
                        desktopSortWeight: mutation.desktop.sortWeight,
                        desktopWidth: mutation.desktop.width,
                        isEnabled: mutation.isEnabled,
                        internalID: 0,
                        mutableWidgetType: mutation.mutableWidgetType,
                    });
                }
            }
            const actualValuesArray = [...actualWidgetLayoutSummary.values()].filter(w => !missingExepectedConfig.has(w.id));
            actualValuesArray.sort((a, b) => {
                return Utilities.compare(a.desktopSortWeight, b.desktopSortWeight);
            });
            const actualDesktopLayout = [];
            for (const actual of actualValuesArray) {
                actualDesktopLayout.push({
                    numericRanking: actualDesktopLayout.length,
                    desktopWidth: actual.desktopWidth,
                    isEnabled: actual.isEnabled,
                    mutableWidgetType: actual.mutableWidgetType,
                    widgetType: actual.widgetType,
                    id: actual.id,
                });
            }
            actualValuesArray.sort((a, b) => {
                return Utilities.compare(a.mobileSortWeight, b.mobileSortWeight);
            });
            const actualMobileLayout = [];
            for (const actual of actualValuesArray) {
                actualMobileLayout.push({
                    numericRanking: actualMobileLayout.length,
                    desktopWidth: actual.desktopWidth,
                    isEnabled: actual.isEnabled,
                    mutableWidgetType: actual.mutableWidgetType,
                    widgetType: actual.widgetType,
                    id: actual.id,
                });
            }
            expectedV1FlattenedLayout.sort((a, b) => {
                return Utilities.compare(a.desktopSortWeight, b.desktopSortWeight);
            });
            expectedV2FlattenedLayout.sort((a, b) => {
                return Utilities.compare(a.desktopSortWeight, b.desktopSortWeight);
            });
            const maxLength = Math.max(expectedV1FlattenedLayout.length, actualDesktopLayout.length);
            for (let i = 0; i < maxLength; i++) {
                if (i >= actualDesktopLayout.length) {
                    break;
                }
                // We must do an order check, as LexoRankHandler will generate new sort weights as the length of default widgets changes.
                const expectedV1 = expectedV1FlattenedLayout[i];
                const expectedV2 = expectedV2FlattenedLayout[i];
                const desktop = actualDesktopLayout[i];
                const mobile = actualMobileLayout[i];
                // We only consider possible layout or Apply changes for isCustomized, pinning/unpinning a Note does not count.
                const doesNotEqualV1 = (expectedV1.widgetType !== desktop.widgetType || // Order is unique to a platform.
                    expectedV1.widgetType !== mobile.widgetType || // Order is unique to a platform.
                    expectedV1.isEnabled !== desktop.isEnabled || // Shared between platforms.
                    expectedV1.desktopWidth !== desktop.desktopWidth || // Shared between platforms.
                    expectedV1.mutableWidgetType !== desktop.mutableWidgetType // Shared between platforms.
                );
                const doesNotEqualV2 = (expectedV2.widgetType !== desktop.widgetType || // Order is unique to a platform.
                    expectedV2.widgetType !== mobile.widgetType || // Order is unique to a platform.
                    expectedV2.isEnabled !== desktop.isEnabled || // Shared between platforms.
                    expectedV2.desktopWidth !== desktop.desktopWidth || // Shared between platforms.
                    expectedV2.mutableWidgetType !== desktop.mutableWidgetType // Shared between platforms.
                );
                // We could not find a match in either layout schema, and we can safely consider the Board customized.
                if (doesNotEqualV1 && doesNotEqualV2) {
                    isCustomized = true;
                    break;
                }
            }
        }
        // We cannot really control the releases here, so if the board is already marked customize, do not change it.
        boardMutation.mutation.isCustomized = (board && board.NodeFields.isCustomized) ? true : isCustomized;
        return {
            board: boardMutation,
            widgets: widgetMutationsRet,
        };
    },
};
//# sourceMappingURL=core.js.map