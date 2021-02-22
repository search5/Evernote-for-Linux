"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardPluginFeatures = exports.getCurrentUserNode = void 0;
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
const getBoardPluginFeatures = (di) => {
    var _a, _b;
    return (_b = (_a = di.featureFlags) === null || _a === void 0 ? void 0 : _a.boardPluginFeatures) !== null && _b !== void 0 ? _b : { schema: {} };
};
exports.getBoardPluginFeatures = getBoardPluginFeatures;
//# sourceMappingURL=Utilities.js.map