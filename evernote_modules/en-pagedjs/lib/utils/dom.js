"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isElement = isElement;
exports.isText = isText;
exports.walk = walk;
exports.nodeAfter = nodeAfter;
exports.nodeBefore = nodeBefore;
exports.elementAfter = elementAfter;
exports.elementBefore = elementBefore;
exports.displayedElementAfter = displayedElementAfter;
exports.displayedElementBefore = displayedElementBefore;
exports.stackChildren = stackChildren;
exports.rebuildAncestors = rebuildAncestors;
exports.areElementsInSameTableRow = areElementsInSameTableRow;
exports.isAvoidingBreakInsideRow = isAvoidingBreakInsideRow;
exports.extractDataRef = extractDataRef;
exports.needsBreakBefore = needsBreakBefore;
exports.needsBreakAfter = needsBreakAfter;
exports.needsPreviousBreakAfter = needsPreviousBreakAfter;
exports.needsPageBreak = needsPageBreak;
exports.words = words;
exports.letters = letters;
exports.isContainer = isContainer;
exports.cloneNode = cloneNode;
exports.findElement = findElement;
exports.findRef = findRef;
exports.validNode = validNode;
exports.prevValidNode = prevValidNode;
exports.nextValidNode = nextValidNode;
exports.indexOf = indexOf;
exports.child = child;
exports.isVisible = isVisible;
exports.hasContent = hasContent;
exports.hasTextContent = hasTextContent;
exports.indexOfTextNode = indexOfTextNode;
exports.isIgnorable = isIgnorable;
exports.isAllWhitespace = isAllWhitespace;
exports.previousSignificantNode = previousSignificantNode;
exports.breakInsideAvoidParentNode = breakInsideAvoidParentNode;
exports.parentOf = parentOf;
exports.nextSignificantNode = nextSignificantNode;
exports.getNextSibling = getNextSibling;
exports.filterTree = filterTree;
exports.overflowContentValidation = overflowContentValidation;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _marked = /*#__PURE__*/_regenerator["default"].mark(walk),
    _marked2 = /*#__PURE__*/_regenerator["default"].mark(words),
    _marked3 = /*#__PURE__*/_regenerator["default"].mark(letters);

function isElement(node) {
  return node && node.nodeType === 1;
}

function isText(node) {
  return node && node.nodeType === 3;
}

function walk(start, limiter) {
  var node;
  return _regenerator["default"].wrap(function walk$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          node = start;

        case 1:
          if (!node) {
            _context.next = 27;
            break;
          }

          _context.next = 4;
          return node;

        case 4:
          if (!node.childNodes.length) {
            _context.next = 8;
            break;
          }

          node = node.firstChild;
          _context.next = 25;
          break;

        case 8:
          if (!node.nextSibling) {
            _context.next = 15;
            break;
          }

          if (!(limiter && node === limiter)) {
            _context.next = 12;
            break;
          }

          node = undefined;
          return _context.abrupt("break", 27);

        case 12:
          node = node.nextSibling;
          _context.next = 25;
          break;

        case 15:
          if (!node) {
            _context.next = 25;
            break;
          }

          node = node.parentNode;

          if (!(limiter && node === limiter)) {
            _context.next = 20;
            break;
          }

          node = undefined;
          return _context.abrupt("break", 25);

        case 20:
          if (!(node && node.nextSibling)) {
            _context.next = 23;
            break;
          }

          node = node.nextSibling;
          return _context.abrupt("break", 25);

        case 23:
          _context.next = 15;
          break;

        case 25:
          _context.next = 1;
          break;

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

function nodeAfter(node, limiter) {
  if (limiter && node === limiter) {
    return;
  }

  var significantNode = nextSignificantNode(node);

  if (significantNode) {
    return significantNode;
  }

  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }

      significantNode = nextSignificantNode(node);

      if (significantNode) {
        return significantNode;
      }
    }
  }
}

