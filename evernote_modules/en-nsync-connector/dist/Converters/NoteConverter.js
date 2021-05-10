"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const BaseConverter_1 = require("./BaseConverter");
const getNoteNodeAndEdges = async (trc, instance, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const attrs = instance.attributes;
    if (!attrs) {
        conduit_utils_1.logger.warn('missing note attributes');
        return null;
    }
    const blobData = instance.blobRef;
    const contentBlobData = {
        bodyHash: (blobData === null || blobData === void 0 ? void 0 : blobData.hash) || '',
        size: (blobData === null || blobData === void 0 ? void 0 : blobData.size) || 0,
    };
    const isExternal = instance.ownerId !== context.currentUserID;
    const initial = BaseConverter_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const note = Object.assign(Object.assign({}, initial), { type: en_core_entity_types_1.CoreEntityTypes.Note, NodeFields: {
            isUntitled: instance.isUntitled,
            isExternal,
            isMetadata: false,
            created: instance.created,
            updated: instance.updated,
            deleted: (_a = instance.deleted) !== null && _a !== void 0 ? _a : null,
            noteResourceCountMax: 0,
            noteSizeMax: 0,
            resourceSizeMax: 0,
            uploadLimit: 0,
            uploaded: 0,
            content: {
                hash: contentBlobData.bodyHash,
                size: contentBlobData.size,
                localChangeTimestamp: 0,
            },
            thumbnailUrl: null,
            /* TODO
            thumbnailUrl: instanceAttrs.resources.length > 0
              ? generateResourceUrl(
                params.syncContextMetadata,
                'thm/note',
                instanceAttrs.guid!,
              ) : null,
            */
            // shareUrl is generated on demand by the service (with a different secret at each generation time):
            // http://${host}/shard/${shardId}/sh/${noteGuid}/${secret} (see NoteFieldResolver#fetchCachedShareUrl)
            // Clients can use a placeholder, missing the secret at the end, to show something before asking the service to generate it for real
            shareUrlPlaceholder: '',
            internal_shareCountProfiles: {},
            Attributes: {
                contentClass: (_b = attrs.contentClass) !== null && _b !== void 0 ? _b : null,
                subjectDate: (_c = attrs.subjectDate) !== null && _c !== void 0 ? _c : null,
                Location: {
                    latitude: (_d = attrs.latitude) !== null && _d !== void 0 ? _d : null,
                    longitude: (_e = attrs.longitude) !== null && _e !== void 0 ? _e : null,
                    altitude: (_f = attrs.altitude) !== null && _f !== void 0 ? _f : null,
                    placeName: (_g = attrs.placeName) !== null && _g !== void 0 ? _g : null,
                },
                Reminder: {
                    reminderOrder: (_h = attrs.reminderOrder) !== null && _h !== void 0 ? _h : null,
                    reminderDoneTime: (_j = attrs.reminderDoneTime) !== null && _j !== void 0 ? _j : null,
                    reminderTime: (_k = attrs.reminderTime) !== null && _k !== void 0 ? _k : null,
                },
                Share: {
                    shareDate: (_l = attrs.shareDate) !== null && _l !== void 0 ? _l : null,
                    sharedWithBusiness: false,
                },
                Editor: {
                    author: (_m = attrs.author) !== null && _m !== void 0 ? _m : null,
                    lastEditedBy: (_o = attrs.lastEditedBy) !== null && _o !== void 0 ? _o : null,
                },
                Source: {
                    source: (_p = attrs.source) !== null && _p !== void 0 ? _p : null,
                    sourceURL: (_q = attrs.sourceURL) !== null && _q !== void 0 ? _q : null,
                    sourceApplication: (_r = attrs.sourceApplication) !== null && _r !== void 0 ? _r : null,
                },
            },
        }, inputs: {
            parent: {},
            sourceNote: {},
            contentHandler: {},
            taskUserSettingsForDefaultNote: {},
        }, outputs: {
            attachments: {},
            creator: {},
            inactiveAttachments: {},
            lastEditor: {},
            memberships: {},
            shortcut: {},
            tags: {},
            noteContentInfo: {},
            tasks: {},
        }, CacheFields: undefined });
    conduit_utils_1.logger.debug(note.id);
    conduit_utils_1.logger.debug(note.label || '');
    return { nodes: { nodesToUpsert: [note], nodesToDelete: [] } };
};
exports.getNoteNodeAndEdges = getNoteNodeAndEdges;
//# sourceMappingURL=NoteConverter.js.map