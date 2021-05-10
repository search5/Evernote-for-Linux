"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.WorkspaceEntitySchema = {
    fields: {
        inWorkspace: 'boolean',
        isDefault: 'boolean',
        lastUpdated: 'timestamp',
        published: 'boolean',
        stack: en_ts_utils_1.NullableString,
    },
};
//# sourceMappingURL=WorkspaceEntity.js.map