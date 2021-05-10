"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteContentInfoEntitySchema = void 0;
const en_ts_utils_1 = require("en-ts-utils");
exports.NoteContentInfoEntitySchema = {
    fields: {
        taskGroupNoteLevelIDs: en_ts_utils_1.NullableListOf('string'),
        sourceOfChange: en_ts_utils_1.NullableString,
    },
};
//# sourceMappingURL=NoteContentInfoEntity.js.map