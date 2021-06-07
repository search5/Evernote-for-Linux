"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const BaseConverter_1 = require("./BaseConverter");
const getNoteNodeAndEdges = async (trc, instance, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const attrs = instance.attributes;
    if (!attrs) {
        conduit_utils_1.logger.warn('missing note attributes');
        return null;
    }
    const note = BaseConverter_1.convertNsyncEntityToNode(instance, context);
    if (!note) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const blobData = instance.blobRef;
    note.NodeFields.isExternal = instance.ownerId !== context.currentUserID;
    note.NodeFields.content = {
        hash: (blobData === null || blobData === void 0 ? void 0 : blobData.hash) || '',
        size: (blobData === null || blobData === void 0 ? void 0 : blobData.size) || 0,
        localChangeTimestamp: 0,
    };
    // shareUrl is generated on demand by the service (with a different secret at each generation time):
    // http://${host}/shard/${shardId}/sh/${noteGuid}/${secret} (see NoteFieldResolver#fetchCachedShareUrl)
    // Clients can use a placeholder, missing the secret at the end, to show something before asking the service to generate it for real
    note.NodeFields.shareUrlPlaceholder = ''; // TODO: getNoteShareUrlPlaceholder(params.syncContextMetadata, noteID)
    note.NodeFields.Attributes = {
        contentClass: (_a = attrs.contentClass) !== null && _a !== void 0 ? _a : null,
        subjectDate: (_b = attrs.subjectDate) !== null && _b !== void 0 ? _b : null,
        Location: {
            latitude: (_c = attrs.latitude) !== null && _c !== void 0 ? _c : null,
            longitude: (_d = attrs.longitude) !== null && _d !== void 0 ? _d : null,
            altitude: (_e = attrs.altitude) !== null && _e !== void 0 ? _e : null,
            placeName: (_f = attrs.placeName) !== null && _f !== void 0 ? _f : null,
        },
        Reminder: {
            reminderOrder: (_g = attrs.reminderOrder) !== null && _g !== void 0 ? _g : null,
            reminderDoneTime: (_h = attrs.reminderDoneTime) !== null && _h !== void 0 ? _h : null,
            reminderTime: (_j = attrs.reminderTime) !== null && _j !== void 0 ? _j : null,
        },
        Share: {
            shareDate: (_k = attrs.shareDate) !== null && _k !== void 0 ? _k : null,
            sharedWithBusiness: false,
        },
        Editor: {
            author: (_l = attrs.author) !== null && _l !== void 0 ? _l : null,
            lastEditedBy: (_m = attrs.lastEditedBy) !== null && _m !== void 0 ? _m : null,
        },
        Source: {
            source: (_o = attrs.source) !== null && _o !== void 0 ? _o : null,
            sourceURL: (_p = attrs.sourceURL) !== null && _p !== void 0 ? _p : null,
            sourceApplication: (_q = attrs.sourceApplication) !== null && _q !== void 0 ? _q : null,
        },
    };
    conduit_utils_1.logger.debug(note.id);
    conduit_utils_1.logger.debug(note.label || '');
    return { nodes: { nodesToUpsert: [note], nodesToDelete: [] } };
};
exports.getNoteNodeAndEdges = getNoteNodeAndEdges;
//# sourceMappingURL=NoteConverter.js.map