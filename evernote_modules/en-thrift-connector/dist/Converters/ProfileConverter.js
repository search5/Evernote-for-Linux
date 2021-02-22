"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileConverter = exports.convertProfileGuidFromService = exports.getUserProfileIDAndEmailFromProfileID = exports.profileFromContact = exports.profileFromIdentity = exports.profileFromUser = exports.profileFromUserProfile = exports.ProfileSourceConfidence = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const simply_immutable_1 = require("simply-immutable");
const ThriftTypes_1 = require("../ThriftTypes");
const Converters_1 = require("./Converters");
var ProfileSourceConfidence;
(function (ProfileSourceConfidence) {
    ProfileSourceConfidence[ProfileSourceConfidence["SharedNoteMembership"] = 1] = "SharedNoteMembership";
    ProfileSourceConfidence[ProfileSourceConfidence["Identity"] = 2] = "Identity";
    ProfileSourceConfidence[ProfileSourceConfidence["Source"] = 3] = "Source";
})(ProfileSourceConfidence = exports.ProfileSourceConfidence || (exports.ProfileSourceConfidence = {}));
function convertBusinessUserStatusToProfileStatusEnum(status) {
    switch (status) {
        case ThriftTypes_1.TBusinessUserStatus.ACTIVE:
            return en_data_model_1.ProfileStatusEnum.ACTIVE;
        case ThriftTypes_1.TBusinessUserStatus.DEACTIVATED:
            return en_data_model_1.ProfileStatusEnum.INACTIVE;
        default:
            conduit_utils_1.logger.debug(`Unknown BusinessUserStatus: ${status}`);
            return en_data_model_1.ProfileStatusEnum.ACTIVE; // Assume all profiles are active basically
    }
}
function profileFromUserProfile(profile, isSameBusiness) {
    return {
        source: en_data_model_1.PROFILE_SOURCE.User,
        id: profile.id,
        photoLastUpdated: profile.photoLastUpdated,
        photoUrl: profile.photoUrl,
        name: profile.name,
        email: profile.email,
        username: profile.username,
        userId: profile.id,
        confidence: ProfileSourceConfidence.Source,
        isSameBusiness,
        isConnected: isSameBusiness,
        isBlocked: false,
        status: convertBusinessUserStatusToProfileStatusEnum(profile.status),
    };
}
exports.profileFromUserProfile = profileFromUserProfile;
function profileFromUser(user, confidence = ProfileSourceConfidence.Source, status) {
    return {
        source: en_data_model_1.PROFILE_SOURCE.User,
        id: user.id,
        photoLastUpdated: user.photoLastUpdated,
        email: user.email,
        photoUrl: user.photoUrl,
        name: user.name,
        username: user.username,
        confidence,
        userId: user.id,
        isConnected: false,
        isBlocked: false,
        status,
    };
}
exports.profileFromUser = profileFromUser;
function profileFromIdentity(identity, confidence = ProfileSourceConfidence.Source, status) {
    if (!identity.contact) {
        throw new Error('Must have contact to convert to profile');
    }
    const id = identity.id;
    return {
        source: en_data_model_1.PROFILE_SOURCE.Identity,
        id,
        photoUrl: identity.contact.photoUrl,
        photoLastUpdated: identity.contact.photoLastUpdated,
        name: identity.contact.name || '',
        email: identity.contact.type === ThriftTypes_1.TContactType.EMAIL ? identity.contact.id : '',
        username: '',
        confidence,
        userId: identity.userId || (identity.contact.type === ThriftTypes_1.TContactType.EVERNOTE ? Number(identity.contact.id) : null),
        isSameBusiness: identity.sameBusiness || false,
        isConnected: identity.userConnected || false,
        isBlocked: identity.blocked || false,
        status,
    };
}
exports.profileFromIdentity = profileFromIdentity;
function profileFromContact(contact, confidence = ProfileSourceConfidence.Source, status) {
    const id = contact.id || '';
    return {
        source: en_data_model_1.PROFILE_SOURCE.Contact,
        id,
        photoUrl: contact.photoUrl,
        photoLastUpdated: contact.photoLastUpdated,
        name: contact.name || contact.id,
        email: '',
        username: '',
        confidence,
        userId: null,
        status,
    };
}
exports.profileFromContact = profileFromContact;
async function getUserProfileIDAndEmailFromProfileID(trc, db, id) {
    const idSplit = id.split(':');
    const node = await db.getNode(trc, null, { type: en_data_model_1.CoreEntityTypes.Profile, id });
    if (node && node.inputs.parent) {
        const parentEdge = conduit_utils_1.firstStashEntry(node.inputs.parent);
        if (parentEdge) {
            const parentVal = await getUserProfileIDAndEmailFromProfileID(trc, db, parentEdge.srcID);
            if (parentVal.email || parentVal.profileID) {
                return parentVal;
            }
        }
    }
    return {
        email: node && node.NodeFields.email ? node.NodeFields.email : undefined,
        profileID: idSplit[1] === en_data_model_1.PROFILE_SOURCE.User ? id : undefined,
        nodeID: id,
    };
}
exports.getUserProfileIDAndEmailFromProfileID = getUserProfileIDAndEmailFromProfileID;
function isNewProfile(currentProfile, newProfile) {
    if (currentProfile.label !== newProfile.label) {
        return true;
    }
    if (!conduit_utils_1.isEqual(conduit_utils_1.firstStashEntry(currentProfile.inputs.parent), conduit_utils_1.firstStashEntry(newProfile.inputs.parent))) {
        return true;
    }
    return !conduit_utils_1.isEqual(currentProfile.NodeFields, newProfile.NodeFields);
}
function mergeProfileData(mainData, newData) {
    const outData = simply_immutable_1.cloneMutable(mainData);
    for (const f in newData.NodeFields) {
        const field = f;
        if (field === 'photoUrl' || field === 'rootID') {
            continue;
        }
        if (field === 'status' && outData.NodeFields.status !== newData.NodeFields.status && newData.NodeFields.status !== null) {
            outData.NodeFields.status = newData.NodeFields.status;
        }
        if (field === 'isSameBusiness' && newData.NodeFields.isSameBusiness) {
            outData.NodeFields.isSameBusiness = true;
        }
        if (field === 'isConnected' && newData.NodeFields.isConnected) {
            outData.NodeFields.isConnected = true;
        }
        if (field === 'photoLastUpdated') {
            if (((newData.NodeFields.photoLastUpdated || 0) > (mainData.NodeFields.photoLastUpdated || 0))
                || (mainData.NodeFields.photoUrl === '' && mainData.NodeFields.photoLastUpdated === null)) {
                outData.NodeFields.photoLastUpdated = newData.NodeFields.photoLastUpdated;
                outData.NodeFields.photoUrl = newData.NodeFields.photoUrl;
            }
        }
        if (!mainData.NodeFields[field]) {
            outData.NodeFields[field] = newData.NodeFields[field];
        }
    }
    if (!outData.label) {
        outData.label = newData.label;
    }
    return outData;
}
// id can be a userID or an email
function convertProfileGuidFromService(source, id) {
    return (`Profile:${source}:${id}`);
}
exports.convertProfileGuidFromService = convertProfileGuidFromService;
class ProfileConverterClass {
    constructor() {
        this.nodeType = en_data_model_1.CoreEntityTypes.Profile;
    }
    convertGuidFromService(guid) {
        throw new Error('ProfileConverter.convertGuidFromService not supported, use Converters.convertGuidFromService instead!');
    }
    convertGuidToService(guid) {
        return guid.slice('Profile:USR:'.length);
    }
    async convertFromService(trc, params, syncContext, profile) {
        var _a, _b;
        const source = profile.source || en_data_model_1.PROFILE_SOURCE.User;
        const profileID = Converters_1.convertGuidFromService(profile.id, en_data_model_1.CoreEntityTypes.Profile, source);
        const currentProfile = await params.graphTransaction.getNode(trc, null, { id: profileID, type: en_data_model_1.CoreEntityTypes.Profile });
        const status = (_b = (_a = profile.status) !== null && _a !== void 0 ? _a : currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.status) !== null && _b !== void 0 ? _b : null;
        let label = profile.name || profile.email || '';
        // when service returns the id as the name, prefer the email as the label cc
        if (label && profile.email && profile.name && profile.name === String(profile.id)) {
            label = profile.email;
        }
        let profileOut = {
            id: profileID,
            type: en_data_model_1.CoreEntityTypes.Profile,
            version: profile.confidence || ProfileSourceConfidence.Source,
            syncContexts: [],
            localChangeTimestamp: 0,
            label,
            NodeFields: {
                email: profile.email || '',
                photoLastUpdated: profile.photoLastUpdated || null,
                photoUrl: profile.photoUrl || '',
                name: profile.name || '',
                username: profile.username || '',
                rootID: profileID,
                isSameBusiness: profile.isSameBusiness || false,
                isConnected: profile.isConnected || false,
                isBlocked: profile.isBlocked || null,
                internal_source: source,
                internal_userId: profile.userId || null,
                status,
            },
            inputs: {
                parent: {},
            },
            outputs: {
                relatedIdentities: {},
            },
        };
        if (currentProfile) {
            if (currentProfile.version > profileOut.version) {
                profileOut = mergeProfileData(currentProfile, profileOut);
            }
            else {
                profileOut = mergeProfileData(profileOut, currentProfile);
            }
        }
        if (source === en_data_model_1.PROFILE_SOURCE.Identity) {
            let rootUserID = profile.userId;
            if (!rootUserID && (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.rootID) !== (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.id)) {
                rootUserID = parseInt(Converters_1.convertGuidToService(currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.rootID, en_data_model_1.CoreEntityTypes.Profile), 0);
            }
            if (rootUserID) {
                await exports.ProfileConverter.convertFromService(trc, params, syncContext, Object.assign(Object.assign({}, profile), { source: en_data_model_1.PROFILE_SOURCE.User, confidence: ProfileSourceConfidence.Identity, id: rootUserID, email: profileOut.NodeFields.email || (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.email) || '', username: profileOut.NodeFields.username || (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.username), name: profileOut.NodeFields.name || (currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.NodeFields.name) || '' }));
                profileOut.NodeFields.rootID = Converters_1.convertGuidFromService(rootUserID, en_data_model_1.CoreEntityTypes.Profile, en_data_model_1.PROFILE_SOURCE.User);
                conduit_storage_1.addInputEdgeToNode(profileOut, 'parent', {
                    id: convertProfileGuidFromService(en_data_model_1.PROFILE_SOURCE.User, rootUserID.toString()),
                    type: exports.ProfileConverter.nodeType,
                    port: 'relatedIdentities',
                });
            }
        }
        if (!currentProfile || isNewProfile(currentProfile, profileOut)) {
            const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, profileOut);
            return !prevNode;
        }
        return false;
    }
    async createOnService() {
        // TODO(log) this is a noop. Application cannot create user profiles.
        return false;
    }
    async deleteFromService() {
        // TODO(log) this is a noop. Self-deletion still being implemented.
        return false;
    }
    async updateToService(trc, params, syncContext, profileID, diff) {
        var _a;
        if (((_a = diff === null || diff === void 0 ? void 0 : diff.NodeFields) === null || _a === void 0 ? void 0 : _a.isBlocked) !== undefined) {
            if (!params.personalAuth) {
                throw new Error('Personal auth token needed');
            }
            const profile = await params.graphTransaction.getNode(trc, null, { id: profileID, type: en_data_model_1.CoreEntityTypes.Profile });
            if (!profile || !profile.NodeFields.internal_userId) {
                throw new conduit_utils_1.InvalidOperationError('no user id');
            }
            const messageStore = params.thriftComm.getMessageStore(params.personalAuth.urls.messageStoreUrl);
            const userID = profile.NodeFields.internal_userId;
            await messageStore.updateProfileBlockStatus(trc, params.personalAuth.token, userID, Boolean(diff.NodeFields.isBlocked));
        }
        return false;
    }
    async applyEdgeChangesToService() {
        throw new Error('Unable to update edges of profiles (profiles are read only)');
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Profile)
], ProfileConverterClass.prototype, "convertFromService", null);
exports.ProfileConverter = new ProfileConverterClass();
//# sourceMappingURL=ProfileConverter.js.map