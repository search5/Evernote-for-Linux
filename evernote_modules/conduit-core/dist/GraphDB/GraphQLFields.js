"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnboundedQuery = exports.setUnboundedQuery = exports.convertSelectionToPaths = exports.shouldIgnoreFieldSelection = exports.getFieldsForResolver = exports.responsePathToSelectionPath = exports.parseFieldsSelection = exports.fieldsForVars = void 0;
const conduit_utils_1 = require("conduit-utils");
function getSelections(node) {
    return node.selectionSet ? node.selectionSet.selections : [];
}
function extractNamedSelectionFields(node, out, name, isAlias, ignoreFragmentSpreadErrors, vars, typeName) {
    if (!out[name]) {
        out[name] = {};
    }
    if (isAlias) {
        out[name].__isAlias = true;
    }
    if (typeName) {
        out[name].__typeFilter = out[name].__typeFilter || [];
        out[name].__typeFilter.push(typeName);
    }
    extractSelectionFields(node, out[name], ignoreFragmentSpreadErrors, vars);
}
function extractDirectives(selNode) {
    const res = [];
    if (selNode.directives && selNode.directives.length) {
        for (const dirNode of selNode.directives) {
            const type = dirNode.name.value;
            if (type !== 'include' && type !== 'skip') {
                conduit_utils_1.logger.error(`found unknown directive "${type}" in query`);
                continue;
            }
            if (!dirNode.arguments || dirNode.arguments.length !== 1) {
                conduit_utils_1.logger.error(`found directive with the wrong number of arguments, expected exactly 1`);
                continue;
            }
            const arg = dirNode.arguments[0];
            if (arg.name.value !== 'if') {
                conduit_utils_1.logger.error(`found directive without an "if" argument, ignoring`);
                continue;
            }
            if (arg.value.kind !== 'Variable') {
                continue;
            }
            const varName = arg.value.name.value;
            res.push({ type, varName });
        }
    }
    return res;
}
function passesDirectives(selNode, vars) {
    const directives = extractDirectives(selNode);
    for (const d of directives) {
        switch (d.type) {
            case 'include':
                return vars.hasOwnProperty(d.varName);
            case 'skip':
                return !vars.hasOwnProperty(d.varName);
            default:
                throw conduit_utils_1.absurd(d.type, 'unhandled directive type');
        }
    }
    return true;
}
function extractSelectionFields(node, out, ignoreFragmentSpreadErrors, vars, typeName) {
    const selections = getSelections(node);
    for (const selNode of selections) {
        if (!passesDirectives(selNode, vars)) {
            continue;
        }
        if (selNode.kind === 'InlineFragment') {
            extractSelectionFields(selNode, out, ignoreFragmentSpreadErrors, vars, selNode.typeCondition ? selNode.typeCondition.name.value : undefined);
        }
        else if (selNode.kind === 'FragmentSpread') {
            if (!ignoreFragmentSpreadErrors) {
                conduit_utils_1.logger.error('referenced query fragments not supported');
            }
        }
        else {
            extractNamedSelectionFields(selNode, out, selNode.name.value, false, ignoreFragmentSpreadErrors, vars, typeName);
            if (selNode.alias && selNode.alias.value !== selNode.name.value) {
                extractNamedSelectionFields(selNode, out, selNode.alias.value, true, ignoreFragmentSpreadErrors, vars, typeName);
            }
        }
    }
}
function extractAllDirectiveVars(node, out) {
    const selections = getSelections(node);
    for (const selNode of selections) {
        const directives = extractDirectives(selNode);
        for (const d of directives) {
            out[d.varName] = true;
        }
        extractAllDirectiveVars(selNode, out);
    }
}
function fieldsForVars(parsedFields, vars) {
    let idx = 0;
    for (let i = 0; i < parsedFields.vars.length; ++i) {
        const varName = parsedFields.vars[i];
        const varValue = vars.hasOwnProperty(varName) ? vars[varName] : parsedFields.defaultVarValues[varName];
        if (varValue) {
            // eslint-disable-next-line no-bitwise
            idx = idx | (1 << i);
        }
    }
    return parsedFields.selections[idx];
}
exports.fieldsForVars = fieldsForVars;
function getVariableValue(node) {
    switch (node.kind) {
        case 'BooleanValue':
        case 'EnumValue':
        case 'FloatValue':
        case 'IntValue':
        case 'StringValue':
            return node.value;
        case 'ListValue':
            return node.values;
        case 'NullValue':
            return null;
        case 'ObjectValue':
            return {}; // good enough for what we need this for right now
        case 'Variable':
            return node.name; // TODO?
        default:
            throw conduit_utils_1.absurd(node, 'Unhandled ValueNode kind');
    }
}
function parseFieldsSelection(doc, ignoreFragmentSpreadErrors = false) {
    const varsStash = {};
    const defaultVarValues = {};
    for (const node of doc.definitions) {
        extractAllDirectiveVars(node, varsStash);
        if (node.kind === 'OperationDefinition' && node.variableDefinitions) {
            for (const varDef of node.variableDefinitions) {
                if (varDef.defaultValue) {
                    defaultVarValues[varDef.variable.name.value] = getVariableValue(varDef.defaultValue);
                }
            }
        }
    }
    const vars = Object.keys(varsStash).sort();
    const combinations = Math.pow(2, vars.length);
    const selections = [];
    for (let index = 0; index < combinations; ++index) {
        const selectedVars = {};
        for (let i = 0; i < vars.length; ++i) {
            // eslint-disable-next-line no-bitwise
            if (index & (1 << i)) {
                selectedVars[vars[i]] = true;
            }
        }
        const out = {};
        for (const node of doc.definitions) {
            extractSelectionFields(node, out, ignoreFragmentSpreadErrors, selectedVars);
        }
        selections.push(out);
    }
    return {
        vars,
        defaultVarValues,
        selections,
    };
}
exports.parseFieldsSelection = parseFieldsSelection;
function filterByType(fields, type) {
    const filtered = {};
    for (const name in fields) {
        if (name.slice(0, 2) === '__') {
            continue;
        }
        if (!fields[name].__typeFilter) {
            filtered[name] = fields[name];
            continue;
        }
        if (fields[name].__typeFilter.includes(type)) {
            filtered[name] = fields[name];
        }
    }
    return filtered;
}
function responsePathToSelectionPath(queryPath) {
    const path = [];
    while (queryPath) {
        if (typeof queryPath.key === 'string') {
            // ignore numeric array indices, as we are walking the selection fields tree
            path.unshift(queryPath.key);
        }
        queryPath = queryPath.prev;
    }
    return path;
}
exports.responsePathToSelectionPath = responsePathToSelectionPath;
function getFieldsForResolver(querySelectionFields, queryPath, type) {
    const path = responsePathToSelectionPath(queryPath);
    let fields = querySelectionFields;
    for (const key of path) {
        fields = fields[key] || {};
    }
    if (type) {
        if (querySelectionFields.__cloned) {
            return filterByType(fields, type);
        }
        if (!fields.__typeCache || !fields.__typeCache[type]) {
            fields.__typeCache = fields.__typeCache || {};
            fields.__typeCache[type] = filterByType(fields, type);
        }
        return fields.__typeCache[type];
    }
    return fields;
}
exports.getFieldsForResolver = getFieldsForResolver;
function shouldIgnoreFieldSelection(selection, field) {
    return Boolean(field.slice(0, 2) === '__' || selection[field].__isAlias);
}
exports.shouldIgnoreFieldSelection = shouldIgnoreFieldSelection;
function convertSelectionToPaths(stash) {
    const paths = [];
    for (const key in stash) {
        if (shouldIgnoreFieldSelection(stash, key)) {
            continue;
        }
        const child = stash[key];
        if (typeof child === 'object' && !Array.isArray(child) && Object.keys(child).length) {
            const childPaths = convertSelectionToPaths(child);
            for (const childPath of childPaths) {
                paths.push([key].concat(childPath));
            }
            if (!childPaths.length) {
                paths.push([key]);
            }
        }
        else {
            paths.push([key]);
        }
    }
    return paths;
}
exports.convertSelectionToPaths = convertSelectionToPaths;
function setUnboundedQuery(context, info, queryName) {
    const queryPath = responsePathToSelectionPath(info === null || info === void 0 ? void 0 : info.path);
    context.unboundedQueryRoots = context.unboundedQueryRoots || {};
    context.unboundedQueryRoots[queryPath.join('/')] = queryName;
}
exports.setUnboundedQuery = setUnboundedQuery;
function getUnboundedQuery(context, info) {
    if (!context.unboundedQueryRoots || !info) {
        return undefined;
    }
    const queryPath = responsePathToSelectionPath(info === null || info === void 0 ? void 0 : info.path);
    while (queryPath.length) {
        const queryName = context.unboundedQueryRoots[queryPath.join('/')];
        if (queryName) {
            return queryName;
        }
        queryPath.pop();
    }
    return undefined;
}
exports.getUnboundedQuery = getUnboundedQuery;
//# sourceMappingURL=GraphQLFields.js.map