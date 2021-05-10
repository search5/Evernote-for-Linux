"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filteredNotesFeatureVersionOne = void 0;
const en_home_data_model_1 = require("en-home-data-model");
exports.filteredNotesFeatureVersionOne = {
    widgetTypeGenerator: () => {
        return [en_home_data_model_1.WidgetType.FilteredNotes];
    },
    schemeUpgradeConverter: async () => {
        return {};
    },
};
//# sourceMappingURL=filteredNotes.js.map