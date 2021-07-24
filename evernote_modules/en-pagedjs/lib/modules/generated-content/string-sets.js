"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _handler = _interopRequireDefault(require("../handler"));

var _cssTree = _interopRequireDefault(require("css-tree"));

var _css = require("../../utils/css");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var StringSets = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(StringSets, _Handler);

  var _super = _createSuper(StringSets);

  function StringSets(chunker, polisher, caller) {
    var _this;

    (0, _classCallCheck2["default"])(this, StringSets);
    _this = _super.call(this, chunker, polisher, caller);
    _this.stringSetSelectors = {};
    _this.type; // pageLastString = last string variable defined on the page 

    _this.pageLastString;
    return _this;
  }

  (0, _createClass2["default"])(StringSets, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      if (declaration.property === "string-set") {
        var selector = _cssTree["default"].generate(rule.ruleNode.prelude);

        var identifier = declaration.value.children.first().name;
        var value;

        _cssTree["default"].walk(declaration, {
          visit: "Function",
          enter: function enter(node, item, list) {
            value = _cssTree["default"].generate(node);
          }
        });

        this.stringSetSelectors[identifier] = {
          identifier: identifier,
          value: value,
          selector: selector
        };
      }
    }
  }, {
    key: "onContent",
    value: function onContent(funcNode, fItem, fList, declaration, rule) {
      if (funcNode.name === "string") {
        var identifier = funcNode.children && funcNode.children.first().name;
        this.type = funcNode.children.last().name;
        funcNode.name = "var";
        funcNode.children = new _cssTree["default"].List();

        if (this.type === "first" || this.type === "last" || this.type === "start" || this.type === "first-except") {
          funcNode.children.append(funcNode.children.createItem({
            type: "Identifier",
            loc: null,
            name: "--pagedjs-string-" + this.type + "-" + identifier
          }));
        } else {
          funcNode.children.append(funcNode.children.createItem({
            type: "Identifier",
            loc: null,
            name: "--pagedjs-string-first-" + identifier
          }));
        }
      }
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(fragment) {
      var _this2 = this;

      if (this.pageLastString === undefined) {
        this.pageLastString = {};
      }

      var _loop = function _loop() {
        var name = _Object$keys[_i];
        var set = _this2.stringSetSelectors[name];
        var selected = fragment.querySelectorAll(set.selector); // Get the last found string for the current identifier

        var stringPrevPage = name in _this2.pageLastString ? _this2.pageLastString[name] : "";
        var varFirst = void 0,
            varLast = void 0,
            varStart = void 0,
            varFirstExcept = void 0;

        if (selected.length == 0) {
          // if there is no sel. on the page
          varFirst = stringPrevPage;
          varLast = stringPrevPage;
          varStart = stringPrevPage;
          varFirstExcept = stringPrevPage;
        } else {
          selected.forEach(function (sel) {
            // push each content into the array to define in the variable the first and the last element of the page.
            _this2.pageLastString[name] = selected[selected.length - 1].textContent;
          });
          /* FIRST */

          varFirst = selected[0].textContent;
          /* LAST */

          varLast = selected[selected.length - 1].textContent;
          /* START */
          // Hack to find if the sel. is the first elem of the page / find a better way 

          var selTop = selected[0].getBoundingClientRect().top;
          var pageContent = selected[0].closest(".pagedjs_page_content");
          var pageContentTop = pageContent.getBoundingClientRect().top;

          if (selTop == pageContentTop) {
            varStart = varFirst;
          } else {
            varStart = stringPrevPage;
          }
          /* FIRST EXCEPT */


          varFirstExcept = "";
        }

        fragment.style.setProperty("--pagedjs-string-first-".concat(name), "\"".concat((0, _css.cleanPseudoContent)(varFirst)));
        fragment.style.setProperty("--pagedjs-string-last-".concat(name), "\"".concat((0, _css.cleanPseudoContent)(varLast)));
        fragment.style.setProperty("--pagedjs-string-start-".concat(name), "\"".concat((0, _css.cleanPseudoContent)(varStart)));
        fragment.style.setProperty("--pagedjs-string-first-except-".concat(name), "\"".concat((0, _css.cleanPseudoContent)(varFirstExcept)));
      };

      for (var _i = 0, _Object$keys = Object.keys(this.stringSetSelectors); _i < _Object$keys.length; _i++) {
        _loop();
      }
    }
  }]);
  return StringSets;
}(_handler["default"]);

var _default = StringSets;
exports["default"] = _default;