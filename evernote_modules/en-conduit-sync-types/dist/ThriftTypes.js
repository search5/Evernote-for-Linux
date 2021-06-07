"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
/* eslint-disable no-restricted-imports */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNoteShareRelationships = exports.TNoteResultSpec = exports.TNoteLockStatus = exports.TNoteInvitationShareRelationship = exports.TNoteCollectionCounts = exports.TNotebookResultSpec = exports.TManageNoteSharesResult = exports.TManageNotebookSharesResult = exports.TLogResponse = exports.TInvitationShareRelationship = exports.TClientSyncRateConfig = exports.TBusinessQueryResult = exports.TBusinessQuery = exports.TUserThread = exports.TUserMessagingInfo = exports.TMessageThread = exports.TMessageSyncFilter = exports.TMessageAttachmentType = exports.TFindMessagesResultSpec = exports.TFindMessagesResult = exports.TFindMessagesPagination = exports.TFindMessagesFilter = exports.TDateFilter = exports.TCreateMessageThreadResult = exports.TRecipientType = exports.EDAM_PREFERENCE_WORKCHATACTIVE_TIMESPAN = exports.EDAM_PREFERENCE_WORKCHATACTIVE = exports.EDAM_SNIPPETS_NOTES_MAX = exports.EDAM_PREFERENCE_SHORTCUTS = exports.EDAM_NOTE_TITLE_QUALITY_UNTITLED = exports.EDAM_NOTE_TITLE_LEN_MAX = exports.EDAM_MIME_TYPE_INK = exports.EDAM_CONNECTED_IDENTITY_REQUEST_MAX = exports.TExperimentsGetServiceStateJsonResponse = exports.TExperimentsGetPropsRequest = exports.TExperimentsGetPropsJsonResponse = exports.TExperimentsExperimentArmId = exports.TExperimentsClientType = exports.EDAMUserException = exports.EDAMSystemException = exports.EDAMNotFoundException = exports.EDAMErrorCode = exports.TCommEngineMessageResponse = exports.TCommEngineMessageRequest = exports.TCommEngineInAppMessageIdentifier = exports.TCommEnginePlacement = exports.TCommEngineEventType = exports.TCommEngineClientType = exports.TServiceProvider = exports.TOpenIdCredential = void 0;
exports.TUserUrls = exports.TPublicUserInfo = exports.TNapMigrationState = exports.TLoginStatus = exports.TLoginInfo = exports.TGetNAPAccessJWTRequest = exports.TGetLoginInfoRequest = exports.TBusinessUserType = exports.TAuthenticationResult = exports.TAuthenticationParameters = exports.TUserRestrictions = exports.TUserProfile = exports.TUserIdentityType = exports.TUserIdentity = exports.TUser = exports.TSubscriptionInfo = exports.TSharedNotePrivilegeLevel = exports.TSharedNotebookPrivilegeLevel = exports.TSharedNote = exports.TServiceLevel = exports.TResourceAttributes = exports.TReminderEmailConfig = exports.TRecipientStatus = exports.TPrivilegeLevel = exports.TPremiumOrderStatus = exports.TNoteSortOrder = exports.TNotebookRecipientSettings = exports.TIdentity = exports.TData = exports.TContactType = exports.TContact = exports.TCanMoveToContainerStatus = exports.TBusinessUserStatus = exports.TBusinessUserRole = exports.TBusinessUserInfo = exports.TBusinessUserFilter = exports.TAccountLimits = exports.TWorkspaceType = exports.TWorkspaceResponseSpec = exports.TWorkspacePrivilegeLevel = exports.TAccessInfo = exports.TWorkspaceUserInterfaceLayoutStyle = exports.TUserSetting = exports.TSyncState = exports.TSyncChunkFilter = exports.TShareRelationshipPrivilegeLevel = exports.TShareRelationships = exports.TRelatedResultSpec = exports.TPreferences = exports.TNotesMetadataResultSpec = void 0;
exports.TMonetizationSvcResponse = exports.TMonetizationSvcRequest = exports.TMonetizationSvcCreateDeviceSyncRequest = exports.TMonetizationSvcClientType = exports.TTsdVariation = exports.TTsdType = exports.TTierSelectionDisplayEligibilityResult = exports.TTierSelectionDisplayEligibilityRequest = exports.TTeamStartPackRequest = exports.TSupportTicket = exports.TRevokeSessionRequest = exports.TResourcesUpdateRequest = exports.TRegisterDeviceSessionRequest = exports.TNsvcTokenType = exports.TNsvcThirdPartyAuthorizationTokenResult = exports.TPromotionStatus = exports.TPinnedEntityType = exports.TPinnedContent = exports.TMarketingEmailParameters = exports.THasActiveSessionRequest = exports.TFeatureAvailability = exports.TCrossPromotionInfo = exports.TChangePositionRequest = void 0;
/***************************************************************
 * EXPORTS
 **************************************************************/
