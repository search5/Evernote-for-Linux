"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackIndexConfig = exports.stackTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
/* The following regexes are created using https://mothereff.in/regexpu#input=/%5Cp%7BLetter%7D/u&unicodePropertyEscape=1
 * and use the regexs defined in the thrift calls to transpile to a ES2015 format */
// tslint:disable: max-line-length
const STACK_LABEL_REGEX = /^[!-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}]([ -~\xA0-\u2027\u202A-\u{10FFFF}]{0,98}[!-~\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\u{10FFFF}])?$/u;
exports.stackTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Stack,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {},
    fieldValidation: {
        label: {
            regex: STACK_LABEL_REGEX,
            min: 1,
            max: 100,
        },
    },
    autoDelete: {
        path: ['outputs', 'notebooks'],
        value: 0,
    },
};
exports.stackIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.stackTypeDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.stackTypeDef, ['label']),
    },
    queries: {
        Stacks: {
            sort: [{ field: 'label', order: 'ASC' }],
            params: {},
        },
    },
});
//# sourceMappingURL=Stack.js.map