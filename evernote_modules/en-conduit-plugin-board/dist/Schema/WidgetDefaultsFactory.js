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
exports.WidgetDefaultsFactory = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const Utilities = __importStar(require("../Utilities"));
const professionalZero = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 2
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 4, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 3
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                if (idx > 1) { // Most of these start disabled by default
                    return { numericRanking: 6 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
                }
                else if (idx === 1) { // ScratchPad in the second position for the row
                    return { numericRanking: 6 + idx, isEnabled: true, desktopWidth: 1, mutableWidgetType: en_home_data_model_1.MutableWidgetType.ScratchPad, autoPosition: null };
                }
                // Pinned in first position for the row
                return { numericRanking: 6 + idx, isEnabled: true, desktopWidth: 1, mutableWidgetType: en_home_data_model_1.MutableWidgetType.Pinned, autoPosition: null };
            })],
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: en_home_data_model_1.BoardSchema.MaxExtraWidgets + 6, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 4
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: en_home_data_model_1.BoardSchema.MaxExtraWidgets + 7, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: en_home_data_model_1.BoardSchema.MaxExtraWidgets + 8, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 5
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: en_home_data_model_1.BoardSchema.MaxExtraWidgets + 9, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: en_home_data_model_1.BoardSchema.MaxExtraWidgets + 10, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
    ]);
};
const personalZero = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 2
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 4, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 3
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 6, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: 7, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 4
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: 8, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: 9, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 10, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Disabled at this tier
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
            })],
    ]);
};
const premiumZero = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 2
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 3
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // In a weird place, as it needs to be auto-added for Beta/Conduit E2Es, but ultimately becomes professional.
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: true }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Disabled at this tier.
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
            })],
    ]);
};
const premiumOne = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 2
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        // Desktop Row 3
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // In a weird place, as it needs to be auto-added for Beta/Conduit E2Es, but ultimately becomes professional.
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Disabled at this tier.
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
            })],
    ]);
};
const freeZero = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 3, mutableWidgetType: null, autoPosition: null }]],
        // Desktop row 2 (pinned disabled for legacy config support)
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        // Disabled at this tier.
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
            })],
    ]);
};
const freeOne = () => {
    return new Map([
        // Not on desktop
        [en_home_data_model_1.WidgetType.OnboardingChecklist, [{ numericRanking: 0, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop row 1
        [en_home_data_model_1.WidgetType.Notes, [{ numericRanking: 1, isEnabled: true, desktopWidth: 2, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.ScratchPad, [{ numericRanking: 2, isEnabled: true, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        // Desktop row 2 (pinned disabled for legacy config support)
        [en_home_data_model_1.WidgetType.Pinned, [{ numericRanking: 3, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Clipped, [{ numericRanking: 4, isEnabled: true, desktopWidth: 3, mutableWidgetType: null, autoPosition: null }]],
        // Disabled at this tier.
        [en_home_data_model_1.WidgetType.Notebooks, [{ numericRanking: 5, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tags, [{ numericRanking: 6, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Shortcuts, [{ numericRanking: 7, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Calendar, [{ numericRanking: 8, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Tasks, [{ numericRanking: 9, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.FilteredNotes, [{ numericRanking: 10, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null }]],
        [en_home_data_model_1.WidgetType.Extra, [...new Array(en_home_data_model_1.BoardSchema.MaxExtraWidgets).keys()].map(idx => {
                return { numericRanking: 11 + idx, isEnabled: false, desktopWidth: 1, mutableWidgetType: null, autoPosition: null };
            })],
    ]);
};
const clientLayoutVersionZero = (userAdjustedServiceLevelV2) => {
    if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PREMIUM) {
        return premiumZero();
    }
    return freeZero();
};
const clientLayoutVersionOne = (userAdjustedServiceLevelV2) => {
    if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PROFESSIONAL) {
        return professionalZero();
    }
    else if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PERSONAL) {
        return personalZero();
    }
    else if (userAdjustedServiceLevelV2 >= en_data_model_1.AdjustedServiceLevelV2.PREMIUM) {
        return premiumOne();
    }
    return freeOne();
};
class WidgetDefaultsFactory {
    constructor() {
        this.layoutGenerators = new Map([
            [0, clientLayoutVersionZero],
            [1, clientLayoutVersionOne],
        ]);
    }
    async create(trc, ctx, userAdjustedServiceLevelV2, clientLayoutVersion, boardType, widgetTypes, boardInternalID = 0) {
        var _a, _b;
        const layoutGenerator = (_a = this.layoutGenerators.get(clientLayoutVersion)) !== null && _a !== void 0 ? _a : clientLayoutVersionZero;
        const configMap = layoutGenerator(userAdjustedServiceLevelV2);
        const lexoRankHandler = new conduit_utils_1.LexoRankHandler(50);
        const mobileRankings = lexoRankHandler.distribute(widgetTypes.length);
        const desktopRankings = lexoRankHandler.distribute(widgetTypes.length - 1);
        const widgetCountsByWidgetType = new Map();
        const widgetDefaults = [];
        for (const widgetType of widgetTypes) {
            const internalID = (_b = widgetCountsByWidgetType.get(widgetType)) !== null && _b !== void 0 ? _b : 0;
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
                selectedTab: Utilities.getDefaultSelectedTabByWidgetType(widgetType),
                autoPosition: config.autoPosition,
            };
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
            if (widgetDefault.widgetType === en_home_data_model_1.WidgetType.OnboardingChecklist) {
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
            const idGen = await ctx.generateDeterministicID(trc, ctx.userID, en_data_model_1.EntityTypes.Widget, en_data_model_1.DefaultDeterministicIdGenerator, en_home_data_model_1.BoardSchema.formDeterministicBoardIdParts(ctx.userID, boardType, boardInternalID, defaults.widgetType, defaults.internalID));
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
}
exports.WidgetDefaultsFactory = WidgetDefaultsFactory;
//# sourceMappingURL=WidgetDefaultsFactory.js.map