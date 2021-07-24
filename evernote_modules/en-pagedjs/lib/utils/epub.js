"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _epubjs = _interopRequireDefault(require("epubjs"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// import JSZip from "jszip";
// window.JSZip = JSZip;
var Epub = /*#__PURE__*/function () {
  function Epub(bookData) {// this.epub = ePub({
    //   worker: false,
    //   replacements: true
    // });

    (0, _classCallCheck2["default"])(this, Epub);
  }

  (0, _createClass2["default"])(Epub, [{
    key: "open",
    value: function open(bookData) {
      var _this = this;

      return (0, _epubjs["default"])(bookData, {
        replacements: true
      }).then(function (book) {
        _this.book = book;
        return _this.sections(_this.book.spine);
      });
    }
  }, {
    key: "sections",
    value: function () {
      var _sections = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(spine) {
        var text, pattern, _iterator, _step, section, href, html;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                text = "";
                pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
                _iterator = _createForOfIteratorHelper(spine);
                _context.prev = 3;

                _iterator.s();

              case 5:
                if ((_step = _iterator.n()).done) {
                  _context.next = 14;
                  break;
                }

                section = _step.value;
                href = section.href;
                _context.next = 10;
                return fetch(href).then(function (response) {
                  return response.text();
                }).then(function (t) {
                  var matches = pattern.exec(t);
                  return matches && matches.length && matches[1];
                });

              case 10:
                html = _context.sent;
                text += html; // let body = html.querySelector("body");
                // text += body.innerHTML;

              case 12:
                _context.next = 5;
                break;

              case 14:
                _context.next = 19;
                break;

              case 16:
                _context.prev = 16;
                _context.t0 = _context["catch"](3);

                _iterator.e(_context.t0);

              case 19:
                _context.prev = 19;

                _iterator.f();

                return _context.finish(19);

              case 22:
                return _context.abrupt("return", text);

              case 23:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[3, 16, 19, 22]]);
      }));

      function sections(_x) {
        return _sections.apply(this, arguments);
      }

      return sections;
    }()
  }]);
  return Epub;
}();

var _default = Epub;
exports["default"] = _default;