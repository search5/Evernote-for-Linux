"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsAllowedPlugin = void 0;
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const en_data_model_1 = require("en-data-model");
const graphql_1 = require("graphql");
function buildArgs() {
    const fieldsType = conduit_core_1.schemaToGraphQLType(['refsCount', 'label', '?'], 'TagsAllowedField');
    const filters = {
        type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
            name: `TagInContextFilter`,
            fields: {
                field: { type: new graphql_1.GraphQLNonNull(fieldsType) },
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
            name: `TagsInContextSort`,
            fields: {
                field: { type: new graphql_1.GraphQLNonNull(fieldsType) },
                order: { type: conduit_core_1.IndexOrderType },
            },
        })),
    };
    return Object.assign(Object.assign({}, conduit_core_1.schemaToGraphQLArgs({ id: 'ID' })), { filters,
        sorts });
}
async function filterAlreadyOwnedTags(root, tags) {
    const ownedTags = [];
    if (root.type === en_data_model_1.CoreEntityTypes.Note) {
        for (const edge in root.outputs.tags) {
            ownedTags.push(root.outputs.tags[edge].dstID);
        }
    }
    else if (root.type === en_data_model_1.CoreEntityTypes.Tag) {
        for (const edge in root.outputs.children) {
            ownedTags.push(root.outputs.children[edge].dstID);
        }
    }
    else {
        throw new Error(`Unexpected owner type given to TagsAllowed: ${root.type}`);
    }
    return tags.filter(e => !ownedTags.includes(e.id));
}
async function tagsAllowedResolver(parent, args, context, info) {
    var e_1, _a;
    if (!args || !args.id) {
        throw new Error(`Missing relative's id`);
    }
    conduit_core_1.validateDB(context);
    let relative = await context.db.getNode(context, { type: en_data_model_1.CoreEntityTypes.Note, id: args.id });
    if (!relative) {
        relative = await context.db.getNode(context, { type: en_data_model_1.CoreEntityTypes.Tag, id: args.id });
    }
    if (!relative) {
        throw new Error(`Could not find note or tag with id: ${args.id}`);
    }
    const { indexedFilters, indexedSorts, unIndexedSorts, indexUsed, } = conduit_core_1.getListResolverParams(en_data_model_1.CoreEntityTypes.Tag, args, context, info, (paths) => paths.concat([['syncContext']]));
    let isFirstPass = true;
    const results = [];
    for (const syncContext of relative.syncContexts) {
        const syncContextFilter = {
            field: 'syncContext',
            match: {
                string: syncContext,
            },
        };
        const tree = await context.db.readonlyIndexingTreeForTypeAndIndex(context.trc, en_data_model_1.CoreEntityTypes.Tag, indexUsed);
        const iterator = await context.indexer.getIterator(context.trc, context.watcher, tree, en_data_model_1.CoreEntityTypes.Tag, indexUsed, [syncContextFilter].concat(indexedFilters), indexedSorts, false, undefined);
        if (!iterator) {
            throw new Error('Unable to create iterator for query');
        }
        try {
            for (var iterator_1 = (e_1 = void 0, __asyncValues(iterator)), iterator_1_1; iterator_1_1 = await iterator_1.next(), !iterator_1_1.done;) {
                const item = iterator_1_1.value;
                if (item && (isFirstPass || !results.includes(item))) {
                    results.push(item);
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
        isFirstPass = false;
    }
    const fieldStripper = context.indexer.indexedValuesFromKeyFactory(en_data_model_1.CoreEntityTypes.Tag, indexUsed, true);
    const list = await filterAlreadyOwnedTags(relative, results.map(e => {
        return Object.assign({ type: en_data_model_1.CoreEntityTypes.Tag }, fieldStripper(e));
    }));
    const congruencyCheck = conduit_core_1.indexedSortsCongruencyCheck(en_data_model_1.CoreEntityTypes.Tag, indexedSorts, indexedFilters, context.indexer, indexUsed.index);
    if (unIndexedSorts.length || !congruencyCheck) {
        // We're sorting by label first but the index is ['syncContext','refsCount','label'] so re-sort
        context.indexer.sort(en_data_model_1.CoreEntityTypes.Tag, list, args.sorts);
    }
    return {
        count: list.length,
        indexUsed: indexUsed.index,
        list,
    };
}
exports.tagsAllowedPlugin = {
    args: buildArgs(),
    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
        name: 'TagsAllowed',
        fields: {
            count: { type: conduit_core_1.schemaToGraphQLType('number') },
            indexUsed: { type: conduit_core_1.schemaToGraphQLType('string[]') },
            list: {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(conduit_core_1.schemaToGraphQLType({
                    id: 'ID',
                    label: 'string',
                    refsCount: 'number?',
                }, 'TagsAllowedListResults', false))),
            },
        },
    })),
    resolve: tagsAllowedResolver,
};
//# sourceMappingURL=TagsAllowed.js.map