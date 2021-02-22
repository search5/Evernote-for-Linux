"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginResolvers = exports.defineStorageAccess = exports.initPlugins = exports.getNsyncAssociationKey = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
function getNsyncAssociationKey(srcType, dstType, associationType) {
    // TODO handle associationType when it becomes necessary
    return `${srcType}|${dstType}`;
}
exports.getNsyncAssociationKey = getNsyncAssociationKey;
function initPlugins(di, plugins, out) {
    const nodeTypes = {};
    for (const plugin of plugins) {
        if (!plugin) {
            continue;
        }
        out.plugins[plugin.name] = plugin;
        plugin.init && plugin.init().catch(e => conduit_utils_1.logger.error(`Unable to initalize plugin ${plugin.name}`, e));
        if (plugin.defineFileUploaderOverrides) {
            copyOrCollide(plugin.defineFileUploaderOverrides(di), out.fileUploaderOverrides, 'FileUploaderOverrides');
        }
        if (plugin.entityTypes) {
            const entityTypes = plugin.entityTypes(di);
            for (const entityType in entityTypes) {
                const def = entityTypes[entityType];
                copyOrCollide({ [entityType]: def.typeDef }, nodeTypes, `${entityType}.typeDef`);
                if (def.indexConfig) {
                    copyOrCollide({ [entityType]: def.indexConfig }, out.indexConfig, `${entityType}.indexConfig`);
                }
                if (def.dataResolver) {
                    copyOrCollide({ [entityType]: def.dataResolver }, out.dataResolvers, `${entityType}.dataResolver`);
                }
                if (def.nsyncConverters) {
                    copyOrCollide(def.nsyncConverters, out.nsyncConverters, `${entityType}.nsyncConverters`);
                    const nsyncType = Object.keys(def.nsyncConverters)[0];
                    out.nodeTypeToNSyncType[entityType] = parseInt(nsyncType, 10);
                    out.nsyncToNodeType[nsyncType] = entityType;
                }
                if (def.blobUploadDefs) {
                    out.fileUploaderBlobDefs[entityType] = out.fileUploaderBlobDefs[entityType] || {};
                    copyOrCollide(def.blobUploadDefs, out.fileUploaderBlobDefs[entityType], `${entityType}.blobUploadDefs`);
                }
            }
        }
        if (plugin.mutatorDefs) {
            copyOrCollide(plugin.mutatorDefs(di), out.mutatorDefinitions, `${plugin.name}.mutatorDefs`);
        }
        if (plugin.mutationRules) {
            out.mutationRules.push(...plugin.mutationRules(di));
        }
    }
    out.nodeTypes = conduit_storage_1.denormalizeEdgeDefinitions(nodeTypes);
    for (const typeStr in nodeTypes) {
        const type = typeStr;
        const edges = nodeTypes[type].edges || {};
        for (const port in edges) {
            const edgeDef = edges[port];
            const { isInput, endpoint } = conduit_storage_1.getEdgeDefinitionEndpoint(edgeDef);
            let endType;
            let endPort = null;
            if (conduit_storage_1.isEdgeEndpointConstraint(endpoint)) {
                endType = conduit_utils_1.toArray(endpoint.type)[0];
                endPort = endpoint.denormalize ? conduit_utils_1.toArray(endpoint.denormalize)[0] : null;
            }
            else {
                endType = conduit_utils_1.toArray(endpoint)[0];
            }
            const srcType = isInput ? endType : type;
            const dstType = isInput ? type : endType;
            const srcNsyncType = out.nodeTypeToNSyncType[srcType];
            const dstNsyncType = out.nodeTypeToNSyncType[dstType];
            if (conduit_utils_1.isNullish(srcNsyncType) || conduit_utils_1.isNullish(dstNsyncType)) {
                continue;
            }
            out.associationOwners[getNsyncAssociationKey(srcNsyncType, dstNsyncType, 0)] = {
                srcPort: isInput ? endPort : port,
                srcType,
                dstPort: isInput ? port : endPort,
                dstType,
                owner: isInput ? 'dst' : 'src',
            };
        }
    }
}
exports.initPlugins = initPlugins;
function defineStorageAccess(plugin, di, graphDB) {
    if (!plugin || !graphDB) {
        return;
    }
    if (plugin.defineStorageAccess) {
        plugin.defineStorageAccess(graphDB, di).catch(e => conduit_utils_1.logger.error(`Unable to set up storage access for plugin ${plugin.name}`, e));
    }
}
exports.defineStorageAccess = defineStorageAccess;
function copyOrCollide(src, dest, type) {
    for (const name in src) {
        if (dest[name]) {
            throw new Error(`Collision in namespaces for ${type} at ${name}`);
        }
    }
    Object.assign(dest, src);
}
function getPluginResolvers(plugins, di, type) {
    const out = {};
    for (const name in plugins) {
        const plugin = plugins[name];
        const func = type === 'Queries' ? plugin.defineQueries : plugin.defineMutators;
        if (func) {
            try {
                copyOrCollide(func(di), out, type);
            }
            catch (e) {
                conduit_utils_1.logger.error('Plugin error', e);
                continue;
            }
        }
    }
    return out;
}
exports.getPluginResolvers = getPluginResolvers;
//# sourceMappingURL=pluginManager.js.map