"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalSearchMode = exports.getSearchString = exports.emptyResultGroup = exports.emptySearchExResult = exports.combineResults = exports.findResultSpec = exports.selectResultGroup = exports.selectResultGroups = exports.setDefaults = exports.composeSearchFilterString = exports.objectIDToServiceGuid = exports.serviceGuidToObjectID = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const SearchSchemaTypes_1 = require("./SearchSchemaTypes");
function serviceGuidToObjectID(guid, type) {
    switch (type) {
        case SearchSchemaTypes_1.SearchExResultType.NOTE:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Note);
        case SearchSchemaTypes_1.SearchExResultType.NOTEBOOK:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Notebook);
        case SearchSchemaTypes_1.SearchExResultType.WORKSPACE:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Workspace);
        case SearchSchemaTypes_1.SearchExResultType.TAG:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Tag);
        case SearchSchemaTypes_1.SearchExResultType.AUTHOR:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User);
        case SearchSchemaTypes_1.SearchExResultType.MESSAGE:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Message);
        case SearchSchemaTypes_1.SearchExResultType.STACK:
            return en_thrift_connector_1.convertGuidFromService(guid, en_core_entity_types_1.CoreEntityTypes.Stack);
        default:
            return guid; // other types do not represent nodes
    }
}
exports.serviceGuidToObjectID = serviceGuidToObjectID;
function objectIDToServiceGuid(id, type) {
    switch (type) {
        case SearchSchemaTypes_1.SearchExResultType.NOTE:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Note);
        case SearchSchemaTypes_1.SearchExResultType.NOTEBOOK:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Notebook);
        case SearchSchemaTypes_1.SearchExResultType.WORKSPACE:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Workspace);
        case SearchSchemaTypes_1.SearchExResultType.TAG:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Tag);
        case SearchSchemaTypes_1.SearchExResultType.AUTHOR:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Profile).toString();
        case SearchSchemaTypes_1.SearchExResultType.MESSAGE:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Message).toString();
        case SearchSchemaTypes_1.SearchExResultType.STACK:
            return en_thrift_connector_1.convertGuidToService(id, en_core_entity_types_1.CoreEntityTypes.Stack);
        default:
            return id; // other types do not represent nodes
    }
}
exports.objectIDToServiceGuid = objectIDToServiceGuid;
/**
 * Escapes quotes in the stack name. Other special characters are escaped in the query parser.
 *
 * @param stackName name of the stack
 */
function escapeStack(stackName) {
    return stackName.replace(/"/g, '\\"');
}
function composeSearchFilterString(serviceGuid, type) {
    switch (type) {
        case SearchSchemaTypes_1.SearchExResultType.NOTE:
            return '_id:"' + serviceGuid + '"';
        case SearchSchemaTypes_1.SearchExResultType.NOTEBOOK:
            return 'nbGuid:"' + serviceGuid + '"';
        case SearchSchemaTypes_1.SearchExResultType.WORKSPACE:
            return 'spaceGuid:"' + serviceGuid + '"';
        case SearchSchemaTypes_1.SearchExResultType.TAG:
            return 'tagGuid:"' + serviceGuid + '"';
        case SearchSchemaTypes_1.SearchExResultType.AUTHOR:
            return 'creatorId:"' + serviceGuid + '"';
        case SearchSchemaTypes_1.SearchExResultType.STACK:
            return 'stack:"' + escapeStack(serviceGuid) + '"';
        default:
            return serviceGuid;
    }
}
exports.composeSearchFilterString = composeSearchFilterString;
// Adds some default values to SearchEx arguments
function setDefaults(args) {
    if (!args.param || !args.param.resultSpec) {
        return;
    }
    for (const resGroupSpec of args.param.resultSpec) {
        if (resGroupSpec.textSearchField === undefined || resGroupSpec.textSearchField === null) {
            resGroupSpec.textSearchField = 0 /* ALL */;
        }
    }
}
exports.setDefaults = setDefaults;
function textFilter(g, requiredTextField) {
    if (requiredTextField !== undefined) {
        return g.textSearchField !== null && g.textSearchField !== undefined && g.textSearchField === requiredTextField;
    }
    return true;
}
/*
 * Returns new SearchExArgs object containing only result groups specified in requiredTypes array.
 * If requiredTextField is provided only groups with equal textSearchField will be returned.
 */
function selectResultGroups(args, requiredTypes, requiredTextField) {
    if (!args.param || !args.param.resultSpec) {
        return null;
    }
    const requiredGroups = args.param.resultSpec.filter(g => (textFilter(g, requiredTextField) && requiredTypes.has(g.type)));
    if (requiredGroups.length > 0) {
        const argsCopy = conduit_utils_1.safeParse(conduit_utils_1.safeStringify(args)); // deep copy
        argsCopy.param.resultSpec = requiredGroups;
        return argsCopy;
    }
    return null;
}
exports.selectResultGroups = selectResultGroups;
function selectResultGroup(args, requiredType, requiredTextField) {
    const requiredGroup = findResultSpec(args, requiredType, requiredTextField);
    if (requiredGroup) {
        const argsCopy = conduit_utils_1.safeParse(conduit_utils_1.safeStringify(args)); // deep copy
        argsCopy.param.resultSpec = [];
        argsCopy.param.resultSpec.push(requiredGroup);
        return argsCopy;
    }
    return null;
}
exports.selectResultGroup = selectResultGroup;
function findResultSpec(args, requiredType, requiredTextField) {
    if (!args.param || !args.param.resultSpec) {
        return null;
    }
    const idx = args.param.resultSpec.findIndex(spec => textFilter(spec, requiredTextField) && spec.type === requiredType);
    if (idx === -1) {
        return null;
    }
    return args.param.resultSpec[idx];
}
exports.findResultSpec = findResultSpec;
// multiple groups of one type are not supported
async function combineResults(args, resultPromises) {
    const resultsToMerge = (await conduit_utils_1.allSettled(resultPromises)).filter(x => x !== null);
    if (!resultsToMerge) {
        return emptySearchExResult();
    }
    const type2result = {}; // maps type to result group
    for (const searcherResult of resultsToMerge) {
        if (!searcherResult || !searcherResult.results) {
            continue;
        }
        for (const resultGroup of searcherResult.results) {
            type2result[resultGroup.type] = resultGroup;
        }
    }
    const result = resultsToMerge[0]; // meta, custom etc will be inherited from first result
    result.results = [];
    for (const requestedGroup of args.param.resultSpec) {
        if (requestedGroup.type in type2result) {
            result.results.push(type2result[requestedGroup.type]);
        }
        else {
            result.results.push(emptyResultGroup(requestedGroup.type));
        }
    }
    return result;
}
exports.combineResults = combineResults;
function emptySearchExResult() {
    return {
        results: [],
        meta: null,
        custom: null,
    };
}
exports.emptySearchExResult = emptySearchExResult;
function emptyResultGroup(resultType) {
    return {
        type: resultType,
        totalResultCount: 0,
        startIndex: 0,
        results: [],
        highlight: null,
    };
}
exports.emptyResultGroup = emptyResultGroup;
function getSearchString(args) {
    return args && args.query && args.query.searchStr ? args.query.searchStr : '';
}
exports.getSearchString = getSearchString;
function getLocalSearchMode(args) {
    return (args && args.param && args.param.processingSpec && args.param.processingSpec.localSearchMode) ?
        args.param.processingSpec.localSearchMode :
        "Auto" /* AUTO */;
}
exports.getLocalSearchMode = getLocalSearchMode;
//# sourceMappingURL=SearchExUtil.js.map