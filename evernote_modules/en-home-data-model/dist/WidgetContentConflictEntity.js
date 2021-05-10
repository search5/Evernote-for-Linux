"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetContentConflictEntitySchema = void 0;
const en_data_model_1 = require("en-data-model");
const en_ts_utils_1 = require("en-ts-utils");
exports.WidgetContentConflictEntitySchema = {
    fields: {
        parentID: en_ts_utils_1.NullableID,
        content: en_data_model_1.BlobV2WithContentSchema,
    },
    embeddedAssociations: {
        parentID: {
            targetIsSrc: true,
            targetType: en_data_model_1.EntityTypes.Widget,
            isNsyncParent: true,
        },
    },
};
//# sourceMappingURL=WidgetContentConflictEntity.js.map