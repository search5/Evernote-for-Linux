"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetDefaultsFactory = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const BoardConstants_1 = require("../BoardConstants");
class WidgetDefaultsFactory {
    constructor(useServiceLevelV2Layouts = false) {
        this.useServiceLevelV2Layouts = useServiceLevelV2Layouts;
    }
    async create(trc, ctx, userAdjustedServiceLevelV2, boardType, widgetTypes, boardInternalID = 0) {
        var _a;
        const configMap = this.useServiceLevelV2Layouts
            ? this.serviceLevelV2Config(userAdjustedServiceLevelV2)
            : this.serviceLevelV1Config(userAdjustedServiceLevelV2);
        const lexoRankHandler = new conduit_utils_1.LexoRankHandler(50);
        const mobileRankings = lexoRankHandler.distribute(widgetTypes.length);
        const desktopRankings = lexoRankHandler.distribute(widgetTypes.length - 1);
        const widgetCountsByWidgetType = new Map();
        const widgetDefaults = [];
        for (const widgetType of widgetTypes) {
            const internalID = (_a = widgetCountsByWidgetType.get(widgetType)) !== null && _a !== void 0 ? _a : 0;
            widgetCountsByWidgetType.set(widgetType, internalID + 1);
            const configArray = configMap.get(widgetType);
            const config = configArray ? configArray[internalID] : undefined;
            if (!config) {
                continue;
            }
            const widgetDefault = {
                boardType,
                widgetType,
                numericalRanking: config.numericRanking,
                mobileSortWeight: '',
                desktopSortWeight: '',
                desktopWidth: config.desktopWidth,
                isEnabled: config.isEnabled,
                internalID,
                mutableWidgetType: config.mutableWidgetType,
                serviceLevelV1Upgrade: config.serviceLevelV1Upgrade,
            };
            if (widgetType === en_data_model_1.WidgetType.Notebooks || widgetType === en_data_model_1.WidgetType.Notes) {
                widgetDefault.selectedTab = en_data_model_1.WidgetSelectedTab.Recent;
            }
            else if (widgetType === en_data_model_1.WidgetType.Clipped) {
                widgetDefault.selectedTab = en_data_model_1.WidgetSelectedTab.WebClips;
            }
            widgetDefaults.push(widgetDefault);
        }
        widgetDefaults.sort((a, b) => {
            return a.numericalRanking - b.numericalRanking;
        });
        /*
         * OnboardingChecklist was initially released to GA with support on Neutron and not on Orion.
         *  However, it was done under the assumption it might be released to Orion some day; as such, the requirement
         *  was it needed to be at the top of the Orion Board when that happens.  Given such, it went down with an 'A'
         *  hardcoded for desktop, instead of an even distribution. This creates the -1 offset on desktop ranking.
         *  Worth noting that when/if it ever gets enabled on Desktop, we probably have to provide a feature version migration
         *  script, anyway.
         */
        for (let i = 0; i < widgetDefaults.length; i++) {
            const widgetDefault = widgetDefaults[i];
            if (widgetDefault.widgetType === en_data_model_1.WidgetType.OnboardingChecklist) {
                widgetDefault.mobileSortWeight = mobileRankings[i];
                widgetDefault.desktopSortWeight = conduit_utils_1.LexoRankMinChar;
            }
            else {
                widgetDefault.mobileSortWeight = mobileRankings[i];
                widgetDefault.desktopSortWeight = desktopRankings[i - 1];
            }
        }
        const widgetDefaultsById = new Map();
        for (const defaults of widgetDefaults) {
            const idGen = await ctx.generateDeterministicID(trc, ctx.userID, BoardConstants_1.BoardEntityTypes.Widget, en_data_model_1.DefaultDeterministicIdGenerator, en_data_model_1.BoardSchema.formDeterministicBoardIdParts(ctx.userID, boardType, boardInternalID, defaults.widgetType, defaults.internalID));
            widgetDefaultsById.set(idGen[1], {
                defaults,
                idGen,
            });
        }
        const widgetTypeConfigResults = new Map();
        for (const [key, values] of configMap.entries()) {
            widgetTypeConfigResults.set(key, values.map(v => {
                return Object.assign(Object.assign({}, v), { widgetType: key });
            }));
        }
        return {
            widgetDefaultsById,
            lexoRankHandler,
            maxDesktopSortWeight: desktopRankings[desktopRankings.length - 1],
            maxMobileSortWeight: mobileRankings[mobileRankings.length - 1],
            widgetTypeConfig: widgetTypeConfigResults,
        };
    }
    serviceLevelV1Config(userAdjustedServiceLevelV2) {
        if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PREMIUM) {
            return this.premium();
        }
        return this.free();
    }
    serviceLevelV2Config(userAdjustedServiceLevelV2) {
        if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PROFESSIONAL) {
            return this.professional();
        }
        else if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PERSONAL) {
            return this.personal();
        }
        else if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PREMIUM) {
            return this.premium();
        }
        return this.free();
    }
    professional() {
        return new Map([
            // Not on desktop
            [en_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 1
            [en_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2 }]],
            [en_data_model_1.WidgetType.Tasks, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 2
            [en_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Calendar, [{ numericRanking: 4, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Pinned, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 3
            [en_data_model_1.WidgetType.Extra, [...new Array(en_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                    if (idx > 1) { // Most of these start disabled by default
                        return { numericRanking: 6 + idx, isEnabled: false, desktopWidth: 1 };
                    }
                    else if (idx === 1) { // ScratchPad in the second position for the row
                        return { numericRanking: 6 + idx, isEnabled: true, desktopWidth: 1, mutableWidgetType: en_data_model_1.MutableWidgetType.ScratchPad };
                    }
                    // Pinned in first position for the row
                    return { numericRanking: 6 + idx, isEnabled: true, desktopWidth: 1, mutableWidgetType: en_data_model_1.MutableWidgetType.Pinned };
                })],
            [en_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: en_data_model_1.BoardSchema.MaxExtraWidgets + 6, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 4
            [en_data_model_1.WidgetType.Tags, [{ numericRanking: en_data_model_1.BoardSchema.MaxExtraWidgets + 7, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Clipped, [{ numericRanking: en_data_model_1.BoardSchema.MaxExtraWidgets + 8, isEnabled: true, desktopWidth: 2 }]],
            // Desktop Row 5
            [en_data_model_1.WidgetType.Notebooks, [{ numericRanking: en_data_model_1.BoardSchema.MaxExtraWidgets + 9, isEnabled: true, desktopWidth: 2 }]],
            [en_data_model_1.WidgetType.Shortcuts, [{ numericRanking: en_data_model_1.BoardSchema.MaxExtraWidgets + 10, isEnabled: true, desktopWidth: 1 }]],
        ]);
    }
    personal() {
        return new Map([
            // Not on desktop
            [en_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 1
            [en_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2 }]],
            [en_data_model_1.WidgetType.Tasks, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 2
            [en_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Calendar, [{ numericRanking: 4, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Pinned, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 3
            [en_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 6, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Clipped, [{ numericRanking: 7, isEnabled: true, desktopWidth: 2 }]],
            // Desktop Row 4
            [en_data_model_1.WidgetType.Tags, [{ numericRanking: 8, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Notebooks, [{ numericRanking: 9, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 10, isEnabled: true, desktopWidth: 1 }]],
            // Disabled at this tier
            [en_data_model_1.WidgetType.Extra, [...new Array(en_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                    return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1 };
                })],
        ]);
    }
    premium() {
        return new Map([
            // Not on desktop
            [en_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 1
            [en_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2 }]],
            [en_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1 }]],
            // Desktop Row 2
            [en_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 2 }]],
            // Desktop Row 3
            [en_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: true, desktopWidth: 1 }]],
            // In a weird place, as it needs to be auto-added for Beta/Conduit E2Es, but ultimately becomes professional.
            [en_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: !this.useServiceLevelV2Layouts, desktopWidth: 1, serviceLevelV1Upgrade: !this.useServiceLevelV2Layouts }]],
            [en_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: !this.useServiceLevelV2Layouts, desktopWidth: 1, serviceLevelV1Upgrade: !this.useServiceLevelV2Layouts }]],
            // Disabled at this tier.
            [en_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Extra, [...new Array(en_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                    return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1 };
                })],
        ]);
    }
    free() {
        return new Map([
            // Not on desktop
            [en_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1 }]],
            // Desktop row 1
            [en_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 3 }]],
            // Desktop row 2 (pinned disabled for legacy config support)
            [en_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: false, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 2 }]],
            // Disabled at this tier.
            [en_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: false, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: false, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: false, desktopWidth: 1 }]],
            // Service level flag here for compatibility reasons, as these were added shortly before the V2 switch over.
            [en_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: false, desktopWidth: 1, serviceLevelV1Upgrade: !this.useServiceLevelV2Layouts }]],
            [en_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: false, desktopWidth: 1, serviceLevelV1Upgrade: !this.useServiceLevelV2Layouts }]],
            // Added at the time of V2 switch over.
            [en_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1 }]],
            [en_data_model_1.WidgetType.Extra, [...new Array(en_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                    return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1 };
                })],
        ]);
    }
}
exports.WidgetDefaultsFactory = WidgetDefaultsFactory;
//# sourceMappingURL=WidgetDefaultsFactory.js.map