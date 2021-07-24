"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLocale = void 0;
const const_1 = require("./const");
function getUserLocale(user) {
    if (!user || !user.NodeFields || !user.NodeFields.Attributes || !user.NodeFields.Attributes.preferredLanguage) {
        return const_1.DEFAULT_LOCALE;
    }
    else {
        return user.NodeFields.Attributes.preferredLanguage;
    }
}
exports.getUserLocale = getUserLocale;
//# sourceMappingURL=locale.js.map