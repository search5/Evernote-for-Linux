"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientTypeSchema = exports.PaywallStateSchema = void 0;
const conduit_utils_1 = require("conduit-utils");
exports.PaywallStateSchema = conduit_utils_1.Struct({
    state: 'string',
}, 'PaywallState');
exports.ClientTypeSchema = conduit_utils_1.EnumWithKeys({
    ION: 1,
    NEUTRON_IOS: 2,
    NEUTRON_ANDROID: 3,
    BORON_MAC: 4,
    BORON_WIN: 5,
}, 'MonetizationClientType');
//# sourceMappingURL=types.js.map