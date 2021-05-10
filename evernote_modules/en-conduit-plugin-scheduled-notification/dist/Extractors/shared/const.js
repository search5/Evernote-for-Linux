"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRef = exports.DEFAULT_LOCALE = void 0;
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const en_core_entity_types_1 = require("en-core-entity-types");
exports.DEFAULT_LOCALE = 'en';
exports.UserRef = {
    id: conduit_core_1.PERSONAL_USER_ID,
    type: en_core_entity_types_1.CoreEntityTypes.User,
};
//# sourceMappingURL=const.js.map