"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotebookEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.NotebookEntitySchema = {
    fields: {
        inWorkspace: 'boolean',
        isDefault: 'boolean',
        lastUpdated: 'timestamp',
        published: 'boolean',
        stack: en_ts_utils_1.NullableString,
    },
};
//# sourceMappingURL=NotebookEntity.js.map