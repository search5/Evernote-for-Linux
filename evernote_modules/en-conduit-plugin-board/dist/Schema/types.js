"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardCustomizeParams = exports.WidgetCustomizeFieldsInput = exports.WidgetCustomizeAssociationsInput = void 0;
const conduit_utils_1 = require("conduit-utils");
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
//# sourceMappingURL=types.js.map