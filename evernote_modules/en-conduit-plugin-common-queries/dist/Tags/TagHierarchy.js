"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagHierarchyPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const graphql_1 = require("graphql");
function buildArgs() {
    const filterType = conduit_core_1.schemaToGraphQLType(['label', 'isBusiness', 'isPersonal', 'isShared', 'rootID', '?'], `TagHierarchyFilterField`);
    const sortType = conduit_core_1.schemaToGraphQLType(['label', 'refsCount', '?'], `TagHierarchySortField`);
    const filters = {
        type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
            name: `TagHierarchyFilter`,
            fields: {
                field: { type: new graphql_1.GraphQLNonNull(filterType) },
                isSet: { type: conduit_core_1.schemaToGraphQLType('boolean?') },
                min: { type: conduit_core_1.IndexRange },
                max: { type: conduit_core_1.IndexRange },
                match: { type: conduit_core_1.IndexMatch },
                prefix: { type: conduit_core_1.schemaToGraphQLType('string?') },
            },
        })),
    };
    const sorts = {
        type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
            name: `TagHierarchySort`,
            fields: {
                field: { type: new graphql_1.GraphQLNonNull(sortType) },
                order: { type: conduit_core_1.IndexOrderType },
            },
        })),
    };
    return {
        filters,
        sorts,
        includeEmptyBusinessTags: {
            type: conduit_core_1.schemaToGraphQLType('boolean?'),
        },
    };
}
function addOriginToTagFromContext(tag, syncContext) {
    if (syncContext.includes(conduit_core_1.VAULT_USER_CONTEXT)) {
        tag.isBusiness = true;
    }
    else if (syncContext.includes(conduit_core_1.PERSONAL_USER_CONTEXT)) {
        tag.isPersonal = true;
    }
    else {
        tag.isShared = true;
    }
}
function buildHierarchyFromLookupRecursive(parents, tagID, lookup, indentation) {
    const root = lookup[tagID];
    root.parents = parents;
    root.indentationLevel = indentation;
    const res = [root];
    const nextParents = parents.slice();
    nextParents.unshift(tagID);
    for (const childID of root.children) {
        res.push(...buildHierarchyFromLookupRecursive(nextParents, childID, lookup, indentation + 1));
    }
    return res;
}
function buildHierarchyFromLookup(noParentTags, hasParentTags, lookup, context, index) {
    const res = new Array(noParentTags.length + hasParentTags.length);
    const transform = (t) => index.map(e => {
        if (e.field === 'parent') {
            return t.parent.id;
        }
        return t[e.field];
    });
    const comparator = (a, b) => {
        return context.indexer.compareKeysFactory(en_core_entity_types_1.CoreEntityTypes.Tag, index)(transform(a), transform(b)).cmp;
    };
    for (let i = hasParentTags.length - 1; i >= 0; i--) {
        const tag = hasParentTags[i];
        if (!lookup.hasOwnProperty(tag.parent.id)) {
            // This happens when a shared tag has parent tags that aren't in the shared context
            hasParentTags.splice(i, 1);
            tag.parent.id = null;
            const indexToInsert = conduit_utils_1.binarySearch(comparator, noParentTags, tag);
            noParentTags.splice(indexToInsert.index, 0, tag);
        }
        else {
            lookup[tag.parent.id].children.unshift(tag.id);
        }
    }
    let current = 0;
    for (const storedTag of noParentTags) {
        const tag = lookup[storedTag.id];
        res[current] = tag;
        current++;
        for (const childID of tag.children) {
            const nestedChildren = buildHierarchyFromLookupRecursive([tag.id], childID, lookup, 1);
            for (const child of nestedChildren) {
                res[current] = child;
                current++;
            }
        }
    }
    return res;
}
function filterHierarchy(context, filters, list) {
    for (let i = list.length - 1; i >= 0; i--) {
        let tag = list[i];
        if (!context.indexer.filter(tag, filters)) {
            list.splice(i, 1); // Filtered out
        }
        else {
            let keep = tag.indentationLevel;
            while (keep > 0 && i > -1) {
                i--; // Move up the list
                if (list[i].id === tag.parent.id) {
                    tag = list[i]; // Move up the hierarchy
                    keep = tag.indentationLevel;
                }
                else if (!context.indexer.filter(list[i], filters)) {
                    list.splice(i, 1); // Filtered out
                }
            }
        }
    }
    return list;
}
function refsCountForTag(tag) {
    return Object.keys(tag.inputs.refs).length;
}
function convertTagToHierarchy(tag, indentationLevel) {
    const storedTag = {
        id: tag.id,
        syncContext: '',
        parent: {
            id: null,
        },
        label: tag.label,
        refsCount: refsCountForTag(tag),
        children: [],
        isBusiness: false,
        isPersonal: false,
        isShared: false,
        parents: [],
        indentationLevel,
    };
    for (const syncContext of tag.syncContexts) {
        addOriginToTagFromContext(storedTag, syncContext);
    }
    return storedTag;
}
async function buildHierarchyForNodeRecursive(context, root, indentationLevel = 0) {
    var _a;
    const list = [convertTagToHierarchy(root, indentationLevel)];
    const childEdgeIDs = Object.keys(root.outputs.children).map(e => root.outputs.children[e].dstID);
    const childTags = await ((_a = context.db) === null || _a === void 0 ? void 0 : _a.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Tag, childEdgeIDs));
    if (childTags) {
        for (const tag of childTags) {
            if (!tag) {
                throw new conduit_utils_1.NotFoundError(`Failed to find child tag in hierarchy`);
            }
            list.push(...(await buildHierarchyForNodeRecursive(context, tag, indentationLevel + 1)));
        }
    }
    return list;
}
async function buildHierarchyForNode(context, rootID) {
    conduit_core_1.validateDB(context);
    const root = await context.db.getNode(context, { id: rootID, type: en_core_entity_types_1.CoreEntityTypes.Tag });
    if (!root) {
        throw new conduit_utils_1.NotFoundError(rootID, `Could not find root tag for hierarchy`);
    }
    return buildHierarchyForNodeRecursive(context, root);
}
async function tagHierarchyResolver(parent, args, context, info) {
    var e_1, _a;
    var _b;
    conduit_core_1.validateDB(context);
    const fieldSelection = info ? conduit_core_1.getFieldsForResolver(context.querySelectionFields, info.path) : {};
    if (fieldSelection.hasOwnProperty('parents')) {
        conduit_utils_1.logger.perf('AllTagsWithHierarchy query requesting deprecated field "parents", please refactor code to rely on indentation only');
    }
    const parentFilter = {
        field: 'parent',
        match: {
            string: 'anything',
        },
    };
    const indexToUse = context.indexer.indexForQuery(en_core_entity_types_1.CoreEntityTypes.Tag, [parentFilter], args.sorts || [], [], ['label', 'refsCount', 'syncContext']);
    if (!indexToUse) {
        throw new Error('Failed to find index for TagsHierarchy query, should not happen');
    }
    // CON-718. Requested always filter tags which isBusiness is true and refsCount is 0.
    const filtersForQuery = await context.db.isBusinessAccount(context.trc) && !args.includeEmptyBusinessTags ? [{ field: 'refsCount', min: { int: 1 } }] : [];
    let list;
    const rootFilterIndex = args.filters && args.filters.findIndex(e => e.field === 'rootID');
    const rootFilter = rootFilterIndex !== undefined && rootFilterIndex >= 0 && args.filters.splice(rootFilterIndex, 1).pop();
    if (rootFilter) {
        if (!((_b = rootFilter.match) === null || _b === void 0 ? void 0 : _b.string)) {
            throw new Error(`Filter for rootID must be a string match filter.`);
        }
        list = await buildHierarchyForNode(context, rootFilter.match.string);
    }
    else {
        const tree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, en_core_entity_types_1.CoreEntityTypes.Tag, indexToUse);
        const iterator = await context.indexer.getIterator(context.trc, context.watcher, tree, en_core_entity_types_1.CoreEntityTypes.Tag, indexToUse, filtersForQuery, args.sorts || [], false, undefined);
        if (!iterator) {
            throw new Error('Unable to retrieve iterator');
        }
        const noParentTags = [];
        const hasParentTags = [];
        const lookup = {};
        const fieldStripper = context.indexer.indexedValuesFromKeyFactory(en_core_entity_types_1.CoreEntityTypes.Tag, indexToUse, true);
        try {
            for (var iterator_1 = __asyncValues(iterator), iterator_1_1; iterator_1_1 = await iterator_1.next(), !iterator_1_1.done;) {
                const key = iterator_1_1.value;
                if (!key) {
                    continue;
                }
                const tagFields = fieldStripper(key);
                const tag = Object.assign({ children: [], isBusiness: false, isPersonal: false, isShared: false, indentationLevel: 0, parents: [] }, tagFields);
                if (!lookup.hasOwnProperty(tag.id)) {
                    addOriginToTagFromContext(tag, tagFields.syncContext);
                    lookup[tag.id] = tag;
                    if (tag.parent.id) {
                        hasParentTags.push(tag);
                    }
                    else {
                        noParentTags.push(tag);
                    }
                }
                else {
                    // We have duplicate tags but in different sync contexts
                    addOriginToTagFromContext(lookup[tag.id], tagFields.syncContext);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterator_1_1 && !iterator_1_1.done && (_a = iterator_1.return)) await _a.call(iterator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        list = buildHierarchyFromLookup(noParentTags, hasParentTags, lookup, context, indexToUse.index);
        if (args.filters && args.filters.length) {
            return filterHierarchy(context, args.filters, list);
        }
    }
    return list;
}
exports.tagHierarchyPlugin = {
    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(conduit_core_1.schemaToGraphQLType({
        id: 'ID',
        parents: 'ID[]',
        indentationLevel: 'number',
        label: 'string',
        refsCount: 'number',
        isBusiness: 'boolean',
        isPersonal: 'boolean',
        isShared: 'boolean',
    }, 'AllTagsHierarchy', false))),
    resolve: tagHierarchyResolver,
    args: buildArgs(),
};
//# sourceMappingURL=TagHierarchy.js.map