"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _whitespace = _interopRequireDefault(require("./whitespace"));

var _comments = _interopRequireDefault(require("./comments"));

var _scripts = _interopRequireDefault(require("./scripts"));

var _undisplayed = _interopRequireDefault(require("./undisplayed"));

var _default = [_whitespace["default"], _comments["default"], _scripts["default"], _undisplayed["default"]];
exports["default"] = _default;