"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserNode = void 0;
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
//# sourceMappingURL=Utilities.js.map