function nodeBefore(node, limiter) {
  if (limiter && node === limiter) {
    return;
  }

  var significantNode = previousSignificantNode(node);

  if (significantNode) {
    return significantNode;
  }

  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }

      significantNode = previousSignificantNode(node);

      if (significantNode) {
        return significantNode;
      }
    }
  }
}

function elementAfter(node, limiter) {
  var after = nodeAfter(node, limiter);

  while (after && after.nodeType !== 1) {
    after = nodeAfter(after, limiter);
  }

  return after;
}

function elementBefore(node, limiter) {
  var before = nodeBefore(node, limiter);

  while (before && before.nodeType !== 1) {
    before = nodeBefore(before, limiter);
  }

  return before;
}

function displayedElementAfter(node, limiter) {
  var after = elementAfter(node, limiter);

  while (after && after.dataset.undisplayed) {
    after = elementAfter(after);
  }

  return after;
}

function displayedElementBefore(node, limiter) {
  var before = elementBefore(node, limiter);

  while (before && before.dataset.undisplayed) {
    before = elementBefore(before);
  }

  return before;
}

function stackChildren(currentNode, stacked) {
  var stack = stacked || [];
  stack.unshift(currentNode);
  var children = currentNode.children;

  for (var i = 0, length = children.length; i < length; i++) {
    stackChildren(children[i], stack);
  }

  return stack;
}

function rebuildAncestors(node) {
  var parent, ancestor;
  var ancestors = [];
  var added = [];
  var fragment = document.createDocumentFragment(); // Gather all ancestors

  var element = node;

  while (element.parentNode && element.parentNode.nodeType === 1) {
    ancestors.unshift(element.parentNode);
    element = element.parentNode;
  }

  for (var i = 0; i < ancestors.length; i++) {
    ancestor = ancestors[i];
    parent = ancestor.cloneNode(false);
    parent.setAttribute("data-split-from", parent.getAttribute("data-ref")); // ancestor.setAttribute("data-split-to", parent.getAttribute("data-ref"));

    if (parent.hasAttribute("id")) {
      var dataID = parent.getAttribute("id");
      parent.setAttribute("data-id", dataID);
      parent.removeAttribute("id");
    } // This is handled by css :not, but also tidied up here


    if (parent.hasAttribute("data-break-before")) {
      parent.removeAttribute("data-break-before");
    }

    if (parent.hasAttribute("data-previous-break-after")) {
      parent.removeAttribute("data-previous-break-after");
    } // If the current node is a table, its child "colgroup" node should also be repeated


    if (ancestor.tagName === "TABLE") {
      var colgroup = ancestor.getElementsByTagName("colgroup")[0];

      if (colgroup) {
        parent.appendChild(colgroup.cloneNode(true));
      }
    } // If the current node is a list item, restore the rest of its children


    if (ancestor.tagName === "LI") {
      for (var j = 0; j < ancestor.children.length; j++) {
        var _child = ancestor.children[j];

        if (i < ancestors.length - 1 ? _child !== ancestors[i + 1] : _child !== node) {
          parent.appendChild(_child.cloneNode(true));
        }
      }
    }

    if (added.length) {
      var container = added[added.length - 1];
      container.appendChild(parent);
    } else {
      fragment.appendChild(parent);
    }

    added.push(parent);
  }

  added = undefined;
  return fragment;
}

function areElementsInSameTableRow(element1, element2, limiter) {
  var insideCell = parentOf(element1, "TD", limiter);

  if (insideCell) {
    var nodeParent = parentOf(insideCell, "TR", limiter);
    var prevNodeParent = parentOf(element2, "TR", limiter);

    if (nodeParent && prevNodeParent) {
      var parentRef = extractDataRef(nodeParent);
      var prevParentRef = extractDataRef(prevNodeParent);

      if (parentRef && prevParentRef && parentRef === prevParentRef) {
        return true;
      }
    }
  }

  return false;
}

function isAvoidingBreakInsideRow(element, limiter) {
  var insideRow = parentOf(element, "TR", limiter);
  return insideRow && window.getComputedStyle(insideRow)["break-inside"] === "avoid";
}

