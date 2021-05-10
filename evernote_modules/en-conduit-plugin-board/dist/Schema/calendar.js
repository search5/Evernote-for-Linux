"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarFeatureVersionOne = void 0;
const en_home_data_model_1 = require("en-home-data-model");
exports.calendarFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [en_home_data_model_1.WidgetType.Calendar];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=calendar.js.map