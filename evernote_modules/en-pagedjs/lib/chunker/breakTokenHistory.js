"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * BreakTokenHistory
 * @class
 */
var BreakTokenHistory = /*#__PURE__*/function () {
  function BreakTokenHistory() {
    (0, _classCallCheck2["default"])(this, BreakTokenHistory);

    // class should be Singleton
    if (BreakTokenHistory._instance) {
      return BreakTokenHistory._instance;
    }

    BreakTokenHistory._instance = this;
    this._history = [];
  }

  (0, _createClass2["default"])(BreakTokenHistory, [{
    key: "setHistory",
    value: function setHistory(newBreakTokenNodeRef) {
      if (typeof newBreakTokenNodeRef === "string") {
        this._history.push(newBreakTokenNodeRef);
      }
    }
  }, {
    key: "isUniqueBreakToken",
    value: function isUniqueBreakToken(token) {
      return !this._history.includes(token);
    }
  }, {
    key: "history",
    get: function get() {
      return this._history;
    }
  }]);
  return BreakTokenHistory;
}();

var _default = BreakTokenHistory;
exports["default"] = _default;