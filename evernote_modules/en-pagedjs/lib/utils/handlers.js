"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerHandlers = registerHandlers;
exports.initializeHandlers = initializeHandlers;
exports.Handlers = exports.registeredHandlers = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _index = _interopRequireDefault(require("../modules/paged-media/index"));

var _index2 = _interopRequireDefault(require("../modules/generated-content/index"));

var _index3 = _interopRequireDefault(require("../modules/filters/index"));

var _eventEmitter = _interopRequireDefault(require("event-emitter"));

var _pipe = _interopRequireDefault(require("event-emitter/pipe"));

var registeredHandlers = [].concat((0, _toConsumableArray2["default"])(_index["default"]), (0, _toConsumableArray2["default"])(_index2["default"]), (0, _toConsumableArray2["default"])(_index3["default"]));
exports.registeredHandlers = registeredHandlers;

var Handlers = function Handlers(chunker, polisher, caller) {
  var _this = this;

  (0, _classCallCheck2["default"])(this, Handlers);
  var handlers = [];
  registeredHandlers.forEach(function (Handler) {
    var handler = new Handler(chunker, polisher, caller);
    handlers.push(handler);
    (0, _pipe["default"])(handler, _this);
  });
};

exports.Handlers = Handlers;
(0, _eventEmitter["default"])(Handlers.prototype);

function registerHandlers() {
  for (var i = 0; i < arguments.length; i++) {
    registeredHandlers.push(arguments[i]);
  }
}

function initializeHandlers(chunker, polisher, caller) {
  var handlers = new Handlers(chunker, polisher, caller);
  return handlers;
}