"use strict";
/*
* Copyright 2019 Evernote Corporation. All rights reserved.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateConditional = exports.invertConditional = exports.isDirectValueRef = void 0;
const conduit_utils_1 = require("conduit-utils");
function isDirectValueRef(ref) {
    return ref.hasOwnProperty('value');
}
exports.isDirectValueRef = isDirectValueRef;
function invertConditional(conditional) {
    const inverted = Object.assign({}, conditional);
    switch (conditional.directive) {
        case 'EQ':
            inverted.directive = '!EQ';
            break;
        case '!EQ':
            inverted.directive = 'EQ';
            break;
        case 'EXISTS':
            inverted.directive = '!EXISTS';
            break;
        case '!EXISTS':
            inverted.directive = 'EXISTS';
            break;
        case 'INCLUDES':
            inverted.directive = '!INCLUDES';
            break;
        case '!INCLUDES':
            inverted.directive = 'INCLUDES';
            break;
        case 'GT':
            inverted.directive = 'LTE';
            break;
        case 'LT':
            inverted.directive = 'GTE';
            break;
        case 'GTE':
            inverted.directive = 'LT';
            break;
        case 'LTE':
            inverted.directive = 'GT';
            break;
        default:
            throw conduit_utils_1.absurd(conditional.directive, 'unhandled conditional directive');
    }
    return inverted;
}
exports.invertConditional = invertConditional;
function resolveFieldOrValueRef(ref, node) {
    if (isDirectValueRef(ref)) {
        return ref.value;
    }
    return conduit_utils_1.walkObjectPathSupportsNumeric(node, ref.field.split('.'));
}
function evaluateConditionalDirect(directive, val1, val2, locale, config) {
    if (directive === 'INCLUDES' || directive === '!INCLUDES') {
        if (!Array.isArray(val1)) {
            throw new Error(`Type of first value in ConditionalExpr is expected to be an array when using the INCLUDES or !INCLUDES directive`);
        }
        const includes = val1.includes(val2);
        return directive === 'INCLUDES' ? includes : !includes;
    }
    if (directive === 'EXISTS' || directive === '!EXISTS') {
        const existing = (val1 !== null && val1 !== undefined);
        return directive === 'EXISTS' ? existing : !existing;
    }
    if (conduit_utils_1.isValuePrimitiveType(val1) && conduit_utils_1.isValuePrimitiveType(val2)) {
        const comparator = conduit_utils_1.comparatorFactory(config, locale);
        const cmpResult = comparator(val1, val2);
        switch (directive) {
            case 'EQ':
                return cmpResult === 0;
            case '!EQ':
                return cmpResult !== 0;
            case 'GT':
                return cmpResult > 0;
            case 'GTE':
                return cmpResult >= 0;
            case 'LT':
                return cmpResult < 0;
            case 'LTE':
                return cmpResult <= 0;
        }
    }
    throw new Error('Value(s) non-indexable and could not be compared');
}
function evaluateConditional(conditional, node, compareNode, locale) {
    const val1 = resolveFieldOrValueRef(conditional.value1, node);
    const val2 = conditional.value2 !== undefined ? resolveFieldOrValueRef(conditional.value2, compareNode) : undefined;
    return evaluateConditionalDirect(conditional.directive, val1, val2, locale, conditional);
}
exports.evaluateConditional = evaluateConditional;
//# sourceMappingURL=DeclarativeExpr.js.map