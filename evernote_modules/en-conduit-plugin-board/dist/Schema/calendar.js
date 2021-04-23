"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarFeatureVersionOne = void 0;
const en_data_model_1 = require("en-data-model");
exports.calendarFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [en_data_model_1.WidgetType.Calendar];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=calendar.js.map