"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteNodeAndEdges = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const NSyncTypes_1 = require("../NSyncTypes");
const BaseConverter_1 = require("./BaseConverter");
const EDAM_NOTE_TITLE_QUALITY_UNTITLED = 0; // copied from en-thrift-internal
const getNoteNodeAndEdges = async (trc, instance, context) => {
    var _a;
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
    const note = Object.assign(Object.assign({}, initial), { type: en_data_model_1.CoreEntityTypes.Note, NodeFields: {
            isUntitled: attrs.noteTitleQuality === EDAM_NOTE_TITLE_QUALITY_UNTITLED,
            isExternal,
            isMetadata: false,
            created: NSyncTypes_1.convertLong(instance.created || 0),
            updated: NSyncTypes_1.convertLong(instance.updated || 0),
            deleted: (instance.deleted === null || instance.deleted === undefined)
                ? null
                : NSyncTypes_1.convertLong(instance.deleted) || null,
            noteResourceCountMax: 0,
            noteSizeMax: 0,
            resourceSizeMax: 0,
            uploadLimit: 0,
            uploaded: 0,
            content: {
                hash: contentBlobData.bodyHash,
                size: (_a = NSyncTypes_1.convertLong(contentBlobData.size)) !== null && _a !== void 0 ? _a : 0,
                localChangeTimestamp: 0,
                url: '',
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
                contentClass: attrs.contentClass || null,
                subjectDate: NSyncTypes_1.convertLong(attrs.subjectDate || 0) || null,
                Location: {
                    latitude: attrs.latitude || null,
                    longitude: attrs.longitude || null,
                    altitude: attrs.altitude || null,
                    placeName: attrs.placeName || null,
                },
                Reminder: {
                    reminderOrder: attrs.reminderOrder || null,
                    reminderDoneTime: attrs.reminderDoneTime || null,
                    reminderTime: NSyncTypes_1.convertLong(attrs.reminderTime || 0) || null,
                },
                Share: {
                    shareDate: NSyncTypes_1.convertLong(attrs.shareDate || 0) || null,
                    sharedWithBusiness: attrs.sharedWithBusiness || null,
                },
                Editor: {
                    author: attrs.author || null,
                    lastEditedBy: attrs.lastEditedBy || null,
                },
                Source: {
                    source: attrs.source || null,
                    sourceURL: attrs.sourceURL || null,
                    sourceApplication: attrs.sourceApplication || null,
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