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

var _utils = require("../utils/utils");

var _dom = require("../utils/dom");

var _breaktoken = _interopRequireDefault(require("./breaktoken"));

var _eventEmitter = _interopRequireDefault(require("event-emitter"));

var _hook = _interopRequireDefault(require("../utils/hook"));

var MAX_CHARS_PER_BREAK = 1500;
/**
 * Layout
 * @class
 */

var Layout = /*#__PURE__*/function () {
  function Layout(element, hooks, options) {
    (0, _classCallCheck2["default"])(this, Layout);
    this.element = element;
    this.bounds = this.element.getBoundingClientRect();

    if (hooks) {
      this.hooks = hooks;
    } else {
      this.hooks = {};
      this.hooks.layout = new _hook["default"]();
      this.hooks.renderNode = new _hook["default"]();
      this.hooks.layoutNode = new _hook["default"]();
      this.hooks.beforeOverflow = new _hook["default"]();
      this.hooks.onOverflow = new _hook["default"]();
      this.hooks.onBreakToken = new _hook["default"]();
      this.hooks.onRenderedLength = new _hook["default"]();
    }

    this.settings = options || {};
    this.maxChars = this.settings.maxChars || MAX_CHARS_PER_BREAK;
    this.forceRenderBreak = false;
  }

  (0, _createClass2["default"])(Layout, [{
    key: "renderTo",
    value: function () {
      var _renderTo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(wrapper, source, breakToken) {
        var bounds,
            start,
            walker,
            node,
            prevNode,
            done,
            next,
            hasRenderedContent,
            newBreakToken,
            length,
            prevBreakToken,
            imgs,
            _imgs,
            shallow,
            rendered,
            addedLength,
            renderedLengthHooks,
            _imgs2,
            currentNoteNode,
            _args = arguments;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                bounds = _args.length > 3 && _args[3] !== undefined ? _args[3] : this.bounds;
                start = this.getStart(source, breakToken);
                walker = (0, _dom.walk)(start, source);
                hasRenderedContent = false;
                length = 0;
                prevBreakToken = breakToken || new _breaktoken["default"](start);

              case 6:
                if (!(!done && !newBreakToken)) {
                  _context.next = 69;
                  break;
                }

                next = walker.next();
                prevNode = node;
                node = next.value;
                done = next.done;

                if (node) {
                  _context.next = 22;
                  break;
                }

                this.hooks && this.hooks.layout.trigger(wrapper, this);
                imgs = wrapper.querySelectorAll("img");

                if (!imgs.length) {
                  _context.next = 17;
                  break;
                }

                _context.next = 17;
                return this.waitForImages(imgs);

              case 17:
                newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken);

                if (!(newBreakToken && newBreakToken.equals(prevBreakToken))) {
                  _context.next = 21;
                  break;
                }

                console.warn("Unable to layout item: ", prevNode);
                return _context.abrupt("return", undefined);

              case 21:
                return _context.abrupt("return", newBreakToken);

              case 22:
                this.hooks && this.hooks.layoutNode.trigger(node); // Check if the rendered element has a break set

                if (!(hasRenderedContent && this.shouldBreak(node))) {
                  _context.next = 36;
                  break;
                }

                this.hooks && this.hooks.layout.trigger(wrapper, this);
                _imgs = wrapper.querySelectorAll("img");

                if (!_imgs.length) {
                  _context.next = 29;
                  break;
                }

                _context.next = 29;
                return this.waitForImages(_imgs);

              case 29:
                newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken);

                if (!newBreakToken) {
                  newBreakToken = this.breakAt(node);
                }

                if (!(newBreakToken && newBreakToken.equals(prevBreakToken))) {
                  _context.next = 34;
                  break;
                }

                console.warn("Unable to layout item: ", node);
                return _context.abrupt("return", undefined);

              case 34:
                length = 0;
                return _context.abrupt("break", 69);

              case 36:
                // Should the Node be a shallow or deep clone
                shallow = (0, _dom.isContainer)(node);
                rendered = this.append(node, wrapper, breakToken, shallow);
                addedLength = rendered.textContent && rendered.textContent.length;
                renderedLengthHooks = this.hooks.onRenderedLength.triggerSync(rendered, node, addedLength, this);
                renderedLengthHooks.forEach(function (newRenderedLength) {
                  if (typeof newRenderedLength != "undefined") {
                    addedLength = newRenderedLength;
                  }
                });
                length += addedLength; // Check if layout has content yet

                if (!hasRenderedContent) {
                  hasRenderedContent = (0, _dom.hasContent)(node);
                } // Skip to the next node if a deep clone was rendered


                if (!shallow) {
                  walker = (0, _dom.walk)((0, _dom.nodeAfter)(node, source), source);
                }

                if (!this.forceRenderBreak) {
                  _context.next = 51;
                  break;
                }

                this.hooks && this.hooks.layout.trigger(wrapper, this);
                newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken);

                if (!newBreakToken) {
                  newBreakToken = this.breakAt(node);
                }

                length = 0;
                this.forceRenderBreak = false;
                return _context.abrupt("break", 69);

              case 51:
                if (!(length >= this.maxChars)) {
                  _context.next = 67;
                  break;
                }

                this.hooks && this.hooks.layout.trigger(wrapper, this);
                _imgs2 = wrapper.querySelectorAll("img");

                if (!_imgs2.length) {
                  _context.next = 57;
                  break;
                }

                _context.next = 57;
                return this.waitForImages(_imgs2);

              case 57:
                newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken);

                if (newBreakToken) {
                  length = 0;
                }

                if (!(newBreakToken && newBreakToken.equals(prevBreakToken))) {
                  _context.next = 67;
                  break;
                }

                console.warn("Unable to layout item: ", node);
                /*
                 * Happens sometimes with HTML Content blocks.
                 * Try to recover by skipping traversal to the next note.
                 */

                currentNoteNode = null;

                if (typeof node.closest !== "undefined") {
                  currentNoteNode = node.closest("div.html-note");
                } else if (node.parentElement) {
                  currentNoteNode = node.parentElement.closest("div.html-note");
                }

                if (!(currentNoteNode && currentNoteNode.nextElementSibling)) {
                  _context.next = 66;
                  break;
                }

                newBreakToken = {
                  node: currentNoteNode.nextElementSibling,
                  offset: 0
                };
                return _context.abrupt("break", 69);

              case 66:
                return _context.abrupt("return", undefined);

              case 67:
                _context.next = 6;
                break;

              case 69:
                return _context.abrupt("return", newBreakToken);

              case 70:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function renderTo(_x, _x2, _x3) {
        return _renderTo.apply(this, arguments);
      }

      return renderTo;
    }()
  }, {
    key: "breakAt",
    value: function breakAt(node) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var newBreakToken = new _breaktoken["default"](node, offset);
      var breakHooks = this.hooks.onBreakToken.triggerSync(newBreakToken, undefined, node, this);
      breakHooks.forEach(function (newToken) {
        if (typeof newToken != "undefined") {
          newBreakToken = newToken;
        }
      });
      return newBreakToken;
    }
  }, {
    key: "shouldBreak",
    value: function shouldBreak(node) {
      var previousSibling = (0, _dom.previousSignificantNode)(node);
      var parentNode = node.parentNode;
      var parentBreakBefore = (0, _dom.needsBreakBefore)(node) && parentNode && !previousSibling && (0, _dom.needsBreakBefore)(parentNode);
      var doubleBreakBefore;

      if (parentBreakBefore) {
        doubleBreakBefore = node.dataset.breakBefore === parentNode.dataset.breakBefore;
      }

      return !doubleBreakBefore && (0, _dom.needsBreakBefore)(node) || (0, _dom.needsPreviousBreakAfter)(node) || (0, _dom.needsPageBreak)(node, previousSibling);
    }
  }, {
    key: "forceBreak",
    value: function forceBreak() {
      this.forceRenderBreak = true;
    }
  }, {
    key: "getStart",
    value: function getStart(source, breakToken) {
      var start;
      var node = breakToken && breakToken.node;

      if (node) {
        start = node;
      } else {
        start = source.firstChild;
      }

      return start;
    }
  }, {
    key: "append",
    value: function () {
      var _append = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(node, dest, breakToken) {
        var shallow,
            rebuild,
            clone,
            parent,
            fragment,
            imgHeight,
            nodeHooks,
            _args2 = arguments;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                shallow = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : true;
                rebuild = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : true;
                clone = (0, _dom.cloneNode)(node, !shallow);

                if (node.parentNode && (0, _dom.isElement)(node.parentNode)) {
                  parent = (0, _dom.findElement)(node.parentNode, dest); // Rebuild chain

                  if (parent) {
                    parent.appendChild(clone);
                  } else if (rebuild) {
                    fragment = (0, _dom.rebuildAncestors)(node);
                    parent = (0, _dom.findElement)(node.parentNode, fragment);

                    if (!parent) {
                      dest.appendChild(clone);
                    } else if (breakToken && (0, _dom.isText)(breakToken.node) && breakToken.offset > 0) {
                      clone.textContent = clone.textContent.substring(breakToken.offset);
                      parent.appendChild(clone);
                    } else {
                      parent.appendChild(clone);
                    }

                    dest.appendChild(fragment);
                  } else {
                    dest.appendChild(clone);
                  }
                } else {
                  dest.appendChild(clone);
                }

                if (!(clone.tagName === "IMG")) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 7;
                return this.waitForImages(clone);

              case 7:
                imgHeight = clone.height;
                clone.style.maxHeight = "".concat(imgHeight, "px");

              case 9:
                nodeHooks = this.hooks.renderNode.triggerSync(clone, node, this);
                nodeHooks.forEach(function (newNode) {
                  if (typeof newNode != "undefined") {
                    clone = newNode;
                  }
                });
                return _context2.abrupt("return", clone);

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function append(_x4, _x5, _x6) {
        return _append.apply(this, arguments);
      }

      return append;
    }()
  }, {
    key: "waitForImages",
    value: function () {
      var _waitForImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(imgs) {
        var _this = this;

        var results;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                results = Array.from(imgs).map( /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(img) {
                    return _regenerator["default"].wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            return _context3.abrupt("return", _this.awaitImageLoaded(img));

                          case 1:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3);
                  }));

                  return function (_x8) {
                    return _ref.apply(this, arguments);
                  };
                }());
                _context4.next = 3;
                return Promise.all(results);

              case 3:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function waitForImages(_x7) {
        return _waitForImages.apply(this, arguments);
      }

      return waitForImages;
    }()
  }, {
    key: "awaitImageLoaded",
    value: function () {
      var _awaitImageLoaded = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(image) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", new Promise(function (resolve) {
                  if (!image.src) {
                    console.warn('There is no src in img!');
                  }

                  if (image.src && image.complete !== true) {
                    image.onload = function () {
                      var _window$getComputedSt = window.getComputedStyle(image),
                          width = _window$getComputedSt.width,
                          height = _window$getComputedSt.height;

                      resolve(width, height);
                    };

                    image.onerror = function (e) {
                      var _window$getComputedSt2 = window.getComputedStyle(image),
                          width = _window$getComputedSt2.width,
                          height = _window$getComputedSt2.height;

                      resolve(width, height, e);
                    };
                  } else {
                    var _window$getComputedSt3 = window.getComputedStyle(image),
                        width = _window$getComputedSt3.width,
                        height = _window$getComputedSt3.height;

                    resolve(width, height);
                  }
                }));

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function awaitImageLoaded(_x9) {
        return _awaitImageLoaded.apply(this, arguments);
      }

      return awaitImageLoaded;
    }()
  }, {
    key: "avoidBreakInside",
    value: function avoidBreakInside(node, limiter) {
      var breakNode;

      if (node === limiter) {
        return;
      }

      while (node.parentNode) {
        node = node.parentNode;

        if (node === limiter) {
          break;
        }

        if (window.getComputedStyle(node)["break-inside"] === "avoid") {
          breakNode = node;
          break;
        }
      }

      return breakNode;
    }
  }, {
    key: "createBreakToken",
    value: function createBreakToken(overflow, rendered, source) {
      var container = overflow.startContainer;
      var offset = overflow.startOffset;
      var node, renderedNode, parent, index, temp;

      if ((0, _dom.isElement)(container)) {
        temp = (0, _dom.child)(container, offset);

        if ((0, _dom.isElement)(temp)) {
          renderedNode = (0, _dom.findElement)(temp, rendered);

          if (!renderedNode) {
            // Find closest element with data-ref
            var prevNode = (0, _dom.prevValidNode)(temp);

            if (!(0, _dom.isElement)(prevNode)) {
              prevNode = prevNode.parentElement;
            }

            renderedNode = (0, _dom.findElement)(prevNode, rendered); // Check if temp is the last rendered node at its level.

            if (!temp.nextSibling) {
              // We need to ensure that the previous sibling of temp is fully rendered.
              var renderedNodeFromSource = (0, _dom.findElement)(renderedNode, source);
              var walker = document.createTreeWalker(renderedNodeFromSource, NodeFilter.SHOW_ELEMENT);
              var lastChildOfRenderedNodeFromSource = walker.lastChild();
              var lastChildOfRenderedNodeMatchingFromRendered = (0, _dom.findElement)(lastChildOfRenderedNodeFromSource, rendered); // Check if we found that the last child in source

              if (!lastChildOfRenderedNodeMatchingFromRendered) {
                // Pending content to be rendered before virtual break token
                return;
              } // Otherwise we will return a break token as per below

            } // renderedNode is actually the last unbroken box that does not overflow.
            // Break Token is therefore the next sibling of renderedNode within source node.


            node = (0, _dom.findElement)(renderedNode, source).nextSibling;
            offset = 0;
          } else {
            node = (0, _dom.findElement)(renderedNode, source);
            offset = 0;
          }
        } else {
          renderedNode = (0, _dom.findElement)(container, rendered);

          if (!renderedNode) {
            renderedNode = (0, _dom.findElement)((0, _dom.prevValidNode)(container), rendered);
          }

          parent = (0, _dom.findElement)(renderedNode, source);
          index = (0, _dom.indexOfTextNode)(temp, parent); // No seperatation for the first textNode of an element

          if (index === 0) {
            node = parent;
            offset = 0;
          } else {
            node = (0, _dom.child)(parent, index);
            offset = 0;
          }
        }
      } else {
        renderedNode = (0, _dom.findElement)(container.parentNode, rendered);

        if (!renderedNode) {
          renderedNode = (0, _dom.findElement)((0, _dom.prevValidNode)(container.parentNode), rendered);
        }

        parent = (0, _dom.findElement)(renderedNode, source);
        index = (0, _dom.indexOfTextNode)(container, parent);

        if (index === -1) {
          return;
        }

        node = (0, _dom.child)(parent, index);
        offset += node.textContent.indexOf(container.textContent);
      }

      if (!node) {
        return;
      }

      return new _breaktoken["default"](node, offset);
    }
  }, {
    key: "findBreakToken",
    value: function findBreakToken(rendered, source) {
      var bounds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bounds;
      var prevBreakToken = arguments.length > 3 ? arguments[3] : undefined;
      var extract = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var overflow = this.findOverflow(rendered, bounds, prevBreakToken);
      var breakToken, breakLetter;
      var overflowHooks = this.hooks.onOverflow.triggerSync(overflow, rendered, bounds, this);
      overflowHooks.forEach(function (newOverflow) {
        if (typeof newOverflow != "undefined") {
          overflow = newOverflow;
        }
      });

      if (overflow) {
        breakToken = this.createBreakToken(overflow, rendered, source); // breakToken is nullable

        var breakHooks = this.hooks.onBreakToken.triggerSync(breakToken, overflow, rendered, this);
        breakHooks.forEach(function (newToken) {
          if (typeof newToken != "undefined") {
            breakToken = newToken;
          }
        }); // Stop removal if we are in a loop

        if (breakToken && breakToken.equals(prevBreakToken)) {
          return breakToken;
        }

        if (breakToken && breakToken["node"] && breakToken["offset"] && breakToken["node"].textContent) {
          breakLetter = breakToken["node"].textContent.charAt(breakToken["offset"]);
        } else {
          breakLetter = undefined;
        }

        if (breakToken && breakToken.node && extract) {
          this.removeOverflow(overflow, breakLetter);
        }
      }

      return breakToken;
    }
  }, {
    key: "hasOverflow",
    value: function hasOverflow(element) {
      var bounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bounds;
      var constrainingElement = element && element.parentNode; // this gets the element, instead of the wrapper for the width workaround

      var _element$getBoundingC = element.getBoundingClientRect(),
          width = _element$getBoundingC.width;

      var scrollWidth = constrainingElement ? constrainingElement.scrollWidth : 0;
      return Math.max(Math.floor(width), scrollWidth) > Math.round(bounds.width);
    }
  }, {
    key: "findOverflow",
    value: function findOverflow(rendered) {
      var bounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bounds;
      var prevBreakToken = arguments.length > 2 ? arguments[2] : undefined;
      if (!this.hasOverflow(rendered, bounds)) return;
      var start = Math.round(bounds.left);
      var end = Math.round(bounds.right);
      var range;
      var walker = (0, _dom.walk)(rendered.firstChild, rendered); // Find Start

      var next, done, node, offset, skip, breakAvoid, prev, br;

      while (!done) {
        next = walker.next();
        done = next.done;
        node = next.value;
        skip = false;
        breakAvoid = false;
        prev = undefined;
        br = undefined;

        if (node) {
          var pos = (0, _utils.getBoundingClientRect)(node);
          var left = Math.round(pos.left);
          var right = Math.floor(pos.right);

          if (!range && left >= end) {
            if (node.tagName === "IMG") {
              var dataRef = node.attributes && node.attributes["data-ref"].value;
              var prevTokenDataRef = (0, _dom.extractDataRef)(prevBreakToken.node);

              if (dataRef === prevTokenDataRef) {
                continue;
              }
            }

            if ((0, _dom.areElementsInSameTableRow)(node, prevBreakToken.node, rendered) && (0, _dom.isAvoidingBreakInsideRow)(node, rendered)) {
              continue;
            } // Check if it is a float


            var isFloat = false; // Check if the node is inside a break-inside: avoid table cell

            var insideTableCell = (0, _dom.parentOf)(node, "TD", rendered);

            if (insideTableCell && window.getComputedStyle(insideTableCell)["break-inside"] === "avoid") {
              // breaking inside a table cell produces unexpected result, as a workaround, we forcibly avoid break inside in a cell.
              prev = insideTableCell;
            } else if (insideTableCell) {
              prev = (0, _dom.parentOf)(insideTableCell, "TR", rendered);
            } else if ((0, _dom.isElement)(node)) {
              var styles = window.getComputedStyle(node);
              isFloat = styles.getPropertyValue("float") !== "none";
              skip = styles.getPropertyValue("break-inside") === "avoid";
              breakAvoid = node.dataset.breakBefore === "avoid" || node.dataset.previousBreakAfter === "avoid";
              prev = breakAvoid && (0, _dom.nodeBefore)(node, rendered);
              br = node.tagName === "BR" || node.tagName === "WBR";
            }

            if (prev) {
              range = document.createRange();
              range.selectNode(prev);
              break;
            }

            if (!br && !isFloat && (0, _dom.isElement)(node)) {
              range = document.createRange();
              range.selectNode(node);
              break;
            }

            if ((0, _dom.isText)(node) && node.textContent.trim().length) {
              range = document.createRange();
              range.selectNode(node);
              break;
            }
          }

          if (!range && (0, _dom.isText)(node) && node.textContent.trim().length && !(0, _dom.breakInsideAvoidParentNode)(node.parentNode)) {
            if ((0, _dom.areElementsInSameTableRow)(node, prevBreakToken.node, rendered) && (0, _dom.isAvoidingBreakInsideRow)(node, rendered)) {
              continue;
            }

            var rects = (0, _utils.getClientRects)(node);
            var rect = void 0;
            left = 0;

            for (var i = 0; i != rects.length; i++) {
              rect = rects[i];

              if (rect.width > 0 && (!left || rect.left > left)) {
                left = rect.left;
              }
            }

            if (left >= end) {
              range = document.createRange();
              offset = this.textBreak(node, start, end);

              if (!offset) {
                range = undefined;
              } else {
                range.setStart(node, offset);
              }

              break;
            }
          } // Skip children


          if (skip || right <= end) {
            next = (0, _dom.nodeAfter)(node, rendered);

            if (next) {
              walker = (0, _dom.walk)(next, rendered);
            }
          }
        }
      } // Find End


      if (range) {
        range.setEndAfter(rendered.lastChild);
        return range;
      }
    }
  }, {
    key: "findEndToken",
    value: function findEndToken(rendered, source) {
      var bounds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bounds;

      if (rendered.childNodes.length === 0) {
        return;
      }

      var lastChild = rendered.lastChild;
      var lastNodeIndex;

      while (lastChild && lastChild.lastChild) {
        if (!(0, _dom.validNode)(lastChild)) {
          // Only get elements with refs
          lastChild = lastChild.previousSibling;
        } else if (!(0, _dom.validNode)(lastChild.lastChild)) {
          // Deal with invalid dom items
          lastChild = (0, _dom.prevValidNode)(lastChild.lastChild);
          break;
        } else {
          lastChild = lastChild.lastChild;
        }
      }

      if ((0, _dom.isText)(lastChild)) {
        if (lastChild.parentNode.dataset.ref) {
          lastNodeIndex = (0, _dom.indexOf)(lastChild);
          lastChild = lastChild.parentNode;
        } else {
          lastChild = lastChild.previousSibling;
        }
      }

      var original = (0, _dom.findElement)(lastChild, source);

      if (lastNodeIndex) {
        original = original.childNodes[lastNodeIndex];
      }

      var after = (0, _dom.nodeAfter)(original);
      return this.breakAt(after);
    }
  }, {
    key: "textBreak",
    value: function textBreak(node, start, end) {
      var wordwalker = (0, _dom.words)(node);
      var left = 0;
      var right = 0;
      var word, next, done, pos;
      var offset;

      while (!done) {
        next = wordwalker.next();
        word = next.value;
        done = next.done;

        if (!word) {
          break;
        }

        pos = (0, _utils.getBoundingClientRect)(word);
        left = Math.floor(pos.left);
        right = Math.floor(pos.right);

        if (left >= end) {
          offset = word.startOffset;
          break;
        }

        if (right > end) {
          var letterwalker = (0, _dom.letters)(word);
          var letter = void 0,
              nextLetter = void 0,
              doneLetter = void 0;

          while (!doneLetter) {
            nextLetter = letterwalker.next();
            letter = nextLetter.value;
            doneLetter = nextLetter.done;

            if (!letter) {
              break;
            }

            pos = (0, _utils.getBoundingClientRect)(letter);
            left = Math.floor(pos.left);

            if (left >= end) {
              offset = letter.startOffset;
              done = true;
              break;
            }
          }
        }
      }

      return offset;
    }
  }, {
    key: "removeOverflow",
    value: function removeOverflow(overflow, breakLetter) {
      var startContainer = overflow.startContainer;
      var extracted = overflow.extractContents();
      this.hyphenateAtBreak(startContainer, breakLetter);
      return extracted;
    }
  }, {
    key: "hyphenateAtBreak",
    value: function hyphenateAtBreak(startContainer, breakLetter) {
      if ((0, _dom.isText)(startContainer)) {
        var startText = startContainer.textContent;
        var prevLetter = startText[startText.length - 1]; // Add a hyphen if previous character is a letter or soft hyphen

        if (breakLetter && /^\w|\u00AD$/.test(prevLetter) && /^\w|\u00AD$/.test(breakLetter) || !breakLetter && /^\w|\u00AD$/.test(prevLetter)) {
          startContainer.parentNode.classList.add("pagedjs_hyphen");
          startContainer.textContent += this.settings.hyphenGlyph || "\u2011";
        }
      }
    }
  }, {
    key: "equalTokens",
    value: function equalTokens(a, b) {
      if (!a || !b) {
        return false;
      }

      if (a["node"] && b["node"] && a["node"] !== b["node"]) {
        return false;
      }

      if (a["offset"] && b["offset"] && a["offset"] !== b["offset"]) {
        return false;
      }

      return true;
    }
  }]);
  return Layout;
}();

(0, _eventEmitter["default"])(Layout.prototype);
var _default = Layout;
exports["default"] = _default;