"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountLimitsTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../EntityConstants");
exports.accountLimitsTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.AccountLimits,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        Limits: conduit_utils_1.Struct({
            userMailLimitDaily: 'int',
            noteSizeMax: 'number',
            resourceSizeMax: 'number',
            userLinkedNotebookMax: 'int',
            uploadLimit: 'number',
            userNoteCountMax: 'int',
            userNotebookCountMax: 'int',
            userTagCountMax: 'int',
            noteTagCountMax: 'int',
            userSavedSearchesMax: 'int',
            noteResourceCountMax: 'int',
            userDeviceLimit: 'int',
            userAdvertisedDeviceLimit: 'int',
            userWorkspaceCountMax: 'int',
            taskAssignmentLimitDaily: 'int',
        }),
        Counts: conduit_utils_1.Struct({
            userNoteCount: 'int',
            userNotebookCount: 'int',
            userLinkedNotebookCount: 'int',
            userTagCount: 'int',
            userSavedSearchesCount: 'int',
            userDeviceCount: 'int',
            userWorkspaceCount: 'int',
            userUploadedAmount: 'number',
            userNoteAndNotebookSharesSentCount: 'int',
            taskAssignmentLimitDaily: 'int',
        }),
    },
    cache: {
        noteAndNotebookSharesAllowance: {
            type: 'number',
            allowStale: false,
            allowStaleOnFillFailure: true,
            dependentFields: ['Counts.userNoteAndNotebookSharesSentCount'],
            cacheTimeout: conduit_utils_1.MILLIS_IN_ONE_HOUR,
        },
    },
};
//# sourceMappingURL=AccountLimits.js.map