function extractDataRef(element) {
  return element.attributes && element.attributes["data-ref"] && element.attributes["data-ref"].value;
}
/*
export function split(bound, cutElement, breakAfter) {
		let needsRemoval = [];
		let index = indexOf(cutElement);

		if (!breakAfter && index === 0) {
			return;
		}

		if (breakAfter && index === (cutElement.parentNode.children.length - 1)) {
			return;
		}

		// Create a fragment with rebuilt ancestors
		let fragment = rebuildAncestors(cutElement);

		// Clone cut
		if (!breakAfter) {
			let clone = cutElement.cloneNode(true);
			let ref = cutElement.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(cutElement);
		}

		// Remove all after cut
		let next = nodeAfter(cutElement, bound);
		while (next) {
			let clone = next.cloneNode(true);
			let ref = next.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(next);
			next = nodeAfter(next, bound);
		}

		// Remove originals
		needsRemoval.forEach((node) => {
			if (node) {
				node.remove();
			}
		});

		// Insert after bounds
		bound.parentNode.insertBefore(fragment, bound.nextSibling);
		return [bound, bound.nextSibling];
}
*/


function needsBreakBefore(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.breakBefore !== "undefined" && (node.dataset.breakBefore === "always" || node.dataset.breakBefore === "page" || node.dataset.breakBefore === "left" || node.dataset.breakBefore === "right" || node.dataset.breakBefore === "recto" || node.dataset.breakBefore === "verso")) {
    return true;
  }

  return false;
}

function needsBreakAfter(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.breakAfter !== "undefined" && (node.dataset.breakAfter === "always" || node.dataset.breakAfter === "page" || node.dataset.breakAfter === "left" || node.dataset.breakAfter === "right" || node.dataset.breakAfter === "recto" || node.dataset.breakAfter === "verso")) {
    return true;
  }

  return false;
}

function needsPreviousBreakAfter(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.previousBreakAfter !== "undefined" && (node.dataset.previousBreakAfter === "always" || node.dataset.previousBreakAfter === "page" || node.dataset.previousBreakAfter === "left" || node.dataset.previousBreakAfter === "right" || node.dataset.previousBreakAfter === "recto" || node.dataset.previousBreakAfter === "verso")) {
    return true;
  }

  return false;
}

function needsPageBreak(node, previousSignificantNode) {
  if (typeof node === "undefined" || !previousSignificantNode || isIgnorable(node)) {
    return false;
  }

  if (node.dataset && node.dataset.undisplayed) {
    return false;
  }

  var previousSignificantNodePage = previousSignificantNode.dataset ? previousSignificantNode.dataset.page : undefined;
  var currentNodePage = node.dataset ? node.dataset.page : undefined;
  return currentNodePage !== previousSignificantNodePage;
}

function words(node) {
  var currentText, max, currentOffset, currentLetter, range;
  return _regenerator["default"].wrap(function words$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          currentText = node.nodeValue;
          max = currentText.length;
          currentOffset = 0;

        case 3:
          if (!(currentOffset < max)) {
            _context2.next = 17;
            break;
          }

          currentLetter = currentText[currentOffset];

          if (!/^[\S\u202F\u00A0]$/.test(currentLetter)) {
            _context2.next = 9;
            break;
          }

          if (!range) {
            range = document.createRange();
            range.setStart(node, currentOffset);
          }

          _context2.next = 14;
          break;

        case 9:
          if (!range) {
            _context2.next = 14;
            break;
          }

          range.setEnd(node, currentOffset);
          _context2.next = 13;
          return range;

        case 13:
          range = undefined;

        case 14:
          currentOffset += 1;
          _context2.next = 3;
          break;

        case 17:
          if (!range) {
            _context2.next = 22;
            break;
          }

          range.setEnd(node, currentOffset);
          _context2.next = 21;
          return range;

        case 21:
          range = undefined;

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2);
}

