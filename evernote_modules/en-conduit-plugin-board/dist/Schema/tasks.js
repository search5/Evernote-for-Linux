"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksFeatureVersionOne = void 0;
const BoardConstants_1 = require("../BoardConstants");
exports.tasksFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [{ widgetType: BoardConstants_1.WidgetType.Tasks, isPremiumWidget: true }];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=tasks.js.map