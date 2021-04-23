"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNSyncEntityFilter = exports.CoreMutationRules = exports.CoreMutatorDefs = exports.CoreEntityTypeDefs = exports.NoteConflictLogger = exports.WorkspaceTypeSchema = exports.WorkspaceType = exports.WorkspaceLayoutStyleSchema = exports.WorkspaceLayoutStyle = exports.WorkspaceAccessStatusSchema = exports.WorkspaceAccessStatus = exports.PinnedContentTypeEnum = exports.pinnedContentDef = exports.isWorkspace = exports.UserReminderEmailConfig = exports.ServiceLevelSchema = exports.ServiceLevel = exports.PrivilegeLevel = exports.PremiumOrderStatus = exports.BusinessUserRole = exports.ProfileStatusEnum = exports.PROFILE_SOURCE = exports.isNotebook = exports.isNote = exports.DEFAULT_NOTE_CONTENT = exports.MembershipRecipientType = exports.InvitationType = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const ProfileDataResolver_1 = require("./DataResolvers/ProfileDataResolver");
const EntityConstants_1 = require("./EntityConstants");
const AttachmentMutators = __importStar(require("./Mutators/AttachmentMutators"));
const FileUploadMutators = __importStar(require("./Mutators/FileUploadMutators"));
const InvitationMutators = __importStar(require("./Mutators/InvitationMutators"));
const MembershipMutators = __importStar(require("./Mutators/MembershipMutators"));
const MessageMutators = __importStar(require("./Mutators/MessageMutators"));
const NotebookMutators = __importStar(require("./Mutators/NotebookMutators"));
const NoteMutators = __importStar(require("./Mutators/NoteMutators"));
const ProfileMutators = __importStar(require("./Mutators/ProfileMutators"));
const PromotionMutators = __importStar(require("./Mutators/PromotionMutators"));
const SavedSearchMutators = __importStar(require("./Mutators/SavedSearchMutators"));
const ShortcutMutators = __importStar(require("./Mutators/ShortcutMutators"));
const StackMutators = __importStar(require("./Mutators/StackMutators"));
const TagMutators = __importStar(require("./Mutators/TagMutators"));
const TestMutators = __importStar(require("./Mutators/TestMutators"));
const ThreadMutators = __importStar(require("./Mutators/ThreadMutators"));
const UserMutators = __importStar(require("./Mutators/UserMutators"));
const WorkspaceMutators = __importStar(require("./Mutators/WorkspaceMutators"));
const AccountLimits_1 = require("./NodeTypes/AccountLimits");
const Attachment_1 = require("./NodeTypes/Attachment");
const BetaFeature_1 = require("./NodeTypes/BetaFeature");
const Invitation_1 = require("./NodeTypes/Invitation");
const MaestroProps_1 = require("./NodeTypes/MaestroProps");
const Membership_1 = require("./NodeTypes/Membership");
const Message_1 = require("./NodeTypes/Message");
const Note_1 = require("./NodeTypes/Note");
const Notebook_1 = require("./NodeTypes/Notebook");
const Profile_1 = require("./NodeTypes/Profile");
const Promotion_1 = require("./NodeTypes/Promotion");
const SavedSearch_1 = require("./NodeTypes/SavedSearch");
const Shortcut_1 = require("./NodeTypes/Shortcut");
const Stack_1 = require("./NodeTypes/Stack");
const Tag_1 = require("./NodeTypes/Tag");
const Thread_1 = require("./NodeTypes/Thread");
const User_1 = require("./NodeTypes/User");
const Workspace_1 = require("./NodeTypes/Workspace");
const ShortcutRules_1 = require("./Rules/ShortcutRules");
__exportStar(require("./EntityConstants"), exports);
__exportStar(require("./NodeTypes/Blob"), exports);
var Invitation_2 = require("./NodeTypes/Invitation");
Object.defineProperty(exports, "InvitationType", { enumerable: true, get: function () { return Invitation_2.InvitationType; } });
var Membership_2 = require("./NodeTypes/Membership");
Object.defineProperty(exports, "MembershipRecipientType", { enumerable: true, get: function () { return Membership_2.MembershipRecipientType; } });
var Note_2 = require("./NodeTypes/Note");
Object.defineProperty(exports, "DEFAULT_NOTE_CONTENT", { enumerable: true, get: function () { return Note_2.DEFAULT_NOTE_CONTENT; } });
Object.defineProperty(exports, "isNote", { enumerable: true, get: function () { return Note_2.isNote; } });
var Notebook_2 = require("./NodeTypes/Notebook");
Object.defineProperty(exports, "isNotebook", { enumerable: true, get: function () { return Notebook_2.isNotebook; } });
var Profile_2 = require("./NodeTypes/Profile");
Object.defineProperty(exports, "PROFILE_SOURCE", { enumerable: true, get: function () { return Profile_2.PROFILE_SOURCE; } });
Object.defineProperty(exports, "ProfileStatusEnum", { enumerable: true, get: function () { return Profile_2.ProfileStatusEnum; } });
var User_2 = require("./NodeTypes/User");
Object.defineProperty(exports, "BusinessUserRole", { enumerable: true, get: function () { return User_2.BusinessUserRole; } });
Object.defineProperty(exports, "PremiumOrderStatus", { enumerable: true, get: function () { return User_2.PremiumOrderStatus; } });
Object.defineProperty(exports, "PrivilegeLevel", { enumerable: true, get: function () { return User_2.PrivilegeLevel; } });
Object.defineProperty(exports, "ServiceLevel", { enumerable: true, get: function () { return User_2.ServiceLevel; } });
Object.defineProperty(exports, "ServiceLevelSchema", { enumerable: true, get: function () { return User_2.ServiceLevelSchema; } });
Object.defineProperty(exports, "UserReminderEmailConfig", { enumerable: true, get: function () { return User_2.UserReminderEmailConfig; } });
var Workspace_2 = require("./NodeTypes/Workspace");
Object.defineProperty(exports, "isWorkspace", { enumerable: true, get: function () { return Workspace_2.isWorkspace; } });
Object.defineProperty(exports, "pinnedContentDef", { enumerable: true, get: function () { return Workspace_2.pinnedContentDef; } });
Object.defineProperty(exports, "PinnedContentTypeEnum", { enumerable: true, get: function () { return Workspace_2.PinnedContentTypeEnum; } });
Object.defineProperty(exports, "WorkspaceAccessStatus", { enumerable: true, get: function () { return Workspace_2.WorkspaceAccessStatus; } });
Object.defineProperty(exports, "WorkspaceAccessStatusSchema", { enumerable: true, get: function () { return Workspace_2.WorkspaceAccessStatusSchema; } });
Object.defineProperty(exports, "WorkspaceLayoutStyle", { enumerable: true, get: function () { return Workspace_2.WorkspaceLayoutStyle; } });
Object.defineProperty(exports, "WorkspaceLayoutStyleSchema", { enumerable: true, get: function () { return Workspace_2.WorkspaceLayoutStyleSchema; } });
Object.defineProperty(exports, "WorkspaceType", { enumerable: true, get: function () { return Workspace_2.WorkspaceType; } });
Object.defineProperty(exports, "WorkspaceTypeSchema", { enumerable: true, get: function () { return Workspace_2.WorkspaceTypeSchema; } });
exports.NoteConflictLogger = new conduit_utils_1.MemLogger(10, 100);
exports.CoreEntityTypeDefs = {
    [EntityConstants_1.CoreEntityTypes.AccountLimits]: {
        typeDef: AccountLimits_1.accountLimitsTypeDef,
    },
    [EntityConstants_1.CoreEntityTypes.Attachment]: {
        typeDef: Attachment_1.attachmentTypeDef,
        indexConfig: Attachment_1.attachmentIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.BetaFeature]: {
        typeDef: BetaFeature_1.betaFeatureTypeDef,
        indexConfig: BetaFeature_1.betaFeatureIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Invitation]: {
        typeDef: Invitation_1.invitationTypeDef,
        indexConfig: Invitation_1.invitationIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.MaestroProps]: {
        typeDef: MaestroProps_1.maestroPropsTypeDef,
    },
    [EntityConstants_1.CoreEntityTypes.Membership]: {
        typeDef: Membership_1.membershipTypeDef,
        indexConfig: Membership_1.membershipIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Message]: {
        typeDef: Message_1.messageTypeDef,
        indexConfig: Message_1.messageIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Note]: {
        typeDef: Note_1.noteTypeDef,
        indexConfig: Note_1.noteIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Notebook]: {
        typeDef: Notebook_1.notebookTypeDef,
        indexConfig: Notebook_1.notebookIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Profile]: {
        typeDef: Profile_1.profileTypeDef,
        indexConfig: Profile_1.profileIndexConfig,
        dataResolver: ProfileDataResolver_1.ProfileDataResolver,
    },
    [EntityConstants_1.CoreEntityTypes.Promotion]: {
        typeDef: Promotion_1.promotionTypeDef,
        indexConfig: Promotion_1.promotionIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.SavedSearch]: {
        typeDef: SavedSearch_1.savedSearchTypeDef,
        indexConfig: SavedSearch_1.savedSearchIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Shortcut]: {
        typeDef: Shortcut_1.shortcutTypeDef,
        indexConfig: Shortcut_1.shortcutIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Stack]: {
        typeDef: Stack_1.stackTypeDef,
        indexConfig: Stack_1.stackIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Tag]: {
        typeDef: Tag_1.tagTypeDef,
        indexConfig: Tag_1.tagIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.Thread]: {
        typeDef: Thread_1.threadTypeDef,
        indexConfig: Thread_1.threadIndexConfig,
    },
    [EntityConstants_1.CoreEntityTypes.User]: {
        typeDef: User_1.userTypeDef,
    },
    [EntityConstants_1.CoreEntityTypes.Workspace]: {
        typeDef: Workspace_1.workspaceTypeDef,
        indexConfig: Workspace_1.workspaceIndexConfig,
    },
};
exports.CoreMutatorDefs = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, AttachmentMutators), FileUploadMutators), InvitationMutators), MembershipMutators), MessageMutators), NotebookMutators), NoteMutators), ProfileMutators), PromotionMutators), SavedSearchMutators), ShortcutMutators), StackMutators), TagMutators), TestMutators), ThreadMutators), UserMutators), WorkspaceMutators);
exports.CoreMutationRules = [
    ...ShortcutRules_1.ShortcutRules,
];
function getNSyncEntityFilter(nodeTypes, featureGroups) {
    const filter = [];
    for (const nodeType in nodeTypes) {
        const typeDef = nodeTypes[nodeType];
        if (typeDef.syncSource === conduit_storage_1.SyncSource.NSYNC) {
            if (featureGroups === '*' || typeDef.nsyncFeatureGroup === 'Core' || featureGroups.includes(typeDef.nsyncFeatureGroup)) {
                filter.push(nodeType);
            }
        }
    }
    return filter;
}
exports.getNSyncEntityFilter = getNSyncEntityFilter;
//# sourceMappingURL=EvernoteDataModel.js.map