function letters(wordRange) {
  var currentText, max, currentOffset, range;
  return _regenerator["default"].wrap(function letters$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          currentText = wordRange.startContainer;
          max = currentText.length;
          currentOffset = wordRange.startOffset; // let currentLetter;

        case 3:
          if (!(currentOffset < max)) {
            _context3.next = 12;
            break;
          }

          // currentLetter = currentText[currentOffset];
          range = document.createRange();
          range.setStart(currentText, currentOffset);
          range.setEnd(currentText, currentOffset + 1);
          _context3.next = 9;
          return range;

        case 9:
          currentOffset += 1;
          _context3.next = 3;
          break;

        case 12:
        case "end":
          return _context3.stop();
      }
    }
  }, _marked3);
}

function isContainer(node) {
  var container;

  if (typeof node.tagName === "undefined") {
    return true;
  }

  if (node.style && node.style.display === "none") {
    return false;
  }

  switch (node.tagName) {
    // Inline
    case "A":
    case "ABBR":
    case "ACRONYM":
    case "B":
    case "BDO":
    case "BIG":
    case "BR":
    case "BUTTON":
    case "CITE":
    case "CODE":
    case "DFN":
    case "EM":
    case "I":
    case "ICONS":
    case "IMG":
    case "INPUT":
    case "KBD":
    case "LABEL":
    case "MAP":
    case "OBJECT":
    case "Q":
    case "SAMP":
    case "SCRIPT":
    case "SELECT":
    case "SMALL":
    case "SPAN":
    case "STRONG":
    case "SUB":
    case "SUP":
    case "TEXTAREA":
    case "TIME":
    case "TT":
    case "VAR":
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "FIGCAPTION":
    case "BLOCKQUOTE":
    case "PRE":
    case "LI":
    case "TR":
    case "DT":
    case "DD":
    case "VIDEO":
    case "CANVAS":
      container = false;
      break;

    default:
      container = true;
  }

  return container;
}

function cloneNode(n) {
  var deep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return n.cloneNode(deep);
}

function findElement(node, doc) {
  var ref = node.getAttribute("data-ref");
  return findRef(ref, doc);
}

function findRef(ref, doc) {
  return doc.querySelector("[data-ref='".concat(ref, "']"));
}

function validNode(node) {
  if (isText(node)) {
    return true;
  }

  if (isElement(node) && node.dataset.ref) {
    return true;
  }

  return false;
}

function prevValidNode(node) {
  while (!validNode(node)) {
    if (node.previousSibling) {
      node = node.previousSibling;
    } else {
      node = node.parentNode;
    }

    if (!node) {
      break;
    }
  }

  return node;
}

function nextValidNode(node) {
  while (!validNode(node)) {
    if (node.nextSibling) {
      node = node.nextSibling;
    } else {
      node = node.parentNode.nextSibling;
    }

    if (!node) {
      break;
    }
  }

  return node;
}

function indexOf(node) {
  var parent = node.parentNode;

  if (!parent) {
    return 0;
  }

  return Array.prototype.indexOf.call(parent.childNodes, node);
}

function child(node, index) {
  return node.childNodes[index];
}

function isVisible(node) {
  if (isElement(node) && window.getComputedStyle(node).display !== "none") {
    return true;
  } else if (isText(node) && hasTextContent(node) && window.getComputedStyle(node.parentNode).display !== "none") {
    return true;
  }

  return false;
}

function hasContent(node) {
  if (isElement(node)) {
    return true;
  } else if (isText(node) && node.textContent.trim().length) {
    return true;
  }

  return false;
}

function hasTextContent(node) {
  if (isElement(node)) {
    var _child2;

    for (var i = 0; i < node.childNodes.length; i++) {
      _child2 = node.childNodes[i];

      if (_child2 && isText(_child2) && _child2.textContent.trim().length) {
        return true;
      }
    }
  } else if (isText(node) && node.textContent.trim().length) {
    return true;
  }

  return false;
}

function indexOfTextNode(node, parent) {
  if (!isText(node)) {
    return -1;
  }

  var nodeTextContent = node.textContent;
  var child;
  var index = -1;

  for (var i = 0; i < parent.childNodes.length; i++) {
    child = parent.childNodes[i];

    if (child.nodeType === 3) {
      var text = parent.childNodes[i].textContent;

      if (text.includes(nodeTextContent)) {
        index = i;
        break;
      }
    }
  }

  return index;
}
/**
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */

