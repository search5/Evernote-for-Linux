"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _sheet = _interopRequireDefault(require("./sheet"));

var _base = _interopRequireDefault(require("./base"));

var _hook = _interopRequireDefault(require("../utils/hook"));

var _request = _interopRequireDefault(require("../utils/request"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var Polisher = /*#__PURE__*/function () {
  function Polisher(setup) {
    (0, _classCallCheck2["default"])(this, Polisher);
    this.sheets = [];
    this.inserted = [];
    this.hooks = {};
    this.hooks.onUrl = new _hook["default"](this);
    this.hooks.onAtPage = new _hook["default"](this);
    this.hooks.onAtMedia = new _hook["default"](this);
    this.hooks.onRule = new _hook["default"](this);
    this.hooks.onDeclaration = new _hook["default"](this);
    this.hooks.onContent = new _hook["default"](this);
    this.hooks.onSelector = new _hook["default"](this);
    this.hooks.onPseudoSelector = new _hook["default"](this);
    this.hooks.onImport = new _hook["default"](this);
    this.hooks.beforeTreeParse = new _hook["default"](this);
    this.hooks.beforeTreeWalk = new _hook["default"](this);
    this.hooks.afterTreeWalk = new _hook["default"](this);

    if (setup !== false) {
      this.setup();
    }
  }

  (0, _createClass2["default"])(Polisher, [{
    key: "setup",
    value: function setup() {
      this.base = this.insert(_base["default"]);
      this.styleEl = document.createElement("style");
      document.head.appendChild(this.styleEl);
      this.styleSheet = this.styleEl.sheet;
      return this.styleSheet;
    }
  }, {
    key: "add",
    value: function () {
      var _add = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _arguments = arguments,
            _this = this;

        var fetched,
            urls,
            i,
            f,
            _loop,
            url,
            _args2 = arguments;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                fetched = [];
                urls = [];

                for (i = 0; i < _args2.length; i++) {
                  f = void 0;

                  if ((0, _typeof2["default"])(_args2[i]) === "object") {
                    _loop = function _loop(url) {
                      var obj = _arguments[i];
                      f = new Promise(function (resolve, reject) {
                        urls.push(url);
                        resolve(obj[url]);
                      });
                    };

                    for (url in _args2[i]) {
                      _loop(url);
                    }
                  } else {
                    urls.push(_args2[i]);
                    f = (0, _request["default"])(_args2[i]).then(function (response) {
                      return response.text();
                    });
                  }

                  fetched.push(f);
                }

                _context2.next = 5;
                return Promise.all(fetched).then( /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(originals) {
                    var text, index;
                    return _regenerator["default"].wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            text = "";
                            index = 0;

                          case 2:
                            if (!(index < originals.length)) {
                              _context.next = 10;
                              break;
                            }

                            _context.next = 5;
                            return _this.convertViaSheet(originals[index], urls[index]);

                          case 5:
                            text = _context.sent;

                            _this.insert(text);

                          case 7:
                            index++;
                            _context.next = 2;
                            break;

                          case 10:
                            return _context.abrupt("return", text);

                          case 11:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  }));

                  return function (_x) {
                    return _ref.apply(this, arguments);
                  };
                }());

              case 5:
                return _context2.abrupt("return", _context2.sent);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function add() {
        return _add.apply(this, arguments);
      }

      return add;
    }()
  }, {
    key: "convertViaSheet",
    value: function () {
      var _convertViaSheet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(cssStr, href) {
        var sheet, _iterator, _step, url, str, text;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                sheet = new _sheet["default"](href, this.hooks);
                _context3.next = 3;
                return sheet.parse(cssStr);

              case 3:
                // Insert the imported sheets first
                _iterator = _createForOfIteratorHelper(sheet.imported);
                _context3.prev = 4;

                _iterator.s();

              case 6:
                if ((_step = _iterator.n()).done) {
                  _context3.next = 17;
                  break;
                }

                url = _step.value;
                _context3.next = 10;
                return (0, _request["default"])(url).then(function (response) {
                  return response.text();
                });

              case 10:
                str = _context3.sent;
                _context3.next = 13;
                return this.convertViaSheet(str, url);

              case 13:
                text = _context3.sent;
                this.insert(text);

              case 15:
                _context3.next = 6;
                break;

              case 17:
                _context3.next = 22;
                break;

              case 19:
                _context3.prev = 19;
                _context3.t0 = _context3["catch"](4);

                _iterator.e(_context3.t0);

              case 22:
                _context3.prev = 22;

                _iterator.f();

                return _context3.finish(22);

              case 25:
                this.sheets.push(sheet);

                if (typeof sheet.width !== "undefined") {
                  this.width = sheet.width;
                }

                if (typeof sheet.height !== "undefined") {
                  this.height = sheet.height;
                }

                if (typeof sheet.orientation !== "undefined") {
                  this.orientation = sheet.orientation;
                }

                return _context3.abrupt("return", sheet.toString());

              case 30:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[4, 19, 22, 25]]);
      }));

      function convertViaSheet(_x2, _x3) {
        return _convertViaSheet.apply(this, arguments);
      }

      return convertViaSheet;
    }()
  }, {
    key: "insert",
    value: function insert(text) {
      var head = document.querySelector("head");
      var style = document.createElement("style");
      style.type = "text/css";
      style.setAttribute("data-pagedjs-inserted-styles", "true");
      style.appendChild(document.createTextNode(text));
      head.appendChild(style);
      this.inserted.push(style);
      return style;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.styleEl.remove();
      this.inserted.forEach(function (s) {
        s.remove();
      });
      this.sheets = [];
    }
  }]);
  return Polisher;
}();

var _default = Polisher;
exports["default"] = _default;