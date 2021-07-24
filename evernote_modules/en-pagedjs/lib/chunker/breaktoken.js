"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Layout
 * @class
 */
var BreakToken = /*#__PURE__*/function () {
  function BreakToken(node, offset) {
    (0, _classCallCheck2["default"])(this, BreakToken);
    this.node = node;
    this.offset = offset;
  }

  (0, _createClass2["default"])(BreakToken, [{
    key: "equals",
    value: function equals(otherBreakToken) {
      if (!otherBreakToken) {
        return false;
      }

      if (this["node"] && otherBreakToken["node"] && this["node"] !== otherBreakToken["node"]) {
        return false;
      }

      if (this["offset"] && otherBreakToken["offset"] && this["offset"] !== otherBreakToken["offset"]) {
        return false;
      }

      return true;
    }
  }]);
  return BreakToken;
}();

var _default = BreakToken;
exports["default"] = _default;