/**
 * Determine if a node should be ignored by the iterator functions.
 * taken from https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#Whitespace_helper_functions
 *
 * @param {Node} node An object implementing the DOM1 |Node| interface.
 * @return {boolean} true if the node is:
 *  1) A |Text| node that is all whitespace
 *  2) A |Comment| node
 *  and otherwise false.
 */


function isIgnorable(node) {
  return node.nodeType === 8 || // A comment node
  node.nodeType === 3 && isAllWhitespace(node); // a text node, all whitespace
}
/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param {Node} node  A node implementing the |CharacterData| interface (i.e., a |Text|, |Comment|, or |CDATASection| node
 * @return {boolean} true if all of the text content of |nod| is whitespace, otherwise false.
 */


function isAllWhitespace(node) {
  return !/[^\t\n\r ]/.test(node.textContent);
}
/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest previous sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */


function previousSignificantNode(sib) {
  while (sib = sib.previousSibling) {
    if (!isIgnorable(sib)) return sib;
  }

  return null;
}

function breakInsideAvoidParentNode(node) {
  while (node = node.parentNode) {
    if (node && node.dataset && node.dataset.breakInside === "avoid") {
      return node;
    }
  }

  return null;
}
/**
 * Find a parent with a given node name.
 * @param {Node} node - initial Node
 * @param {string} nodeName - node name (eg. "TD", "TABLE", "STRONG"...)
 * @param {Node} limiter - go up to the parent until there's no more parent or the current node is equals to the limiter
 * @returns {Node|undefined} - Either:
 *  1) The closest parent for a the given node name, or
 *  2) undefined if no such node exists.
 */


function parentOf(node, nodeName, limiter) {
  if (limiter && node === limiter) {
    return;
  }

  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }

      if (node.nodeName === nodeName) {
        return node;
      }
    }
  }
}
/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest next sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */


function nextSignificantNode(sib) {
  while (sib = sib.nextSibling) {
    if (!isIgnorable(sib)) return sib;
  }

  return null;
}

function getNextSibling(elem, selector) {
  // Get the next sibling element
  var sibling = elem.nextElementSibling; // If there's no selector, return the first sibling

  if (!selector) return sibling; // If the sibling matches our selector, use it
  // If not, jump to the next sibling and continue the loop

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }
}

function filterTree(content, func, what) {
  var treeWalker = document.createTreeWalker(content || this.dom, what || NodeFilter.SHOW_ALL, func ? {
    acceptNode: func
  } : null, false);
  var node;
  var current;
  node = treeWalker.nextNode();

  while (node) {
    current = node;
    node = treeWalker.nextNode();
    current.parentNode.removeChild(current);
  }
} // HTML validation for block positions


function overflowContentValidation(node, contentSizes) {
  if (!node || !node.style || !contentSizes) {
    return null;
  }

  var width = contentSizes.width,
      height = contentSizes.height;
  var safePositionValue = 0;
  var positionLimitsMap = {
    top: height,
    bottom: height,
    left: width,
    right: width
  }; // if clipped note (foreignContentView) have minHeight === "100vh" -> it would overlap the content of the note below (on same page)

  if (node.style.minHeight === "100vh") {
    var parentNode = node.parentElement;

    while (parentNode) {
      if (parentNode.dataset && parentNode.dataset.testid === "foreignContentView") {
        node.style.minHeight = "auto";
        break;
      }

      parentNode = parentNode.parentElement;
    }
  }

  for (var _i = 0, _Object$entries = Object.entries(positionLimitsMap); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        value = _Object$entries$_i[1];

    var position = node.style[key] && Math.abs(Number.parseInt(node.style[key])); //position > value - signal that the element has went out of the page content size

    if (position > value) {
      var dataRef = extractDataRef(node);
      node.style[key] = safePositionValue;
      console.warn("This node has go out of the page content size. (".concat(key, " is ").concat(position, ")"), dataRef);
    }
  }
}