"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuerySortParamConfig = exports.isQueryRangeParamConfig = exports.isQueryMatchParamConfig = void 0;
function isQueryMatchParamConfig(config) {
    return config.hasOwnProperty('match');
}
exports.isQueryMatchParamConfig = isQueryMatchParamConfig;
function isQueryRangeParamConfig(config) {
    return config.hasOwnProperty('range');
}
exports.isQueryRangeParamConfig = isQueryRangeParamConfig;
function isQuerySortParamConfig(config) {
    return config.hasOwnProperty('sort');
}
exports.isQuerySortParamConfig = isQuerySortParamConfig;
//# sourceMappingURL=QueryDefs.js.map