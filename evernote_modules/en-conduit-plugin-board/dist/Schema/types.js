"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetBiCustomizeFieldsInput = exports.EntryPointType = exports.BoardCustomizeParams = exports.WidgetCustomizeFieldsInput = exports.WidgetCustomizeAssociationsInput = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const BoardMutators_1 = require("../Mutators/BoardMutators");
exports.WidgetCustomizeAssociationsInput = conduit_utils_1.NullableStruct({
    noteToUnpin: conduit_utils_1.NullableID,
    noteToPin: conduit_utils_1.NullableID,
}, 'WidgetCustomizeAssociationsInput');
exports.WidgetCustomizeFieldsInput = conduit_utils_1.NullableStruct({
    label: conduit_utils_1.NullableString,
    isEnabled: conduit_utils_1.NullableBoolean,
    mutableWidgetType: conduit_utils_1.Nullable(en_home_data_model_1.MutableWidgetTypeSchema),
    filteredNotesQuery: conduit_utils_1.NullableStruct({
        query: 'string',
        resultSpec: conduit_utils_1.ExtendStruct(en_home_data_model_1.WidgetSearchResultSpecSchema, {}, 'WidgetSearchResultSpecInput'),
    }, 'FilteredNotesQueryInput'),
    backgroundColor: BoardMutators_1.BoardColorSchemaInput,
    desktop: conduit_utils_1.NullableStruct({
        width: conduit_utils_1.NullableNumber,
        sortWeight: conduit_utils_1.NullableString,
    }),
    mobile: conduit_utils_1.NullableStruct({
        sortWeight: conduit_utils_1.NullableString,
    }),
}, 'WidgetCustomizeFieldsInput');
exports.BoardCustomizeParams = conduit_utils_1.NullableStruct({
    board: 'ID',
    isCustomized: conduit_utils_1.NullableBoolean,
    headerFields: BoardMutators_1.BoardHeaderFieldsSchema,
}, 'BoardCustomizeParams');
var EntryPointType;
(function (EntryPointType) {
    EntryPointType["BannerNewFeature"] = "BANNER_NEW_FEATURE";
    EntryPointType["BannerOther"] = "BANNER_OTHER";
    EntryPointType["Create"] = "CREATE";
    EntryPointType["Customize"] = "CUSTOMIZE";
    EntryPointType["Editor"] = "EDITOR";
    EntryPointType["Search"] = "SEARCH";
    EntryPointType["FeatureTrial"] = "FEATURE_TRIAL";
    EntryPointType["ResetLayout"] = "RESET_LAYOUT";
    EntryPointType["MenuContext"] = "MENU_CONTEXT";
    EntryPointType["MenuEditor"] = "MENU_EDITOR";
    EntryPointType["MenuNav"] = "MENU_NAV";
    EntryPointType["MenuOther"] = "MENU_OTHER";
    EntryPointType["MenuOverflow"] = "MENU_OVERFLOW";
    EntryPointType["ModalHome"] = "MODAL_HOME";
    EntryPointType["ModalOther"] = "MODAL_OTHER";
    EntryPointType["Unknown"] = "UNKNOWN";
})(EntryPointType = exports.EntryPointType || (exports.EntryPointType = {}));
exports.WidgetBiCustomizeFieldsInput = conduit_utils_1.NullableStruct({
    entryPointType: conduit_utils_1.Nullable(conduit_utils_1.Enum(EntryPointType, 'WidgetCustomizeEntryPointTypesInput')),
    relatedEntity: conduit_utils_1.Nullable(conduit_utils_1.Enum(en_data_model_1.EntityTypes, 'WidgetCustomizeEntityTypesInput')),
}, 'WidgetBiCustomizeFieldsInput');
//# sourceMappingURL=types.js.map