"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreEntityTypes = void 0;
const en_data_model_1 = require("en-data-model");
exports.CoreEntityTypes = {
    // nsync-backed entity types (but not for v1+)
    Attachment: en_data_model_1.EntityTypes.Attachment,
    Note: en_data_model_1.EntityTypes.Note,
    Notebook: en_data_model_1.EntityTypes.Notebook,
    SavedSearch: en_data_model_1.EntityTypes.SavedSearch,
    Shortcut: en_data_model_1.EntityTypes.Shortcut,
    Tag: en_data_model_1.EntityTypes.Tag,
    Workspace: en_data_model_1.EntityTypes.Workspace,
    // conduit-only entity types, populated by monolith data
    AccountLimits: 'AccountLimits',
    BetaFeature: 'BetaFeature',
    Invitation: 'Invitation',
    MaestroProps: 'MaestroProps',
    Membership: 'Membership',
    Message: 'Message',
    Preferences: 'Preferences',
    Profile: 'Profile',
    Promotion: 'Promotion',
    Stack: 'Stack',
    Thread: 'Thread',
    User: 'User',
};
//# sourceMappingURL=EntityConstants.js.map