var AuthenticationTypes_1 = require("en-thrift-internal/lib/AuthenticationTypes");
Object.defineProperty(exports, "TOpenIdCredential", { enumerable: true, get: function () { return AuthenticationTypes_1.OpenIdCredential; } });
Object.defineProperty(exports, "TServiceProvider", { enumerable: true, get: function () { return AuthenticationTypes_1.ServiceProvider; } });
var CommunicationEngineTypesV2_1 = require("en-thrift-internal/lib/CommunicationEngineTypesV2");
Object.defineProperty(exports, "TCommEngineClientType", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.CommEngineClientType; } });
Object.defineProperty(exports, "TCommEngineEventType", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.CommEngineEventType; } });
Object.defineProperty(exports, "TCommEnginePlacement", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.CommEnginePlacement; } });
Object.defineProperty(exports, "TCommEngineInAppMessageIdentifier", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.InAppMessageIdentifier; } });
Object.defineProperty(exports, "TCommEngineMessageRequest", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.MessageRequest; } });
Object.defineProperty(exports, "TCommEngineMessageResponse", { enumerable: true, get: function () { return CommunicationEngineTypesV2_1.MessageResponse; } });
var Errors_1 = require("en-thrift-internal/lib/Errors");
Object.defineProperty(exports, "EDAMErrorCode", { enumerable: true, get: function () { return Errors_1.EDAMErrorCode; } });
Object.defineProperty(exports, "EDAMNotFoundException", { enumerable: true, get: function () { return Errors_1.EDAMNotFoundException; } });
Object.defineProperty(exports, "EDAMSystemException", { enumerable: true, get: function () { return Errors_1.EDAMSystemException; } });
Object.defineProperty(exports, "EDAMUserException", { enumerable: true, get: function () { return Errors_1.EDAMUserException; } });
var ExperimentsService_1 = require("en-thrift-internal/lib/ExperimentsService");
Object.defineProperty(exports, "TExperimentsClientType", { enumerable: true, get: function () { return ExperimentsService_1.TClientType; } });
Object.defineProperty(exports, "TExperimentsExperimentArmId", { enumerable: true, get: function () { return ExperimentsService_1.TExperimentArmId; } });
Object.defineProperty(exports, "TExperimentsGetPropsJsonResponse", { enumerable: true, get: function () { return ExperimentsService_1.TGetPropsJsonResponse; } });
Object.defineProperty(exports, "TExperimentsGetPropsRequest", { enumerable: true, get: function () { return ExperimentsService_1.TGetPropsRequest; } });
Object.defineProperty(exports, "TExperimentsGetServiceStateJsonResponse", { enumerable: true, get: function () { return ExperimentsService_1.TGetServiceStateJsonResponse; } });
var Limits_1 = require("en-thrift-internal/lib/Limits");
Object.defineProperty(exports, "EDAM_CONNECTED_IDENTITY_REQUEST_MAX", { enumerable: true, get: function () { return Limits_1.EDAM_CONNECTED_IDENTITY_REQUEST_MAX; } });
Object.defineProperty(exports, "EDAM_MIME_TYPE_INK", { enumerable: true, get: function () { return Limits_1.EDAM_MIME_TYPE_INK; } });
Object.defineProperty(exports, "EDAM_NOTE_TITLE_LEN_MAX", { enumerable: true, get: function () { return Limits_1.EDAM_NOTE_TITLE_LEN_MAX; } });
Object.defineProperty(exports, "EDAM_NOTE_TITLE_QUALITY_UNTITLED", { enumerable: true, get: function () { return Limits_1.EDAM_NOTE_TITLE_QUALITY_UNTITLED; } });
Object.defineProperty(exports, "EDAM_PREFERENCE_SHORTCUTS", { enumerable: true, get: function () { return Limits_1.EDAM_PREFERENCE_SHORTCUTS; } });
Object.defineProperty(exports, "EDAM_SNIPPETS_NOTES_MAX", { enumerable: true, get: function () { return Limits_1.EDAM_SNIPPETS_NOTES_MAX; } });
Object.defineProperty(exports, "EDAM_PREFERENCE_WORKCHATACTIVE", { enumerable: true, get: function () { return Limits_1.EDAM_PREFERENCE_WORKCHATACTIVE; } });
Object.defineProperty(exports, "EDAM_PREFERENCE_WORKCHATACTIVE_TIMESPAN", { enumerable: true, get: function () { return Limits_1.EDAM_PREFERENCE_WORKCHATACTIVE_TIMESPAN; } });
var MembershipService_1 = require("en-thrift-internal/lib/MembershipService");
Object.defineProperty(exports, "TRecipientType", { enumerable: true, get: function () { return MembershipService_1.RecipientType; } });
var MessageStore_1 = require("en-thrift-internal/lib/MessageStore");
Object.defineProperty(exports, "TCreateMessageThreadResult", { enumerable: true, get: function () { return MessageStore_1.CreateMessageThreadResult; } });
Object.defineProperty(exports, "TDateFilter", { enumerable: true, get: function () { return MessageStore_1.DateFilter; } });
Object.defineProperty(exports, "TFindMessagesFilter", { enumerable: true, get: function () { return MessageStore_1.FindMessagesFilter; } });
Object.defineProperty(exports, "TFindMessagesPagination", { enumerable: true, get: function () { return MessageStore_1.FindMessagesPagination; } });
Object.defineProperty(exports, "TFindMessagesResult", { enumerable: true, get: function () { return MessageStore_1.FindMessagesResult; } });
Object.defineProperty(exports, "TFindMessagesResultSpec", { enumerable: true, get: function () { return MessageStore_1.FindMessagesResultSpec; } });
Object.defineProperty(exports, "TMessageAttachmentType", { enumerable: true, get: function () { return MessageStore_1.MessageAttachmentType; } });
Object.defineProperty(exports, "TMessageSyncFilter", { enumerable: true, get: function () { return MessageStore_1.MessageSyncFilter; } });
Object.defineProperty(exports, "TMessageThread", { enumerable: true, get: function () { return MessageStore_1.MessageThread; } });
Object.defineProperty(exports, "TUserMessagingInfo", { enumerable: true, get: function () { return MessageStore_1.UserMessagingInfo; } });
Object.defineProperty(exports, "TUserThread", { enumerable: true, get: function () { return MessageStore_1.UserThread; } });
var NoteStore_1 = require("en-thrift-internal/lib/NoteStore");
Object.defineProperty(exports, "TBusinessQuery", { enumerable: true, get: function () { return NoteStore_1.BusinessQuery; } });
Object.defineProperty(exports, "TBusinessQueryResult", { enumerable: true, get: function () { return NoteStore_1.BusinessQueryResult; } });
Object.defineProperty(exports, "TClientSyncRateConfig", { enumerable: true, get: function () { return NoteStore_1.ClientSyncRateConfig; } });
Object.defineProperty(exports, "TInvitationShareRelationship", { enumerable: true, get: function () { return NoteStore_1.InvitationShareRelationship; } });
Object.defineProperty(exports, "TLogResponse", { enumerable: true, get: function () { return NoteStore_1.LogResponse; } });
Object.defineProperty(exports, "TManageNotebookSharesResult", { enumerable: true, get: function () { return NoteStore_1.ManageNotebookSharesResult; } });
Object.defineProperty(exports, "TManageNoteSharesResult", { enumerable: true, get: function () { return NoteStore_1.ManageNoteSharesResult; } });
Object.defineProperty(exports, "TNotebookResultSpec", { enumerable: true, get: function () { return NoteStore_1.NotebookResultSpec; } });
Object.defineProperty(exports, "TNoteCollectionCounts", { enumerable: true, get: function () { return NoteStore_1.NoteCollectionCounts; } });
Object.defineProperty(exports, "TNoteInvitationShareRelationship", { enumerable: true, get: function () { return NoteStore_1.NoteInvitationShareRelationship; } });
Object.defineProperty(exports, "TNoteLockStatus", { enumerable: true, get: function () { return NoteStore_1.NoteLockStatus; } });
Object.defineProperty(exports, "TNoteResultSpec", { enumerable: true, get: function () { return NoteStore_1.NoteResultSpec; } });
Object.defineProperty(exports, "TNoteShareRelationships", { enumerable: true, get: function () { return NoteStore_1.NoteShareRelationships; } });
Object.defineProperty(exports, "TNotesMetadataResultSpec", { enumerable: true, get: function () { return NoteStore_1.NotesMetadataResultSpec; } });
Object.defineProperty(exports, "TPreferences", { enumerable: true, get: function () { return NoteStore_1.Preferences; } });
Object.defineProperty(exports, "TRelatedResultSpec", { enumerable: true, get: function () { return NoteStore_1.RelatedResultSpec; } });
Object.defineProperty(exports, "TShareRelationships", { enumerable: true, get: function () { return NoteStore_1.ShareRelationships; } });
Object.defineProperty(exports, "TShareRelationshipPrivilegeLevel", { enumerable: true, get: function () { return NoteStore_1.ShareRelationshipPrivilegeLevel; } });
Object.defineProperty(exports, "TSyncChunkFilter", { enumerable: true, get: function () { return NoteStore_1.SyncChunkFilter; } });
Object.defineProperty(exports, "TSyncState", { enumerable: true, get: function () { return NoteStore_1.SyncState; } });
Object.defineProperty(exports, "TUserSetting", { enumerable: true, get: function () { return NoteStore_1.UserSetting; } });
Object.defineProperty(exports, "TWorkspaceUserInterfaceLayoutStyle", { enumerable: true, get: function () { return NoteStore_1.WorkspaceUserInterfaceLayoutStyle; } });
var SpaceService_1 = require("en-thrift-internal/lib/SpaceService");
Object.defineProperty(exports, "TAccessInfo", { enumerable: true, get: function () { return SpaceService_1.AccessInfo; } });
Object.defineProperty(exports, "TWorkspacePrivilegeLevel", { enumerable: true, get: function () { return SpaceService_1.WorkspacePrivilegeLevel; } });
Object.defineProperty(exports, "TWorkspaceResponseSpec", { enumerable: true, get: function () { return SpaceService_1.WorkspaceResponseSpec; } });
Object.defineProperty(exports, "TWorkspaceType", { enumerable: true, get: function () { return SpaceService_1.WorkspaceType; } });
var Types_1 = require("en-thrift-internal/lib/Types");
Object.defineProperty(exports, "TAccountLimits", { enumerable: true, get: function () { return Types_1.AccountLimits; } });
Object.defineProperty(exports, "TBusinessUserFilter", { enumerable: true, get: function () { return Types_1.BusinessUserFilter; } });
Object.defineProperty(exports, "TBusinessUserInfo", { enumerable: true, get: function () { return Types_1.BusinessUserInfo; } });
Object.defineProperty(exports, "TBusinessUserRole", { enumerable: true, get: function () { return Types_1.BusinessUserRole; } });
Object.defineProperty(exports, "TBusinessUserStatus", { enumerable: true, get: function () { return Types_1.BusinessUserStatus; } });
Object.defineProperty(exports, "TCanMoveToContainerStatus", { enumerable: true, get: function () { return Types_1.CanMoveToContainerStatus; } });
Object.defineProperty(exports, "TContact", { enumerable: true, get: function () { return Types_1.Contact; } });
Object.defineProperty(exports, "TContactType", { enumerable: true, get: function () { return Types_1.ContactType; } });
Object.defineProperty(exports, "TData", { enumerable: true, get: function () { return Types_1.Data; } });
Object.defineProperty(exports, "TIdentity", { enumerable: true, get: function () { return Types_1.Identity; } });
Object.defineProperty(exports, "TNotebookRecipientSettings", { enumerable: true, get: function () { return Types_1.NotebookRecipientSettings; } });
Object.defineProperty(exports, "TNoteSortOrder", { enumerable: true, get: function () { return Types_1.NoteSortOrder; } });
Object.defineProperty(exports, "TPremiumOrderStatus", { enumerable: true, get: function () { return Types_1.PremiumOrderStatus; } });
Object.defineProperty(exports, "TPrivilegeLevel", { enumerable: true, get: function () { return Types_1.PrivilegeLevel; } });
Object.defineProperty(exports, "TRecipientStatus", { enumerable: true, get: function () { return Types_1.RecipientStatus; } });
Object.defineProperty(exports, "TReminderEmailConfig", { enumerable: true, get: function () { return Types_1.ReminderEmailConfig; } });
Object.defineProperty(exports, "TResourceAttributes", { enumerable: true, get: function () { return Types_1.ResourceAttributes; } });
Object.defineProperty(exports, "TServiceLevel", { enumerable: true, get: function () { return Types_1.ServiceLevel; } });
Object.defineProperty(exports, "TSharedNote", { enumerable: true, get: function () { return Types_1.SharedNote; } });
Object.defineProperty(exports, "TSharedNotebookPrivilegeLevel", { enumerable: true, get: function () { return Types_1.SharedNotebookPrivilegeLevel; } });
Object.defineProperty(exports, "TSharedNotePrivilegeLevel", { enumerable: true, get: function () { return Types_1.SharedNotePrivilegeLevel; } });
Object.defineProperty(exports, "TSubscriptionInfo", { enumerable: true, get: function () { return Types_1.SubscriptionInfo; } });
Object.defineProperty(exports, "TUser", { enumerable: true, get: function () { return Types_1.User; } });
Object.defineProperty(exports, "TUserIdentity", { enumerable: true, get: function () { return Types_1.UserIdentity; } });
Object.defineProperty(exports, "TUserIdentityType", { enumerable: true, get: function () { return Types_1.UserIdentityType; } });
Object.defineProperty(exports, "TUserProfile", { enumerable: true, get: function () { return Types_1.UserProfile; } });
Object.defineProperty(exports, "TUserRestrictions", { enumerable: true, get: function () { return Types_1.UserRestrictions; } });
var UserStore_1 = require("en-thrift-internal/lib/UserStore");
Object.defineProperty(exports, "TAuthenticationParameters", { enumerable: true, get: function () { return UserStore_1.AuthenticationParameters; } });
Object.defineProperty(exports, "TAuthenticationResult", { enumerable: true, get: function () { return UserStore_1.AuthenticationResult; } });
Object.defineProperty(exports, "TBusinessUserType", { enumerable: true, get: function () { return UserStore_1.BusinessUserType; } });
Object.defineProperty(exports, "TGetLoginInfoRequest", { enumerable: true, get: function () { return UserStore_1.GetLoginInfoRequest; } });
Object.defineProperty(exports, "TGetNAPAccessJWTRequest", { enumerable: true, get: function () { return UserStore_1.GetNAPAccessJWTRequest; } });
Object.defineProperty(exports, "TLoginInfo", { enumerable: true, get: function () { return UserStore_1.LoginInfo; } });
Object.defineProperty(exports, "TLoginStatus", { enumerable: true, get: function () { return UserStore_1.LoginStatus; } });
Object.defineProperty(exports, "TNapMigrationState", { enumerable: true, get: function () { return UserStore_1.NapMigrationState; } });
Object.defineProperty(exports, "TPublicUserInfo", { enumerable: true, get: function () { return UserStore_1.PublicUserInfo; } });
Object.defineProperty(exports, "TUserUrls", { enumerable: true, get: function () { return UserStore_1.UserUrls; } });
var Utility_1 = require("en-thrift-internal/lib/Utility");
Object.defineProperty(exports, "TChangePositionRequest", { enumerable: true, get: function () { return Utility_1.ChangePositionRequest; } });
Object.defineProperty(exports, "TCrossPromotionInfo", { enumerable: true, get: function () { return Utility_1.CrossPromotionInfo; } });
Object.defineProperty(exports, "TFeatureAvailability", { enumerable: true, get: function () { return Utility_1.FeatureAvailability; } });
Object.defineProperty(exports, "THasActiveSessionRequest", { enumerable: true, get: function () { return Utility_1.HasActiveSessionRequest; } });
Object.defineProperty(exports, "TMarketingEmailParameters", { enumerable: true, get: function () { return Utility_1.MarketingEmailParameters; } });
Object.defineProperty(exports, "TPinnedContent", { enumerable: true, get: function () { return Utility_1.PinnedContent; } });
Object.defineProperty(exports, "TPinnedEntityType", { enumerable: true, get: function () { return Utility_1.PinnedEntityType; } });
Object.defineProperty(exports, "TPromotionStatus", { enumerable: true, get: function () { return Utility_1.PromotionStatus; } });
Object.defineProperty(exports, "TNsvcThirdPartyAuthorizationTokenResult", { enumerable: true, get: function () { return Utility_1.NsvcThirdPartyAuthorizationTokenResult; } });
Object.defineProperty(exports, "TNsvcTokenType", { enumerable: true, get: function () { return Utility_1.NsvcTokenType; } });
Object.defineProperty(exports, "TRegisterDeviceSessionRequest", { enumerable: true, get: function () { return Utility_1.RegisterDeviceSessionRequest; } });
Object.defineProperty(exports, "TResourcesUpdateRequest", { enumerable: true, get: function () { return Utility_1.ResourcesUpdateRequest; } });
Object.defineProperty(exports, "TRevokeSessionRequest", { enumerable: true, get: function () { return Utility_1.RevokeSessionRequest; } });
Object.defineProperty(exports, "TSupportTicket", { enumerable: true, get: function () { return Utility_1.SupportTicket; } });
Object.defineProperty(exports, "TTeamStartPackRequest", { enumerable: true, get: function () { return Utility_1.TeamStarterPackRequest; } });
Object.defineProperty(exports, "TTierSelectionDisplayEligibilityRequest", { enumerable: true, get: function () { return Utility_1.TierSelectionDisplayEligibilityRequest; } });
Object.defineProperty(exports, "TTierSelectionDisplayEligibilityResult", { enumerable: true, get: function () { return Utility_1.TierSelectionDisplayEligibilityResult; } });
Object.defineProperty(exports, "TTsdType", { enumerable: true, get: function () { return Utility_1.TsdType; } });
Object.defineProperty(exports, "TTsdVariation", { enumerable: true, get: function () { return Utility_1.TsdVariation; } });
Object.defineProperty(exports, "TMonetizationSvcClientType", { enumerable: true, get: function () { return Utility_1.MmsvcClientType; } });
Object.defineProperty(exports, "TMonetizationSvcCreateDeviceSyncRequest", { enumerable: true, get: function () { return Utility_1.MmsvcCreateSyncRequest; } });
Object.defineProperty(exports, "TMonetizationSvcRequest", { enumerable: true, get: function () { return Utility_1.MmsvcRequest; } });
Object.defineProperty(exports, "TMonetizationSvcResponse", { enumerable: true, get: function () { return Utility_1.MmsvcResponse; } });
//# sourceMappingURL=ThriftTypes.js.map