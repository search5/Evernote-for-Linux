"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeEntitySchemas = exports.BoardSchema = void 0;
const en_data_model_1 = require("en-data-model");
const BoardEntity_1 = require("./BoardEntity");
const WidgetContentConflictEntity_1 = require("./WidgetContentConflictEntity");
const WidgetEntity_1 = require("./WidgetEntity");
exports.BoardSchema = __importStar(require("./boardSchema"));
__exportStar(require("./BoardEntity"), exports);
__exportStar(require("./BoardTypes"), exports);
__exportStar(require("./WidgetContentConflictEntity"), exports);
__exportStar(require("./WidgetEntity"), exports);
exports.HomeEntitySchemas = {
    [en_data_model_1.EntityTypes.Board]: BoardEntity_1.BoardEntitySchema,
    [en_data_model_1.EntityTypes.Widget]: WidgetEntity_1.WidgetEntitySchema,
    [en_data_model_1.EntityTypes.WidgetContentConflict]: WidgetContentConflictEntity_1.WidgetContentConflictEntitySchema,
};
//# sourceMappingURL=index.js.map