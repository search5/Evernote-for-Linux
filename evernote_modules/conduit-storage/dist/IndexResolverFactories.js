"use strict";
/*
* Copyright 2020 Evernote Corporation. All rights reserved.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexByResolverForDenormalizedEdgeCount = exports.getIndexByResolverForDenormalizedEdge = exports.getIndexByResolverForEdgeCount = exports.getIndexByResolverForEdge = exports.getIndexByResolverForPrimitives = void 0;
const conduit_utils_1 = require("conduit-utils");
const GraphTypes_1 = require("./GraphTypes");
function getIndexByResolverForPrimitives(nodeTypeDef, path, useLocaleCompare) {
    let schemaType = null;
    let graphqlPath = path;
    if (path[0] === 'NodeFields') {
        graphqlPath = path.slice(1);
        schemaType = conduit_utils_1.traverseSchema(nodeTypeDef.schema, graphqlPath);
    }
    else if (path[0] === 'label') {
        schemaType = 'string';
    }
    else if (path[0] === 'id') {
        graphqlPath = ['id'];
        schemaType = 'ID';
    }
    if (!schemaType) {
        throw new Error(`Cannot find schema type for index resolver (${path.join('.')})`);
    }
    if (!conduit_utils_1.fieldTypeIsBasic(schemaType)) {
        throw new Error(`Unindexable schema type (${schemaType}) for index resolver (${path.join('.')})`);
    }
    return {
        schemaType,
        resolver: path,
        graphqlPath,
        useLocaleCompare: useLocaleCompare !== null && useLocaleCompare !== void 0 ? useLocaleCompare : path[0] === 'label',
    };
}
exports.getIndexByResolverForPrimitives = getIndexByResolverForPrimitives;
function buildResolverForEdge(entityRefTypes, path, constraint) {
    const needsFullRef = !Array.isArray(entityRefTypes) || entityRefTypes.length !== 1;
    let schemaType = 'ID';
    if (needsFullRef) {
        schemaType = 'EntityRef';
    }
    if (constraint === GraphTypes_1.EdgeConstraint.OPTIONAL) {
        // make it nullable
        schemaType = conduit_utils_1.Nullable(schemaType);
    }
    const useSrc = path[0] === 'inputs';
    async function resolver(trc, node, nodeFieldLookup) {
        const edgePort = conduit_utils_1.walkObjectPathSupportsNumeric(node, path);
        const edge = conduit_utils_1.firstStashEntry(edgePort);
        if (!edge) {
            return [null];
        }
        if (needsFullRef) {
            return [{
                    id: useSrc ? edge.srcID : edge.dstID,
                    type: useSrc ? edge.srcType : edge.dstType,
                }];
        }
        return [useSrc ? edge.srcID : edge.dstID];
    }
    return {
        schemaType,
        entityRefTypes,
        resolver,
        graphqlPath: needsFullRef ? path.slice(1) : path.slice(1).concat('id'),
    };
}
function getEntityRefTypes(nodeTypeDef, edgePath) {
    var _a;
    const edgeConfig = (_a = nodeTypeDef[edgePath[0]]) === null || _a === void 0 ? void 0 : _a[edgePath[1]];
    const { endpoint } = GraphTypes_1.getEdgeDefinitionEndpoint(edgeConfig);
    const entityRefTypes = [];
    if (GraphTypes_1.isEdgeEndpointConstraint(endpoint)) {
        entityRefTypes.push(...conduit_utils_1.toArray(endpoint.type));
    }
    else {
        entityRefTypes.push(...conduit_utils_1.toArray(endpoint));
    }
    return entityRefTypes;
}
function getIndexByResolverForEdge(nodeTypeDef, edgePath) {
    var _a;
    const edgeConfig = (_a = nodeTypeDef[edgePath[0]]) === null || _a === void 0 ? void 0 : _a[edgePath[1]];
    if (!edgeConfig) {
        throw new Error(`Bad path passed to getIndexByResolverForEdge(): ${nodeTypeDef.name}.${edgePath.join('.')}`);
    }
    if (edgeConfig.constraint === GraphTypes_1.EdgeConstraint.MANY) {
        throw new Error('EdgeConstraint.MANY edges currently not supported by getIndexByResolverForEdge()');
    }
    const { isInput } = GraphTypes_1.getEdgeDefinitionEndpoint(edgeConfig);
    const path = [isInput ? 'inputs' : 'outputs'];
    path.push(edgePath[1]);
    let entityRefTypes = getEntityRefTypes(nodeTypeDef, edgePath);
    if (entityRefTypes.length === 0) {
        entityRefTypes = (def) => {
            return getEntityRefTypes(def, edgePath);
        };
    }
    return buildResolverForEdge(entityRefTypes, path, edgeConfig.constraint);
}
exports.getIndexByResolverForEdge = getIndexByResolverForEdge;
function getIndexByResolverForEdgeCount(nodeTypeDef, edgePath) {
    var _a;
    const edgeConfig = (_a = nodeTypeDef[edgePath[0]]) === null || _a === void 0 ? void 0 : _a[edgePath[1]];
    if (!edgeConfig) {
        throw new Error(`Bad path passed to getIndexByResolverForEdgeCount(): ${nodeTypeDef.name}.${edgePath.join('.')}`);
    }
    if (edgeConfig.constraint !== GraphTypes_1.EdgeConstraint.MANY) {
        throw new Error('Must use EdgeConstraint.MANY edges for getIndexByResolverForEdgeCount()');
    }
    const { isInput } = GraphTypes_1.getEdgeDefinitionEndpoint(edgeConfig);
    const path = [isInput ? 'inputs' : 'outputs', edgePath[1]];
    return {
        schemaType: 'int',
        resolver: path,
        graphqlPath: [`${path[1]}Count`],
        isUnSyncedField: true,
    };
}
exports.getIndexByResolverForEdgeCount = getIndexByResolverForEdgeCount;
function getDenormalizedPathAndConstraint(nodeType, sourceNodeTypeDef, sourceEdgePath, dstPort, funcName) {
    var _a;
    const edgeConfig = (_a = sourceNodeTypeDef[sourceEdgePath[0]]) === null || _a === void 0 ? void 0 : _a[sourceEdgePath[1]];
    if (!edgeConfig) {
        throw new Error(`Bad path passed to ${funcName}(): ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
    }
    const { isInput, endpoint } = GraphTypes_1.getEdgeDefinitionEndpoint(edgeConfig);
    const path = [isInput ? 'outputs' : 'inputs']; // note that these are reversed, because we want the denormalized path
    if (!GraphTypes_1.isEdgeEndpointConstraint(endpoint) || !endpoint.denormalize) {
        throw new Error(`${funcName}() called for an edge that is not denormalized: ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
    }
    if (!conduit_utils_1.toArray(endpoint.type).includes(nodeType)) {
        throw new Error(`${funcName}() called for an edge that is not denormalized to the desired node type: ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
    }
    if (Array.isArray(endpoint.denormalize)) {
        if (!dstPort) {
            throw new Error(`${funcName}() needs the denormalized port specified: ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
        }
        if (!endpoint.denormalize.includes(dstPort)) {
            throw new Error(`${funcName}() specified a denormalized port that does not exist: ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
        }
        path.push(dstPort);
    }
    else {
        if (dstPort && dstPort !== endpoint.denormalize) {
            throw new Error(`${funcName}() specified a denormalized port that does not exist: ${sourceNodeTypeDef.name}.${sourceEdgePath.join('.')}`);
        }
        path.push(endpoint.denormalize);
    }
    return { path, constraint: endpoint.constraint };
}
function getIndexByResolverForDenormalizedEdge(nodeType, sourceNodeTypeDef, sourceEdgePath, dstPort) {
    const { path, constraint } = getDenormalizedPathAndConstraint(nodeType, sourceNodeTypeDef, sourceEdgePath, dstPort, 'getIndexByResolverForDenormalizedEdge');
    return buildResolverForEdge([sourceNodeTypeDef.name], path, constraint);
}
exports.getIndexByResolverForDenormalizedEdge = getIndexByResolverForDenormalizedEdge;
function getIndexByResolverForDenormalizedEdgeCount(nodeType, sourceNodeTypeDef, sourceEdgePath, dstPort) {
    const { path, constraint } = getDenormalizedPathAndConstraint(nodeType, sourceNodeTypeDef, sourceEdgePath, dstPort, 'getIndexByResolverForDenormalizedEdgeCount');
    if (constraint !== GraphTypes_1.EdgeConstraint.MANY) {
        throw new Error('Must use EdgeConstraint.MANY edges for getIndexByResolverForDenormalizedEdgeCount()');
    }
    const graphqlField = `${path[1].startsWith('internal_') ? path[1].slice(9) : path[1]}Count`;
    return {
        schemaType: 'int',
        resolver: path,
        graphqlPath: [graphqlField],
        isUnSyncedField: true,
    };
}
exports.getIndexByResolverForDenormalizedEdgeCount = getIndexByResolverForDenormalizedEdgeCount;
//# sourceMappingURL=IndexResolverFactories.js.map