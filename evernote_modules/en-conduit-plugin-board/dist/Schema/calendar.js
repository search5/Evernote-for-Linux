"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarFeatureVersionOne = void 0;
const BoardConstants_1 = require("../BoardConstants");
exports.calendarFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [{ widgetType: BoardConstants_1.WidgetType.Calendar, isPremiumWidget: true }];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=calendar.js.map