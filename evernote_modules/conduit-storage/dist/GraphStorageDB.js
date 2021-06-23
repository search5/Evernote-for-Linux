"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphStorageDB = exports.GraphTransactionContext = exports.GraphStorageBase = exports.tableForNodeType = exports.isNodeTable = exports.NSYNC_CONTEXT = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const DeclarativeExpr_1 = require("./DeclarativeExpr");
const GraphIndexTypes_1 = require("./GraphIndexTypes");
const GraphTypes_1 = require("./GraphTypes");
const IndexSchemaDiff_1 = require("./IndexSchemaDiff");
const KeyValStorage_1 = require("./KeyValStorage");
const QueryExecutor_1 = require("./QueryExecutor");
const ReadonlyIndexingTree_1 = require("./ReadonlyIndexingTree");
const ReadWriteIndexingTree_1 = require("./ReadWriteIndexingTree");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
const NODES_PER_REINDEX_BATCH = 200;
const INDEX_TRAVERSALS_CHUNK_SIZE = 200;
exports.NSYNC_CONTEXT = 'NSyncContext';
function isGraphEdgeChange(change) {
    return 'edge' in change;
}
var Tables;
(function (Tables) {
    Tables["DBMetadata"] = "DBMetadata";
    Tables["SyncContextMetadata"] = "SyncContextMetadata";
    Tables["SyncState"] = "SyncState";
    Tables["StoredIndexes"] = "StoredIndexes";
    Tables["StoredResolverVersions"] = "StoredResolverVersions";
    Tables["CacheLookaside"] = "CacheLookaside";
    Tables["LoadedInMemory"] = "LoadedInMemory";
})(Tables || (Tables = {}));
const SyncContextIndexNodeType = 'SyncContextIndex';
const SYNC_CONTEXT_INDEX = {
    key: 'SyncContextKey',
    index: [{ field: 'ref', order: 'ASC', type: 'EntityRef', isMatchField: true }],
    indexCondition: [],
    inMemoryIndex: false,
};
const localeKey = 'locale';
function fakeStoredIndexForLocale(locale) {
    return {
        indexConfigVersion: GraphIndexTypes_1.INDEX_CONFIG_VERSION,
        tableName: localeKey,
        type: 'LOCALE',
        locale,
    };
}
function edgeMatchesFilter(edge, filter) {
    if (filter.srcID && edge.srcID !== filter.srcID) {
        return false;
    }
    if (filter.srcPort && edge.srcPort !== filter.srcPort) {
        return false;
    }
    if (filter.srcType && edge.srcType !== filter.srcType) {
        return false;
    }
    if (filter.dstID && edge.dstID !== filter.dstID) {
        return false;
    }
    if (filter.dstPort && edge.dstPort !== filter.dstPort) {
        return false;
    }
    if (filter.dstType && edge.dstType !== filter.dstType) {
        return false;
    }
    return true;
}
function edgeToString(edge) {
    return [
        edge.srcID,
        edge.srcPort,
        edge.dstID,
        edge.dstPort,
    ].join('::');
}
function validateIsGraphNode(val) {
    const obj = KeyValStorage_1.validateIsObject(val);
    if (obj && obj.type && obj.id) {
        return obj;
    }
    return null;
}
function validateIsRealGraphNode(val) {
    const obj = KeyValStorage_1.validateIsObject(val);
    if (obj && obj.type && obj.id && isNodeReal(obj)) {
        return obj;
    }
    return null;
}
function isNodeReal(n) {
    return Boolean(n && n.dummy !== true);
}
function nodeRefsEqual(ref1, ref2) {
    return ref2 && ref1.id === ref2.id && ref2.type === ref1.type;
}
function addSyncContext(syncContexts, syncContext) {
    return syncContexts.includes(syncContext) ? syncContexts : syncContexts.concat(syncContext);
}
function removeSyncContext(syncContexts, syncContextIdx) {
    return syncContexts.slice(0, syncContextIdx).concat(syncContexts.slice(syncContextIdx + 1));
}
function isNodeTable(tableName) {
    return tableName.startsWith('Nodes_');
}
exports.isNodeTable = isNodeTable;
function tableForNodeType(type) {
    return `Nodes_${type}`;
}
exports.tableForNodeType = tableForNodeType;
function tableForIndex(type, index) {
    return `${type}::${index.key}`;
}
function tableForNodeLookup(type, lookupField) {
    return `${type}::lookup:${lookupField}`;
}
function tableForCustomSyncState(customType) {
    return `${Tables.SyncState}${customType}`;
}
class GraphStorageBase extends StorageEventEmitter_1.StorageEventEmitter {
    constructor(storage, ephemeralStorage, config, underlay) {
        super();
        this.config = config;
        this.underlay = underlay;
        this.readonlyIndexingTrees = {};
        this.lookups = {};
        this.nodeFieldLookup = async (trc, ref, lookupField) => {
            const lookupTable = await this.getNodeLookupTable(trc, ref.type, lookupField);
            return lookupTable[ref.id];
        };
        this.storage = storage;
        this.storage.addChangeHandler(this);
        this.ephemeralStorage = ephemeralStorage;
        this.ephemeralStorage.addChangeHandler(this);
        this.indexes = new conduit_utils_1.DemandLoader(async (trc) => {
            return this.loadStoredIndexes(trc);
        });
    }
    async destructor(trc) {
        super.destructor(trc);
        this.storage.removeChangeHandler(this);
        this.ephemeralStorage.removeChangeHandler(this);
    }
    async readOnlyTreeForTypeAndIndex(trc, type, index, inMemory) {
        const table = tableForIndex(type, index);
        if (!inMemory && this.readonlyIndexingTrees.hasOwnProperty(table)) {
            return this.readonlyIndexingTrees[table];
        }
        if (inMemory) {
            if (await this.isIndexLoadedInMemory(trc, type, index)) {
                return new ReadonlyIndexingTree_1.ReadonlyIndexingTree(this.ephemeralStorage, table, this.config.indexer.treeOrder, this.config.indexer.compareKeysFactory(type, index.index));
            }
            else {
                setTimeout(() => {
                    this.loadInMemoryIndex(trc, table, type, index).catch(err => {
                        conduit_utils_1.logger.error(`Failed to load inMemoryIndex: ${index.key}, reason: ${err}`);
                    });
                }, 0); // Pushes the loading transaction to the end of the current frame so we can resolve the query first
            }
        }
        const tree = new ReadonlyIndexingTree_1.ReadonlyIndexingTree(this.storage, table, this.config.indexer.treeOrder, this.config.indexer.compareKeysFactory(type, index.index));
        this.readonlyIndexingTrees[table] = tree;
        return tree;
    }
    async queryGraph(trc, watcher, nodeType, queryName, args) {
        var _a, _b;
        if (!await this.hasIndexesConfigured(trc)) {
            throw new Error('Cannot call queryGraph without indexes configured');
        }
        const indexer = this.config.indexer;
        const nodeTypeDef = (_a = this.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[nodeType];
        if (!nodeTypeDef) {
            throw new conduit_utils_1.InternalError(`Missing node type definition for ${nodeType}`);
        }
        const query = (_b = indexer.config[nodeType]) === null || _b === void 0 ? void 0 : _b.queries[queryName];
        if (!query) {
            throw new conduit_utils_1.InternalError(`Missing query definition for ${nodeType}:${queryName}`);
        }
        const params = QueryExecutor_1.getIndexParamsForQueryArgs(query, args, indexer);
        const tree = await this.readOnlyTreeForTypeAndIndex(trc, query.type, params.indexUsed, params.indexUsed.inMemoryIndex);
        const results = await indexer.getList(trc, watcher, tree, query.type, nodeTypeDef, params, false);
        return results.list;
    }
    async getNodeImmediateAncestor(trc, watcher, node) {
        var _a;
        const nodeTypeDef = (_a = this.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[node.type];
        if (!nodeTypeDef) {
            throw new conduit_utils_1.InternalError(`Missing node type definition for ${node.type}`);
        }
        if (!nodeTypeDef.ancestorPort) {
            return null;
        }
        const parentEdge = conduit_utils_1.firstStashEntry(node.inputs[nodeTypeDef.ancestorPort]);
        if (!parentEdge) {
            return null;
        }
        return await this.getNode(trc, watcher, { id: parentEdge.srcID, type: parentEdge.srcType });
    }
    async getNodeAncestors(trc, watcher, node) {
        const ancestors = [];
        let parent = node;
        while (parent) {
            parent = await this.getNodeImmediateAncestor(trc, watcher, parent);
            if (parent) {
                ancestors.push(parent);
            }
        }
        return ancestors;
    }
    async isIndexLoadedInMemory(trc, type, index) {
        const indexTable = tableForIndex(type, index);
        return this.ephemeralStorage.baseStorage.getValidatedValue(trc, null, Tables.LoadedInMemory, indexTable, KeyValStorage_1.validateIsBoolean);
    }
    async loadInMemoryIndex(trc, table, type, index) {
        if (this.ephemeralStorage.isDestructed() || this.storage.isDestructed()) {
            return;
        }
        const isOverlayDB = this.ephemeralStorage.isOverlay;
        if (isOverlayDB && !this.storage.isOverlay) {
            throw new conduit_utils_1.InternalError(`Shouldn't happen`);
        }
        await this.ephemeralStorage.baseStorage.transact(trc, 'loadInMemoryIndex', async (ephemeralOverlay) => {
            await this.storage.baseStorage.transact(trc, 'loadInMemoryIndex', async (overlay) => {
                // This works as long as we're not loading in memory indexes before disk indexes have been written
                const tableKeys = await overlay.getKeys(trc, null, table);
                const tableValues = await overlay.batchGetValues(trc, null, table, tableKeys);
                for (const key in tableValues) {
                    const value = tableValues[key];
                    if (value !== undefined) {
                        await ephemeralOverlay.setValue(trc, table, key, value);
                    }
                }
            });
        });
        if (isOverlayDB) {
            await this.ephemeralStorage.transact(trc, 'loadInMemoryIndexOverlay', async (ephemeralOverlay) => {
                await this.storage.transact(trc, 'loadInMemoryIndexOverlay', async (_) => {
                    ephemeralOverlay.copyTableChangesFrom(this.storage, table);
                });
            });
        }
        await this.ephemeralStorage.baseStorage.transact(trc, 'setInMemoryIndexAsLoaded', async (ephemeralOverlay) => {
            const indexTable = tableForIndex(type, index);
            await ephemeralOverlay.setValue(trc, Tables.LoadedInMemory, indexTable, true);
        });
    }
    async loadStoredIndexes(trc) {
        const entries = (await this.getFullTable(trc, null, Tables.StoredIndexes)) || {};
        for (const key in entries) {
            const entry = entries[key];
            if (entry.indexConfigVersion !== GraphIndexTypes_1.INDEX_CONFIG_VERSION) {
                delete entries[key];
            }
        }
        return entries;
    }
    async loadStoredResolverVersions(trc) {
        return await this.getFullTable(trc, null, Tables.StoredResolverVersions) || {};
    }
    shouldIndexSyncContext(syncContext) {
        for (const regex of this.config.syncContextIndexExcludes) {
            if (syncContext.match(regex)) {
                return false;
            }
        }
        return true;
    }
    async hasIndexesConfigured(trc) {
        const indexes = await this.indexes.getData(trc);
        return !conduit_utils_1.isStashEmpty(indexes);
    }
    async getIndexesForType(trc, type) {
        const indexes = await this.indexes.getData(trc);
        return Object.values(indexes).filter(entry => entry.type === type && entry.tableName !== localeKey).map(entry => GraphIndexTypes_1.fromStoredIndexItem(entry.indexItem) || entry.lookupField);
    }
    async getNode(trc, watcher, nodeRef, getDummy = false) {
        return await this.storage.getValidatedValue(trc, watcher, tableForNodeType(nodeRef.type), nodeRef.id, getDummy ? validateIsGraphNode : validateIsRealGraphNode);
    }
    async batchGetNodes(trc, watcher, type, nodeIDs, getDummy = false) {
        conduit_utils_1.traceEventStart(trc, 'batchGetNodes', { type, noteIDsCount: nodeIDs.length });
        const validate = getDummy ? validateIsGraphNode : validateIsRealGraphNode;
        const values = await this.storage.batchGetValues(trc, watcher, tableForNodeType(type), nodeIDs);
        const nodes = [];
        for (const nodeID of nodeIDs) {
            nodes.push(validate(values[nodeID]));
        }
        conduit_utils_1.traceEventEnd(trc, 'batchGetNodes');
        return nodes;
    }
    async getAllGraphNodeRefs(trc, watcher) {
        const ret = [];
        for (const type in this.config.nodeTypes || {}) {
            const nodes = (await this.getFullTable(trc, watcher, tableForNodeType(type))) || {};
            for (const key in nodes) {
                const node = nodes[key];
                if (!node.dummy) {
                    ret.push({ id: node.id, type: node.type });
                }
            }
        }
        return ret;
    }
    // NOTE: includes dummy node refs!
    async getGraphNodeRefsByType(trc, watcher, type) {
        const nodeIDs = await this.storage.getKeys(trc, watcher, tableForNodeType(type));
        return nodeIDs.map(id => {
            return { id, type };
        });
    }
    async getGraphNodesByType(trc, watcher, type) {
        const nodes = (await this.getFullTable(trc, watcher, tableForNodeType(type))) || {};
        return Object.values(nodes).filter(n => !n.dummy);
    }
    async getEdge(trc, watcher, association) {
        const srcNode = await this.getNode(trc, watcher, association.src);
        if (srcNode) {
            for (const port in srcNode.outputs) {
                const edges = srcNode.outputs[port];
                for (const key in edges) {
                    const edge = edges[key];
                    if (edge.dstID === association.dst.id && edge.dstType === association.dst.type) {
                        return edge;
                    }
                }
            }
        }
        const dstNode = await this.getNode(trc, watcher, association.dst);
        if (dstNode) {
            for (const port in dstNode.outputs) {
                const edges = dstNode.outputs[port];
                for (const key in edges) {
                    const edge = edges[key];
                    if (edge.srcID === association.src.id && edge.srcType === association.src.type) {
                        return edge;
                    }
                }
            }
        }
        return null;
    }
    async traverseGraph(trc, watcher, nodeRef, traverse) {
        let ret = [];
        let node;
        if (GraphTypes_1.isGraphNode(nodeRef)) {
            node = nodeRef;
        }
        else {
            node = await this.getNode(trc, watcher, nodeRef);
        }
        if (!node) {
            return [];
        }
        if (!traverse.length) {
            return [Object.assign(Object.assign({}, nodeRef), { edge: undefined })];
        }
        const t = traverse[0];
        const shouldExclude = t.excludeIf && t.excludeIf.reduce((prev, current) => {
            if (prev) {
                return true;
            }
            else {
                return DeclarativeExpr_1.evaluateConditional(current, node, node, this.config.indexer.locale);
            }
        }, false);
        if (shouldExclude) {
            return ret;
        }
        if (!t.edge && !t.type) {
            return [Object.assign(Object.assign({}, nodeRef), { edge: undefined })];
        }
        else if (t.edge && t.type) {
            const childTraverse = traverse.slice(1);
            const edges = node[t.edge[0]][t.edge[1]];
            if (!edges) {
                return [];
            }
            for (const key in edges) {
                const edge = edges[key];
                const childNode = {
                    id: t.edge[0] === 'outputs' ? edge.dstID : edge.srcID,
                    type: t.edge[0] === 'outputs' ? edge.dstType : edge.srcType,
                };
                if (childNode.type !== t.type) {
                    continue;
                }
                if (childTraverse.length) {
                    const childRet = await this.traverseGraph(trc, watcher, childNode, childTraverse);
                    ret = ret.concat(childRet);
                }
                else {
                    ret.push(Object.assign(Object.assign({}, childNode), { edge: edges[key] }));
                }
            }
        }
        return ret;
    }
    async getSyncContextMetadata(trc, watcher, syncContext) {
        const metadata = await this.storage.getValue(trc, watcher, Tables.SyncContextMetadata, syncContext);
        return metadata ? this.config.amendSyncContextMetadataBeforeRead(trc, metadata) : undefined;
    }
    async batchGetSyncContextMetadatas(trc, watcher, syncContexts) {
        const values = await this.storage.batchGetValues(trc, watcher, Tables.SyncContextMetadata, syncContexts);
        const metadatas = syncContexts.map(sc => values[sc]);
        for (let i = 0; i < metadatas.length; ++i) {
            const m = metadatas[i];
            if (m) {
                metadatas[i] = await this.config.amendSyncContextMetadataBeforeRead(trc, m);
            }
        }
        return metadatas;
    }
    async getAllSyncContextMetadata(trc, watcher) {
        const res = (await this.getFullTable(trc, watcher, Tables.SyncContextMetadata)) || {};
        for (const k in res) {
            const m = res[k];
            if (m) {
                res[k] = await this.config.amendSyncContextMetadataBeforeRead(trc, m);
            }
        }
        return res;
    }
    async getAllSyncContexts(trc, watcher) {
        return await this.storage.getKeys(trc, watcher, Tables.SyncContextMetadata);
    }
    async getStoredLocale(trc, watcher) {
        const index = await this.storage.getValue(trc, null, Tables.StoredIndexes, localeKey);
        if (!index) {
            return undefined;
        }
        return index.locale;
    }
    async getSyncState(trc, watcher, path) {
        const key = path[0];
        const subpath = path.slice(1);
        if (!subpath.length) {
            return await this.storage.getValue(trc, watcher, Tables.SyncState, key);
        }
        const syncState = (await this.storage.getValidatedValue(trc, watcher, Tables.SyncState, key, KeyValStorage_1.validateIsObject)) || {};
        return conduit_utils_1.walkObjectPath(syncState, subpath, undefined);
    }
    async getFullSyncState(trc, watcher) {
        return this.getFullTable(trc, watcher, Tables.SyncState);
    }
    async getCustomSyncState(trc, watcher, customType, key) {
        return await this.storage.getValue(trc, watcher, tableForCustomSyncState(customType), key);
    }
    async batchGetCustomSyncState(trc, watcher, customType, keys) {
        return await this.storage.batchGetValues(trc, watcher, tableForCustomSyncState(customType), keys);
    }
    async hasCustomSyncStateKey(trc, watcher, customType, key) {
        return await this.storage.hasKey(trc, watcher, tableForCustomSyncState(customType), key);
    }
    async getCustomSyncStateKeys(trc, watcher, customType) {
        return await this.storage.getKeys(trc, watcher, tableForCustomSyncState(customType));
    }
    async getFullTable(trc, watcher, tableName) {
        conduit_utils_1.traceEventStart(trc, 'getFullTable', { tableName });
        const keys = (await this.storage.getKeys(trc, watcher, tableName)).sort();
        if (!keys.length) {
            conduit_utils_1.traceEventEnd(trc, 'getFullTable');
            return undefined;
        }
        const values = await this.storage.batchGetValues(trc, watcher, tableName, keys);
        const ret = {};
        for (const key of keys) {
            const val = values[key];
            if (val !== undefined) {
                ret[key] = val;
            }
        }
        conduit_utils_1.traceEventEnd(trc, 'getFullTable');
        return ret;
    }
    getCacheConfig(nodeType, cacheField) {
        const typeDef = this.config.nodeTypes ? this.config.nodeTypes[nodeType] : undefined;
        if (!typeDef) {
            throw new Error(`Missing node type definition for "${nodeType}"`);
        }
        if (!typeDef.cache) {
            throw new Error(`Missing cache config from node type definition for "${nodeType}"`);
        }
        if (!typeDef.cache.hasOwnProperty(cacheField)) {
            throw new Error(`Missing cache config for field "${cacheField}" from node type definition for "${nodeType}"`);
        }
        return typeDef.cache[cacheField];
    }
    async getNodeCachedField(trc, watcher, nodeRef, cacheField) {
        const cacheConfig = this.getCacheConfig(nodeRef.type, cacheField);
        const allowStaleOnFillFailure = Boolean(cacheConfig.allowStaleOnFillFailure);
        const defaultRet = !(cacheConfig.allowStale && cacheConfig.hasOwnProperty('defaultValue')) ? undefined : {
            node: null,
            isStale: true,
            allowStaleOnFillFailure,
            values: {
                [cacheField]: cacheConfig.defaultValue,
            },
        };
        const node = GraphTypes_1.isGraphNode(nodeRef) ? nodeRef : await this.getNode(trc, watcher, nodeRef);
        if (!node) {
            return defaultRet;
        }
        if (defaultRet) {
            defaultRet.node = node;
        }
        const cacheState = node.CacheState ? node.CacheState[cacheField] : undefined;
        if (!cacheState) {
            return defaultRet;
        }
        let isStale = false;
        for (const dep in cacheState.dependentFieldValues) {
            const cacheValue = cacheState.dependentFieldValues[dep];
            const nodeValue = conduit_utils_1.walkObjectPath(node.NodeFields, dep.split('.'), null);
            if (cacheValue !== nodeValue) {
                isStale = true;
                break;
            }
        }
        if (!isStale && cacheState.expireTimestamp && cacheState.expireTimestamp < Date.now()) {
            isStale = true;
        }
        if (isStale && !cacheConfig.allowStale && !allowStaleOnFillFailure) {
            // early out before lookaside fetch if stale
            return defaultRet;
        }
        let cachedFieldValue = cacheConfig.defaultValue;
        if (cacheState.lookasideKey) {
            cachedFieldValue = await this.storage.getValue(trc, watcher, Tables.CacheLookaside, cacheState.lookasideKey);
        }
        else if (node.CacheFields && node.CacheFields.hasOwnProperty(cacheField)) {
            cachedFieldValue = node.CacheFields[cacheField];
        }
        else {
            // no value in cache
            return defaultRet;
        }
        return {
            node,
            isStale,
            allowStaleOnFillFailure,
            values: Object.assign(Object.assign({}, cacheState.dependentFieldValues), { [cacheField]: cachedFieldValue }),
        };
    }
    async loadNodeLookupTable(trc, tableName) {
        if (this.underlay) {
            const underlayData = await this.underlay.getNodeLookupTableByName(trc, tableName);
            return Object.assign({}, underlayData);
        }
        return (await this.getFullTable(trc, null, tableName)) || {};
    }
    getNodeLookup(tableName) {
        if (!this.lookups[tableName]) {
            this.lookups[tableName] = new conduit_utils_1.DemandLoader(trc => {
                return this.loadNodeLookupTable(trc, tableName);
            });
        }
        return this.lookups[tableName];
    }
    async getNodeLookupTableByName(trc, tableName) {
        return this.getNodeLookup(tableName).getData(trc);
    }
    async getNodeLookupTable(trc, type, lookupField) {
        return await this.getNodeLookupTableByName(trc, tableForNodeLookup(type, lookupField));
    }
    clearLookups() {
        for (const type in this.config.indexer.config) {
            const indexConfig = this.config.indexer.config[type];
            for (const lookupField of indexConfig.lookups) {
                const tableName = tableForNodeLookup(type, lookupField);
                this.getNodeLookup(tableName).setData({});
            }
        }
    }
}
__decorate([
    conduit_utils_1.traceAsync('loadNodeLookupTable', 'tableName')
], GraphStorageBase.prototype, "loadNodeLookupTable", null);
__decorate([
    conduit_utils_1.traceAsync('clearLookups')
], GraphStorageBase.prototype, "clearLookups", null);
exports.GraphStorageBase = GraphStorageBase;
class GraphTransactionContext extends GraphStorageBase {
    constructor(db, ephemeralDB, config, underlay) {
        super(db, ephemeralDB, config, underlay);
        this.db = db;
        this.ephemeralDB = ephemeralDB;
        this.readWriteIndexingTrees = {};
        this.pendingChanges = {};
        this.pendingPropagatedFields = {};
    }
    async destructor(trc) {
        await this.applyPendingChanges(trc);
        // applyPendingChanges will reindex nodes with pending changes, thus catching any pending propagations, and call setNode for each
        // finalizeIndexPropagation will reindex the nodes applyPendingChanges missed
        // finalizeIndexPropagation will set the nodes with the updated PropagatedFields, thus no redundant setNodes will occur.
        await this.finalizeIndexPropagation(trc);
        await super.destructor(trc);
    }
    getPendingChangesKey(ref) {
        return `${ref.type}::${ref.id}`;
    }
    splitPendingChangesKey(key) {
        const idx = key.indexOf('::');
        return idx !== -1 ? key.slice(idx + 2) : '';
    }
    readWriteTreeForTypeAndIndex(type, index, inMemory, rootID) {
        const table = tableForIndex(type, index);
        const treeKey = table + (rootID ? '::' + rootID : '');
        if (!inMemory && this.readWriteIndexingTrees.hasOwnProperty(treeKey)) {
            return this.readWriteIndexingTrees[treeKey];
        }
        const tree = new ReadWriteIndexingTree_1.ReadWriteIndexingTree(this.config.uuid, inMemory ? this.ephemeralDB : this.db, table, this.config.indexer.treeOrder, this.config.indexer.compareKeysFactory(type, index.index), rootID);
        if (!inMemory) {
            this.readWriteIndexingTrees[treeKey] = tree;
        }
        return tree;
    }
    generateUndoEvents() {
        return this.db.generateUndoEvents();
    }
    async clearAllData(trc) {
        await this.db.clearAll(trc);
        this.newIndexes = {};
        this.clearLookups();
    }
    // SYNC CONTEXT METHODS:
    async createSyncContext(trc, syncContext, metadata) {
        const newMetadata = await this.config.amendSyncContextMetadataBeforeWrite(trc, metadata);
        await this.db.setValue(trc, Tables.SyncContextMetadata, syncContext, newMetadata);
    }
    async replaceSyncContextMetadata(trc, syncContext, metadata) {
        const prevMetadata = await this.db.getValue(trc, null, Tables.SyncContextMetadata, syncContext);
        if (prevMetadata === undefined || prevMetadata === null) {
            // no such syncContext
            return;
        }
        let newMetadata = SimplyImmutable.replaceImmutable(prevMetadata, metadata);
        newMetadata = await this.config.amendSyncContextMetadataBeforeWrite(trc, newMetadata);
        if (prevMetadata !== newMetadata) {
            await this.db.setValue(trc, Tables.SyncContextMetadata, syncContext, newMetadata);
        }
    }
    async updateSyncContextMetadata(trc, syncContext, metadata) {
        const prevMetadata = await this.db.getValue(trc, null, Tables.SyncContextMetadata, syncContext);
        if (prevMetadata === undefined || prevMetadata === null) {
            // no such syncContext
            return;
        }
        let newMetadata = SimplyImmutable.updateImmutable(prevMetadata, metadata);
        newMetadata = await this.config.amendSyncContextMetadataBeforeWrite(trc, newMetadata);
        if (prevMetadata !== newMetadata) {
            await this.db.setValue(trc, Tables.SyncContextMetadata, syncContext, newMetadata);
        }
    }
    async deleteNodesForSyncContext(trc, syncContext) {
        if (!this.shouldIndexSyncContext(syncContext)) {
            return;
        }
        const refs = [];
        const tree = this.readWriteTreeForTypeAndIndex(SyncContextIndexNodeType, SYNC_CONTEXT_INDEX, false, syncContext);
        const fieldStripper = this.config.indexer.indexedValuesFromKeyFactory(SyncContextIndexNodeType, SYNC_CONTEXT_INDEX, false);
        await tree.walkLeaves(trc, null, true, async (key) => {
            const ref = fieldStripper(key).ref;
            refs.push(ref);
        });
        await tree.clearTree(trc);
        await conduit_utils_1.allSettled(refs.map(ref => this.deleteNode(trc, syncContext, ref)));
    }
    async deleteSyncContext(trc, syncContext) {
        if (!(await this.db.getValue(trc, null, Tables.SyncContextMetadata, syncContext))) {
            return;
        }
        await this.deleteNodesForSyncContext(trc, syncContext);
        await this.db.removeValue(trc, Tables.SyncContextMetadata, syncContext);
    }
    async assertSyncContext(trc, syncContext) {
        const curValue = await this.db.getValue(trc, null, Tables.SyncContextMetadata, syncContext);
        if (curValue === undefined) {
            conduit_utils_1.logger.error(`No sync context found for ${syncContext}`);
            return false;
        }
        return true;
    }
    // SYNC STATE METHODS:
    async updateSyncState(trc, path, update) {
        const key = path[0];
        const subpath = path.slice(1);
        const prevSyncState = (await this.db.getValidatedValue(trc, null, Tables.SyncState, key, KeyValStorage_1.validateIsObject)) || {};
        const syncState = SimplyImmutable.deepUpdateImmutable(prevSyncState, subpath, update);
        if (prevSyncState !== syncState) {
            await this.db.setValue(trc, Tables.SyncState, key, syncState);
        }
    }
    async replaceSyncState(trc, path, value) {
        const key = path[0];
        const subpath = path.slice(1);
        const prevSyncState = (await this.db.getValidatedValue(trc, null, Tables.SyncState, key, KeyValStorage_1.validateIsObject)) || {};
        const syncState = SimplyImmutable.replaceImmutable(prevSyncState, subpath, value);
        if (prevSyncState !== syncState) {
            await this.db.setValue(trc, Tables.SyncState, key, syncState);
        }
    }
    async deleteSyncState(trc, path) {
        const key = path[0];
        const subpath = path.slice(1);
        const prevSyncState = (await this.db.getValidatedValue(trc, null, Tables.SyncState, key, KeyValStorage_1.validateIsObject)) || {};
        const syncState = SimplyImmutable.deleteImmutable(prevSyncState, subpath);
        if (prevSyncState !== syncState) {
            await this.db.setValue(trc, Tables.SyncState, key, syncState);
        }
    }
    async replaceCustomSyncState(trc, customType, key, value) {
        await this.db.setValue(trc, tableForCustomSyncState(customType), key, value);
    }
    async deleteCustomSyncState(trc, customType, key) {
        await this.db.removeValue(trc, tableForCustomSyncState(customType), key);
    }
    async setNodeFieldLookupValue(trc, nodeRef, lookupField, lookupValue) {
        conduit_utils_1.traceEventStart(trc, 'setNodeFieldLookupValue', { type: nodeRef.type, lookupField });
        const tableName = tableForNodeLookup(nodeRef.type, lookupField);
        const isRemove = lookupValue === null || lookupValue === undefined;
        const lookup = await this.getNodeLookup(tableName).getData(trc);
        if (isRemove) {
            delete lookup[nodeRef.id];
        }
        else {
            lookup[nodeRef.id] = lookupValue;
        }
        this.getNodeLookup(tableName).setData(lookup);
        if (isRemove) {
            await this.db.removeValue(trc, tableName, nodeRef.id);
        }
        else {
            await this.db.setValue(trc, tableName, nodeRef.id, lookupValue);
        }
        conduit_utils_1.traceEventEnd(trc, 'setNodeFieldLookupValue');
    }
    // INDEX METHODS:
    async _updateIndexes(trc, oldIndexes, newIndexes, priorities, localeChanged, mustBeReindexed, setProgress) {
        const changedIndexes = {};
        const toReindex = {};
        const allTableNames = {};
        for (const tableName in oldIndexes) {
            allTableNames[tableName] = tableName;
        }
        for (const tableName in newIndexes) {
            allTableNames[tableName] = tableName;
        }
        // reindex where changed or created
        let changeCount = 0;
        for (const tableName in allTableNames) {
            const oldIndex = oldIndexes[tableName];
            const newIndex = newIndexes[tableName];
            if (tableName === localeKey) {
                if (IndexSchemaDiff_1.hasStoredIndexChanged(oldIndex, newIndex)) {
                    changedIndexes[tableName] = newIndex;
                }
            }
            else if (localeChanged || IndexSchemaDiff_1.hasStoredIndexChanged(oldIndex, newIndex) || mustBeReindexed[tableName]) {
                ++changeCount;
                await this.db.clearTable(trc, tableName);
                await this.db.removeValue(trc, Tables.StoredIndexes, tableName);
                if (newIndex) {
                    changedIndexes[tableName] = newIndex;
                    toReindex[newIndex.type] = toReindex[newIndex.type] || [];
                    toReindex[newIndex.type].push(GraphIndexTypes_1.fromStoredIndexItem(newIndex.indexItem) || newIndex.lookupField);
                }
            }
        }
        setProgress && await setProgress(trc, 0.15);
        const toReindexKeys = Object.keys(toReindex);
        const propagatedFieldUpdatesByType = {};
        const sortedKeys = [...toReindexKeys].sort((a, b) => { var _a, _b; return ((_a = priorities[a]) !== null && _a !== void 0 ? _a : GraphIndexTypes_1.IndexPriority.DEFAULT) - ((_b = priorities[b]) !== null && _b !== void 0 ? _b : GraphIndexTypes_1.IndexPriority.DEFAULT); });
        let totalIndexes = 0;
        let processedIndexes = 0;
        sortedKeys.map(type => totalIndexes += toReindex[type].length);
        const setProgressPerType = (async (type, percent) => {
            const progressSoFar = (processedIndexes / totalIndexes) + ((toReindex[type].length / totalIndexes) * percent);
            setProgress && await setProgress(trc, (0.75 * progressSoFar) + 0.15);
        });
        for (const type of sortedKeys) {
            propagatedFieldUpdatesByType[type] = await this.reindexType(trc, type, toReindex[type], setProgressPerType);
            await setProgressPerType(type, 1);
            processedIndexes += toReindex[type].length;
        }
        return { changeCount, propagatedFieldUpdatesByType, changedIndexes };
    }
    async _finalizeIndexesUpdate(trc, newIndexes, changedIndexes, resolverVersions, shouldUpdateVersions) {
        for (const tableName in changedIndexes) {
            await this.db.setValue(trc, Tables.StoredIndexes, tableName, changedIndexes[tableName]);
        }
        // Update resolver versions if we found version changes
        if (shouldUpdateVersions) {
            for (const key in resolverVersions) {
                const resolvers = resolverVersions[key];
                await this.db.setValue(trc, Tables.StoredResolverVersions, key, resolvers);
            }
        }
        // store for post-transact cache update
        this.newIndexes = newIndexes;
    }
    async reindexType(trc, type, indexes, setProgressPerType) {
        const propagatedFieldUpdates = {};
        const pendingKeysPerIndex = {};
        for (const indexItem of indexes) {
            if (GraphIndexTypes_1.isIndex(indexItem)) {
                pendingKeysPerIndex[indexItem.key] = [];
            }
        }
        const refs = await this.getGraphNodeRefsByType(trc, null, type);
        const chunks = conduit_utils_1.chunkArray(refs, NODES_PER_REINDEX_BATCH);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const nodes = await this.batchGetNodes(trc, null, type, chunk.map(ref => ref.id), false);
            const ps = [];
            for (const node of nodes) {
                if (!node) {
                    continue;
                }
                const propagatedFields = {};
                const resolvedFields = await this.config.indexer.resolveAllFields(trc, node, this.nodeFieldLookup, propagatedFields);
                for (const indexItem of indexes) {
                    if (GraphIndexTypes_1.isLookup(indexItem)) {
                        const lookupValue = resolvedFields[indexItem];
                        ps.push(this.setNodeFieldLookupValue(trc, node, indexItem, lookupValue[0]));
                    }
                    else {
                        const keys = this.config.indexer.keysForNodeAndIndex(node, indexItem, resolvedFields);
                        for (const key of keys) {
                            pendingKeysPerIndex[indexItem.key].push(key);
                        }
                    }
                }
                // defer writing propagated fields until later to handle as multiple transactions to reduce memory pressure
                const oldPropagatedFields = node.PropagatedFields || {};
                const newPropagatedFields = SimplyImmutable.updateImmutable(oldPropagatedFields, propagatedFields);
                if (newPropagatedFields !== oldPropagatedFields) {
                    propagatedFieldUpdates[node.id] = newPropagatedFields;
                }
            }
            await conduit_utils_1.allSettled(ps);
            // set batch fetch progress
            await setProgressPerType(type, 0.7 * ((i + 1) / chunks.length));
        }
        for (let i = 0; i < indexes.length; i++) {
            const indexItem = indexes[i];
            if (GraphIndexTypes_1.isIndex(indexItem)) {
                const pendingKeys = pendingKeysPerIndex[indexItem.key];
                const tree = this.readWriteTreeForTypeAndIndex(type, indexItem, false);
                await tree.rebuildTree(trc, pendingKeys);
                if (this.config.indexer.doValidation) {
                    await tree.validate();
                }
            }
            await setProgressPerType(type, (0.3 * ((i + 1) / indexes.length)) + 0.7);
        }
        return propagatedFieldUpdates;
    }
    getNewIndexes() {
        return this.newIndexes;
    }
    getNewLookups(trc) {
        const ret = {};
        for (const tableName in this.lookups) {
            const data = this.lookups[tableName].getData(trc);
            if (data instanceof Promise) {
                continue;
            }
            ret[tableName] = data;
        }
        return ret;
    }
    // NODE CRUD METHODS:
    nodeDefaultEdgeStructure(nodeType) {
        var _a;
        const inputs = {};
        const outputs = {};
        const typeDef = this.config.nodeTypes ? this.config.nodeTypes[nodeType] : undefined;
        if (typeDef) {
            for (const port in (typeDef.inputs || {})) {
                inputs[port] = {};
            }
            for (const port in (typeDef.outputs || {})) {
                outputs[port] = {};
            }
        }
        const propagatedFields = {};
        const indexResolvers = (_a = this.config.indexer.config[nodeType]) === null || _a === void 0 ? void 0 : _a.indexResolvers;
        if (indexResolvers) {
            for (const field in indexResolvers) {
                if (indexResolvers[field].propagatedFrom) {
                    propagatedFields[field] = [conduit_utils_1.getSchemaTypeDefaultValue(indexResolvers[field].schemaType)];
                }
            }
        }
        return { inputs, outputs, PropagatedFields: propagatedFields, syncContexts: [] };
    }
    async createNode(trc, syncContext, nodeData, timestamp) {
        const prev = await this.getNode(trc, null, nodeData);
        if (prev) {
            return prev;
        }
        return await this.createNodeInternal(trc, syncContext, nodeData, {}, {}, timestamp);
    }
    async createNodeInternal(trc, syncContext, nodeData, inputs, outputs, timestamp) {
        const internalFields = this.nodeDefaultEdgeStructure(nodeData.type);
        let dummyNode = await this.getNodeInternal(trc, nodeData);
        if (dummyNode && !dummyNode.dummy) {
            throw new conduit_utils_1.InternalError(`createNodeInternal called when an existing node already exists for ID=${nodeData.id}`);
        }
        if (dummyNode) {
            dummyNode = SimplyImmutable.cloneMutable(dummyNode);
            for (const port in (dummyNode.inputs || {})) {
                internalFields.inputs[port] = dummyNode.inputs[port];
            }
            for (const port in (dummyNode.outputs || {})) {
                internalFields.outputs[port] = dummyNode.outputs[port];
            }
        }
        for (const port in inputs) {
            for (const key in inputs[port]) {
                internalFields.inputs[port][key] = inputs[port][key];
            }
        }
        for (const port in outputs) {
            for (const key in outputs[port]) {
                internalFields.outputs[port][key] = outputs[port][key];
            }
        }
        if (nodeData.CacheFields || nodeData.CacheState) {
            // not allowed to populate cache via createNode
            nodeData = SimplyImmutable.deleteImmutable(nodeData, ['CacheFields']);
            nodeData = SimplyImmutable.deleteImmutable(nodeData, ['CacheState']);
        }
        internalFields.syncContexts = addSyncContext(nodeData.syncContexts, syncContext);
        let newFields = {};
        if (timestamp) {
            newFields.localChangeTimestamp = timestamp;
            const typeDef = this.config.nodeTypes ? this.config.nodeTypes[nodeData.type] : undefined;
            // hasOwnProperty on nodeData doesn't work as getSchemaDefaults sets default values for unpopulated fields.
            if (typeDef && typeDef.schema.hasOwnProperty('created') && (!nodeData.NodeFields || !nodeData.NodeFields.created)) {
                newFields = Object.assign(Object.assign({}, newFields), { NodeFields: { created: newFields.localChangeTimestamp } });
            }
        }
        else {
            newFields.localChangeTimestamp = 0;
        }
        const nodeWithExtraFields = SimplyImmutable.deepUpdateImmutable(nodeData, newFields);
        const node = SimplyImmutable.updateImmutable(nodeWithExtraFields, internalFields);
        const propagatedFields = await this.reindexNode(trc, null, node);
        await this._setNode(trc, null, node, undefined, propagatedFields);
        await this.config.countUpdater(trc, this, syncContext, nodeData.type, 1);
        return node;
    }
    denormalizeEdge(edge, toDst, isRemove) {
        const id = toDst ? edge.dstID : edge.srcID;
        const type = toDst ? edge.dstType : edge.srcType;
        const port = toDst ? edge.dstPort : edge.srcPort;
        if (!port) {
            return;
        }
        const key = this.getPendingChangesKey({ id, type });
        this.pendingChanges[key] = this.pendingChanges[key] || { type, changes: [] };
        this.pendingChanges[key].changes.push({
            edge,
            isRemove,
        });
    }
    async applyPendingChanges(trc) {
        const idsByType = {};
        for (const key in this.pendingChanges) {
            const change = this.pendingChanges[key];
            const id = this.splitPendingChangesKey(key);
            const type = change.type;
            idsByType[type] = idsByType[type] || [];
            idsByType[type].push(id);
        }
        const ps = [];
        for (const type in idsByType) {
            // simply calling get on a node will apply the pending edge changes
            ps.push(this.batchGetNodes(trc, null, type, idsByType[type], true));
        }
        await conduit_utils_1.allSettled(ps);
    }
    async replaceNodeAndEdges(trc, syncContext, node) {
        var _a, _b;
        const typeDef = this.config.nodeTypes ? this.config.nodeTypes[node.type] : undefined;
        if (!typeDef) {
            throw new Error(`Missing node type definition for "${node.type}"`);
        }
        const prevNode = await this.getNodeInternal(trc, node);
        if (prevNode && prevNode.version > node.version) {
            // just modify syncContexts
            const newNode = SimplyImmutable.replaceImmutable(prevNode, ['syncContexts'], addSyncContext(prevNode.syncContexts, syncContext));
            await this._setNode(trc, prevNode, newNode);
            await this.replaceSyncContextIndexes(trc, prevNode, newNode);
            // count dummy conversion
            if (prevNode.dummy) {
                conduit_utils_1.logger.warn('Dummy node with higher version... should never happen');
                await this.config.countUpdater(trc, this, syncContext, node.type, 1);
            }
            // ignore the edge updates
            return (prevNode && !prevNode.dummy) ? prevNode : null;
        }
        // Process edge updates
        const inputs = Object.assign({}, node.inputs);
        const outputs = Object.assign({}, node.outputs);
        if (prevNode) {
            for (const port in prevNode.inputs) {
                for (const key in prevNode.inputs[port]) {
                    const prevEdge = prevNode.inputs[port][key];
                    if ((_a = typeDef.inputs[port]) === null || _a === void 0 ? void 0 : _a.isOwned) {
                        if (!inputs[port][key]) {
                            // remove old owned edge not in new node
                            this.denormalizeEdge(prevEdge, false, true);
                        }
                    }
                    else {
                        // carryover unowned edge
                        inputs[port] = inputs[port] || {};
                        inputs[port][key] = prevEdge;
                    }
                }
            }
            for (const port in prevNode.outputs) {
                for (const key in prevNode.outputs[port]) {
                    const prevEdge = prevNode.outputs[port][key];
                    if ((_b = typeDef.outputs[port]) === null || _b === void 0 ? void 0 : _b.isOwned) {
                        if (!outputs[port][key]) {
                            // remove old owned edge not in new node
                            this.denormalizeEdge(prevEdge, true, true);
                        }
                    }
                    else {
                        // carryover unowned edge
                        outputs[port] = outputs[port] || {};
                        outputs[port][key] = prevEdge;
                    }
                }
            }
        }
        for (const port in inputs) {
            for (const key in inputs[port]) {
                const edge = inputs[port][key];
                if (!prevNode || !prevNode.inputs[port] || !prevNode.inputs[port][key]) {
                    this.denormalizeEdge(edge, false, false);
                }
            }
        }
        for (const port in outputs) {
            for (const key in outputs[port]) {
                const edge = outputs[port][key];
                if (!prevNode || !prevNode.outputs[port] || !prevNode.outputs[port][key]) {
                    this.denormalizeEdge(edge, true, false);
                }
            }
        }
        // create or update node
        if (!prevNode) {
            await this.createNodeInternal(trc, syncContext, node, inputs, outputs);
        }
        else {
            const carryover = {
                syncContexts: addSyncContext(prevNode.syncContexts, syncContext),
                CacheFields: prevNode.CacheFields,
                CacheState: prevNode.CacheState,
                PropagatedFields: prevNode.PropagatedFields,
                inputs,
                outputs,
            };
            const newNode = SimplyImmutable.replaceImmutable(prevNode, SimplyImmutable.updateImmutable(node, carryover));
            let propagatedFields;
            if (prevNode.dummy) {
                propagatedFields = await this.reindexNode(trc, null, newNode);
            }
            else {
                propagatedFields = await this.reindexNode(trc, prevNode, newNode);
            }
            await this._setNode(trc, prevNode, newNode, undefined, propagatedFields);
        }
        // count dummy conversion
        if (prevNode && prevNode.dummy) {
            await this.config.countUpdater(trc, this, syncContext, node.type, 1);
        }
        return (prevNode && !prevNode.dummy) ? prevNode : null;
    }
    async replaceNode(trc, syncContext, node) {
        const prevNode = await this.getNodeInternal(trc, node);
        if (prevNode && prevNode.version > node.version) {
            // just modify syncContexts
            const newNode = SimplyImmutable.replaceImmutable(prevNode, ['syncContexts'], addSyncContext(prevNode.syncContexts, syncContext));
            await this._setNode(trc, prevNode, newNode);
            await this.replaceSyncContextIndexes(trc, prevNode, newNode);
            // count dummy conversion
            if (prevNode.dummy) {
                conduit_utils_1.logger.warn('Dummy node with higher version... should never happen');
                await this.config.countUpdater(trc, this, syncContext, node.type, 1);
            }
            // ignore the edge updates
            return (prevNode && !prevNode.dummy) ? prevNode : null;
        }
        // create or update node
        if (!prevNode) {
            await this.createNodeInternal(trc, syncContext, node, node.inputs, node.outputs);
        }
        else {
            const carryover = {
                syncContexts: addSyncContext(prevNode.syncContexts, syncContext),
                CacheFields: prevNode.CacheFields,
                CacheState: prevNode.CacheState,
                inputs: prevNode.inputs,
                outputs: prevNode.outputs,
            };
            const newNode = SimplyImmutable.replaceImmutable(prevNode, SimplyImmutable.updateImmutable(node, carryover));
            let propagatedFields;
            if (prevNode.dummy) {
                propagatedFields = await this.reindexNode(trc, null, newNode);
            }
            else {
                propagatedFields = await this.reindexNode(trc, prevNode, newNode);
            }
            await this._setNode(trc, prevNode, newNode, undefined, propagatedFields);
        }
        // count dummy conversion
        if (prevNode && prevNode.dummy) {
            await this.config.countUpdater(trc, this, syncContext, node.type, 1);
        }
        return (prevNode && !prevNode.dummy) ? prevNode : null;
    }
    async updateNode(trc, syncContext, nodeRef, nodeData, timestamp) {
        const prevNode = await this.getNodeInternal(trc, nodeRef);
        if (!isNodeReal(prevNode)) {
            return null;
        }
        if (!prevNode.syncContexts.includes(syncContext)) {
            conduit_utils_1.logger.debug(`updateNode called with a syncContext "${syncContext}" that the node (${nodeRef.id}) does not belong to`);
            return null;
        }
        if (nodeData.CacheFields || nodeData.CacheState) {
            // not allowed to populate cache via updateNode
            nodeData = SimplyImmutable.deleteImmutable(nodeData, ['CacheFields']);
            nodeData = SimplyImmutable.deleteImmutable(nodeData, ['CacheState']);
        }
        let newFields = {};
        if (timestamp) {
            newFields.localChangeTimestamp = timestamp;
            if (prevNode.NodeFields.hasOwnProperty('updated') && (!nodeData.NodeFields || !nodeData.NodeFields.hasOwnProperty('updated'))) {
                newFields = Object.assign(Object.assign({}, newFields), { NodeFields: { updated: newFields.localChangeTimestamp } });
            }
        }
        else {
            newFields.localChangeTimestamp = 0;
        }
        const update = SimplyImmutable.deepUpdateImmutable(nodeData, newFields);
        const node = SimplyImmutable.deepUpdateImmutable(prevNode, update);
        const propagatedFields = await this.reindexNode(trc, prevNode, node);
        await this._setNode(trc, prevNode, node, undefined, propagatedFields);
        return node;
    }
    async updateNodeDeferred(trc, nodeRef, path, value, doNotIndex = false) {
        const key = this.getPendingChangesKey(nodeRef);
        this.pendingChanges[key] = this.pendingChanges[key] || { type: nodeRef.type, changes: [] };
        this.pendingChanges[key].changes.push({
            path,
            value,
            doNotIndex,
        });
    }
    async deleteNode(trc, syncContext, nodeRef, deleteDummy = false, timestamp) {
        return this.deleteNodeInternal(trc, syncContext, nodeRef, false, deleteDummy, timestamp);
    }
    async hasAccessToNode(trc, node, typeConfig, propagatedFrom) {
        /* TODO need to get access to the personal UserID
        if (node.owner === personalUserID) {
          return true;
        }
        */
        for (const port in typeConfig.inputs) {
            const inputConfig = typeConfig.inputs[port];
            if (inputConfig.type !== GraphTypes_1.EdgeType.ANCESTRY && inputConfig.type !== GraphTypes_1.EdgeType.ANCESTRY_LINK) {
                continue;
            }
            const edges = node.inputs[port];
            for (const localTerminus in edges) {
                const edge = edges[localTerminus];
                if (edge.srcID === propagatedFrom.id && edge.srcType === propagatedFrom.type) {
                    continue;
                }
                const ancestryNode = await this.getNodeInternal(trc, { type: edge.srcType, id: edge.srcID });
                if (!ancestryNode || ancestryNode.dummy) {
                    continue;
                }
                // still has access from a parent
                return true;
            }
        }
        // check if this node has memberships with recipientIsMe where the membership !== propagatedFrom
        const membershipIDs = [];
        let membershipType = null;
        for (const port in typeConfig.outputs) {
            const outputConfig = typeConfig.outputs[port];
            if (outputConfig.type !== GraphTypes_1.EdgeType.MEMBERSHIP) {
                continue;
            }
            const edges = node.outputs[port];
            for (const localTerminus in edges) {
                const edge = edges[localTerminus];
                if (edge.dstID === propagatedFrom.id && edge.dstType === propagatedFrom.type) {
                    continue;
                }
                membershipType = edge.dstType;
                membershipIDs.push(edge.dstID);
            }
        }
        if (membershipType && membershipIDs.length) {
            const memberships = await this.batchGetNodes(trc, null, membershipType, membershipIDs);
            for (const membership of memberships) {
                if ((membership === null || membership === void 0 ? void 0 : membership.NodeFields.recipientIsMe) === true) {
                    return true;
                }
            }
        }
        return false;
    }
    async propagateNodeDelete(trc, syncContext, node, typeConfig, isAccessLoss, deleteDummy, timestamp, propagatedFrom, originalSyncSource) {
        for (const port in typeConfig.inputs) {
            const inputConfig = typeConfig.inputs[port];
            // Is this a hack? Yeah, sort of. It presumes that any membership has a recipientIsMe field;
            // I (Conor) think this is ok though since in V2 we will have memberships as a first class type in graph storage.
            if (inputConfig.type === GraphTypes_1.EdgeType.MEMBERSHIP && node.NodeFields.recipientIsMe === true) {
                const edges = node.inputs[port];
                for (const localTerminus in edges) {
                    const edge = edges[localTerminus];
                    if (propagatedFrom && edge.srcID === propagatedFrom.id && edge.srcType === propagatedFrom.type) {
                        // caller is already deleting it
                        continue;
                    }
                    await this.deleteNodeInternal(trc, syncContext, { id: edge.srcID, type: edge.srcType }, true, deleteDummy, timestamp, node, originalSyncSource);
                }
            }
        }
        for (const port in typeConfig.outputs) {
            const outputConfig = typeConfig.outputs[port];
            if (outputConfig.type === GraphTypes_1.EdgeType.ANCESTRY || outputConfig.type === GraphTypes_1.EdgeType.ANCESTRY_LINK || outputConfig.type === GraphTypes_1.EdgeType.MEMBERSHIP) {
                const edges = node.outputs[port];
                for (const localTerminus in edges) {
                    const edge = edges[localTerminus];
                    if (propagatedFrom && edge.dstID === propagatedFrom.id && edge.dstType === propagatedFrom.type) {
                        // caller is already deleting it
                        continue;
                    }
                    await this.deleteNodeInternal(trc, syncContext, { id: edge.dstID, type: edge.dstType }, isAccessLoss, deleteDummy, timestamp, node, originalSyncSource);
                }
            }
        }
    }
    async deleteNodeInternal(trc, syncContext, nodeRef, isAccessLoss, deleteDummy = false, timestamp, propagatedFrom, originalSyncSource) {
        var _a;
        if (syncContext !== '*' && !await this.assertSyncContext(trc, syncContext)) {
            return false;
        }
        let node = await this.getNodeInternal(trc, nodeRef);
        if (!node) {
            return false;
        }
        const typeConfig = (_a = this.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[nodeRef.type];
        const syncSource = typeConfig === null || typeConfig === void 0 ? void 0 : typeConfig.syncSource;
        originalSyncSource = originalSyncSource || syncSource;
        if (syncSource !== originalSyncSource) {
            syncContext = node.syncContexts[0];
        }
        if (typeConfig) {
            if (isAccessLoss && propagatedFrom && syncContext === exports.NSYNC_CONTEXT && await this.hasAccessToNode(trc, node, typeConfig, propagatedFrom)) {
                return false;
            }
            await this.propagateNodeDelete(trc, syncContext, node, typeConfig, isAccessLoss, deleteDummy, timestamp, propagatedFrom, originalSyncSource);
        }
        const isDummyNode = node.dummy;
        if (isDummyNode) {
            if (!deleteDummy) {
                return false;
            }
        }
        else if (syncContext !== '*') {
            const syncContextIdx = node.syncContexts.indexOf(syncContext);
            if (syncContextIdx < 0) {
                return false;
            }
            if (node.syncContexts.length > 1) {
                let updatedNode = SimplyImmutable.replaceImmutable(node, ['syncContexts'], removeSyncContext(node.syncContexts, syncContextIdx));
                updatedNode = SimplyImmutable.updateImmutable(updatedNode, ['localChangeTimestamp'], timestamp !== null && timestamp !== void 0 ? timestamp : 0);
                await this._setNode(trc, node, updatedNode);
                return false;
            }
        }
        const deleteHook = this.config.deleteHooks[nodeRef.type];
        if (deleteHook) {
            await deleteHook(trc, this, nodeRef.id);
        }
        const removedEdges = [];
        for (const port in node.inputs) {
            const edges = node.inputs[port];
            for (const localTerminus in edges) {
                const edge = edges[localTerminus];
                if (propagatedFrom && edge.srcID === propagatedFrom.id && edge.srcType === propagatedFrom.type) {
                    // caller will delete this edge
                    continue;
                }
                removedEdges.push(edge);
            }
        }
        for (const port in node.outputs) {
            const edges = node.outputs[port];
            for (const localTerminus in edges) {
                const edge = edges[localTerminus];
                if (propagatedFrom && edge.dstID === propagatedFrom.id && edge.dstType === propagatedFrom.type) {
                    // caller will delete this edge
                    continue;
                }
                removedEdges.push(edge);
            }
        }
        await this.removeEdges(trc, removedEdges, timestamp, nodeRef);
        if (!isDummyNode) {
            // update indexes
            node = await this.getNodeInternal(trc, nodeRef);
            if (!node) {
                return false;
            }
            await this.reindexNode(trc, node, null);
        }
        await this.db.removeValue(trc, tableForNodeType(nodeRef.type), nodeRef.id);
        if (!isDummyNode) {
            await this.config.countUpdater(trc, this, syncContext, nodeRef.type, -1);
        }
        return !isDummyNode;
    }
    // EDGE METHODS:
    async replaceEdges(trc, edgesToDelete, edgesToCreate, timestamp) {
        await this.replaceEdgesInternal(trc, edgesToDelete, edgesToCreate, timestamp);
    }
    async removeEdges(trc, edgesToDelete, timestamp, excludeNode) {
        await this.replaceEdgesInternal(trc, edgesToDelete, [], timestamp, excludeNode);
    }
    // CACHE METHODS:
    async setNodeCachedField(trc, nodeRef, cacheField, cacheValue, dependentFieldValues) {
        var _a;
        const node = await this.getNode(trc, null, nodeRef);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, `Cannot find node ${nodeRef.id}`);
        }
        const cacheConfig = this.getCacheConfig(nodeRef.type, cacheField);
        for (const dep of (cacheConfig.dependentFields || [])) {
            if (!dependentFieldValues.hasOwnProperty(dep)) {
                dependentFieldValues[dep] = conduit_utils_1.walkObjectPath(node.NodeFields, dep.split('.'), null);
            }
        }
        const expireTimestamp = cacheConfig.cacheTimeout ? (Date.now() + cacheConfig.cacheTimeout) : 0;
        let CacheFields = node.CacheFields || {};
        let lookasideKey = node.CacheState ? (_a = node.CacheState[cacheField]) === null || _a === void 0 ? void 0 : _a.lookasideKey : undefined;
        const useLookaside = cacheConfig.lookasideThreshold && typeof cacheValue === 'string' && cacheValue.length > cacheConfig.lookasideThreshold;
        if (useLookaside) {
            lookasideKey = lookasideKey || `${nodeRef.type}::${nodeRef.id}::${cacheField}`;
            await this.db.setValue(trc, Tables.CacheLookaside, lookasideKey, cacheValue);
            CacheFields = SimplyImmutable.deleteImmutable(CacheFields, [cacheField]);
        }
        else {
            if (lookasideKey) {
                await this.db.removeValue(trc, Tables.CacheLookaside, lookasideKey);
                lookasideKey = undefined;
            }
            CacheFields = SimplyImmutable.replaceImmutable(CacheFields, [cacheField], cacheValue);
        }
        const update = {
            CacheFields,
            CacheState: SimplyImmutable.replaceImmutable(node.CacheState || {}, [cacheField], {
                dependentFieldValues,
                expireTimestamp,
                lookasideKey,
            }),
        };
        await this._setNode(trc, node, SimplyImmutable.updateImmutable(node, update));
    }
    async removeNodeCachedFields(trc, nodeRef, cacheFields) {
        const node = await this.getNode(trc, null, nodeRef);
        if (!node) {
            throw new conduit_utils_1.NotFoundError(nodeRef.id, `Cannot find node ${nodeRef.id}`);
        }
        const update = {};
        if (node.CacheState) {
            update.CacheState = SimplyImmutable.cloneMutable(node.CacheState);
            for (const field of cacheFields) {
                const cacheState = node.CacheState[field];
                if (cacheState === null || cacheState === void 0 ? void 0 : cacheState.lookasideKey) {
                    await this.db.removeValue(trc, Tables.CacheLookaside, cacheState.lookasideKey);
                }
                delete update.CacheState[field];
            }
        }
        if (node.CacheFields) {
            update.CacheFields = SimplyImmutable.cloneMutable(node.CacheFields);
            for (const field of cacheFields) {
                delete update.CacheFields[field];
            }
        }
        if (update.CacheState || update.CacheFields) {
            await this._setNode(trc, node, SimplyImmutable.updateImmutable(node, update));
        }
    }
    // PRIVATE METHODS:
    async replaceEdgesInternal(trc, edgesToDelete, edgesToCreate, timestamp, excludeNode) {
        const newEdgeLookup = {};
        for (const edge of edgesToCreate) {
            newEdgeLookup[edgeToString(edge)] = edge;
        }
        const affectedNodes = new Set();
        for (const filter of edgesToDelete) {
            // find matching edges and delete them if they are not also in edgesToCreate (uses newEdgeLookup for better perf)
            const matchingEdges = await this.findEdgesInternal(trc, filter, { searchDummy: true });
            for (const edge of matchingEdges) {
                if (!newEdgeLookup.hasOwnProperty(edgeToString(edge))) {
                    const updated = await this.removeEdge(trc, edge, timestamp, excludeNode);
                    for (const ref of updated) {
                        affectedNodes.add(ref);
                    }
                }
            }
        }
        for (const edge of edgesToCreate) {
            const updated = await this.addEdge(trc, edge, timestamp, excludeNode);
            for (const ref of updated) {
                affectedNodes.add(ref);
            }
        }
        for (const nodeRef of affectedNodes.values()) {
            await this.checkAndApplyAutoDelete(trc, nodeRef);
        }
    }
    async checkAndApplyAutoDelete(trc, nodeRef, fallbackNode) {
        var _a;
        const nodeTypeDef = (_a = this.config.nodeTypes) === null || _a === void 0 ? void 0 : _a[nodeRef.type];
        if (nodeTypeDef === null || nodeTypeDef === void 0 ? void 0 : nodeTypeDef.autoDelete) {
            const node = await this.getNode(trc, null, nodeRef);
            if (node) {
                let curValue = conduit_utils_1.walkObjectPath(node, nodeTypeDef.autoDelete.path, undefined);
                const valueType = conduit_utils_1.getTypeOf(curValue);
                if (valueType === 'object') {
                    curValue = Object.keys(curValue).length;
                }
                else if (valueType === 'array') {
                    curValue = curValue.length;
                }
                if (curValue === nodeTypeDef.autoDelete.value) {
                    await this.deleteNode(trc, '*', nodeRef, false);
                    return null;
                }
            }
            return node;
        }
        return fallbackNode || null;
    }
    async findEdgesInternal(trc, filter, opts = { searchDummy: false }) {
        const f = filter;
        const ret = [];
        let node;
        if (opts.searchDummy) {
            node = f.srcID ?
                await this.getNodeInternal(trc, { id: f.srcID, type: f.srcType }) :
                await this.getNodeInternal(trc, { id: f.dstID, type: f.dstType });
        }
        else {
            node = f.srcID ?
                await this.getNode(trc, null, { id: f.srcID, type: f.srcType }) :
                await this.getNode(trc, null, { id: f.dstID, type: f.dstType });
        }
        if (!node) {
            return ret;
        }
        const ports = f.srcID ? node.outputs : node.inputs;
        const p = f.srcID ? f.srcPort : f.dstPort;
        if (p) {
            for (const key in ports[p]) {
                const edge = ports[p][key];
                if (edgeMatchesFilter(edge, f)) {
                    ret.push(edge);
                }
            }
        }
        else {
            for (const pp in ports) {
                for (const key in ports[pp]) {
                    const edge = ports[pp][key];
                    if (edgeMatchesFilter(edge, f)) {
                        ret.push(edge);
                    }
                }
            }
        }
        return ret;
    }
    async _setNode(trc, oldNode, node, opts = { dummy: false }, propagatedFields) {
        if (opts.dummy) {
            node = SimplyImmutable.updateImmutable(node, { dummy: true });
        }
        if (propagatedFields) {
            node = SimplyImmutable.deepUpdateImmutable(node, ['PropagatedFields'], propagatedFields);
        }
        if (node === oldNode) {
            // don't write if unchanged
            return node;
        }
        await this.db.setValue(trc, tableForNodeType(node.type), node.id, node, /* noClone=*/ true);
        return node;
    }
    async removeSyncContextIndex(trc, syncContext, ref) {
        if (!this.shouldIndexSyncContext(syncContext)) {
            return;
        }
        const key = [ref];
        const tree = this.readWriteTreeForTypeAndIndex(SyncContextIndexNodeType, SYNC_CONTEXT_INDEX, false, syncContext);
        await tree.delete(trc, key);
    }
    async addSyncContextIndex(trc, syncContext, ref) {
        if (!this.shouldIndexSyncContext(syncContext)) {
            return;
        }
        const key = [ref];
        const tree = this.readWriteTreeForTypeAndIndex(SyncContextIndexNodeType, SYNC_CONTEXT_INDEX, false, syncContext);
        await tree.insert(trc, key);
    }
    async prepareIndexPropagation(trc, edgesToPropagateToByType, origNode, newNode) {
        var _a;
        if (!origNode && !newNode) {
            throw new conduit_utils_1.InvalidParameterError('A node must be passed in order to propagate index updates');
        }
        const origPropagatedFields = {};
        const newPropagatedFields = {};
        for (const dstPort in edgesToPropagateToByType) {
            const byPort = edgesToPropagateToByType[dstPort];
            // Propagated values should never need any async operations to resolve from the source node, hence we're not passing the nodeFieldLookup func
            if (origNode) {
                const origValue = await this.config.indexer.resolveField(trc, origNode, byPort.srcField, null, {}, {});
                origPropagatedFields[byPort.dstField] = origValue;
            }
            const newValue = newNode ? await this.config.indexer.resolveField(trc, newNode, byPort.srcField, null, {}, {}) : [null];
            newPropagatedFields[byPort.dstField] = newValue;
        }
        if (conduit_utils_1.isEqual(origPropagatedFields, newPropagatedFields)) {
            return;
        }
        for (const dstPort in edgesToPropagateToByType) {
            const byPort = edgesToPropagateToByType[dstPort];
            for (const dstNodeType in byPort) {
                if (dstNodeType === 'dstField' || dstNodeType === 'srcField') {
                    continue;
                }
                const byType = byPort[dstNodeType];
                for (const srcPort in byType) {
                    const targetEdgeTraverses = (_a = byType[srcPort]) !== null && _a !== void 0 ? _a : [];
                    let nodeRefAndEdges;
                    if (!newNode) {
                        nodeRefAndEdges = await this.traverseGraph(trc, null, origNode, targetEdgeTraverses);
                    }
                    else {
                        nodeRefAndEdges = await this.traverseGraph(trc, null, newNode, targetEdgeTraverses);
                    }
                    for (const ref of nodeRefAndEdges) {
                        if (!this.pendingPropagatedFields[ref.type]) {
                            this.pendingPropagatedFields[ref.type] = {};
                        }
                        if (!this.pendingPropagatedFields[ref.type][ref.id]) {
                            this.pendingPropagatedFields[ref.type][ref.id] = newPropagatedFields;
                        }
                        else {
                            this.pendingPropagatedFields[ref.type][ref.id] = SimplyImmutable.deepUpdateImmutable(this.pendingPropagatedFields[ref.type][ref.id], newPropagatedFields);
                        }
                    }
                }
            }
        }
    }
    async finalizeIndexPropagation(trc) {
        for (const type in this.pendingPropagatedFields) {
            const toReindex = Object.keys(this.pendingPropagatedFields[type]);
            const chunks = conduit_utils_1.chunkArray(toReindex, INDEX_TRAVERSALS_CHUNK_SIZE);
            for (const chunk of chunks) {
                const targetNodes = await this.batchGetNodes(trc, null, type, chunk);
                const ps = [];
                for (const targetNode of targetNodes) {
                    if (targetNode) {
                        // Reindex node will pull and delete the pending propagated fields
                        const propagatedFields = await this.reindexNode(trc, targetNode, targetNode);
                        ps.push(this._setNode(trc, targetNode, targetNode, undefined, propagatedFields));
                    }
                }
                await conduit_utils_1.allSettled(ps);
            }
        }
    }
    async reindexNode(trc, origNode, node) {
        if (!origNode && !node) {
            return {};
        }
        const nodeRef = { id: (origNode === null || origNode === void 0 ? void 0 : origNode.id) || node.id, type: (origNode === null || origNode === void 0 ? void 0 : origNode.type) || node.type };
        if (node && node.dummy) {
            return {};
        }
        if (!(await this.hasIndexesConfigured(trc))) {
            return {};
        }
        const pending = this.pendingPropagatedFields[nodeRef.type] && this.pendingPropagatedFields[nodeRef.type][nodeRef.id];
        const propagatedFields = pending ? SimplyImmutable.cloneMutable(pending) : {};
        const origResolvedFields = origNode ? await this.config.indexer.resolveAllFields(trc, origNode, this.nodeFieldLookup, origNode.PropagatedFields || {}) : {};
        const resolvedFields = node ? await this.config.indexer.resolveAllFields(trc, node, this.nodeFieldLookup, propagatedFields) : {};
        const fieldsChanged = Object.keys(resolvedFields).filter(field => !conduit_utils_1.isEqual(origResolvedFields[field], resolvedFields[field]));
        const typeIndexes = await this.getIndexesForType(trc, nodeRef.type);
        const indexes = node ? GraphIndexTypes_1.indexesWithAnyParams(typeIndexes, fieldsChanged) : typeIndexes;
        const ps = [];
        ps.push(this.replaceSyncContextIndexes(trc, origNode, node));
        for (const indexItem of indexes) {
            if (GraphIndexTypes_1.isLookup(indexItem)) {
                const lookupValue = resolvedFields[indexItem];
                ps.push(this.setNodeFieldLookupValue(trc, nodeRef, indexItem, !lookupValue ? lookupValue : lookupValue[0]));
            }
            else {
                const tree = this.readWriteTreeForTypeAndIndex(nodeRef.type, indexItem, false);
                const keysToInsert = this.config.indexer.keysForNodeAndIndex(node, indexItem, resolvedFields);
                const keysToRemove = this.config.indexer.keysForNodeAndIndex(origNode, indexItem, origResolvedFields);
                ps.push(tree.replaceMulti(trc, keysToRemove, keysToInsert));
                if (indexItem.inMemoryIndex && await this.isIndexLoadedInMemory(trc, nodeRef.type, indexItem)) {
                    const inMemoryTree = this.readWriteTreeForTypeAndIndex(nodeRef.type, indexItem, true);
                    ps.push(inMemoryTree.replaceMulti(trc, keysToRemove, keysToInsert));
                }
            }
        }
        const propagationConfig = this.config.indexer.propagationConfig[nodeRef.type];
        if (propagationConfig) {
            ps.push(this.prepareIndexPropagation(trc, propagationConfig, origNode, node));
        }
        await conduit_utils_1.allSettled(ps);
        if (pending) {
            delete this.pendingPropagatedFields[nodeRef.type][nodeRef.id];
        }
        return propagatedFields;
    }
    async replaceSyncContextIndexes(trc, prev, current) {
        const ps = [];
        let adds = [];
        let removes = [];
        if (prev) {
            if (current) {
                for (const syncContext of prev.syncContexts) {
                    if (!current.syncContexts.includes(syncContext) || prev.id !== current.id) {
                        removes.push(syncContext);
                    }
                }
                for (const syncContext of current.syncContexts) {
                    if (!prev.syncContexts.includes(syncContext) || prev.id !== current.id) {
                        adds.push(syncContext);
                    }
                }
            }
            else {
                removes = prev.syncContexts;
            }
            for (const syncContext of removes) {
                ps.push(this.removeSyncContextIndex(trc, syncContext, prev));
            }
        }
        else if (current) {
            adds = current.syncContexts;
        }
        if (current) {
            for (const syncContext of adds) {
                ps.push(this.addSyncContextIndex(trc, syncContext, current));
            }
        }
        await conduit_utils_1.allSettled(ps);
    }
    async applyPendingNodeUpdates(trc, nodeRef, origNode, changes) {
        const isDummy = !isNodeReal(origNode);
        let node = origNode;
        let doNotIndex = false;
        const update = {
            inputs: {},
            outputs: {},
        };
        for (const change of changes) {
            if (isGraphEdgeChange(change)) {
                const edge = change.edge;
                if (!node) {
                    if (change.isRemove) {
                        continue;
                    }
                    // init dummy node to retain the edge.
                    const edgeStructure = this.nodeDefaultEdgeStructure(nodeRef.type);
                    node = Object.assign(Object.assign({}, edgeStructure), { id: nodeRef.id, type: nodeRef.type, version: 0 });
                }
                if (edge.srcID === nodeRef.id) {
                    if (edge.srcPort) {
                        const srcTerminus = GraphTypes_1.getEdgeTerminusName(edge.dstID, edge.dstPort);
                        update.outputs[edge.srcPort] = update.outputs[edge.srcPort] || {};
                        update.outputs[edge.srcPort][srcTerminus] = change.isRemove ? SimplyImmutable.REMOVE : edge;
                    }
                }
                else {
                    if (edge.dstPort) {
                        const dstTerminus = GraphTypes_1.getEdgeTerminusName(edge.srcID, edge.srcPort);
                        update.inputs[edge.dstPort] = update.inputs[edge.dstPort] || {};
                        update.inputs[edge.dstPort][dstTerminus] = change.isRemove ? SimplyImmutable.REMOVE : edge;
                    }
                }
            }
            else if (!isDummy) {
                if (change.doNotIndex) {
                    doNotIndex = true;
                }
                conduit_utils_1.objectSetField(change.value, change.path, update);
            }
        }
        if (node) {
            node = SimplyImmutable.deepUpdateImmutable(node, update);
            let propagatedFields;
            if (!isDummy && !doNotIndex) {
                propagatedFields = await this.reindexNode(trc, origNode, node);
            }
            node = (await this._setNode(trc, origNode, node, isDummy ? { dummy: true } : undefined, propagatedFields));
            node = await this.checkAndApplyAutoDelete(trc, nodeRef, node);
        }
        return node;
    }
    async addEdge(trc, edge, timestamp, excludeNode) {
        const updated = [];
        if (edge.srcPort) {
            const srcNodeRef = { id: edge.srcID, type: edge.srcType };
            const srcNode = nodeRefsEqual(srcNodeRef, excludeNode) ? null : await this.getNodeInternal(trc, srcNodeRef);
            const srcTerminus = GraphTypes_1.getEdgeTerminusName(edge.dstID, edge.dstPort);
            if (isNodeReal(srcNode)) {
                let updatedNode = SimplyImmutable.updateImmutable(srcNode, ['outputs', edge.srcPort, srcTerminus], edge);
                updatedNode = SimplyImmutable.updateImmutable(updatedNode, ['localChangeTimestamp'], timestamp !== null && timestamp !== void 0 ? timestamp : 0);
                const propagatedFields = await this.reindexNode(trc, srcNode, updatedNode);
                await this._setNode(trc, srcNode, updatedNode, undefined, propagatedFields);
                updated.push(srcNodeRef);
            }
            else {
                // Add a dummy node to retain the edge.
                const edgeStructure = this.nodeDefaultEdgeStructure(edge.srcType);
                await this._setNode(trc, srcNode, SimplyImmutable.updateImmutable(Object.assign(Object.assign({}, (srcNode || edgeStructure)), { id: edge.srcID, type: edge.srcType, version: 0 }), ['outputs', edge.srcPort, srcTerminus], edge), { dummy: true });
            }
        }
        if (edge.dstPort) {
            const dstNodeRef = { id: edge.dstID, type: edge.dstType };
            const dstNode = nodeRefsEqual(dstNodeRef, excludeNode) ? null : await this.getNodeInternal(trc, dstNodeRef);
            const dstTerminus = GraphTypes_1.getEdgeTerminusName(edge.srcID, edge.srcPort);
            if (isNodeReal(dstNode)) {
                let updatedNode = SimplyImmutable.updateImmutable(dstNode, ['inputs', edge.dstPort, dstTerminus], edge);
                updatedNode = SimplyImmutable.updateImmutable(updatedNode, ['localChangeTimestamp'], timestamp !== null && timestamp !== void 0 ? timestamp : 0);
                const propagatedFields = await this.reindexNode(trc, dstNode, updatedNode);
                await this._setNode(trc, dstNode, updatedNode, undefined, propagatedFields);
                updated.push(dstNodeRef);
            }
            else {
                // Add a dummy node to retain the edge.
                const edgeStructure = this.nodeDefaultEdgeStructure(edge.dstType);
                await this._setNode(trc, dstNode, SimplyImmutable.updateImmutable(Object.assign(Object.assign({}, (dstNode || edgeStructure)), { id: edge.dstID, type: edge.dstType, version: 0 }), ['inputs', edge.dstPort, dstTerminus], edge), { dummy: true });
            }
        }
        return updated;
    }
    async removeEdge(trc, edge, timestamp, excludeNode) {
        const srcNodeRef = { id: edge.srcID, type: edge.srcType };
        const srcNode = nodeRefsEqual(srcNodeRef, excludeNode) ? null : await this.getNodeInternal(trc, srcNodeRef);
        const dstNodeRef = { id: edge.dstID, type: edge.dstType };
        const dstNode = nodeRefsEqual(dstNodeRef, excludeNode) ? null : await this.getNodeInternal(trc, dstNodeRef);
        if (!srcNode && !dstNode) {
            return [];
        }
        const updated = [];
        if (edge.srcPort) {
            const srcTerminus = GraphTypes_1.getEdgeTerminusName(edge.dstID, edge.dstPort);
            if (isNodeReal(srcNode)) {
                let updatedNode = SimplyImmutable.deleteImmutable(srcNode, ['outputs', edge.srcPort, srcTerminus]);
                updatedNode = SimplyImmutable.updateImmutable(updatedNode, ['localChangeTimestamp'], timestamp !== null && timestamp !== void 0 ? timestamp : 0);
                const propagatedFields = await this.reindexNode(trc, srcNode, updatedNode);
                await this._setNode(trc, srcNode, updatedNode, undefined, propagatedFields);
                updated.push(srcNodeRef);
            }
            else if (srcNode) {
                await this._setNode(trc, srcNode, SimplyImmutable.deleteImmutable(srcNode, ['outputs', edge.srcPort, srcTerminus]), { dummy: true });
            }
        }
        if (edge.dstPort) {
            const dstTerminus = GraphTypes_1.getEdgeTerminusName(edge.srcID, edge.srcPort);
            if (isNodeReal(dstNode)) {
                let updatedNode = SimplyImmutable.deleteImmutable(dstNode, ['inputs', edge.dstPort, dstTerminus]);
                updatedNode = SimplyImmutable.updateImmutable(updatedNode, ['localChangeTimestamp'], timestamp !== null && timestamp !== void 0 ? timestamp : 0);
                const propagatedFields = await this.reindexNode(trc, dstNode, updatedNode);
                await this._setNode(trc, dstNode, updatedNode, undefined, propagatedFields);
                updated.push(dstNodeRef);
            }
            else if (dstNode) {
                await this._setNode(trc, dstNode, SimplyImmutable.deleteImmutable(dstNode, ['inputs', edge.dstPort, dstTerminus]), { dummy: true });
            }
        }
        return updated;
    }
    async applyNodePendingChanges(trc, nodeRef, node, getDummy) {
        if (!node && !getDummy) {
            return node;
        }
        const key = this.getPendingChangesKey(nodeRef);
        const pending = this.pendingChanges[key];
        if (pending) {
            delete this.pendingChanges[key];
            node = await this.applyPendingNodeUpdates(trc, nodeRef, node, pending.changes);
        }
        return node;
    }
    /*
     * Returns both dummy nodes and actual nodes.
     */
    async getNodeInternal(trc, nodeRef) {
        const node = await this.storage.getValidatedValue(trc, null, tableForNodeType(nodeRef.type), nodeRef.id, validateIsGraphNode);
        return this.applyNodePendingChanges(trc, nodeRef, node, true);
    }
    async getNode(trc, watcher, nodeRef, getDummy = false) {
        const node = await super.getNode(trc, watcher, nodeRef, getDummy);
        return this.applyNodePendingChanges(trc, nodeRef, node, getDummy);
    }
    async batchGetNodes(trc, watcher, type, nodeIDs, getDummy = false) {
        const nodes = await super.batchGetNodes(trc, watcher, type, nodeIDs, getDummy);
        for (let i = 0; i < nodes.length; ++i) {
            nodes[i] = await this.applyNodePendingChanges(trc, { id: nodeIDs[i], type }, nodes[i], getDummy);
        }
        return nodes;
    }
}
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "_updateIndexes", null);
__decorate([
    conduit_utils_1.traceAsync('reindexType', 'type', 'indexes')
], GraphTransactionContext.prototype, "reindexType", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "createNodeInternal", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "replaceNodeAndEdges", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "replaceNode", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "updateNode", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "updateNodeDeferred", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "deleteNodeInternal", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "setNodeCachedField", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "removeNodeCachedFields", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "replaceEdgesInternal", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "removeSyncContextIndex", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "addSyncContextIndex", null);
__decorate([
    conduit_utils_1.traceAsync('GraphStorageDB')
], GraphTransactionContext.prototype, "prepareIndexPropagation", null);
__decorate([
    conduit_utils_1.traceAsync('GraphStorageDB')
], GraphTransactionContext.prototype, "finalizeIndexPropagation", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "reindexNode", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "replaceSyncContextIndexes", null);
__decorate([
    conduit_utils_1.traceAsync
], GraphTransactionContext.prototype, "applyPendingNodeUpdates", null);
exports.GraphTransactionContext = GraphTransactionContext;
class GraphStorageDB extends GraphStorageBase {
    constructor(storage, ephemeralStorage, config, underlay, storageOverlay) {
        super(storage, ephemeralStorage, config, underlay);
        this.config = config;
        this.storageOverlay = storageOverlay;
    }
    async init(trc, version) {
        const curVersion = await this.storage.getValue(trc, null, Tables.DBMetadata, 'version');
        if (version !== curVersion) {
            await this.ephemeralStorage.transact(trc, 'GraphStorageDB init', async (etx) => {
                await this.storage.transact(trc, 'GraphStorageDB init', async (tx) => {
                    await tx.clearAll(trc);
                    await tx.setValue(trc, Tables.DBMetadata, 'version', version);
                });
                await etx.clearAll(trc);
            });
        }
    }
    async destructor(trc) {
        await super.destructor(trc);
        await this.storage.destructor();
        await this.ephemeralStorage.destructor();
    }
    async transact(trc, transactionName, func, mutexTimeoutOverride) {
        return await this.ephemeralStorage.transact(trc, transactionName, async (ephemeralOverlay) => {
            return await this.storage.transact(trc, transactionName, async (overlay) => {
                const ctx = new GraphTransactionContext(overlay, ephemeralOverlay, this.config, this);
                const fRes = await conduit_utils_1.withError(func(ctx));
                await ctx.destructor(trc);
                if (fRes.err) {
                    throw fRes.err;
                }
                const newIndexes = ctx.getNewIndexes();
                if (newIndexes) {
                    this.indexes.setData(newIndexes);
                }
                const newLookups = ctx.getNewLookups(trc);
                for (const tableName in newLookups) {
                    this.getNodeLookup(tableName).setData(newLookups[tableName]);
                }
                return fRes.data;
            }, mutexTimeoutOverride);
        }, mutexTimeoutOverride);
    }
    async importDatabase(trc, filename) {
        await this.storage.importDatabase(trc, filename);
        await this.indexes.reset();
    }
    generateUndoEvents() {
        if (!this.storageOverlay) {
            throw new Error('Can only generate undo events for overlays');
        }
        return this.storageOverlay.generateUndoEvents();
    }
    createOverlay(inheritChangeEvents) {
        const kvOverlay = new KeyValStorage_1.KeyValOverlay(this.storage, inheritChangeEvents);
        const ephemeralOverlay = new KeyValStorage_1.KeyValOverlay(this.ephemeralStorage, inheritChangeEvents);
        return new GraphStorageDB(kvOverlay, ephemeralOverlay, this.config, this, kvOverlay);
    }
    async configureIndexes(trc, locale, setProgress) {
        var _a, _b, _c, _d, _e;
        const oldResolverVersions = await this.loadStoredResolverVersions(trc);
        ;
        let resolverVersions = SimplyImmutable.cloneImmutable(oldResolverVersions);
        const mustBeReindexed = {};
        const newIndexes = {};
        const priorities = {};
        for (const typeStr in this.config.indexer.config) {
            const type = typeStr;
            const typeConfig = this.config.indexer.config[type];
            const resolversLookup = {};
            for (const field in typeConfig.indexResolvers) {
                resolversLookup[field] = [];
            }
            const oldResolvers = oldResolverVersions[type] || {};
            priorities[type] = (_a = typeConfig.priority) !== null && _a !== void 0 ? _a : GraphIndexTypes_1.IndexPriority.DEFAULT;
            for (const key in typeConfig.indexes) {
                const indexItem = typeConfig.indexes[key];
                for (const fieldDef of indexItem.index) {
                    const field = fieldDef.field;
                    resolversLookup[field].push(indexItem);
                }
                const tableName = tableForIndex(type, indexItem);
                newIndexes[tableName] = {
                    indexConfigVersion: GraphIndexTypes_1.INDEX_CONFIG_VERSION,
                    type,
                    tableName,
                    indexItem: GraphIndexTypes_1.toStoredIndexItem(indexItem),
                };
            }
            for (const lookupField of typeConfig.lookups) {
                resolversLookup[lookupField].push(lookupField);
                const tableName = tableForNodeLookup(type, lookupField);
                newIndexes[tableName] = {
                    indexConfigVersion: GraphIndexTypes_1.INDEX_CONFIG_VERSION,
                    type,
                    tableName,
                    lookupField,
                };
            }
            // Check for versioned resolvers
            for (const field in typeConfig.indexResolvers) {
                const resolverConfig = typeConfig.indexResolvers[field];
                if (resolverConfig.version) {
                    const oldVersion = oldResolvers[field] || 0;
                    if (oldVersion < resolverConfig.version) {
                        // Update resolver versions
                        const updatedResolvers = SimplyImmutable.updateImmutable(oldResolvers, [field], resolverConfig.version);
                        resolverVersions = SimplyImmutable.replaceImmutable(resolverVersions, [type], updatedResolvers);
                        // Mark affected indexes to reindex
                        const indexes = resolversLookup[field];
                        for (const index of indexes) {
                            let tableName;
                            if (GraphIndexTypes_1.isLookup(index)) {
                                tableName = tableForNodeLookup(type, index);
                            }
                            else {
                                tableName = tableForIndex(type, index);
                            }
                            mustBeReindexed[tableName] = true;
                        }
                    }
                }
            }
        }
        setProgress && await setProgress(trc, 0.05);
        // compare config to stored
        const oldIndexes = await this.indexes.getData(trc);
        const newLocale = locale || ((_b = oldIndexes.locale) === null || _b === void 0 ? void 0 : _b.locale);
        newIndexes.locale = fakeStoredIndexForLocale(newLocale);
        const localeChanged = Boolean(locale && locale !== ((_c = oldIndexes.locale) === null || _c === void 0 ? void 0 : _c.locale));
        if (localeChanged) {
            conduit_utils_1.logger.info(`Locale changed to: ${(_d = newIndexes.locale) === null || _d === void 0 ? void 0 : _d.locale} from: ${(_e = oldIndexes.locale) === null || _e === void 0 ? void 0 : _e.locale}`);
        }
        const indexUpdateResult = await this.transact(trc, 'configureIndexes', async (tx) => {
            this.config.indexer.locale = newLocale;
            if (!IndexSchemaDiff_1.haveStoredIndexesChanged(oldIndexes, newIndexes) && !localeChanged && conduit_utils_1.isStashEmpty(mustBeReindexed)) {
                // no change
                setProgress && await setProgress(trc, 1);
                return null;
            }
            setProgress && await setProgress(trc, 0.1);
            return await tx._updateIndexes(trc, oldIndexes, newIndexes, priorities, localeChanged, mustBeReindexed, setProgress);
        });
        if (!indexUpdateResult) {
            setProgress && await setProgress(trc, 1);
            return 0;
        }
        const { changeCount, changedIndexes, propagatedFieldUpdatesByType } = indexUpdateResult;
        for (const type in propagatedFieldUpdatesByType) {
            const propagatedFieldUpdates = propagatedFieldUpdatesByType[type];
            const chunks = conduit_utils_1.chunkArray(Object.keys(propagatedFieldUpdates), NODES_PER_REINDEX_BATCH);
            for (const chunk of chunks) {
                await this.transact(trc, 'updatePropagatedFields', async (tx) => {
                    const nodes = await tx.batchGetNodes(trc, null, type, chunk);
                    if (!nodes) {
                        return;
                    }
                    const ps = [];
                    for (const node of nodes) {
                        if (node) {
                            ps.push(tx._setNode(trc, node, node, undefined, propagatedFieldUpdates[node.id]));
                        }
                    }
                    await conduit_utils_1.allSettled(ps);
                });
            }
        }
        setProgress && await setProgress(trc, 0.95);
        // finalize last, to write the newIndex configuration; this is to handle the case where the client crashes or
        // is closed during this logical transaction
        await this.transact(trc, 'configureIndexes', async (tx) => {
            await tx._finalizeIndexesUpdate(trc, newIndexes, changedIndexes, resolverVersions, !conduit_utils_1.isStashEmpty(mustBeReindexed));
        });
        setProgress && await setProgress(trc, 1);
        return changeCount;
    }
}
__decorate([
    conduit_utils_1.traceAsync
], GraphStorageDB.prototype, "configureIndexes", null);
exports.GraphStorageDB = GraphStorageDB;
//# sourceMappingURL=GraphStorageDB.js.map