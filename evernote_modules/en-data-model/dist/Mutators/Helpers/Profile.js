"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountProfileRef = void 0;
const conduit_core_1 = require("conduit-core");
const EntityConstants_1 = require("../../EntityConstants");
async function getAccountProfileRef(trc, ctx) {
    var _a;
    const nodes = await ctx.traverseGraph(trc, { type: EntityConstants_1.CoreEntityTypes.User, id: conduit_core_1.PERSONAL_USER_ID }, [{
            edge: ['outputs', 'profile'],
            type: EntityConstants_1.CoreEntityTypes.Profile,
        }]);
    return (_a = nodes[0]) !== null && _a !== void 0 ? _a : null;
}
exports.getAccountProfileRef = getAccountProfileRef;
//# sourceMappingURL=Profile.js.map