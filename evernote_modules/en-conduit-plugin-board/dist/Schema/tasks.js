"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksFeatureVersionOne = void 0;
const en_home_data_model_1 = require("en-home-data-model");
exports.tasksFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [en_home_data_model_1.WidgetType.Tasks];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=tasks.js.map