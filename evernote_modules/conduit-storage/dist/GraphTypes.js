"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.denormalizeEdgeDefinitions = exports.getEdgeDefinitionEndpoint = exports.isEdgeEndpointConstraint = exports.isNodeOutputEdgeDefinition = exports.isNodeInputEdgeDefinition = exports.addOutputEdgeToNode = exports.addInputEdgeToNode = exports.getEdgeConnection = exports.getEdgeTerminusName = exports.EdgeType = exports.EdgeConstraint = exports.SyncSource = exports.isGraphEdge = exports.isGraphNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const simply_immutable_1 = require("simply-immutable");
function isGraphNode(obj) {
    if (obj && obj.hasOwnProperty('inputs') && obj.hasOwnProperty('version')) {
        return true;
    }
    return false;
}
exports.isGraphNode = isGraphNode;
function isGraphEdge(obj) {
    return obj && obj.hasOwnProperty('dstID') && obj.hasOwnProperty('srcID');
}
exports.isGraphEdge = isGraphEdge;
var SyncSource;
(function (SyncSource) {
    SyncSource[SyncSource["THRIFT"] = 1] = "THRIFT";
    SyncSource[SyncSource["NSYNC"] = 2] = "NSYNC";
    SyncSource[SyncSource["LOCAL"] = 3] = "LOCAL";
    SyncSource[SyncSource["HYBRID"] = 4] = "HYBRID";
})(SyncSource = exports.SyncSource || (exports.SyncSource = {}));
var EdgeConstraint;
(function (EdgeConstraint) {
    EdgeConstraint[EdgeConstraint["OPTIONAL"] = 1] = "OPTIONAL";
    EdgeConstraint[EdgeConstraint["REQUIRED"] = 2] = "REQUIRED";
    EdgeConstraint[EdgeConstraint["MANY"] = 3] = "MANY";
})(EdgeConstraint = exports.EdgeConstraint || (exports.EdgeConstraint = {}));
var EdgeType;
(function (EdgeType) {
    EdgeType[EdgeType["ANCESTRY"] = 1] = "ANCESTRY";
    EdgeType[EdgeType["ANCESTRY_LINK"] = 2] = "ANCESTRY_LINK";
    EdgeType[EdgeType["VIEW"] = 3] = "VIEW";
    EdgeType[EdgeType["LINK"] = 4] = "LINK";
    EdgeType[EdgeType["MEMBERSHIP"] = 5] = "MEMBERSHIP";
})(EdgeType = exports.EdgeType || (exports.EdgeType = {}));
function getEdgeTerminusName(nodeID, port) {
    return nodeID + ':' + (port || '');
}
exports.getEdgeTerminusName = getEdgeTerminusName;
function getEdgeConnection(edge, nodeID) {
    return edge.srcID === nodeID ? {
        id: edge.dstID,
        type: edge.dstType,
        port: edge.srcPort,
        fullPort: 'outputs:' + edge.srcPort,
    } : {
        id: edge.srcID,
        type: edge.srcType,
        port: edge.dstPort,
        fullPort: edge.dstPort ? ('inputs:' + edge.dstPort) : null,
    };
}
exports.getEdgeConnection = getEdgeConnection;
function addInputEdgeToNode(node, port, terminus) {
    const edge = {
        srcID: terminus.id,
        srcType: terminus.type,
        srcPort: terminus.port,
        dstID: node.id,
        dstType: node.type,
        dstPort: port,
    };
    node.inputs[port][getEdgeTerminusName(edge.srcID, edge.srcPort)] = edge;
}
exports.addInputEdgeToNode = addInputEdgeToNode;
function addOutputEdgeToNode(node, port, terminus) {
    const edge = {
        srcID: node.id,
        srcType: node.type,
        srcPort: port,
        dstID: terminus.id,
        dstType: terminus.type,
        dstPort: terminus.port,
    };
    node.outputs[port][getEdgeTerminusName(edge.dstID, edge.dstPort)] = edge;
}
exports.addOutputEdgeToNode = addOutputEdgeToNode;
function isNodeInputEdgeDefinition(edgeDef) {
    return edgeDef.hasOwnProperty('from');
}
exports.isNodeInputEdgeDefinition = isNodeInputEdgeDefinition;
function isNodeOutputEdgeDefinition(edgeDef) {
    return edgeDef.hasOwnProperty('to');
}
exports.isNodeOutputEdgeDefinition = isNodeOutputEdgeDefinition;
function isEdgeEndpointConstraint(endpoint) {
    return !Array.isArray(endpoint) && typeof endpoint !== 'string';
}
exports.isEdgeEndpointConstraint = isEdgeEndpointConstraint;
function getEdgeDefinitionEndpoint(edgeDef) {
    return isNodeInputEdgeDefinition(edgeDef) ? { isInput: true, endpoint: edgeDef.from } : { isInput: false, endpoint: edgeDef.to };
}
exports.getEdgeDefinitionEndpoint = getEdgeDefinitionEndpoint;
function denormalizeEdgeDefinitions(nodeTypesIn) {
    var _a;
    const out = {};
    function addConnections(type1, port1, constraint, edgeType, type2, port2, isInput, isOwned) {
        var _a;
        const type1Array = conduit_utils_1.toArray(type1);
        const type2Array = conduit_utils_1.toArray(type2);
        for (const t1 of type1Array) {
            if (!out.hasOwnProperty(t1)) {
                throw new Error(`Failed to add connection from ${type1}:${port1} to ${type2}:${port2}: no type ${t1} defined`);
            }
            const portConfigMap = isInput ? out[t1].inputs : out[t1].outputs;
            portConfigMap[port1] = {
                constraint,
                type: edgeType,
                connections: ((_a = portConfigMap[port1]) === null || _a === void 0 ? void 0 : _a.connections) || [],
                isOwned,
            };
            for (const t2 of type2Array) {
                if (port2.length === 0) {
                    portConfigMap[port1].connections.push([t2, null]);
                }
                else {
                    for (const p2 of port2) {
                        portConfigMap[port1].connections.push([t2, p2]);
                    }
                }
            }
        }
    }
    const membershipTargetTypes = {};
    for (const nodeType in nodeTypesIn) {
        const typedef = nodeTypesIn[nodeType];
        out[nodeType] = Object.assign(Object.assign({}, typedef), { inputs: {}, outputs: {}, ancestorPort: null });
        if (typedef.hasMemberships) {
            membershipTargetTypes[typedef.hasMemberships.to] = membershipTargetTypes[typedef.hasMemberships.to] || [];
            membershipTargetTypes[typedef.hasMemberships.to].push(nodeType);
        }
        const edges = out[nodeType].edges;
        if (edges) {
            out[nodeType].edges = simply_immutable_1.cloneMutable(edges);
        }
    }
    for (const nodeTypeStr in nodeTypesIn) {
        const nodeType = nodeTypeStr;
        const edges = out[nodeType].edges || {};
        for (const port in edges) {
            const edgeDef = edges[port];
            const { isInput, endpoint } = getEdgeDefinitionEndpoint(edgeDef);
            if (isInput && (edgeDef.type === EdgeType.ANCESTRY || edgeDef.type === EdgeType.ANCESTRY_LINK)) {
                if (out[nodeType].ancestorPort) {
                    throw new Error(`Multiple ANCESTRY edges defined on type ${nodeType}; only one is allowed.`);
                }
                out[nodeType].ancestorPort = port;
            }
            if (isEdgeEndpointConstraint(endpoint)) {
                if (edgeDef.type === EdgeType.MEMBERSHIP) {
                    endpoint.type = (_a = membershipTargetTypes[nodeType]) !== null && _a !== void 0 ? _a : [];
                    edgeDef.from.type = endpoint.type;
                }
                const denormalize = conduit_utils_1.toArray(endpoint.denormalize);
                addConnections(nodeType, port, edgeDef.constraint, edgeDef.type, endpoint.type, denormalize, isInput, true);
                for (const denormalPort of denormalize) {
                    addConnections(endpoint.type, denormalPort, endpoint.constraint, edgeDef.type, nodeType, [port], !isInput, false);
                }
            }
            else {
                addConnections(nodeType, port, edgeDef.constraint, edgeDef.type, endpoint, [], isInput, true);
            }
        }
    }
    return out;
}
exports.denormalizeEdgeDefinitions = denormalizeEdgeDefinitions;
//# sourceMappingURL=GraphTypes.js.map