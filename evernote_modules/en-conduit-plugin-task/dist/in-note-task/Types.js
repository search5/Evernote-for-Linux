"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonStatus = void 0;
var ComparisonStatus;
(function (ComparisonStatus) {
    ComparisonStatus[ComparisonStatus["added"] = 0] = "added";
    ComparisonStatus[ComparisonStatus["deleted"] = 1] = "deleted";
    ComparisonStatus[ComparisonStatus["modified"] = 2] = "modified";
    ComparisonStatus[ComparisonStatus["same"] = 3] = "same";
    ComparisonStatus[ComparisonStatus["notInGraphDb"] = 4] = "notInGraphDb";
})(ComparisonStatus = exports.ComparisonStatus || (exports.ComparisonStatus = {}));
//# sourceMappingURL=Types.js.map