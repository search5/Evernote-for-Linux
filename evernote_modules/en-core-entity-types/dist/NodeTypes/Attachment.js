"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentIndexConfig = exports.attachmentTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
const Blob_1 = require("./Blob");
exports.attachmentTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Attachment,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        mime: 'string',
        width: 'number',
        height: 'number',
        filename: 'string',
        isActive: 'boolean',
        data: Blob_1.BlobSchema,
        recognition: Blob_1.BlobBaseSchema,
        alternateData: Blob_1.BlobBaseSchema,
        applicationDataKeys: 'string[]',
        Attributes: {
            sourceURL: 'string?',
            timestamp: 'timestamp?',
            Location: {
                latitude: 'number?',
                longitude: 'number?',
                altitude: 'number?',
            },
            cameraMake: 'string?',
            cameraModel: 'string?',
            clientWillIndex: 'boolean',
        },
    },
    cache: Object.assign(Object.assign({}, Blob_1.BlobCache('recognition', 256)), Blob_1.BlobCache('alternateData', 256)),
    edges: {
        parent: {
            constraint: conduit_storage_1.EdgeConstraint.REQUIRED,
            type: conduit_storage_1.EdgeType.ANCESTRY,
            from: {
                type: EntityConstants_1.CoreEntityTypes.Note,
                constraint: conduit_storage_1.EdgeConstraint.MANY,
                denormalize: ['attachments', 'inactiveAttachments'],
            },
        },
    },
};
exports.attachmentIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.attachmentTypeDef, {
    indexResolvers: {
        label: conduit_storage_1.getIndexByResolverForPrimitives(exports.attachmentTypeDef, ['label']),
        parent: conduit_storage_1.getIndexByResolverForEdge(exports.attachmentTypeDef, ['edges', 'parent']),
        isActive: conduit_storage_1.getIndexByResolverForPrimitives(exports.attachmentTypeDef, ['NodeFields', 'isActive']),
    },
    indexes: {
        parent: {
            index: [
                { field: 'parent', order: 'ASC', isMatchField: true },
                { field: 'label', order: 'ASC', isMatchField: false },
            ],
        },
    },
    queries: {
        AttachmentsInNote: {
            traversalName: 'childAttachments',
            sort: [{ field: 'label', order: 'ASC' }],
            params: {
                note: {
                    match: { field: 'parent' },
                },
                isActive: {
                    defaultValue: true,
                    match: { field: 'isActive' },
                },
            },
        },
    },
});
//# sourceMappingURL=Attachment.js.map