"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeRefFromInstanceData = exports.convertEdgeFromEntityID = exports.convertEdgeFromEntityRef = exports.convertEdgeFromIdentityID = exports.convertEdgeFromUserID = exports.convertProfileGuidFromService = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
function convertProfileGuidFromService(source, id) {
    return (`Profile:${source}:${id}`);
}
exports.convertProfileGuidFromService = convertProfileGuidFromService;
function convertEdgeFromUserID(nsyncInstancePath) {
    return (instance, context, typeDef, edgeName) => {
        if (!typeDef.edges) {
            return null;
        }
        const path = (nsyncInstancePath || edgeName).split('.');
        const value = Number(conduit_utils_1.walkObjectPath(instance, path, null));
        if (!isNaN(value)) {
            const profileID = convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.User, value);
            return {
                id: profileID,
                type: 'Profile',
            };
        }
        return null;
    };
}
exports.convertEdgeFromUserID = convertEdgeFromUserID;
;
function convertEdgeFromIdentityID(nsyncInstancePath) {
    return (instance, context, typeDef, edgeName) => {
        if (!typeDef.edges) {
            return null;
        }
        const path = (nsyncInstancePath || edgeName).split('.');
        const value = Number(conduit_utils_1.walkObjectPath(instance, path, null));
        if (!isNaN(value)) {
            const profileID = convertProfileGuidFromService(en_core_entity_types_1.PROFILE_SOURCE.Identity, value);
            return {
                id: profileID,
                type: 'Profile',
            };
        }
        return null;
    };
}
exports.convertEdgeFromIdentityID = convertEdgeFromIdentityID;
;
function convertEdgeFromEntityRef(nsyncInstancePath) {
    return (instance, context, typeDef, edgeName) => {
        return edgeRefFromInstanceData(instance, context, typeDef, nsyncInstancePath || edgeName);
    };
}
exports.convertEdgeFromEntityRef = convertEdgeFromEntityRef;
function convertEdgeFromEntityID(type, nsyncInstancePath) {
    return (instance, context, typeDef, edgePath) => {
        const path = (nsyncInstancePath || edgePath).split('.');
        const value = conduit_utils_1.walkObjectPath(instance, path, null);
        if (conduit_utils_1.getTypeOf(value) === 'string') {
            return {
                type,
                id: value,
            };
        }
        return null;
    };
}
exports.convertEdgeFromEntityID = convertEdgeFromEntityID;
function validateEntityRef(edge) {
    if (conduit_utils_1.getTypeOf(edge) !== 'object') {
        return false;
    }
    if (conduit_utils_1.getTypeOf(edge.id) !== 'string') {
        return false;
    }
    return true;
}
function edgeRefFromInstanceData(instance, context, typeDef, edgePath) {
    if (!typeDef.edges) {
        return null;
    }
    const path = (edgePath).split('.');
    const value = conduit_utils_1.walkObjectPath(instance, path, null);
    if (conduit_utils_1.getTypeOf(value) === 'object') {
        const type = context.di.convertNsyncTypeToNodeType(value.type);
        if (type && validateEntityRef(value)) {
            return {
                id: value.id,
                type,
            };
        }
    }
    return null;
}
exports.edgeRefFromInstanceData = edgeRefFromInstanceData;
//# sourceMappingURL=EdgeConverters.js.map