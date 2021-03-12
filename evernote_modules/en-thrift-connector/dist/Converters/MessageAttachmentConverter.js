"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNewIdentity = exports.addNewShare = exports.convertIdentityGuidToService = exports.convertIdentityGuidFromService = void 0;
const conduit_storage_1 = require("conduit-storage");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const ProfileConverter_1 = require("./ProfileConverter");
function lookupToString(lookupTable, type, defaultRet) {
    return type && lookupTable[type] || defaultRet;
}
const attachmentTypeLookup = [
    'UNKNOWN',
    'NOTE',
    'NOTEBOOK',
];
function convertIdentityGuidFromService(guid) {
    return `Identity:${guid}`;
}
exports.convertIdentityGuidFromService = convertIdentityGuidFromService;
function convertIdentityGuidToService(nodeID) {
    return Number(nodeID.slice('Identity:'.length));
}
exports.convertIdentityGuidToService = convertIdentityGuidToService;
function invitationFromAttachment(invitationID, serviceData, sharerID, sentAt) {
    const shareNode = {
        id: invitationID,
        type: en_core_entity_types_1.CoreEntityTypes.Invitation,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: serviceData.title || '',
        NodeFields: {
            created: sentAt || null,
            snippet: serviceData.snippet || '',
            invitationType: lookupToString(attachmentTypeLookup, serviceData.type, 'UNKNOWN'),
            internal_attachment: serviceData,
        },
        inputs: {},
        outputs: {
            sharer: {},
            owner: {},
        },
    };
    if (serviceData.userId) {
        conduit_storage_1.addOutputEdgeToNode(shareNode, 'owner', {
            id: Converters_1.convertGuidFromService(serviceData.userId, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            port: null,
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
        });
    }
    if (sharerID) {
        conduit_storage_1.addOutputEdgeToNode(shareNode, 'sharer', {
            id: Converters_1.convertGuidFromService(sharerID, en_core_entity_types_1.CoreEntityTypes.Profile, en_core_entity_types_1.PROFILE_SOURCE.User),
            port: null,
            type: en_core_entity_types_1.CoreEntityTypes.Profile,
        });
    }
    return shareNode;
}
async function addNewShare(trc, params, syncContext, globalShareID, sharerID, sentAt, serviceData) {
    const invitation = invitationFromAttachment(Converters_1.convertGuidFromService(globalShareID, en_core_entity_types_1.CoreEntityTypes.Invitation), serviceData, sharerID, sentAt);
    await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, invitation);
}
exports.addNewShare = addNewShare;
async function addNewIdentity(trc, params, syncContext, serviceData) {
    var _a;
    if (serviceData.contact) {
        const status = ((_a = serviceData.deactivated) !== null && _a !== void 0 ? _a : false) ? en_core_entity_types_1.ProfileStatusEnum.INACTIVE : en_core_entity_types_1.ProfileStatusEnum.ACTIVE;
        await ProfileConverter_1.ProfileConverter.convertFromService(trc, params, syncContext, ProfileConverter_1.profileFromIdentity(serviceData, ProfileConverter_1.ProfileSourceConfidence.Source, status));
    }
}
exports.addNewIdentity = addNewIdentity;
//# sourceMappingURL=MessageAttachmentConverter.js.map