"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutEntitySchema = void 0;
exports.ShortcutEntitySchema = {
    fields: {
        sortOrder: 'string',
        source: 'EntityRef',
    },
    embeddedAssociations: {
        source: {
            targetIsSrc: true,
            targetType: null,
            isNsyncParent: false,
        },
    },
};
//# sourceMappingURL=ShortcutEntity.js.map