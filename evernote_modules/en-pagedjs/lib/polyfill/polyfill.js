"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _previewer = _interopRequireDefault(require("./previewer"));

var Paged = _interopRequireWildcard(require("../index"));

window.Paged = Paged;
var ready = new Promise(function (resolve, reject) {
  if (document.readyState === "interactive" || document.readyState === "complete") {
    resolve(document.readyState);
    return;
  }

  document.onreadystatechange = function ($) {
    if (document.readyState === "interactive") {
      resolve(document.readyState);
    }
  };
});
var config = window.PagedConfig || {
  auto: true,
  before: undefined,
  after: undefined,
  content: undefined,
  stylesheets: undefined,
  renderTo: undefined,
  settings: undefined
};
var previewer = new _previewer["default"](config.settings);
ready.then( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
  var done;
  return _regenerator["default"].wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!config.before) {
            _context.next = 3;
            break;
          }

          _context.next = 3;
          return config.before();

        case 3:
          if (!(config.auto !== false)) {
            _context.next = 7;
            break;
          }

          _context.next = 6;
          return previewer.preview(config.content, config.stylesheets, config.renderTo);

        case 6:
          done = _context.sent;

        case 7:
          if (!config.after) {
            _context.next = 10;
            break;
          }

          _context.next = 10;
          return config.after(done);

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, _callee);
})));
var _default = previewer;
exports["default"] = _default;