"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDay = exports.sameDay = exports.getCurrentUserNode = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const getCurrentUserNode = async (context) => {
    conduit_core_1.validateDB(context);
    const userNode = await context.db.getUserNode(context);
    if (!userNode) {
        throw new conduit_utils_1.NotFoundError('Current User');
    }
    return userNode;
};
exports.getCurrentUserNode = getCurrentUserNode;
function sameDay(first, second) {
    return getDay(first).getTime() === getDay(second).getTime();
}
exports.sameDay = sameDay;
function getDay(date) {
    return new Date(date.toISOString().slice(0, 10));
}
exports.getDay = getDay;
//# sourceMappingURL=Utilities.js.map