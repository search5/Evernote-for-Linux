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

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var Counters = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(Counters, _Handler);

  var _super = _createSuper(Counters);

  function Counters(chunker, polisher, caller) {
    var _this;

    (0, _classCallCheck2["default"])(this, Counters);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.counters = {};
    _this.resetCountersMap = new Map();
    return _this;
  }

  (0, _createClass2["default"])(Counters, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var property = declaration.property;

      if (property === "counter-increment") {
        var inc = this.handleIncrement(declaration, rule);

        if (inc) {
          dList.remove(dItem);
        }
      } else if (property === "counter-reset") {
        var reset = this.handleReset(declaration, rule);

        if (reset) {
          dList.remove(dItem);
        }
      }
    }
  }, {
    key: "onContent",
    value: function onContent(funcNode, fItem, fList, declaration, rule) {
      if (funcNode.name === "counter") {// console.log("counter", funcNode);
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(parsed) {
      this.processCounters(parsed, this.counters);
      this.scopeCounters(this.counters);
    }
  }, {
    key: "addCounter",
    value: function addCounter(name) {
      if (name in this.counters) {
        return this.counters[name];
      }

      this.counters[name] = {
        name: name,
        increments: {},
        resets: {}
      };
      return this.counters[name];
    }
  }, {
    key: "handleIncrement",
    value: function handleIncrement(declaration, rule) {
      var identifier = declaration.value.children.first();
      var number = declaration.value.children.getSize() > 1 ? declaration.value.children.last().value : 1;
      var name = identifier && identifier.name;

      if (name === "page" || name.indexOf("target-counter-") === 0) {
        return;
      }

      var selector = _cssTree["default"].generate(rule.ruleNode.prelude);

      var counter;

      if (!(name in this.counters)) {
        counter = this.addCounter(name);
      } else {
        counter = this.counters[name];
      }

      return counter.increments[selector] = {
        selector: selector,
        number: number
      };
    }
  }, {
    key: "handleReset",
    value: function handleReset(declaration, rule) {
      var identifier = declaration.value.children.first();
      var number = declaration.value.children.getSize() > 1 && declaration.value.children.last().value;
      var name = identifier && identifier.name;

      var selector = _cssTree["default"].generate(rule.ruleNode.prelude);

      var counter;

      if (!(name in this.counters)) {
        counter = this.addCounter(name);
      } else {
        counter = this.counters[name];
      }

      return counter.resets[selector] = {
        selector: selector,
        number: number || 0
      };
    }
  }, {
    key: "processCounters",
    value: function processCounters(parsed, counters) {
      var counter;

      for (var c in counters) {
        counter = this.counters[c];
        this.processCounterIncrements(parsed, counter);
        this.processCounterResets(parsed, counter);

        if (c !== "page") {
          this.addCounterValues(parsed, counter);
        }
      }
    }
  }, {
    key: "scopeCounters",
    value: function scopeCounters(counters) {
      var countersArray = [];

      for (var c in counters) {
        if (c !== "page") {
          countersArray.push("".concat(counters[c].name, " 0"));
        }
      } // Add to pages to allow cross page scope


      this.insertRule(".pagedjs_pages { counter-reset: ".concat(countersArray.join(" "), " page 0 pages var(--pagedjs-page-count)}"));
    }
  }, {
    key: "insertRule",
    value: function insertRule(rule) {
      this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
    }
  }, {
    key: "processCounterIncrements",
    value: function processCounterIncrements(parsed, counter) {
      var increment;

      for (var inc in counter.increments) {
        increment = counter.increments[inc]; // Find elements for increments

        var incrementElements = parsed.querySelectorAll(increment.selector); // Add counter data

        for (var i = 0; i < incrementElements.length; i++) {
          incrementElements[i].setAttribute("data-counter-" + counter.name + "-increment", increment.number);
          incrementElements[i].setAttribute("data-counter-increment", counter.name);
        }
      }
    }
  }, {
    key: "processCounterResets",
    value: function processCounterResets(parsed, counter) {
      var reset;

      for (var r in counter.resets) {
        reset = counter.resets[r]; // Find elements for resets

        var resetElements = parsed.querySelectorAll(reset.selector); // Add counter data

        for (var i = 0; i < resetElements.length; i++) {
          resetElements[i].setAttribute("data-counter-" + counter.name + "-reset", reset.number);
          resetElements[i].setAttribute("data-counter-reset", counter.name);
        }
      }
    }
  }, {
    key: "addCounterValues",
    value: function addCounterValues(parsed, counter) {
      var counterName = counter.name;
      var elements = parsed.querySelectorAll("[data-counter-" + counterName + "-reset], [data-counter-" + counterName + "-increment]");
      var count = 0;
      var element;
      var increment, reset;
      var resetValue, incrementValue, resetDelta;
      var incrementArray;

      for (var i = 0; i < elements.length; i++) {
        element = elements[i];
        resetDelta = 0;
        incrementArray = [];

        if (element.hasAttribute("data-counter-" + counterName + "-reset")) {
          reset = element.getAttribute("data-counter-" + counterName + "-reset");
          resetValue = parseInt(reset); // Use negative increment value inplace of reset

          resetDelta = resetValue - count;
          incrementArray.push("".concat(counterName, " ").concat(resetDelta));
          count = resetValue;
        }

        if (element.hasAttribute("data-counter-" + counterName + "-increment")) {
          increment = element.getAttribute("data-counter-" + counterName + "-increment");
          incrementValue = parseInt(increment);
          count += incrementValue;
          element.setAttribute("data-counter-" + counterName + "-value", count);
          incrementArray.push("".concat(counterName, " ").concat(incrementValue));
        }

        if (incrementArray.length > 0) {
          this.incrementCounterForElement(element, incrementArray);
        }
      }
    }
  }, {
    key: "incrementCounterForElement",
    value: function incrementCounterForElement(element, incrementArray) {
      if (!element || !incrementArray || incrementArray.length === 0) return;
      var ref = element.dataset.ref;
      var prevIncrements = Array.from(this.styleSheet.cssRules).filter(function (rule) {
        return rule.selectorText === "[data-ref=\"".concat(element.dataset.ref, "\"]:not([data-split-from])") && rule.style[0] === "counter-increment";
      });
      var increments = [];

      var _iterator = _createForOfIteratorHelper(prevIncrements),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var styleRule = _step.value;
          var values = styleRule.style.counterIncrement.split(" ");

          for (var i = 0; i < values.length; i += 2) {
            increments.push(values[i] + " " + values[i + 1]);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      Array.prototype.push.apply(increments, incrementArray);
      this.insertRule("[data-ref=\"".concat(ref, "\"]:not([data-split-from]) { counter-increment: ").concat(increments.join(" "), " }"));
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(pageElement, page) {
      var _this2 = this;

      var pgreset = pageElement.querySelectorAll("[data-counter-page-reset]");
      pgreset.forEach(function (reset) {
        var ref = reset.dataset && reset.dataset.ref;

        if (ref && _this2.resetCountersMap.has(ref)) {// ignoring, the counter-reset directive has already been taken into account.
        } else {
          if (ref) {
            _this2.resetCountersMap.set(ref, "");
          }

          var value = reset.dataset.counterPageReset;

          _this2.styleSheet.insertRule("[data-page-number=\"".concat(pageElement.dataset.pageNumber, "\"] { counter-increment: none; counter-reset: page ").concat(value, "; }"), _this2.styleSheet.cssRules.length);
        }
      });
    }
  }]);
  return Counters;
}(_handler["default"]);

var _default = Counters;
exports["default"] = _default;