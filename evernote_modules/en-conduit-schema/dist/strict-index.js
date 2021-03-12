"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipsInParentOrderBy = exports.MembershipsForMeOrderBy = exports.MembershipsForMeInParentOrderBy = exports.MembershipRecipientType = exports.MembershipPrivilege = exports.MembershipFilterField = exports.MarketingEmailType = exports.MaestroRequestingEnvironment = exports.MaestroPlatform = exports.MaestroClientType = exports.LoginInfoNapMigrationState = exports.LoginInfoLoginStatus = exports.LoginInfoBusinessUserType = exports.LayoutStyle = exports.Layout = exports.InvitationSortField = exports.InvitationsForMeOrderBy = exports.InvitationInvitationType = exports.InvitationFilterField = exports.IndexOrderType = exports.GoogleScopesEnum = exports.FeatureRolloutDataResultSiwg = exports.FeatureRolloutDataResultSiwa = exports.FeatureRolloutClientType = exports.DescendentTasksStatus = exports.CommEngineEventType = exports.ClientType = exports.ClientPlatform = exports.CalendarSettingsMobileRemindersOpenNoteMinutes = exports.CalendarSettingsMobileRemindersCreateNoteMinutes = exports.CalendarSettingsDesktopRemindersOpenNoteMinutes = exports.CalendarSettingsDesktopRemindersCreateNoteMinutes = exports.CalendarProviderField = exports.CalendarEventStatus = exports.BoardSortField = exports.BoardPlatformWidgetsPlatform = exports.BoardMobileLayout = exports.BoardFilterField = exports.BoardDesktopLayout = exports.BoardCreateHome_ServiceLevel = exports.BoardCreateHome_Platform = exports.BoardBootstrapPlatform = exports.BoardBoardType = exports.BetaFeatureSortField = exports.BetaFeatureFilterField = exports.AuthStateEnum = exports.AttachmentSortField = exports.AttachmentFilterField = exports.AdaptiveDownsyncTypeEnum = exports.AccessStatus = void 0;
exports.SearchExSortOrder = exports.SearchExResultType = exports.SearchExLocalSearchMode = exports.ScheduledNotificationSortField = exports.ScheduledNotificationScheduledNotificationType = exports.ScheduledNotificationFilterField = exports.SavedSearchSortField = exports.SavedSearchFilterField = exports.ReminderUpdate_ReminderDateUiOption = exports.ReminderStatus = exports.ReminderSortField = exports.ReminderReminderDateUiOption = exports.ReminderFilterField = exports.ReminderCreate_ReminderDateUiOption = exports.PublishedNotebooksSortField = exports.PublishedNotebooksFilterField = exports.Provider = exports.PromotionSortField = exports.PromotionFilterField = exports.ProfileStatus = exports.ProfileSortField = exports.ProfileFilterField = exports.PrivilegeLevel = exports.PlatformWidgetsWidgetType = exports.PlatformWidgetsSelectedTab = exports.OAuthProvider = exports.NotesWithRemindersOrderBy = exports.NoteSortField = exports.NotesNotInTrashOrderBy = exports.NotesInTrashOrderBy = exports.NotesInParentOrderBy = exports.NoteOwnMembershipsOrderBy = exports.NoteInvite_Privilege = exports.NoteFilterField = exports.NoteContentInfoSortField = exports.NoteContentInfoFilterField = exports.NotebookSortField = exports.NotebooksOrderBy = exports.NotebookReminderNotesOrderBy = exports.NotebookOwnMembershipsOrderBy = exports.NotebookInvite_Privilege = exports.NotebookFilterField = exports.NotebookChildNotesOrderBy = exports.NotebookAllMembershipsOrderBy = exports.NoteAllMembershipsOrderBy = exports.MonetizationClientType = exports.MessageSortField = exports.MessageFilterField = exports.MembershipUpdatePrivilege_Privilege = exports.MembershipSortField = void 0;
exports.WidgetsInBoardWidgetType = exports.WidgetsInBoardSelectedTab = exports.WidgetsInBoardPlatform = exports.WidgetSetSelectedTab_TabToSelect = exports.WidgetSelectedTab = exports.WidgetFilterField = exports.WidgetContentConflictSortField = exports.WidgetContentConflictFilterField = exports.WidgetBoardType = exports.UserSetReminderSetting_Setting = exports.UserServiceLevel = exports.UserPrivilege = exports.UserBusinessUserRole = exports.UserAttributesReminderEmail = exports.UserAccountingPremiumServiceStatus = exports.UserAccountingBusinessRole = exports.TierSelectionDisplayResultTsdVariation = exports.TierSelectionDisplayResultTsdType = exports.ThreadSortField = exports.ThreadFilterField = exports.TaskUserSettingsSortField = exports.TaskUserSettingsFilterField = exports.TaskUpdate_Status = exports.TaskUpdate_DueDateUiOption = exports.TaskStatus = exports.TaskSortField = exports.TasksInNoteStatus = exports.TaskNotesNotInTrashOrderBy = exports.TaskFilterField = exports.TaskDueDateUiOption = exports.TaskCreate_DueDateUiOption = exports.TagSortField = exports.TagsOrderBy = exports.TagsAllowedField = exports.TagHierarchySortField = exports.TagHierarchyFilterField = exports.TagFilterField = exports.TagChildTagsOrderBy = exports.SyncProgressTypeEnum = exports.SupportedPlacement = exports.Status = exports.StackSortField = exports.StackFilterField = exports.StackedNotebookSortField = exports.ShortcutSortField = exports.ShortcutFilterField = exports.SharedWithMeField = exports.ServiceProvider = exports.SearchLogEventTypeProperty = exports.SearchExTextField = void 0;
exports.WorkspaceWorkspaceType = exports.WorkspaceUpdate_Type = exports.WorkspaceUpdate_DefaultRole = exports.WorkspaceSortField = exports.WorkspaceSetLayoutStyle_LayoutStyle = exports.WorkspaceReminderNotesOrderBy = exports.WorkspaceOwnMembershipsOrderBy = exports.WorkspaceInvite_Privilege = exports.WorkspaceFilterField = exports.WorkspaceDirectorySortField = exports.WorkspaceDirectoryFilterField = exports.WorkspaceDefaultRole = exports.WorkspaceCreate_Type = exports.WorkspaceCreate_DefaultRole = exports.WorkspaceChildNotesOrderBy = exports.WorkspaceAllMembershipsOrderBy = exports.WorkspaceAccessStatus = exports.WidgetWidgetType = exports.WidgetSortField = void 0;
var AccessStatus;
(function (AccessStatus) {
    AccessStatus["Open"] = "OPEN";
    AccessStatus["Member"] = "MEMBER";
})(AccessStatus = exports.AccessStatus || (exports.AccessStatus = {}));
var AdaptiveDownsyncTypeEnum;
(function (AdaptiveDownsyncTypeEnum) {
    AdaptiveDownsyncTypeEnum["None"] = "NONE";
    AdaptiveDownsyncTypeEnum["FullDownsyncSmallAccount"] = "FULL_DOWNSYNC_SMALL_ACCOUNT";
    AdaptiveDownsyncTypeEnum["FullDownsyncLargeAccount"] = "FULL_DOWNSYNC_LARGE_ACCOUNT";
    AdaptiveDownsyncTypeEnum["LimitedDownsync"] = "LIMITED_DOWNSYNC";
})(AdaptiveDownsyncTypeEnum = exports.AdaptiveDownsyncTypeEnum || (exports.AdaptiveDownsyncTypeEnum = {}));
var AttachmentFilterField;
(function (AttachmentFilterField) {
    AttachmentFilterField["Label"] = "label";
    AttachmentFilterField["Parent"] = "parent";
    AttachmentFilterField["IsActive"] = "isActive";
    AttachmentFilterField["Id"] = "id";
    AttachmentFilterField["Mime"] = "mime";
    AttachmentFilterField["Width"] = "width";
    AttachmentFilterField["Height"] = "height";
    AttachmentFilterField["Filename"] = "filename";
    AttachmentFilterField["DataLocalChangeTimestamp"] = "data_localChangeTimestamp";
    AttachmentFilterField["DataHash"] = "data_hash";
    AttachmentFilterField["DataSize"] = "data_size";
    AttachmentFilterField["DataUrl"] = "data_url";
    AttachmentFilterField["RecognitionLocalChangeTimestamp"] = "recognition_localChangeTimestamp";
    AttachmentFilterField["RecognitionHash"] = "recognition_hash";
    AttachmentFilterField["RecognitionSize"] = "recognition_size";
    AttachmentFilterField["AlternateDataLocalChangeTimestamp"] = "alternateData_localChangeTimestamp";
    AttachmentFilterField["AlternateDataHash"] = "alternateData_hash";
    AttachmentFilterField["AlternateDataSize"] = "alternateData_size";
    AttachmentFilterField["ApplicationDataKeys"] = "applicationDataKeys";
    AttachmentFilterField["AttributesSourceUrl"] = "Attributes_sourceURL";
    AttachmentFilterField["AttributesTimestamp"] = "Attributes_timestamp";
    AttachmentFilterField["AttributesLocationLatitude"] = "Attributes_Location_latitude";
    AttachmentFilterField["AttributesLocationLongitude"] = "Attributes_Location_longitude";
    AttachmentFilterField["AttributesLocationAltitude"] = "Attributes_Location_altitude";
    AttachmentFilterField["AttributesCameraMake"] = "Attributes_cameraMake";
    AttachmentFilterField["AttributesCameraModel"] = "Attributes_cameraModel";
    AttachmentFilterField["AttributesClientWillIndex"] = "Attributes_clientWillIndex";
})(AttachmentFilterField = exports.AttachmentFilterField || (exports.AttachmentFilterField = {}));
var AttachmentSortField;
(function (AttachmentSortField) {
    AttachmentSortField["Label"] = "label";
    AttachmentSortField["Parent"] = "parent";
    AttachmentSortField["IsActive"] = "isActive";
    AttachmentSortField["Id"] = "id";
    AttachmentSortField["Mime"] = "mime";
    AttachmentSortField["Width"] = "width";
    AttachmentSortField["Height"] = "height";
    AttachmentSortField["Filename"] = "filename";
    AttachmentSortField["DataLocalChangeTimestamp"] = "data_localChangeTimestamp";
    AttachmentSortField["DataHash"] = "data_hash";
    AttachmentSortField["DataSize"] = "data_size";
    AttachmentSortField["DataUrl"] = "data_url";
    AttachmentSortField["RecognitionLocalChangeTimestamp"] = "recognition_localChangeTimestamp";
    AttachmentSortField["RecognitionHash"] = "recognition_hash";
    AttachmentSortField["RecognitionSize"] = "recognition_size";
    AttachmentSortField["AlternateDataLocalChangeTimestamp"] = "alternateData_localChangeTimestamp";
    AttachmentSortField["AlternateDataHash"] = "alternateData_hash";
    AttachmentSortField["AlternateDataSize"] = "alternateData_size";
    AttachmentSortField["ApplicationDataKeys"] = "applicationDataKeys";
    AttachmentSortField["AttributesSourceUrl"] = "Attributes_sourceURL";
    AttachmentSortField["AttributesTimestamp"] = "Attributes_timestamp";
    AttachmentSortField["AttributesLocationLatitude"] = "Attributes_Location_latitude";
    AttachmentSortField["AttributesLocationLongitude"] = "Attributes_Location_longitude";
    AttachmentSortField["AttributesLocationAltitude"] = "Attributes_Location_altitude";
    AttachmentSortField["AttributesCameraMake"] = "Attributes_cameraMake";
    AttachmentSortField["AttributesCameraModel"] = "Attributes_cameraModel";
    AttachmentSortField["AttributesClientWillIndex"] = "Attributes_clientWillIndex";
})(AttachmentSortField = exports.AttachmentSortField || (exports.AttachmentSortField = {}));
var AuthStateEnum;
(function (AuthStateEnum) {
    AuthStateEnum["NoAuth"] = "NoAuth";
    AuthStateEnum["NeedTwoFactor"] = "NeedTwoFactor";
    AuthStateEnum["NeedSso"] = "NeedSSO";
    AuthStateEnum["Expired"] = "Expired";
    AuthStateEnum["BadAuthToken"] = "BadAuthToken";
    AuthStateEnum["UserChanged"] = "UserChanged";
    AuthStateEnum["Authorized"] = "Authorized";
    AuthStateEnum["ClientNotSupported"] = "ClientNotSupported";
    AuthStateEnum["SessionRevoked"] = "SessionRevoked";
    AuthStateEnum["PasswordResetRequired"] = "PasswordResetRequired";
})(AuthStateEnum = exports.AuthStateEnum || (exports.AuthStateEnum = {}));
var BetaFeatureFilterField;
(function (BetaFeatureFilterField) {
    BetaFeatureFilterField["BetaFeatureKey"] = "betaFeatureKey";
    BetaFeatureFilterField["IsAvailable"] = "isAvailable";
    BetaFeatureFilterField["Id"] = "id";
    BetaFeatureFilterField["Label"] = "label";
})(BetaFeatureFilterField = exports.BetaFeatureFilterField || (exports.BetaFeatureFilterField = {}));
var BetaFeatureSortField;
(function (BetaFeatureSortField) {
    BetaFeatureSortField["BetaFeatureKey"] = "betaFeatureKey";
    BetaFeatureSortField["IsAvailable"] = "isAvailable";
    BetaFeatureSortField["Id"] = "id";
    BetaFeatureSortField["Label"] = "label";
})(BetaFeatureSortField = exports.BetaFeatureSortField || (exports.BetaFeatureSortField = {}));
var BoardBoardType;
(function (BoardBoardType) {
    BoardBoardType["Home"] = "Home";
})(BoardBoardType = exports.BoardBoardType || (exports.BoardBoardType = {}));
var BoardBootstrapPlatform;
(function (BoardBootstrapPlatform) {
    BoardBootstrapPlatform["Mobile"] = "Mobile";
    BoardBootstrapPlatform["Desktop"] = "Desktop";
})(BoardBootstrapPlatform = exports.BoardBootstrapPlatform || (exports.BoardBootstrapPlatform = {}));
var BoardCreateHome_Platform;
(function (BoardCreateHome_Platform) {
    BoardCreateHome_Platform["Mobile"] = "Mobile";
    BoardCreateHome_Platform["Desktop"] = "Desktop";
})(BoardCreateHome_Platform = exports.BoardCreateHome_Platform || (exports.BoardCreateHome_Platform = {}));
var BoardCreateHome_ServiceLevel;
(function (BoardCreateHome_ServiceLevel) {
    BoardCreateHome_ServiceLevel["Basic"] = "BASIC";
    BoardCreateHome_ServiceLevel["Plus"] = "PLUS";
    BoardCreateHome_ServiceLevel["Premium"] = "PREMIUM";
    BoardCreateHome_ServiceLevel["Business"] = "BUSINESS";
})(BoardCreateHome_ServiceLevel = exports.BoardCreateHome_ServiceLevel || (exports.BoardCreateHome_ServiceLevel = {}));
var BoardDesktopLayout;
(function (BoardDesktopLayout) {
    BoardDesktopLayout["ThreeColumnFlex"] = "ThreeColumnFlex";
})(BoardDesktopLayout = exports.BoardDesktopLayout || (exports.BoardDesktopLayout = {}));
var BoardFilterField;
(function (BoardFilterField) {
    BoardFilterField["Created"] = "created";
    BoardFilterField["IsSupported"] = "isSupported";
    BoardFilterField["Id"] = "id";
    BoardFilterField["BoardType"] = "boardType";
    BoardFilterField["HeaderBgLocalChangeTimestamp"] = "headerBG_localChangeTimestamp";
    BoardFilterField["HeaderBgHash"] = "headerBG_hash";
    BoardFilterField["HeaderBgSize"] = "headerBG_size";
    BoardFilterField["HeaderBgUrl"] = "headerBG_url";
    BoardFilterField["HeaderBgId"] = "headerBG_id";
    BoardFilterField["HeaderBgFormat"] = "headerBG_format";
    BoardFilterField["HeaderBgVersion"] = "headerBG_version";
    BoardFilterField["HeaderBgPath"] = "headerBG_path";
    BoardFilterField["HeaderBgMime"] = "headerBGMime";
    BoardFilterField["HeaderBgFileName"] = "headerBGFileName";
    BoardFilterField["HeaderBgPreviousUploadLocalChangeTimestamp"] = "headerBGPreviousUpload_localChangeTimestamp";
    BoardFilterField["HeaderBgPreviousUploadHash"] = "headerBGPreviousUpload_hash";
    BoardFilterField["HeaderBgPreviousUploadSize"] = "headerBGPreviousUpload_size";
    BoardFilterField["HeaderBgPreviousUploadUrl"] = "headerBGPreviousUpload_url";
    BoardFilterField["HeaderBgPreviousUploadId"] = "headerBGPreviousUpload_id";
    BoardFilterField["HeaderBgPreviousUploadFormat"] = "headerBGPreviousUpload_format";
    BoardFilterField["HeaderBgPreviousUploadVersion"] = "headerBGPreviousUpload_version";
    BoardFilterField["HeaderBgPreviousUploadPath"] = "headerBGPreviousUpload_path";
    BoardFilterField["HeaderBgPreviousUploadMime"] = "headerBGPreviousUploadMime";
    BoardFilterField["HeaderBgPreviousUploadFileName"] = "headerBGPreviousUploadFileName";
    BoardFilterField["DesktopLayout"] = "desktop_layout";
    BoardFilterField["MobileLayout"] = "mobile_layout";
    BoardFilterField["FreeTrialExpiration"] = "freeTrialExpiration";
    BoardFilterField["Updated"] = "updated";
    BoardFilterField["TasksVersion"] = "tasksVersion";
    BoardFilterField["CalendarVersion"] = "calendarVersion";
    BoardFilterField["Label"] = "label";
})(BoardFilterField = exports.BoardFilterField || (exports.BoardFilterField = {}));
var BoardMobileLayout;
(function (BoardMobileLayout) {
    BoardMobileLayout["SingleColumnStack"] = "SingleColumnStack";
})(BoardMobileLayout = exports.BoardMobileLayout || (exports.BoardMobileLayout = {}));
var BoardPlatformWidgetsPlatform;
(function (BoardPlatformWidgetsPlatform) {
    BoardPlatformWidgetsPlatform["Mobile"] = "mobile";
    BoardPlatformWidgetsPlatform["Desktop"] = "desktop";
})(BoardPlatformWidgetsPlatform = exports.BoardPlatformWidgetsPlatform || (exports.BoardPlatformWidgetsPlatform = {}));
var BoardSortField;
(function (BoardSortField) {
    BoardSortField["Created"] = "created";
    BoardSortField["IsSupported"] = "isSupported";
    BoardSortField["Id"] = "id";
    BoardSortField["BoardType"] = "boardType";
    BoardSortField["HeaderBgLocalChangeTimestamp"] = "headerBG_localChangeTimestamp";
    BoardSortField["HeaderBgHash"] = "headerBG_hash";
    BoardSortField["HeaderBgSize"] = "headerBG_size";
    BoardSortField["HeaderBgUrl"] = "headerBG_url";
    BoardSortField["HeaderBgId"] = "headerBG_id";
    BoardSortField["HeaderBgFormat"] = "headerBG_format";
    BoardSortField["HeaderBgVersion"] = "headerBG_version";
    BoardSortField["HeaderBgPath"] = "headerBG_path";
    BoardSortField["HeaderBgMime"] = "headerBGMime";
    BoardSortField["HeaderBgFileName"] = "headerBGFileName";
    BoardSortField["HeaderBgPreviousUploadLocalChangeTimestamp"] = "headerBGPreviousUpload_localChangeTimestamp";
    BoardSortField["HeaderBgPreviousUploadHash"] = "headerBGPreviousUpload_hash";
    BoardSortField["HeaderBgPreviousUploadSize"] = "headerBGPreviousUpload_size";
    BoardSortField["HeaderBgPreviousUploadUrl"] = "headerBGPreviousUpload_url";
    BoardSortField["HeaderBgPreviousUploadId"] = "headerBGPreviousUpload_id";
    BoardSortField["HeaderBgPreviousUploadFormat"] = "headerBGPreviousUpload_format";
    BoardSortField["HeaderBgPreviousUploadVersion"] = "headerBGPreviousUpload_version";
    BoardSortField["HeaderBgPreviousUploadPath"] = "headerBGPreviousUpload_path";
    BoardSortField["HeaderBgPreviousUploadMime"] = "headerBGPreviousUploadMime";
    BoardSortField["HeaderBgPreviousUploadFileName"] = "headerBGPreviousUploadFileName";
    BoardSortField["DesktopLayout"] = "desktop_layout";
    BoardSortField["MobileLayout"] = "mobile_layout";
    BoardSortField["FreeTrialExpiration"] = "freeTrialExpiration";
    BoardSortField["Updated"] = "updated";
    BoardSortField["TasksVersion"] = "tasksVersion";
    BoardSortField["CalendarVersion"] = "calendarVersion";
    BoardSortField["Label"] = "label";
})(BoardSortField = exports.BoardSortField || (exports.BoardSortField = {}));
var CalendarEventStatus;
(function (CalendarEventStatus) {
    CalendarEventStatus["Confirmed"] = "CONFIRMED";
    CalendarEventStatus["Canceled"] = "CANCELED";
    CalendarEventStatus["Tentative"] = "TENTATIVE";
})(CalendarEventStatus = exports.CalendarEventStatus || (exports.CalendarEventStatus = {}));
var CalendarProviderField;
(function (CalendarProviderField) {
    CalendarProviderField["Google"] = "GOOGLE";
    CalendarProviderField["Outlook"] = "OUTLOOK";
    CalendarProviderField["Other"] = "OTHER";
})(CalendarProviderField = exports.CalendarProviderField || (exports.CalendarProviderField = {}));
var CalendarSettingsDesktopRemindersCreateNoteMinutes;
(function (CalendarSettingsDesktopRemindersCreateNoteMinutes) {
    CalendarSettingsDesktopRemindersCreateNoteMinutes["ThirtyBefore"] = "THIRTY_BEFORE";
    CalendarSettingsDesktopRemindersCreateNoteMinutes["TenBefore"] = "TEN_BEFORE";
    CalendarSettingsDesktopRemindersCreateNoteMinutes["FiveBefore"] = "FIVE_BEFORE";
    CalendarSettingsDesktopRemindersCreateNoteMinutes["AtStart"] = "AT_START";
    CalendarSettingsDesktopRemindersCreateNoteMinutes["AtEnd"] = "AT_END";
    CalendarSettingsDesktopRemindersCreateNoteMinutes["FiveAfter"] = "FIVE_AFTER";
})(CalendarSettingsDesktopRemindersCreateNoteMinutes = exports.CalendarSettingsDesktopRemindersCreateNoteMinutes || (exports.CalendarSettingsDesktopRemindersCreateNoteMinutes = {}));
var CalendarSettingsDesktopRemindersOpenNoteMinutes;
(function (CalendarSettingsDesktopRemindersOpenNoteMinutes) {
    CalendarSettingsDesktopRemindersOpenNoteMinutes["ThirtyBefore"] = "THIRTY_BEFORE";
    CalendarSettingsDesktopRemindersOpenNoteMinutes["TenBefore"] = "TEN_BEFORE";
    CalendarSettingsDesktopRemindersOpenNoteMinutes["FiveBefore"] = "FIVE_BEFORE";
    CalendarSettingsDesktopRemindersOpenNoteMinutes["AtStart"] = "AT_START";
    CalendarSettingsDesktopRemindersOpenNoteMinutes["AtEnd"] = "AT_END";
    CalendarSettingsDesktopRemindersOpenNoteMinutes["FiveAfter"] = "FIVE_AFTER";
})(CalendarSettingsDesktopRemindersOpenNoteMinutes = exports.CalendarSettingsDesktopRemindersOpenNoteMinutes || (exports.CalendarSettingsDesktopRemindersOpenNoteMinutes = {}));
var CalendarSettingsMobileRemindersCreateNoteMinutes;
(function (CalendarSettingsMobileRemindersCreateNoteMinutes) {
    CalendarSettingsMobileRemindersCreateNoteMinutes["ThirtyBefore"] = "THIRTY_BEFORE";
    CalendarSettingsMobileRemindersCreateNoteMinutes["TenBefore"] = "TEN_BEFORE";
    CalendarSettingsMobileRemindersCreateNoteMinutes["FiveBefore"] = "FIVE_BEFORE";
    CalendarSettingsMobileRemindersCreateNoteMinutes["AtStart"] = "AT_START";
    CalendarSettingsMobileRemindersCreateNoteMinutes["AtEnd"] = "AT_END";
    CalendarSettingsMobileRemindersCreateNoteMinutes["FiveAfter"] = "FIVE_AFTER";
})(CalendarSettingsMobileRemindersCreateNoteMinutes = exports.CalendarSettingsMobileRemindersCreateNoteMinutes || (exports.CalendarSettingsMobileRemindersCreateNoteMinutes = {}));
var CalendarSettingsMobileRemindersOpenNoteMinutes;
(function (CalendarSettingsMobileRemindersOpenNoteMinutes) {
    CalendarSettingsMobileRemindersOpenNoteMinutes["ThirtyBefore"] = "THIRTY_BEFORE";
    CalendarSettingsMobileRemindersOpenNoteMinutes["TenBefore"] = "TEN_BEFORE";
    CalendarSettingsMobileRemindersOpenNoteMinutes["FiveBefore"] = "FIVE_BEFORE";
    CalendarSettingsMobileRemindersOpenNoteMinutes["AtStart"] = "AT_START";
    CalendarSettingsMobileRemindersOpenNoteMinutes["AtEnd"] = "AT_END";
    CalendarSettingsMobileRemindersOpenNoteMinutes["FiveAfter"] = "FIVE_AFTER";
})(CalendarSettingsMobileRemindersOpenNoteMinutes = exports.CalendarSettingsMobileRemindersOpenNoteMinutes || (exports.CalendarSettingsMobileRemindersOpenNoteMinutes = {}));
var ClientPlatform;
(function (ClientPlatform) {
    ClientPlatform["Android"] = "ANDROID";
    ClientPlatform["Ios"] = "IOS";
    ClientPlatform["Mac"] = "MAC";
})(ClientPlatform = exports.ClientPlatform || (exports.ClientPlatform = {}));
var ClientType;
(function (ClientType) {
    ClientType["Mac"] = "MAC";
    ClientType["Windows"] = "WINDOWS";
    ClientType["Ios"] = "IOS";
    ClientType["Android"] = "ANDROID";
    ClientType["Web"] = "WEB";
    ClientType["Clipper"] = "CLIPPER";
    ClientType["Ion"] = "ION";
    ClientType["Boron"] = "BORON";
})(ClientType = exports.ClientType || (exports.ClientType = {}));
var CommEngineEventType;
(function (CommEngineEventType) {
    CommEngineEventType["Show"] = "SHOW";
    CommEngineEventType["Dismiss"] = "DISMISS";
    CommEngineEventType["Track"] = "TRACK";
    CommEngineEventType["Errorevent"] = "ERROREVENT";
})(CommEngineEventType = exports.CommEngineEventType || (exports.CommEngineEventType = {}));
var DescendentTasksStatus;
(function (DescendentTasksStatus) {
    DescendentTasksStatus["Open"] = "open";
    DescendentTasksStatus["Completed"] = "completed";
})(DescendentTasksStatus = exports.DescendentTasksStatus || (exports.DescendentTasksStatus = {}));
var FeatureRolloutClientType;
(function (FeatureRolloutClientType) {
    FeatureRolloutClientType["Mobile"] = "mobile";
    FeatureRolloutClientType["Desktop"] = "desktop";
})(FeatureRolloutClientType = exports.FeatureRolloutClientType || (exports.FeatureRolloutClientType = {}));
var FeatureRolloutDataResultSiwa;
(function (FeatureRolloutDataResultSiwa) {
    FeatureRolloutDataResultSiwa["Nap"] = "NAP";
    FeatureRolloutDataResultSiwa["Legacy"] = "Legacy";
})(FeatureRolloutDataResultSiwa = exports.FeatureRolloutDataResultSiwa || (exports.FeatureRolloutDataResultSiwa = {}));
var FeatureRolloutDataResultSiwg;
(function (FeatureRolloutDataResultSiwg) {
    FeatureRolloutDataResultSiwg["Nap"] = "NAP";
    FeatureRolloutDataResultSiwg["Legacy"] = "Legacy";
})(FeatureRolloutDataResultSiwg = exports.FeatureRolloutDataResultSiwg || (exports.FeatureRolloutDataResultSiwg = {}));
/** Recognized Google authorization scopes for use in Google Services API. */
var GoogleScopesEnum;
(function (GoogleScopesEnum) {
    /** Scope for Google Drive API access. */
    GoogleScopesEnum["Drive"] = "DRIVE";
    /** Scope for Google Calendar API access. */
    GoogleScopesEnum["Calendar"] = "CALENDAR";
    /** Scope for Google Contacts API access. */
    GoogleScopesEnum["Contacts"] = "CONTACTS";
})(GoogleScopesEnum = exports.GoogleScopesEnum || (exports.GoogleScopesEnum = {}));
var IndexOrderType;
(function (IndexOrderType) {
    IndexOrderType["Asc"] = "ASC";
    IndexOrderType["Desc"] = "DESC";
})(IndexOrderType = exports.IndexOrderType || (exports.IndexOrderType = {}));
var InvitationFilterField;
(function (InvitationFilterField) {
    InvitationFilterField["Created"] = "created";
    InvitationFilterField["Label"] = "label";
    InvitationFilterField["Id"] = "id";
    InvitationFilterField["Snippet"] = "snippet";
    InvitationFilterField["InvitationType"] = "invitationType";
})(InvitationFilterField = exports.InvitationFilterField || (exports.InvitationFilterField = {}));
var InvitationInvitationType;
(function (InvitationInvitationType) {
    InvitationInvitationType["Unknown"] = "UNKNOWN";
    InvitationInvitationType["Note"] = "NOTE";
    InvitationInvitationType["Notebook"] = "NOTEBOOK";
})(InvitationInvitationType = exports.InvitationInvitationType || (exports.InvitationInvitationType = {}));
var InvitationsForMeOrderBy;
(function (InvitationsForMeOrderBy) {
    InvitationsForMeOrderBy["Created"] = "created";
    InvitationsForMeOrderBy["Label"] = "label";
})(InvitationsForMeOrderBy = exports.InvitationsForMeOrderBy || (exports.InvitationsForMeOrderBy = {}));
var InvitationSortField;
(function (InvitationSortField) {
    InvitationSortField["Created"] = "created";
    InvitationSortField["Label"] = "label";
    InvitationSortField["Id"] = "id";
    InvitationSortField["Snippet"] = "snippet";
    InvitationSortField["InvitationType"] = "invitationType";
})(InvitationSortField = exports.InvitationSortField || (exports.InvitationSortField = {}));
var Layout;
(function (Layout) {
    Layout["Embed"] = "EMBED";
    Layout["Nativeembed"] = "NATIVEEMBED";
    Layout["Web"] = "WEB";
    Layout["Iphone"] = "IPHONE";
    Layout["Android"] = "ANDROID";
    Layout["Ipad"] = "IPAD";
    Layout["Wp7"] = "WP7";
    Layout["App"] = "APP";
    Layout["Micro"] = "MICRO";
    Layout["Oauthmicro"] = "OAUTHMICRO";
    Layout["Small"] = "SMALL";
    Layout["Mobile"] = "MOBILE";
    Layout["Webembed"] = "WEBEMBED";
    Layout["Mac"] = "MAC";
})(Layout = exports.Layout || (exports.Layout = {}));
var LayoutStyle;
(function (LayoutStyle) {
    LayoutStyle["List"] = "LIST";
    LayoutStyle["Board"] = "BOARD";
})(LayoutStyle = exports.LayoutStyle || (exports.LayoutStyle = {}));
var LoginInfoBusinessUserType;
(function (LoginInfoBusinessUserType) {
    LoginInfoBusinessUserType["Unknown"] = "UNKNOWN";
    LoginInfoBusinessUserType["PersonalOnly"] = "PERSONAL_ONLY";
    LoginInfoBusinessUserType["Legacy"] = "LEGACY";
    LoginInfoBusinessUserType["BusinessOnly"] = "BUSINESS_ONLY";
})(LoginInfoBusinessUserType = exports.LoginInfoBusinessUserType || (exports.LoginInfoBusinessUserType = {}));
var LoginInfoLoginStatus;
(function (LoginInfoLoginStatus) {
    LoginInfoLoginStatus["Unknown"] = "UNKNOWN";
    LoginInfoLoginStatus["InvalidFormat"] = "INVALID_FORMAT";
    LoginInfoLoginStatus["NotFound"] = "NOT_FOUND";
    LoginInfoLoginStatus["InvitePending"] = "INVITE_PENDING";
    LoginInfoLoginStatus["PasswordReset"] = "PASSWORD_RESET";
    LoginInfoLoginStatus["Password"] = "PASSWORD";
    LoginInfoLoginStatus["Sso"] = "SSO";
})(LoginInfoLoginStatus = exports.LoginInfoLoginStatus || (exports.LoginInfoLoginStatus = {}));
var LoginInfoNapMigrationState;
(function (LoginInfoNapMigrationState) {
    LoginInfoNapMigrationState["Unknown"] = "UNKNOWN";
    LoginInfoNapMigrationState["Legacy"] = "LEGACY";
    LoginInfoNapMigrationState["MigrateOnLogin"] = "MIGRATE_ON_LOGIN";
    LoginInfoNapMigrationState["Migrated"] = "MIGRATED";
    LoginInfoNapMigrationState["MigrationFailed"] = "MIGRATION_FAILED";
    LoginInfoNapMigrationState["MigratedNapOnly"] = "MIGRATED_NAP_ONLY";
    LoginInfoNapMigrationState["NotFound"] = "NOT_FOUND";
})(LoginInfoNapMigrationState = exports.LoginInfoNapMigrationState || (exports.LoginInfoNapMigrationState = {}));
var MaestroClientType;
(function (MaestroClientType) {
    MaestroClientType["Ion"] = "ION";
    MaestroClientType["Neutron"] = "NEUTRON";
    MaestroClientType["Boron"] = "BORON";
})(MaestroClientType = exports.MaestroClientType || (exports.MaestroClientType = {}));
var MaestroPlatform;
(function (MaestroPlatform) {
    MaestroPlatform["PlatformUnknown"] = "PLATFORM_UNKNOWN";
    MaestroPlatform["PlatformAndroid"] = "PLATFORM_ANDROID";
    MaestroPlatform["PlatformIos"] = "PLATFORM_IOS";
    MaestroPlatform["PlatformLinux"] = "PLATFORM_LINUX";
    MaestroPlatform["PlatformMac"] = "PLATFORM_MAC";
    MaestroPlatform["PlatformWindows"] = "PLATFORM_WINDOWS";
})(MaestroPlatform = exports.MaestroPlatform || (exports.MaestroPlatform = {}));
var MaestroRequestingEnvironment;
(function (MaestroRequestingEnvironment) {
    MaestroRequestingEnvironment["Localhost"] = "LOCALHOST";
    MaestroRequestingEnvironment["Preprod"] = "PREPROD";
    MaestroRequestingEnvironment["Stage"] = "STAGE";
    MaestroRequestingEnvironment["Production"] = "PRODUCTION";
    MaestroRequestingEnvironment["Etnc"] = "ETNC";
})(MaestroRequestingEnvironment = exports.MaestroRequestingEnvironment || (exports.MaestroRequestingEnvironment = {}));
var MarketingEmailType;
(function (MarketingEmailType) {
    MarketingEmailType["DesktopUpsell"] = "DESKTOP_UPSELL";
    MarketingEmailType["ClipperUpsell"] = "CLIPPER_UPSELL";
    MarketingEmailType["MobileUpsell"] = "MOBILE_UPSELL";
})(MarketingEmailType = exports.MarketingEmailType || (exports.MarketingEmailType = {}));
var MembershipFilterField;
(function (MembershipFilterField) {
    MembershipFilterField["Created"] = "created";
    MembershipFilterField["Label"] = "label";
    MembershipFilterField["RecipientIsMe"] = "recipientIsMe";
    MembershipFilterField["Parent"] = "parent";
    MembershipFilterField["Id"] = "id";
    MembershipFilterField["Privilege"] = "privilege";
    MembershipFilterField["RecipientType"] = "recipientType";
    MembershipFilterField["Updated"] = "updated";
    MembershipFilterField["InvitedTime"] = "invitedTime";
})(MembershipFilterField = exports.MembershipFilterField || (exports.MembershipFilterField = {}));
var MembershipPrivilege;
(function (MembershipPrivilege) {
    MembershipPrivilege["Read"] = "READ";
    MembershipPrivilege["Edit"] = "EDIT";
    MembershipPrivilege["Manage"] = "MANAGE";
})(MembershipPrivilege = exports.MembershipPrivilege || (exports.MembershipPrivilege = {}));
var MembershipRecipientType;
(function (MembershipRecipientType) {
    MembershipRecipientType["User"] = "USER";
    MembershipRecipientType["Identity"] = "IDENTITY";
    MembershipRecipientType["Email"] = "EMAIL";
    MembershipRecipientType["Business"] = "BUSINESS";
})(MembershipRecipientType = exports.MembershipRecipientType || (exports.MembershipRecipientType = {}));
var MembershipsForMeInParentOrderBy;
(function (MembershipsForMeInParentOrderBy) {
    MembershipsForMeInParentOrderBy["Created"] = "created";
    MembershipsForMeInParentOrderBy["Label"] = "label";
})(MembershipsForMeInParentOrderBy = exports.MembershipsForMeInParentOrderBy || (exports.MembershipsForMeInParentOrderBy = {}));
var MembershipsForMeOrderBy;
(function (MembershipsForMeOrderBy) {
    MembershipsForMeOrderBy["Created"] = "created";
    MembershipsForMeOrderBy["Label"] = "label";
})(MembershipsForMeOrderBy = exports.MembershipsForMeOrderBy || (exports.MembershipsForMeOrderBy = {}));
var MembershipsInParentOrderBy;
(function (MembershipsInParentOrderBy) {
    MembershipsInParentOrderBy["Created"] = "created";
    MembershipsInParentOrderBy["Label"] = "label";
})(MembershipsInParentOrderBy = exports.MembershipsInParentOrderBy || (exports.MembershipsInParentOrderBy = {}));
var MembershipSortField;
(function (MembershipSortField) {
    MembershipSortField["Created"] = "created";
    MembershipSortField["Label"] = "label";
    MembershipSortField["RecipientIsMe"] = "recipientIsMe";
    MembershipSortField["Parent"] = "parent";
    MembershipSortField["Id"] = "id";
    MembershipSortField["Privilege"] = "privilege";
    MembershipSortField["RecipientType"] = "recipientType";
    MembershipSortField["Updated"] = "updated";
    MembershipSortField["InvitedTime"] = "invitedTime";
})(MembershipSortField = exports.MembershipSortField || (exports.MembershipSortField = {}));
var MembershipUpdatePrivilege_Privilege;
(function (MembershipUpdatePrivilege_Privilege) {
    MembershipUpdatePrivilege_Privilege["Read"] = "READ";
    MembershipUpdatePrivilege_Privilege["Edit"] = "EDIT";
    MembershipUpdatePrivilege_Privilege["Manage"] = "MANAGE";
})(MembershipUpdatePrivilege_Privilege = exports.MembershipUpdatePrivilege_Privilege || (exports.MembershipUpdatePrivilege_Privilege = {}));
var MessageFilterField;
(function (MessageFilterField) {
    MessageFilterField["Thread"] = "thread";
    MessageFilterField["Created"] = "created";
    MessageFilterField["SupportedForWorkChat"] = "supportedForWorkChat";
    MessageFilterField["Id"] = "id";
    MessageFilterField["ReshareMessage"] = "reshareMessage";
    MessageFilterField["Creator"] = "creator";
    MessageFilterField["HasAttachments"] = "hasAttachments";
    MessageFilterField["Label"] = "label";
})(MessageFilterField = exports.MessageFilterField || (exports.MessageFilterField = {}));
var MessageSortField;
(function (MessageSortField) {
    MessageSortField["Thread"] = "thread";
    MessageSortField["Created"] = "created";
    MessageSortField["SupportedForWorkChat"] = "supportedForWorkChat";
    MessageSortField["Id"] = "id";
    MessageSortField["ReshareMessage"] = "reshareMessage";
    MessageSortField["Creator"] = "creator";
    MessageSortField["HasAttachments"] = "hasAttachments";
    MessageSortField["Label"] = "label";
})(MessageSortField = exports.MessageSortField || (exports.MessageSortField = {}));
var MonetizationClientType;
(function (MonetizationClientType) {
    MonetizationClientType["Ion"] = "ION";
    MonetizationClientType["NeutronIos"] = "NEUTRON_IOS";
    MonetizationClientType["NeutronAndroid"] = "NEUTRON_ANDROID";
    MonetizationClientType["BoronMac"] = "BORON_MAC";
    MonetizationClientType["BoronWin"] = "BORON_WIN";
})(MonetizationClientType = exports.MonetizationClientType || (exports.MonetizationClientType = {}));
var NoteAllMembershipsOrderBy;
(function (NoteAllMembershipsOrderBy) {
    NoteAllMembershipsOrderBy["Created"] = "created";
    NoteAllMembershipsOrderBy["Label"] = "label";
})(NoteAllMembershipsOrderBy = exports.NoteAllMembershipsOrderBy || (exports.NoteAllMembershipsOrderBy = {}));
var NotebookAllMembershipsOrderBy;
(function (NotebookAllMembershipsOrderBy) {
    NotebookAllMembershipsOrderBy["Created"] = "created";
    NotebookAllMembershipsOrderBy["Label"] = "label";
})(NotebookAllMembershipsOrderBy = exports.NotebookAllMembershipsOrderBy || (exports.NotebookAllMembershipsOrderBy = {}));
var NotebookChildNotesOrderBy;
(function (NotebookChildNotesOrderBy) {
    NotebookChildNotesOrderBy["Label"] = "label";
    NotebookChildNotesOrderBy["Created"] = "created";
    NotebookChildNotesOrderBy["Updated"] = "updated";
})(NotebookChildNotesOrderBy = exports.NotebookChildNotesOrderBy || (exports.NotebookChildNotesOrderBy = {}));
var NotebookFilterField;
(function (NotebookFilterField) {
    NotebookFilterField["Creator"] = "creator";
    NotebookFilterField["Label"] = "label";
    NotebookFilterField["Created"] = "created";
    NotebookFilterField["Updated"] = "updated";
    NotebookFilterField["Stack"] = "stack";
    NotebookFilterField["Parent"] = "parent";
    NotebookFilterField["ChildrenCount"] = "childrenCount";
    NotebookFilterField["MarkedForOffline"] = "markedForOffline";
    NotebookFilterField["ContentDownloaded"] = "contentDownloaded";
    NotebookFilterField["HasStack"] = "hasStack";
    NotebookFilterField["Id"] = "id";
    NotebookFilterField["IsPublished"] = "isPublished";
    NotebookFilterField["InWorkspace"] = "inWorkspace";
    NotebookFilterField["IsExternal"] = "isExternal";
    NotebookFilterField["ReminderNotifyEmail"] = "reminderNotifyEmail";
    NotebookFilterField["ReminderNotifyInApp"] = "reminderNotifyInApp";
    NotebookFilterField["IsPartialNotebook"] = "isPartialNotebook";
})(NotebookFilterField = exports.NotebookFilterField || (exports.NotebookFilterField = {}));
var NotebookInvite_Privilege;
(function (NotebookInvite_Privilege) {
    NotebookInvite_Privilege["Read"] = "READ";
    NotebookInvite_Privilege["Edit"] = "EDIT";
    NotebookInvite_Privilege["Manage"] = "MANAGE";
})(NotebookInvite_Privilege = exports.NotebookInvite_Privilege || (exports.NotebookInvite_Privilege = {}));
var NotebookOwnMembershipsOrderBy;
(function (NotebookOwnMembershipsOrderBy) {
    NotebookOwnMembershipsOrderBy["Created"] = "created";
    NotebookOwnMembershipsOrderBy["Label"] = "label";
})(NotebookOwnMembershipsOrderBy = exports.NotebookOwnMembershipsOrderBy || (exports.NotebookOwnMembershipsOrderBy = {}));
var NotebookReminderNotesOrderBy;
(function (NotebookReminderNotesOrderBy) {
    NotebookReminderNotesOrderBy["ReminderTime"] = "reminderTime";
    NotebookReminderNotesOrderBy["Label"] = "label";
    NotebookReminderNotesOrderBy["Created"] = "created";
    NotebookReminderNotesOrderBy["Updated"] = "updated";
})(NotebookReminderNotesOrderBy = exports.NotebookReminderNotesOrderBy || (exports.NotebookReminderNotesOrderBy = {}));
var NotebooksOrderBy;
(function (NotebooksOrderBy) {
    NotebooksOrderBy["Label"] = "label";
    NotebooksOrderBy["Updated"] = "updated";
})(NotebooksOrderBy = exports.NotebooksOrderBy || (exports.NotebooksOrderBy = {}));
var NotebookSortField;
(function (NotebookSortField) {
    NotebookSortField["Creator"] = "creator";
    NotebookSortField["Label"] = "label";
    NotebookSortField["Created"] = "created";
    NotebookSortField["Updated"] = "updated";
    NotebookSortField["Stack"] = "stack";
    NotebookSortField["Parent"] = "parent";
    NotebookSortField["ChildrenCount"] = "childrenCount";
    NotebookSortField["MarkedForOffline"] = "markedForOffline";
    NotebookSortField["ContentDownloaded"] = "contentDownloaded";
    NotebookSortField["HasStack"] = "hasStack";
    NotebookSortField["Id"] = "id";
    NotebookSortField["IsPublished"] = "isPublished";
    NotebookSortField["InWorkspace"] = "inWorkspace";
    NotebookSortField["IsExternal"] = "isExternal";
    NotebookSortField["ReminderNotifyEmail"] = "reminderNotifyEmail";
    NotebookSortField["ReminderNotifyInApp"] = "reminderNotifyInApp";
    NotebookSortField["IsPartialNotebook"] = "isPartialNotebook";
})(NotebookSortField = exports.NotebookSortField || (exports.NotebookSortField = {}));
var NoteContentInfoFilterField;
(function (NoteContentInfoFilterField) {
    NoteContentInfoFilterField["Parent"] = "parent";
    NoteContentInfoFilterField["Id"] = "id";
    NoteContentInfoFilterField["TaskGroupNoteLevelIDs"] = "taskGroupNoteLevelIDs";
    NoteContentInfoFilterField["Created"] = "created";
    NoteContentInfoFilterField["Updated"] = "updated";
    NoteContentInfoFilterField["SourceOfChange"] = "sourceOfChange";
    NoteContentInfoFilterField["Label"] = "label";
})(NoteContentInfoFilterField = exports.NoteContentInfoFilterField || (exports.NoteContentInfoFilterField = {}));
var NoteContentInfoSortField;
(function (NoteContentInfoSortField) {
    NoteContentInfoSortField["Parent"] = "parent";
    NoteContentInfoSortField["Id"] = "id";
    NoteContentInfoSortField["TaskGroupNoteLevelIDs"] = "taskGroupNoteLevelIDs";
    NoteContentInfoSortField["Created"] = "created";
    NoteContentInfoSortField["Updated"] = "updated";
    NoteContentInfoSortField["SourceOfChange"] = "sourceOfChange";
    NoteContentInfoSortField["Label"] = "label";
})(NoteContentInfoSortField = exports.NoteContentInfoSortField || (exports.NoteContentInfoSortField = {}));
var NoteFilterField;
(function (NoteFilterField) {
    NoteFilterField["Created"] = "created";
    NoteFilterField["Updated"] = "updated";
    NoteFilterField["Label"] = "label";
    NoteFilterField["ReminderOrder"] = "reminderOrder";
    NoteFilterField["ReminderTime"] = "reminderTime";
    NoteFilterField["ReminderDoneTime"] = "reminderDoneTime";
    NoteFilterField["Source"] = "source";
    NoteFilterField["SourceNote"] = "sourceNote";
    NoteFilterField["Parent"] = "parent";
    NoteFilterField["InTrash"] = "inTrash";
    NoteFilterField["HasReminder"] = "hasReminder";
    NoteFilterField["ReminderIsDone"] = "reminderIsDone";
    NoteFilterField["HasSource"] = "hasSource";
    NoteFilterField["Workspace"] = "workspace";
    NoteFilterField["Stack"] = "stack";
    NoteFilterField["InBusinessAccount"] = "inBusinessAccount";
    NoteFilterField["HasTask"] = "hasTask";
    NoteFilterField["Id"] = "id";
    NoteFilterField["IsMetadata"] = "isMetadata";
    NoteFilterField["IsUntitled"] = "isUntitled";
    NoteFilterField["Deleted"] = "deleted";
    NoteFilterField["IsExternal"] = "isExternal";
    NoteFilterField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    NoteFilterField["ContentHash"] = "content_hash";
    NoteFilterField["ContentSize"] = "content_size";
    NoteFilterField["ThumbnailUrl"] = "thumbnailUrl";
    NoteFilterField["ShareUrlPlaceholder"] = "shareUrlPlaceholder";
    NoteFilterField["ContentDownloaded"] = "contentDownloaded";
    NoteFilterField["AttributesSubjectDate"] = "Attributes_subjectDate";
    NoteFilterField["AttributesContentClass"] = "Attributes_contentClass";
    NoteFilterField["AttributesLocationLatitude"] = "Attributes_Location_latitude";
    NoteFilterField["AttributesLocationLongitude"] = "Attributes_Location_longitude";
    NoteFilterField["AttributesLocationAltitude"] = "Attributes_Location_altitude";
    NoteFilterField["AttributesLocationPlaceName"] = "Attributes_Location_placeName";
    NoteFilterField["AttributesReminderReminderOrder"] = "Attributes_Reminder_reminderOrder";
    NoteFilterField["AttributesReminderReminderDoneTime"] = "Attributes_Reminder_reminderDoneTime";
    NoteFilterField["AttributesReminderReminderTime"] = "Attributes_Reminder_reminderTime";
    NoteFilterField["AttributesShareShareDate"] = "Attributes_Share_shareDate";
    NoteFilterField["AttributesShareSharedWithBusiness"] = "Attributes_Share_sharedWithBusiness";
    NoteFilterField["AttributesEditorAuthor"] = "Attributes_Editor_author";
    NoteFilterField["AttributesEditorLastEditedBy"] = "Attributes_Editor_lastEditedBy";
    NoteFilterField["AttributesSourceSource"] = "Attributes_Source_source";
    NoteFilterField["AttributesSourceSourceUrl"] = "Attributes_Source_sourceURL";
    NoteFilterField["AttributesSourceSourceApplication"] = "Attributes_Source_sourceApplication";
    NoteFilterField["NoteResourceCountMax"] = "noteResourceCountMax";
    NoteFilterField["UploadLimit"] = "uploadLimit";
    NoteFilterField["ResourceSizeMax"] = "resourceSizeMax";
    NoteFilterField["NoteSizeMax"] = "noteSizeMax";
    NoteFilterField["Uploaded"] = "uploaded";
})(NoteFilterField = exports.NoteFilterField || (exports.NoteFilterField = {}));
var NoteInvite_Privilege;
(function (NoteInvite_Privilege) {
    NoteInvite_Privilege["Read"] = "READ";
    NoteInvite_Privilege["Edit"] = "EDIT";
    NoteInvite_Privilege["Manage"] = "MANAGE";
})(NoteInvite_Privilege = exports.NoteInvite_Privilege || (exports.NoteInvite_Privilege = {}));
var NoteOwnMembershipsOrderBy;
(function (NoteOwnMembershipsOrderBy) {
    NoteOwnMembershipsOrderBy["Created"] = "created";
    NoteOwnMembershipsOrderBy["Label"] = "label";
})(NoteOwnMembershipsOrderBy = exports.NoteOwnMembershipsOrderBy || (exports.NoteOwnMembershipsOrderBy = {}));
var NotesInParentOrderBy;
(function (NotesInParentOrderBy) {
    NotesInParentOrderBy["Label"] = "label";
    NotesInParentOrderBy["Created"] = "created";
    NotesInParentOrderBy["Updated"] = "updated";
})(NotesInParentOrderBy = exports.NotesInParentOrderBy || (exports.NotesInParentOrderBy = {}));
var NotesInTrashOrderBy;
(function (NotesInTrashOrderBy) {
    NotesInTrashOrderBy["Label"] = "label";
    NotesInTrashOrderBy["Created"] = "created";
    NotesInTrashOrderBy["Updated"] = "updated";
})(NotesInTrashOrderBy = exports.NotesInTrashOrderBy || (exports.NotesInTrashOrderBy = {}));
var NotesNotInTrashOrderBy;
(function (NotesNotInTrashOrderBy) {
    NotesNotInTrashOrderBy["Label"] = "label";
    NotesNotInTrashOrderBy["Created"] = "created";
    NotesNotInTrashOrderBy["Updated"] = "updated";
})(NotesNotInTrashOrderBy = exports.NotesNotInTrashOrderBy || (exports.NotesNotInTrashOrderBy = {}));
var NoteSortField;
(function (NoteSortField) {
    NoteSortField["Created"] = "created";
    NoteSortField["Updated"] = "updated";
    NoteSortField["Label"] = "label";
    NoteSortField["ReminderOrder"] = "reminderOrder";
    NoteSortField["ReminderTime"] = "reminderTime";
    NoteSortField["ReminderDoneTime"] = "reminderDoneTime";
    NoteSortField["Source"] = "source";
    NoteSortField["SourceNote"] = "sourceNote";
    NoteSortField["Parent"] = "parent";
    NoteSortField["InTrash"] = "inTrash";
    NoteSortField["HasReminder"] = "hasReminder";
    NoteSortField["ReminderIsDone"] = "reminderIsDone";
    NoteSortField["HasSource"] = "hasSource";
    NoteSortField["Workspace"] = "workspace";
    NoteSortField["Stack"] = "stack";
    NoteSortField["InBusinessAccount"] = "inBusinessAccount";
    NoteSortField["HasTask"] = "hasTask";
    NoteSortField["Id"] = "id";
    NoteSortField["IsMetadata"] = "isMetadata";
    NoteSortField["IsUntitled"] = "isUntitled";
    NoteSortField["Deleted"] = "deleted";
    NoteSortField["IsExternal"] = "isExternal";
    NoteSortField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    NoteSortField["ContentHash"] = "content_hash";
    NoteSortField["ContentSize"] = "content_size";
    NoteSortField["ThumbnailUrl"] = "thumbnailUrl";
    NoteSortField["ShareUrlPlaceholder"] = "shareUrlPlaceholder";
    NoteSortField["ContentDownloaded"] = "contentDownloaded";
    NoteSortField["AttributesSubjectDate"] = "Attributes_subjectDate";
    NoteSortField["AttributesContentClass"] = "Attributes_contentClass";
    NoteSortField["AttributesLocationLatitude"] = "Attributes_Location_latitude";
    NoteSortField["AttributesLocationLongitude"] = "Attributes_Location_longitude";
    NoteSortField["AttributesLocationAltitude"] = "Attributes_Location_altitude";
    NoteSortField["AttributesLocationPlaceName"] = "Attributes_Location_placeName";
    NoteSortField["AttributesReminderReminderOrder"] = "Attributes_Reminder_reminderOrder";
    NoteSortField["AttributesReminderReminderDoneTime"] = "Attributes_Reminder_reminderDoneTime";
    NoteSortField["AttributesReminderReminderTime"] = "Attributes_Reminder_reminderTime";
    NoteSortField["AttributesShareShareDate"] = "Attributes_Share_shareDate";
    NoteSortField["AttributesShareSharedWithBusiness"] = "Attributes_Share_sharedWithBusiness";
    NoteSortField["AttributesEditorAuthor"] = "Attributes_Editor_author";
    NoteSortField["AttributesEditorLastEditedBy"] = "Attributes_Editor_lastEditedBy";
    NoteSortField["AttributesSourceSource"] = "Attributes_Source_source";
    NoteSortField["AttributesSourceSourceUrl"] = "Attributes_Source_sourceURL";
    NoteSortField["AttributesSourceSourceApplication"] = "Attributes_Source_sourceApplication";
    NoteSortField["NoteResourceCountMax"] = "noteResourceCountMax";
    NoteSortField["UploadLimit"] = "uploadLimit";
    NoteSortField["ResourceSizeMax"] = "resourceSizeMax";
    NoteSortField["NoteSizeMax"] = "noteSizeMax";
    NoteSortField["Uploaded"] = "uploaded";
})(NoteSortField = exports.NoteSortField || (exports.NoteSortField = {}));
var NotesWithRemindersOrderBy;
(function (NotesWithRemindersOrderBy) {
    NotesWithRemindersOrderBy["ReminderTime"] = "reminderTime";
    NotesWithRemindersOrderBy["Label"] = "label";
    NotesWithRemindersOrderBy["Created"] = "created";
    NotesWithRemindersOrderBy["Updated"] = "updated";
})(NotesWithRemindersOrderBy = exports.NotesWithRemindersOrderBy || (exports.NotesWithRemindersOrderBy = {}));
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["Google"] = "GOOGLE";
    OAuthProvider["Facebook"] = "FACEBOOK";
})(OAuthProvider = exports.OAuthProvider || (exports.OAuthProvider = {}));
var PlatformWidgetsSelectedTab;
(function (PlatformWidgetsSelectedTab) {
    PlatformWidgetsSelectedTab["Recent"] = "Recent";
    PlatformWidgetsSelectedTab["Suggested"] = "Suggested";
    PlatformWidgetsSelectedTab["WebClips"] = "WebClips";
    PlatformWidgetsSelectedTab["Emails"] = "Emails";
    PlatformWidgetsSelectedTab["Images"] = "Images";
    PlatformWidgetsSelectedTab["Audio"] = "Audio";
    PlatformWidgetsSelectedTab["Documents"] = "Documents";
})(PlatformWidgetsSelectedTab = exports.PlatformWidgetsSelectedTab || (exports.PlatformWidgetsSelectedTab = {}));
var PlatformWidgetsWidgetType;
(function (PlatformWidgetsWidgetType) {
    PlatformWidgetsWidgetType["Clipped"] = "Clipped";
    PlatformWidgetsWidgetType["Notebooks"] = "Notebooks";
    PlatformWidgetsWidgetType["Notes"] = "Notes";
    PlatformWidgetsWidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    PlatformWidgetsWidgetType["Pinned"] = "Pinned";
    PlatformWidgetsWidgetType["ScratchPad"] = "ScratchPad";
    PlatformWidgetsWidgetType["Shortcuts"] = "Shortcuts";
    PlatformWidgetsWidgetType["Tags"] = "Tags";
    PlatformWidgetsWidgetType["Calendar"] = "Calendar";
    PlatformWidgetsWidgetType["Tasks"] = "Tasks";
})(PlatformWidgetsWidgetType = exports.PlatformWidgetsWidgetType || (exports.PlatformWidgetsWidgetType = {}));
var PrivilegeLevel;
(function (PrivilegeLevel) {
    PrivilegeLevel["ReadNotebook"] = "READ_NOTEBOOK";
    PrivilegeLevel["ModifyNotebookPlusActivity"] = "MODIFY_NOTEBOOK_PLUS_ACTIVITY";
    PrivilegeLevel["ReadNotebookPlusActivity"] = "READ_NOTEBOOK_PLUS_ACTIVITY";
    PrivilegeLevel["Group"] = "GROUP";
    PrivilegeLevel["FullAccess"] = "FULL_ACCESS";
})(PrivilegeLevel = exports.PrivilegeLevel || (exports.PrivilegeLevel = {}));
var ProfileFilterField;
(function (ProfileFilterField) {
    ProfileFilterField["Label"] = "label";
    ProfileFilterField["Username"] = "username";
    ProfileFilterField["IsSameBusiness"] = "isSameBusiness";
    ProfileFilterField["IsRootProfile"] = "isRootProfile";
    ProfileFilterField["Id"] = "id";
    ProfileFilterField["Email"] = "email";
    ProfileFilterField["PhotoLastUpdated"] = "photoLastUpdated";
    ProfileFilterField["PhotoUrl"] = "photoUrl";
    ProfileFilterField["Name"] = "name";
    ProfileFilterField["RootId"] = "rootID";
    ProfileFilterField["IsBlocked"] = "isBlocked";
    ProfileFilterField["IsConnected"] = "isConnected";
    ProfileFilterField["Status"] = "status";
})(ProfileFilterField = exports.ProfileFilterField || (exports.ProfileFilterField = {}));
var ProfileSortField;
(function (ProfileSortField) {
    ProfileSortField["Label"] = "label";
    ProfileSortField["Username"] = "username";
    ProfileSortField["IsSameBusiness"] = "isSameBusiness";
    ProfileSortField["IsRootProfile"] = "isRootProfile";
    ProfileSortField["Id"] = "id";
    ProfileSortField["Email"] = "email";
    ProfileSortField["PhotoLastUpdated"] = "photoLastUpdated";
    ProfileSortField["PhotoUrl"] = "photoUrl";
    ProfileSortField["Name"] = "name";
    ProfileSortField["RootId"] = "rootID";
    ProfileSortField["IsBlocked"] = "isBlocked";
    ProfileSortField["IsConnected"] = "isConnected";
    ProfileSortField["Status"] = "status";
})(ProfileSortField = exports.ProfileSortField || (exports.ProfileSortField = {}));
var ProfileStatus;
(function (ProfileStatus) {
    ProfileStatus["Active"] = "ACTIVE";
    ProfileStatus["Inactive"] = "INACTIVE";
})(ProfileStatus = exports.ProfileStatus || (exports.ProfileStatus = {}));
var PromotionFilterField;
(function (PromotionFilterField) {
    PromotionFilterField["ShownCount"] = "shownCount";
    PromotionFilterField["Id"] = "id";
    PromotionFilterField["OptedOut"] = "optedOut";
    PromotionFilterField["TimeLastShown"] = "timeLastShown";
    PromotionFilterField["Label"] = "label";
})(PromotionFilterField = exports.PromotionFilterField || (exports.PromotionFilterField = {}));
var PromotionSortField;
(function (PromotionSortField) {
    PromotionSortField["ShownCount"] = "shownCount";
    PromotionSortField["Id"] = "id";
    PromotionSortField["OptedOut"] = "optedOut";
    PromotionSortField["TimeLastShown"] = "timeLastShown";
    PromotionSortField["Label"] = "label";
})(PromotionSortField = exports.PromotionSortField || (exports.PromotionSortField = {}));
var Provider;
(function (Provider) {
    Provider["Google"] = "GOOGLE";
    Provider["Outlook"] = "OUTLOOK";
    Provider["Other"] = "OTHER";
})(Provider = exports.Provider || (exports.Provider = {}));
var PublishedNotebooksFilterField;
(function (PublishedNotebooksFilterField) {
    PublishedNotebooksFilterField["Label"] = "label";
    PublishedNotebooksFilterField["Description"] = "description";
})(PublishedNotebooksFilterField = exports.PublishedNotebooksFilterField || (exports.PublishedNotebooksFilterField = {}));
var PublishedNotebooksSortField;
(function (PublishedNotebooksSortField) {
    PublishedNotebooksSortField["Label"] = "label";
    PublishedNotebooksSortField["Created"] = "created";
    PublishedNotebooksSortField["Updated"] = "updated";
    PublishedNotebooksSortField["AccessStatus"] = "accessStatus";
})(PublishedNotebooksSortField = exports.PublishedNotebooksSortField || (exports.PublishedNotebooksSortField = {}));
var ReminderCreate_ReminderDateUiOption;
(function (ReminderCreate_ReminderDateUiOption) {
    ReminderCreate_ReminderDateUiOption["DateTime"] = "date_time";
    ReminderCreate_ReminderDateUiOption["DateOnly"] = "date_only";
    ReminderCreate_ReminderDateUiOption["RelativeToDue"] = "relative_to_due";
})(ReminderCreate_ReminderDateUiOption = exports.ReminderCreate_ReminderDateUiOption || (exports.ReminderCreate_ReminderDateUiOption = {}));
var ReminderFilterField;
(function (ReminderFilterField) {
    ReminderFilterField["Source"] = "source";
    ReminderFilterField["ReminderDate"] = "reminderDate";
    ReminderFilterField["Updated"] = "updated";
    ReminderFilterField["Id"] = "id";
    ReminderFilterField["ReminderDateUiOption"] = "reminderDateUIOption";
    ReminderFilterField["TimeZone"] = "timeZone";
    ReminderFilterField["Created"] = "created";
    ReminderFilterField["DueDateOffset"] = "dueDateOffset";
    ReminderFilterField["NoteLevelId"] = "noteLevelID";
    ReminderFilterField["SourceOfChange"] = "sourceOfChange";
    ReminderFilterField["Status"] = "status";
    ReminderFilterField["Label"] = "label";
})(ReminderFilterField = exports.ReminderFilterField || (exports.ReminderFilterField = {}));
var ReminderReminderDateUiOption;
(function (ReminderReminderDateUiOption) {
    ReminderReminderDateUiOption["DateTime"] = "date_time";
    ReminderReminderDateUiOption["DateOnly"] = "date_only";
    ReminderReminderDateUiOption["RelativeToDue"] = "relative_to_due";
})(ReminderReminderDateUiOption = exports.ReminderReminderDateUiOption || (exports.ReminderReminderDateUiOption = {}));
var ReminderSortField;
(function (ReminderSortField) {
    ReminderSortField["Source"] = "source";
    ReminderSortField["ReminderDate"] = "reminderDate";
    ReminderSortField["Updated"] = "updated";
    ReminderSortField["Id"] = "id";
    ReminderSortField["ReminderDateUiOption"] = "reminderDateUIOption";
    ReminderSortField["TimeZone"] = "timeZone";
    ReminderSortField["Created"] = "created";
    ReminderSortField["DueDateOffset"] = "dueDateOffset";
    ReminderSortField["NoteLevelId"] = "noteLevelID";
    ReminderSortField["SourceOfChange"] = "sourceOfChange";
    ReminderSortField["Status"] = "status";
    ReminderSortField["Label"] = "label";
})(ReminderSortField = exports.ReminderSortField || (exports.ReminderSortField = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["Active"] = "active";
    ReminderStatus["Muted"] = "muted";
})(ReminderStatus = exports.ReminderStatus || (exports.ReminderStatus = {}));
var ReminderUpdate_ReminderDateUiOption;
(function (ReminderUpdate_ReminderDateUiOption) {
    ReminderUpdate_ReminderDateUiOption["DateTime"] = "date_time";
    ReminderUpdate_ReminderDateUiOption["DateOnly"] = "date_only";
    ReminderUpdate_ReminderDateUiOption["RelativeToDue"] = "relative_to_due";
})(ReminderUpdate_ReminderDateUiOption = exports.ReminderUpdate_ReminderDateUiOption || (exports.ReminderUpdate_ReminderDateUiOption = {}));
var SavedSearchFilterField;
(function (SavedSearchFilterField) {
    SavedSearchFilterField["Label"] = "label";
    SavedSearchFilterField["Id"] = "id";
    SavedSearchFilterField["Query"] = "query";
})(SavedSearchFilterField = exports.SavedSearchFilterField || (exports.SavedSearchFilterField = {}));
var SavedSearchSortField;
(function (SavedSearchSortField) {
    SavedSearchSortField["Label"] = "label";
    SavedSearchSortField["Id"] = "id";
    SavedSearchSortField["Query"] = "query";
})(SavedSearchSortField = exports.SavedSearchSortField || (exports.SavedSearchSortField = {}));
var ScheduledNotificationFilterField;
(function (ScheduledNotificationFilterField) {
    ScheduledNotificationFilterField["Id"] = "id";
    ScheduledNotificationFilterField["ScheduledNotificationType"] = "scheduledNotificationType";
    ScheduledNotificationFilterField["Created"] = "created";
    ScheduledNotificationFilterField["Updated"] = "updated";
    ScheduledNotificationFilterField["Mute"] = "mute";
    ScheduledNotificationFilterField["Label"] = "label";
})(ScheduledNotificationFilterField = exports.ScheduledNotificationFilterField || (exports.ScheduledNotificationFilterField = {}));
var ScheduledNotificationScheduledNotificationType;
(function (ScheduledNotificationScheduledNotificationType) {
    ScheduledNotificationScheduledNotificationType["TaskReminder"] = "TaskReminder";
})(ScheduledNotificationScheduledNotificationType = exports.ScheduledNotificationScheduledNotificationType || (exports.ScheduledNotificationScheduledNotificationType = {}));
var ScheduledNotificationSortField;
(function (ScheduledNotificationSortField) {
    ScheduledNotificationSortField["Id"] = "id";
    ScheduledNotificationSortField["ScheduledNotificationType"] = "scheduledNotificationType";
    ScheduledNotificationSortField["Created"] = "created";
    ScheduledNotificationSortField["Updated"] = "updated";
    ScheduledNotificationSortField["Mute"] = "mute";
    ScheduledNotificationSortField["Label"] = "label";
})(ScheduledNotificationSortField = exports.ScheduledNotificationSortField || (exports.ScheduledNotificationSortField = {}));
var SearchExLocalSearchMode;
(function (SearchExLocalSearchMode) {
    SearchExLocalSearchMode["Auto"] = "AUTO";
    SearchExLocalSearchMode["Strict"] = "STRICT";
})(SearchExLocalSearchMode = exports.SearchExLocalSearchMode || (exports.SearchExLocalSearchMode = {}));
var SearchExResultType;
(function (SearchExResultType) {
    SearchExResultType["History"] = "HISTORY";
    SearchExResultType["Text"] = "TEXT";
    SearchExResultType["Note"] = "NOTE";
    SearchExResultType["Notebook"] = "NOTEBOOK";
    SearchExResultType["Workspace"] = "WORKSPACE";
    SearchExResultType["Tag"] = "TAG";
    SearchExResultType["Author"] = "AUTHOR";
    SearchExResultType["Contains"] = "CONTAINS";
    SearchExResultType["Message"] = "MESSAGE";
    SearchExResultType["Stack"] = "STACK";
})(SearchExResultType = exports.SearchExResultType || (exports.SearchExResultType = {}));
var SearchExSortOrder;
(function (SearchExSortOrder) {
    SearchExSortOrder["Created"] = "CREATED";
    SearchExSortOrder["Updated"] = "UPDATED";
    SearchExSortOrder["Relevance"] = "RELEVANCE";
    SearchExSortOrder["Title"] = "TITLE";
    SearchExSortOrder["ReminderOrder"] = "REMINDER_ORDER";
    SearchExSortOrder["ReminderTime"] = "REMINDER_TIME";
    SearchExSortOrder["ReminderDoneTime"] = "REMINDER_DONE_TIME";
})(SearchExSortOrder = exports.SearchExSortOrder || (exports.SearchExSortOrder = {}));
var SearchExTextField;
(function (SearchExTextField) {
    SearchExTextField["All"] = "ALL";
    SearchExTextField["Name"] = "NAME";
})(SearchExTextField = exports.SearchExTextField || (exports.SearchExTextField = {}));
var SearchLogEventTypeProperty;
(function (SearchLogEventTypeProperty) {
    SearchLogEventTypeProperty["SearchClick"] = "SEARCH_CLICK";
    SearchLogEventTypeProperty["Exit"] = "EXIT";
    SearchLogEventTypeProperty["SuggestClick"] = "SUGGEST_CLICK";
    SearchLogEventTypeProperty["NoteView"] = "NOTE_VIEW";
})(SearchLogEventTypeProperty = exports.SearchLogEventTypeProperty || (exports.SearchLogEventTypeProperty = {}));
var ServiceProvider;
(function (ServiceProvider) {
    ServiceProvider["Google"] = "GOOGLE";
    ServiceProvider["Facebook"] = "FACEBOOK";
})(ServiceProvider = exports.ServiceProvider || (exports.ServiceProvider = {}));
var SharedWithMeField;
(function (SharedWithMeField) {
    SharedWithMeField["Created"] = "created";
    SharedWithMeField["Label"] = "label";
})(SharedWithMeField = exports.SharedWithMeField || (exports.SharedWithMeField = {}));
var ShortcutFilterField;
(function (ShortcutFilterField) {
    ShortcutFilterField["SortOrder"] = "sortOrder";
    ShortcutFilterField["Label"] = "label";
    ShortcutFilterField["Source"] = "source";
    ShortcutFilterField["Id"] = "id";
})(ShortcutFilterField = exports.ShortcutFilterField || (exports.ShortcutFilterField = {}));
var ShortcutSortField;
(function (ShortcutSortField) {
    ShortcutSortField["SortOrder"] = "sortOrder";
    ShortcutSortField["Label"] = "label";
    ShortcutSortField["Source"] = "source";
    ShortcutSortField["Id"] = "id";
})(ShortcutSortField = exports.ShortcutSortField || (exports.ShortcutSortField = {}));
var StackedNotebookSortField;
(function (StackedNotebookSortField) {
    StackedNotebookSortField["Label"] = "label";
    StackedNotebookSortField["Created"] = "created";
    StackedNotebookSortField["Updated"] = "updated";
})(StackedNotebookSortField = exports.StackedNotebookSortField || (exports.StackedNotebookSortField = {}));
var StackFilterField;
(function (StackFilterField) {
    StackFilterField["Label"] = "label";
    StackFilterField["Id"] = "id";
})(StackFilterField = exports.StackFilterField || (exports.StackFilterField = {}));
var StackSortField;
(function (StackSortField) {
    StackSortField["Label"] = "label";
    StackSortField["Id"] = "id";
})(StackSortField = exports.StackSortField || (exports.StackSortField = {}));
var Status;
(function (Status) {
    Status["Open"] = "open";
    Status["Completed"] = "completed";
})(Status = exports.Status || (exports.Status = {}));
var SupportedPlacement;
(function (SupportedPlacement) {
    SupportedPlacement["Fullscreen"] = "FULLSCREEN";
    SupportedPlacement["Banner"] = "BANNER";
    SupportedPlacement["Card"] = "CARD";
})(SupportedPlacement = exports.SupportedPlacement || (exports.SupportedPlacement = {}));
var SyncProgressTypeEnum;
(function (SyncProgressTypeEnum) {
    SyncProgressTypeEnum["None"] = "NONE";
    SyncProgressTypeEnum["InitialDownsync"] = "INITIAL_DOWNSYNC";
    SyncProgressTypeEnum["DbMigration"] = "DB_MIGRATION";
    SyncProgressTypeEnum["IncrementalSync"] = "INCREMENTAL_SYNC";
    SyncProgressTypeEnum["ImmediateNoteSync"] = "IMMEDIATE_NOTE_SYNC";
    SyncProgressTypeEnum["Reindexing"] = "REINDEXING";
})(SyncProgressTypeEnum = exports.SyncProgressTypeEnum || (exports.SyncProgressTypeEnum = {}));
var TagChildTagsOrderBy;
(function (TagChildTagsOrderBy) {
    TagChildTagsOrderBy["Label"] = "label";
    TagChildTagsOrderBy["RefsCount"] = "refsCount";
})(TagChildTagsOrderBy = exports.TagChildTagsOrderBy || (exports.TagChildTagsOrderBy = {}));
var TagFilterField;
(function (TagFilterField) {
    TagFilterField["Label"] = "label";
    TagFilterField["Parent"] = "parent";
    TagFilterField["RefsCount"] = "refsCount";
    TagFilterField["SyncContext"] = "syncContext";
    TagFilterField["Id"] = "id";
})(TagFilterField = exports.TagFilterField || (exports.TagFilterField = {}));
var TagHierarchyFilterField;
(function (TagHierarchyFilterField) {
    TagHierarchyFilterField["Label"] = "label";
    TagHierarchyFilterField["IsBusiness"] = "isBusiness";
    TagHierarchyFilterField["IsPersonal"] = "isPersonal";
    TagHierarchyFilterField["IsShared"] = "isShared";
    TagHierarchyFilterField["RootId"] = "rootID";
})(TagHierarchyFilterField = exports.TagHierarchyFilterField || (exports.TagHierarchyFilterField = {}));
var TagHierarchySortField;
(function (TagHierarchySortField) {
    TagHierarchySortField["Label"] = "label";
    TagHierarchySortField["RefsCount"] = "refsCount";
})(TagHierarchySortField = exports.TagHierarchySortField || (exports.TagHierarchySortField = {}));
var TagsAllowedField;
(function (TagsAllowedField) {
    TagsAllowedField["RefsCount"] = "refsCount";
    TagsAllowedField["Label"] = "label";
})(TagsAllowedField = exports.TagsAllowedField || (exports.TagsAllowedField = {}));
var TagsOrderBy;
(function (TagsOrderBy) {
    TagsOrderBy["Label"] = "label";
    TagsOrderBy["RefsCount"] = "refsCount";
})(TagsOrderBy = exports.TagsOrderBy || (exports.TagsOrderBy = {}));
var TagSortField;
(function (TagSortField) {
    TagSortField["Label"] = "label";
    TagSortField["Parent"] = "parent";
    TagSortField["RefsCount"] = "refsCount";
    TagSortField["SyncContext"] = "syncContext";
    TagSortField["Id"] = "id";
})(TagSortField = exports.TagSortField || (exports.TagSortField = {}));
var TaskCreate_DueDateUiOption;
(function (TaskCreate_DueDateUiOption) {
    TaskCreate_DueDateUiOption["DateTime"] = "date_time";
    TaskCreate_DueDateUiOption["DateOnly"] = "date_only";
})(TaskCreate_DueDateUiOption = exports.TaskCreate_DueDateUiOption || (exports.TaskCreate_DueDateUiOption = {}));
var TaskDueDateUiOption;
(function (TaskDueDateUiOption) {
    TaskDueDateUiOption["DateTime"] = "date_time";
    TaskDueDateUiOption["DateOnly"] = "date_only";
})(TaskDueDateUiOption = exports.TaskDueDateUiOption || (exports.TaskDueDateUiOption = {}));
var TaskFilterField;
(function (TaskFilterField) {
    TaskFilterField["Parent"] = "parent";
    TaskFilterField["Label"] = "label";
    TaskFilterField["SortWeight"] = "sortWeight";
    TaskFilterField["Status"] = "status";
    TaskFilterField["TaskGroupNoteLevelId"] = "taskGroupNoteLevelID";
    TaskFilterField["Id"] = "id";
    TaskFilterField["Created"] = "created";
    TaskFilterField["Updated"] = "updated";
    TaskFilterField["DueDate"] = "dueDate";
    TaskFilterField["DueDateUiOption"] = "dueDateUIOption";
    TaskFilterField["TimeZone"] = "timeZone";
    TaskFilterField["InNote"] = "inNote";
    TaskFilterField["Flag"] = "flag";
    TaskFilterField["NoteLevelId"] = "noteLevelID";
    TaskFilterField["StatusUpdated"] = "statusUpdated";
    TaskFilterField["SourceOfChange"] = "sourceOfChange";
})(TaskFilterField = exports.TaskFilterField || (exports.TaskFilterField = {}));
var TaskNotesNotInTrashOrderBy;
(function (TaskNotesNotInTrashOrderBy) {
    TaskNotesNotInTrashOrderBy["Label"] = "label";
    TaskNotesNotInTrashOrderBy["Created"] = "created";
    TaskNotesNotInTrashOrderBy["Updated"] = "updated";
})(TaskNotesNotInTrashOrderBy = exports.TaskNotesNotInTrashOrderBy || (exports.TaskNotesNotInTrashOrderBy = {}));
var TasksInNoteStatus;
(function (TasksInNoteStatus) {
    TasksInNoteStatus["Open"] = "open";
    TasksInNoteStatus["Completed"] = "completed";
})(TasksInNoteStatus = exports.TasksInNoteStatus || (exports.TasksInNoteStatus = {}));
var TaskSortField;
(function (TaskSortField) {
    TaskSortField["Parent"] = "parent";
    TaskSortField["Label"] = "label";
    TaskSortField["SortWeight"] = "sortWeight";
    TaskSortField["Status"] = "status";
    TaskSortField["TaskGroupNoteLevelId"] = "taskGroupNoteLevelID";
    TaskSortField["Id"] = "id";
    TaskSortField["Created"] = "created";
    TaskSortField["Updated"] = "updated";
    TaskSortField["DueDate"] = "dueDate";
    TaskSortField["DueDateUiOption"] = "dueDateUIOption";
    TaskSortField["TimeZone"] = "timeZone";
    TaskSortField["InNote"] = "inNote";
    TaskSortField["Flag"] = "flag";
    TaskSortField["NoteLevelId"] = "noteLevelID";
    TaskSortField["StatusUpdated"] = "statusUpdated";
    TaskSortField["SourceOfChange"] = "sourceOfChange";
})(TaskSortField = exports.TaskSortField || (exports.TaskSortField = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Open"] = "open";
    TaskStatus["Completed"] = "completed";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var TaskUpdate_DueDateUiOption;
(function (TaskUpdate_DueDateUiOption) {
    TaskUpdate_DueDateUiOption["DateTime"] = "date_time";
    TaskUpdate_DueDateUiOption["DateOnly"] = "date_only";
})(TaskUpdate_DueDateUiOption = exports.TaskUpdate_DueDateUiOption || (exports.TaskUpdate_DueDateUiOption = {}));
var TaskUpdate_Status;
(function (TaskUpdate_Status) {
    TaskUpdate_Status["Open"] = "open";
    TaskUpdate_Status["Completed"] = "completed";
})(TaskUpdate_Status = exports.TaskUpdate_Status || (exports.TaskUpdate_Status = {}));
var TaskUserSettingsFilterField;
(function (TaskUserSettingsFilterField) {
    TaskUserSettingsFilterField["Label"] = "label";
    TaskUserSettingsFilterField["Id"] = "id";
    TaskUserSettingsFilterField["Created"] = "created";
    TaskUserSettingsFilterField["Updated"] = "updated";
    TaskUserSettingsFilterField["DefaultReminder"] = "defaultReminder";
    TaskUserSettingsFilterField["DefaultRemindersOffsets"] = "defaultRemindersOffsets";
    TaskUserSettingsFilterField["PinDefaultTaskNote"] = "pinDefaultTaskNote";
})(TaskUserSettingsFilterField = exports.TaskUserSettingsFilterField || (exports.TaskUserSettingsFilterField = {}));
var TaskUserSettingsSortField;
(function (TaskUserSettingsSortField) {
    TaskUserSettingsSortField["Label"] = "label";
    TaskUserSettingsSortField["Id"] = "id";
    TaskUserSettingsSortField["Created"] = "created";
    TaskUserSettingsSortField["Updated"] = "updated";
    TaskUserSettingsSortField["DefaultReminder"] = "defaultReminder";
    TaskUserSettingsSortField["DefaultRemindersOffsets"] = "defaultRemindersOffsets";
    TaskUserSettingsSortField["PinDefaultTaskNote"] = "pinDefaultTaskNote";
})(TaskUserSettingsSortField = exports.TaskUserSettingsSortField || (exports.TaskUserSettingsSortField = {}));
var ThreadFilterField;
(function (ThreadFilterField) {
    ThreadFilterField["LastMessageSentAt"] = "lastMessageSentAt";
    ThreadFilterField["Id"] = "id";
    ThreadFilterField["Snippet"] = "snippet";
    ThreadFilterField["GroupThread"] = "groupThread";
    ThreadFilterField["MaxMessageId"] = "maxMessageID";
    ThreadFilterField["MaxReadMessageId"] = "maxReadMessageID";
    ThreadFilterField["MaxDeletedMessageId"] = "maxDeletedMessageID";
    ThreadFilterField["Label"] = "label";
})(ThreadFilterField = exports.ThreadFilterField || (exports.ThreadFilterField = {}));
var ThreadSortField;
(function (ThreadSortField) {
    ThreadSortField["LastMessageSentAt"] = "lastMessageSentAt";
    ThreadSortField["Id"] = "id";
    ThreadSortField["Snippet"] = "snippet";
    ThreadSortField["GroupThread"] = "groupThread";
    ThreadSortField["MaxMessageId"] = "maxMessageID";
    ThreadSortField["MaxReadMessageId"] = "maxReadMessageID";
    ThreadSortField["MaxDeletedMessageId"] = "maxDeletedMessageID";
    ThreadSortField["Label"] = "label";
})(ThreadSortField = exports.ThreadSortField || (exports.ThreadSortField = {}));
var TierSelectionDisplayResultTsdType;
(function (TierSelectionDisplayResultTsdType) {
    TierSelectionDisplayResultTsdType["RegularTsd"] = "REGULAR_TSD";
    TierSelectionDisplayResultTsdType["TargetedUpsell"] = "TARGETED_UPSELL";
})(TierSelectionDisplayResultTsdType = exports.TierSelectionDisplayResultTsdType || (exports.TierSelectionDisplayResultTsdType = {}));
var TierSelectionDisplayResultTsdVariation;
(function (TierSelectionDisplayResultTsdVariation) {
    TierSelectionDisplayResultTsdVariation["DialogVar1"] = "DIALOG_VAR1";
    TierSelectionDisplayResultTsdVariation["Fullscreen1ButtonDismiss"] = "FULLSCREEN1BUTTON_DISMISS";
    TierSelectionDisplayResultTsdVariation["Fullscreen1ButtonNodismiss"] = "FULLSCREEN1BUTTON_NODISMISS";
    TierSelectionDisplayResultTsdVariation["Fullscreen1ButtonTierpath"] = "FULLSCREEN1BUTTON_TIERPATH";
    TierSelectionDisplayResultTsdVariation["Fullscreen1ButtonVar2"] = "FULLSCREEN1BUTTON_VAR2";
    TierSelectionDisplayResultTsdVariation["Fullscreen3ButtonsDefault"] = "FULLSCREEN3BUTTONS_DEFAULT";
    TierSelectionDisplayResultTsdVariation["Fullscreen3ButtonsDismiss"] = "FULLSCREEN3BUTTONS_DISMISS";
    TierSelectionDisplayResultTsdVariation["Fullscreen3ButtonsNodismiss"] = "FULLSCREEN3BUTTONS_NODISMISS";
    TierSelectionDisplayResultTsdVariation["Fullscreen3ButtonsBeforefle"] = "FULLSCREEN3BUTTONS_BEFOREFLE";
    TierSelectionDisplayResultTsdVariation["ModalDefault"] = "MODAL_DEFAULT";
    TierSelectionDisplayResultTsdVariation["NotificationAspirational"] = "NOTIFICATION_ASPIRATIONAL";
    TierSelectionDisplayResultTsdVariation["NotificationStorage"] = "NOTIFICATION_STORAGE";
    TierSelectionDisplayResultTsdVariation["SheetAspirational"] = "SHEET_ASPIRATIONAL";
    TierSelectionDisplayResultTsdVariation["SheetStorage"] = "SHEET_STORAGE";
    TierSelectionDisplayResultTsdVariation["BannerLearnmore"] = "BANNER_LEARNMORE";
    TierSelectionDisplayResultTsdVariation["BannerUpgrade"] = "BANNER_UPGRADE";
    TierSelectionDisplayResultTsdVariation["FullscreenSinglesday"] = "FULLSCREEN_SINGLESDAY";
    TierSelectionDisplayResultTsdVariation["FullscreenDiscount"] = "FULLSCREEN_DISCOUNT";
    TierSelectionDisplayResultTsdVariation["FullscreenNewyear"] = "FULLSCREEN_NEWYEAR";
    TierSelectionDisplayResultTsdVariation["TestUnsupported"] = "TEST_UNSUPPORTED";
})(TierSelectionDisplayResultTsdVariation = exports.TierSelectionDisplayResultTsdVariation || (exports.TierSelectionDisplayResultTsdVariation = {}));
var UserAccountingBusinessRole;
(function (UserAccountingBusinessRole) {
    UserAccountingBusinessRole["Admin"] = "ADMIN";
    UserAccountingBusinessRole["Normal"] = "NORMAL";
})(UserAccountingBusinessRole = exports.UserAccountingBusinessRole || (exports.UserAccountingBusinessRole = {}));
var UserAccountingPremiumServiceStatus;
(function (UserAccountingPremiumServiceStatus) {
    UserAccountingPremiumServiceStatus["None"] = "NONE";
    UserAccountingPremiumServiceStatus["Pending"] = "PENDING";
    UserAccountingPremiumServiceStatus["Active"] = "ACTIVE";
    UserAccountingPremiumServiceStatus["Failed"] = "FAILED";
    UserAccountingPremiumServiceStatus["CancellationPending"] = "CANCELLATION_PENDING";
    UserAccountingPremiumServiceStatus["Canceled"] = "CANCELED";
})(UserAccountingPremiumServiceStatus = exports.UserAccountingPremiumServiceStatus || (exports.UserAccountingPremiumServiceStatus = {}));
var UserAttributesReminderEmail;
(function (UserAttributesReminderEmail) {
    UserAttributesReminderEmail["DoNotSend"] = "DO_NOT_SEND";
    UserAttributesReminderEmail["SendDailyEmail"] = "SEND_DAILY_EMAIL";
})(UserAttributesReminderEmail = exports.UserAttributesReminderEmail || (exports.UserAttributesReminderEmail = {}));
var UserBusinessUserRole;
(function (UserBusinessUserRole) {
    UserBusinessUserRole["Admin"] = "ADMIN";
    UserBusinessUserRole["Normal"] = "NORMAL";
})(UserBusinessUserRole = exports.UserBusinessUserRole || (exports.UserBusinessUserRole = {}));
var UserPrivilege;
(function (UserPrivilege) {
    UserPrivilege["Normal"] = "NORMAL";
    UserPrivilege["Premium"] = "PREMIUM";
    UserPrivilege["Vip"] = "VIP";
    UserPrivilege["Manager"] = "MANAGER";
    UserPrivilege["Support"] = "SUPPORT";
    UserPrivilege["Admin"] = "ADMIN";
})(UserPrivilege = exports.UserPrivilege || (exports.UserPrivilege = {}));
var UserServiceLevel;
(function (UserServiceLevel) {
    UserServiceLevel["Basic"] = "BASIC";
    UserServiceLevel["Plus"] = "PLUS";
    UserServiceLevel["Premium"] = "PREMIUM";
    UserServiceLevel["Business"] = "BUSINESS";
})(UserServiceLevel = exports.UserServiceLevel || (exports.UserServiceLevel = {}));
var UserSetReminderSetting_Setting;
(function (UserSetReminderSetting_Setting) {
    UserSetReminderSetting_Setting["DoNotSend"] = "DO_NOT_SEND";
    UserSetReminderSetting_Setting["SendDailyEmail"] = "SEND_DAILY_EMAIL";
})(UserSetReminderSetting_Setting = exports.UserSetReminderSetting_Setting || (exports.UserSetReminderSetting_Setting = {}));
var WidgetBoardType;
(function (WidgetBoardType) {
    WidgetBoardType["Home"] = "Home";
})(WidgetBoardType = exports.WidgetBoardType || (exports.WidgetBoardType = {}));
var WidgetContentConflictFilterField;
(function (WidgetContentConflictFilterField) {
    WidgetContentConflictFilterField["Parent"] = "parent";
    WidgetContentConflictFilterField["ContentHash"] = "content_hash";
    WidgetContentConflictFilterField["Updated"] = "updated";
    WidgetContentConflictFilterField["Id"] = "id";
    WidgetContentConflictFilterField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    WidgetContentConflictFilterField["ContentSize"] = "content_size";
    WidgetContentConflictFilterField["ContentUrl"] = "content_url";
    WidgetContentConflictFilterField["ContentId"] = "content_id";
    WidgetContentConflictFilterField["ContentFormat"] = "content_format";
    WidgetContentConflictFilterField["ContentVersion"] = "content_version";
    WidgetContentConflictFilterField["ContentPath"] = "content_path";
    WidgetContentConflictFilterField["ContentContent"] = "content_content";
    WidgetContentConflictFilterField["Created"] = "created";
    WidgetContentConflictFilterField["Label"] = "label";
})(WidgetContentConflictFilterField = exports.WidgetContentConflictFilterField || (exports.WidgetContentConflictFilterField = {}));
var WidgetContentConflictSortField;
(function (WidgetContentConflictSortField) {
    WidgetContentConflictSortField["Parent"] = "parent";
    WidgetContentConflictSortField["ContentHash"] = "content_hash";
    WidgetContentConflictSortField["Updated"] = "updated";
    WidgetContentConflictSortField["Id"] = "id";
    WidgetContentConflictSortField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    WidgetContentConflictSortField["ContentSize"] = "content_size";
    WidgetContentConflictSortField["ContentUrl"] = "content_url";
    WidgetContentConflictSortField["ContentId"] = "content_id";
    WidgetContentConflictSortField["ContentFormat"] = "content_format";
    WidgetContentConflictSortField["ContentVersion"] = "content_version";
    WidgetContentConflictSortField["ContentPath"] = "content_path";
    WidgetContentConflictSortField["ContentContent"] = "content_content";
    WidgetContentConflictSortField["Created"] = "created";
    WidgetContentConflictSortField["Label"] = "label";
})(WidgetContentConflictSortField = exports.WidgetContentConflictSortField || (exports.WidgetContentConflictSortField = {}));
var WidgetFilterField;
(function (WidgetFilterField) {
    WidgetFilterField["Parent"] = "parent";
    WidgetFilterField["ContentProvider"] = "contentProvider";
    WidgetFilterField["MobileSortWeight"] = "mobile_sortWeight";
    WidgetFilterField["DesktopSortWeight"] = "desktop_sortWeight";
    WidgetFilterField["Created"] = "created";
    WidgetFilterField["WidgetType"] = "widgetType";
    WidgetFilterField["IsEnabled"] = "isEnabled";
    WidgetFilterField["SelectedTab"] = "selectedTab";
    WidgetFilterField["IsSupportedV2"] = "isSupportedV2";
    WidgetFilterField["Id"] = "id";
    WidgetFilterField["BoardType"] = "boardType";
    WidgetFilterField["SoftDelete"] = "softDelete";
    WidgetFilterField["MobilePanelKey"] = "mobile_panelKey";
    WidgetFilterField["MobileWidth"] = "mobile_width";
    WidgetFilterField["MobileHeight"] = "mobile_height";
    WidgetFilterField["DesktopPanelKey"] = "desktop_panelKey";
    WidgetFilterField["DesktopWidth"] = "desktop_width";
    WidgetFilterField["DesktopHeight"] = "desktop_height";
    WidgetFilterField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    WidgetFilterField["ContentHash"] = "content_hash";
    WidgetFilterField["ContentSize"] = "content_size";
    WidgetFilterField["ContentUrl"] = "content_url";
    WidgetFilterField["ContentId"] = "content_id";
    WidgetFilterField["ContentFormat"] = "content_format";
    WidgetFilterField["ContentVersion"] = "content_version";
    WidgetFilterField["ContentPath"] = "content_path";
    WidgetFilterField["ContentContent"] = "content_content";
    WidgetFilterField["Updated"] = "updated";
    WidgetFilterField["Label"] = "label";
})(WidgetFilterField = exports.WidgetFilterField || (exports.WidgetFilterField = {}));
var WidgetSelectedTab;
(function (WidgetSelectedTab) {
    WidgetSelectedTab["Recent"] = "Recent";
    WidgetSelectedTab["Suggested"] = "Suggested";
    WidgetSelectedTab["WebClips"] = "WebClips";
    WidgetSelectedTab["Emails"] = "Emails";
    WidgetSelectedTab["Images"] = "Images";
    WidgetSelectedTab["Audio"] = "Audio";
    WidgetSelectedTab["Documents"] = "Documents";
})(WidgetSelectedTab = exports.WidgetSelectedTab || (exports.WidgetSelectedTab = {}));
var WidgetSetSelectedTab_TabToSelect;
(function (WidgetSetSelectedTab_TabToSelect) {
    WidgetSetSelectedTab_TabToSelect["Recent"] = "Recent";
    WidgetSetSelectedTab_TabToSelect["Suggested"] = "Suggested";
    WidgetSetSelectedTab_TabToSelect["WebClips"] = "WebClips";
    WidgetSetSelectedTab_TabToSelect["Emails"] = "Emails";
    WidgetSetSelectedTab_TabToSelect["Images"] = "Images";
    WidgetSetSelectedTab_TabToSelect["Audio"] = "Audio";
    WidgetSetSelectedTab_TabToSelect["Documents"] = "Documents";
})(WidgetSetSelectedTab_TabToSelect = exports.WidgetSetSelectedTab_TabToSelect || (exports.WidgetSetSelectedTab_TabToSelect = {}));
var WidgetsInBoardPlatform;
(function (WidgetsInBoardPlatform) {
    WidgetsInBoardPlatform["Mobile"] = "mobile";
    WidgetsInBoardPlatform["Desktop"] = "desktop";
})(WidgetsInBoardPlatform = exports.WidgetsInBoardPlatform || (exports.WidgetsInBoardPlatform = {}));
var WidgetsInBoardSelectedTab;
(function (WidgetsInBoardSelectedTab) {
    WidgetsInBoardSelectedTab["Recent"] = "Recent";
    WidgetsInBoardSelectedTab["Suggested"] = "Suggested";
    WidgetsInBoardSelectedTab["WebClips"] = "WebClips";
    WidgetsInBoardSelectedTab["Emails"] = "Emails";
    WidgetsInBoardSelectedTab["Images"] = "Images";
    WidgetsInBoardSelectedTab["Audio"] = "Audio";
    WidgetsInBoardSelectedTab["Documents"] = "Documents";
})(WidgetsInBoardSelectedTab = exports.WidgetsInBoardSelectedTab || (exports.WidgetsInBoardSelectedTab = {}));
var WidgetsInBoardWidgetType;
(function (WidgetsInBoardWidgetType) {
    WidgetsInBoardWidgetType["Clipped"] = "Clipped";
    WidgetsInBoardWidgetType["Notebooks"] = "Notebooks";
    WidgetsInBoardWidgetType["Notes"] = "Notes";
    WidgetsInBoardWidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    WidgetsInBoardWidgetType["Pinned"] = "Pinned";
    WidgetsInBoardWidgetType["ScratchPad"] = "ScratchPad";
    WidgetsInBoardWidgetType["Shortcuts"] = "Shortcuts";
    WidgetsInBoardWidgetType["Tags"] = "Tags";
    WidgetsInBoardWidgetType["Calendar"] = "Calendar";
    WidgetsInBoardWidgetType["Tasks"] = "Tasks";
})(WidgetsInBoardWidgetType = exports.WidgetsInBoardWidgetType || (exports.WidgetsInBoardWidgetType = {}));
var WidgetSortField;
(function (WidgetSortField) {
    WidgetSortField["Parent"] = "parent";
    WidgetSortField["ContentProvider"] = "contentProvider";
    WidgetSortField["MobileSortWeight"] = "mobile_sortWeight";
    WidgetSortField["DesktopSortWeight"] = "desktop_sortWeight";
    WidgetSortField["Created"] = "created";
    WidgetSortField["WidgetType"] = "widgetType";
    WidgetSortField["IsEnabled"] = "isEnabled";
    WidgetSortField["SelectedTab"] = "selectedTab";
    WidgetSortField["IsSupportedV2"] = "isSupportedV2";
    WidgetSortField["Id"] = "id";
    WidgetSortField["BoardType"] = "boardType";
    WidgetSortField["SoftDelete"] = "softDelete";
    WidgetSortField["MobilePanelKey"] = "mobile_panelKey";
    WidgetSortField["MobileWidth"] = "mobile_width";
    WidgetSortField["MobileHeight"] = "mobile_height";
    WidgetSortField["DesktopPanelKey"] = "desktop_panelKey";
    WidgetSortField["DesktopWidth"] = "desktop_width";
    WidgetSortField["DesktopHeight"] = "desktop_height";
    WidgetSortField["ContentLocalChangeTimestamp"] = "content_localChangeTimestamp";
    WidgetSortField["ContentHash"] = "content_hash";
    WidgetSortField["ContentSize"] = "content_size";
    WidgetSortField["ContentUrl"] = "content_url";
    WidgetSortField["ContentId"] = "content_id";
    WidgetSortField["ContentFormat"] = "content_format";
    WidgetSortField["ContentVersion"] = "content_version";
    WidgetSortField["ContentPath"] = "content_path";
    WidgetSortField["ContentContent"] = "content_content";
    WidgetSortField["Updated"] = "updated";
    WidgetSortField["Label"] = "label";
})(WidgetSortField = exports.WidgetSortField || (exports.WidgetSortField = {}));
var WidgetWidgetType;
(function (WidgetWidgetType) {
    WidgetWidgetType["Clipped"] = "Clipped";
    WidgetWidgetType["Notebooks"] = "Notebooks";
    WidgetWidgetType["Notes"] = "Notes";
    WidgetWidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    WidgetWidgetType["Pinned"] = "Pinned";
    WidgetWidgetType["ScratchPad"] = "ScratchPad";
    WidgetWidgetType["Shortcuts"] = "Shortcuts";
    WidgetWidgetType["Tags"] = "Tags";
    WidgetWidgetType["Calendar"] = "Calendar";
    WidgetWidgetType["Tasks"] = "Tasks";
})(WidgetWidgetType = exports.WidgetWidgetType || (exports.WidgetWidgetType = {}));
var WorkspaceAccessStatus;
(function (WorkspaceAccessStatus) {
    WorkspaceAccessStatus["Open"] = "OPEN";
    WorkspaceAccessStatus["Discoverable"] = "DISCOVERABLE";
    WorkspaceAccessStatus["Pending"] = "PENDING";
    WorkspaceAccessStatus["Member"] = "MEMBER";
})(WorkspaceAccessStatus = exports.WorkspaceAccessStatus || (exports.WorkspaceAccessStatus = {}));
var WorkspaceAllMembershipsOrderBy;
(function (WorkspaceAllMembershipsOrderBy) {
    WorkspaceAllMembershipsOrderBy["Created"] = "created";
    WorkspaceAllMembershipsOrderBy["Label"] = "label";
})(WorkspaceAllMembershipsOrderBy = exports.WorkspaceAllMembershipsOrderBy || (exports.WorkspaceAllMembershipsOrderBy = {}));
var WorkspaceChildNotesOrderBy;
(function (WorkspaceChildNotesOrderBy) {
    WorkspaceChildNotesOrderBy["Label"] = "label";
    WorkspaceChildNotesOrderBy["Created"] = "created";
    WorkspaceChildNotesOrderBy["Updated"] = "updated";
})(WorkspaceChildNotesOrderBy = exports.WorkspaceChildNotesOrderBy || (exports.WorkspaceChildNotesOrderBy = {}));
var WorkspaceCreate_DefaultRole;
(function (WorkspaceCreate_DefaultRole) {
    WorkspaceCreate_DefaultRole["Read"] = "READ";
    WorkspaceCreate_DefaultRole["Edit"] = "EDIT";
    WorkspaceCreate_DefaultRole["Manage"] = "MANAGE";
})(WorkspaceCreate_DefaultRole = exports.WorkspaceCreate_DefaultRole || (exports.WorkspaceCreate_DefaultRole = {}));
var WorkspaceCreate_Type;
(function (WorkspaceCreate_Type) {
    WorkspaceCreate_Type["InviteOnly"] = "INVITE_ONLY";
    WorkspaceCreate_Type["Discoverable"] = "DISCOVERABLE";
    WorkspaceCreate_Type["Open"] = "OPEN";
})(WorkspaceCreate_Type = exports.WorkspaceCreate_Type || (exports.WorkspaceCreate_Type = {}));
var WorkspaceDefaultRole;
(function (WorkspaceDefaultRole) {
    WorkspaceDefaultRole["Read"] = "READ";
    WorkspaceDefaultRole["Edit"] = "EDIT";
    WorkspaceDefaultRole["Manage"] = "MANAGE";
})(WorkspaceDefaultRole = exports.WorkspaceDefaultRole || (exports.WorkspaceDefaultRole = {}));
var WorkspaceDirectoryFilterField;
(function (WorkspaceDirectoryFilterField) {
    WorkspaceDirectoryFilterField["Label"] = "label";
    WorkspaceDirectoryFilterField["Description"] = "description";
})(WorkspaceDirectoryFilterField = exports.WorkspaceDirectoryFilterField || (exports.WorkspaceDirectoryFilterField = {}));
var WorkspaceDirectorySortField;
(function (WorkspaceDirectorySortField) {
    WorkspaceDirectorySortField["Label"] = "label";
    WorkspaceDirectorySortField["Created"] = "created";
    WorkspaceDirectorySortField["Updated"] = "updated";
    WorkspaceDirectorySortField["MemberCount"] = "memberCount";
    WorkspaceDirectorySortField["AccessStatus"] = "accessStatus";
})(WorkspaceDirectorySortField = exports.WorkspaceDirectorySortField || (exports.WorkspaceDirectorySortField = {}));
var WorkspaceFilterField;
(function (WorkspaceFilterField) {
    WorkspaceFilterField["Label"] = "label";
    WorkspaceFilterField["Id"] = "id";
    WorkspaceFilterField["Description"] = "description";
    WorkspaceFilterField["WorkspaceType"] = "workspaceType";
    WorkspaceFilterField["Created"] = "created";
    WorkspaceFilterField["Updated"] = "updated";
    WorkspaceFilterField["Viewed"] = "viewed";
    WorkspaceFilterField["DefaultRole"] = "defaultRole";
    WorkspaceFilterField["IsSample"] = "isSample";
    WorkspaceFilterField["NotesCount"] = "notesCount";
    WorkspaceFilterField["NotebooksCount"] = "notebooksCount";
    WorkspaceFilterField["AccessStatus"] = "accessStatus";
})(WorkspaceFilterField = exports.WorkspaceFilterField || (exports.WorkspaceFilterField = {}));
var WorkspaceInvite_Privilege;
(function (WorkspaceInvite_Privilege) {
    WorkspaceInvite_Privilege["Read"] = "READ";
    WorkspaceInvite_Privilege["Edit"] = "EDIT";
    WorkspaceInvite_Privilege["Manage"] = "MANAGE";
})(WorkspaceInvite_Privilege = exports.WorkspaceInvite_Privilege || (exports.WorkspaceInvite_Privilege = {}));
var WorkspaceOwnMembershipsOrderBy;
(function (WorkspaceOwnMembershipsOrderBy) {
    WorkspaceOwnMembershipsOrderBy["Created"] = "created";
    WorkspaceOwnMembershipsOrderBy["Label"] = "label";
})(WorkspaceOwnMembershipsOrderBy = exports.WorkspaceOwnMembershipsOrderBy || (exports.WorkspaceOwnMembershipsOrderBy = {}));
var WorkspaceReminderNotesOrderBy;
(function (WorkspaceReminderNotesOrderBy) {
    WorkspaceReminderNotesOrderBy["ReminderTime"] = "reminderTime";
    WorkspaceReminderNotesOrderBy["Label"] = "label";
    WorkspaceReminderNotesOrderBy["Created"] = "created";
    WorkspaceReminderNotesOrderBy["Updated"] = "updated";
})(WorkspaceReminderNotesOrderBy = exports.WorkspaceReminderNotesOrderBy || (exports.WorkspaceReminderNotesOrderBy = {}));
var WorkspaceSetLayoutStyle_LayoutStyle;
(function (WorkspaceSetLayoutStyle_LayoutStyle) {
    WorkspaceSetLayoutStyle_LayoutStyle["List"] = "LIST";
    WorkspaceSetLayoutStyle_LayoutStyle["Board"] = "BOARD";
})(WorkspaceSetLayoutStyle_LayoutStyle = exports.WorkspaceSetLayoutStyle_LayoutStyle || (exports.WorkspaceSetLayoutStyle_LayoutStyle = {}));
var WorkspaceSortField;
(function (WorkspaceSortField) {
    WorkspaceSortField["Label"] = "label";
    WorkspaceSortField["Id"] = "id";
    WorkspaceSortField["Description"] = "description";
    WorkspaceSortField["WorkspaceType"] = "workspaceType";
    WorkspaceSortField["Created"] = "created";
    WorkspaceSortField["Updated"] = "updated";
    WorkspaceSortField["Viewed"] = "viewed";
    WorkspaceSortField["DefaultRole"] = "defaultRole";
    WorkspaceSortField["IsSample"] = "isSample";
    WorkspaceSortField["NotesCount"] = "notesCount";
    WorkspaceSortField["NotebooksCount"] = "notebooksCount";
    WorkspaceSortField["AccessStatus"] = "accessStatus";
})(WorkspaceSortField = exports.WorkspaceSortField || (exports.WorkspaceSortField = {}));
var WorkspaceUpdate_DefaultRole;
(function (WorkspaceUpdate_DefaultRole) {
    WorkspaceUpdate_DefaultRole["Read"] = "READ";
    WorkspaceUpdate_DefaultRole["Edit"] = "EDIT";
    WorkspaceUpdate_DefaultRole["Manage"] = "MANAGE";
})(WorkspaceUpdate_DefaultRole = exports.WorkspaceUpdate_DefaultRole || (exports.WorkspaceUpdate_DefaultRole = {}));
var WorkspaceUpdate_Type;
(function (WorkspaceUpdate_Type) {
    WorkspaceUpdate_Type["InviteOnly"] = "INVITE_ONLY";
    WorkspaceUpdate_Type["Discoverable"] = "DISCOVERABLE";
    WorkspaceUpdate_Type["Open"] = "OPEN";
})(WorkspaceUpdate_Type = exports.WorkspaceUpdate_Type || (exports.WorkspaceUpdate_Type = {}));
var WorkspaceWorkspaceType;
(function (WorkspaceWorkspaceType) {
    WorkspaceWorkspaceType["InviteOnly"] = "INVITE_ONLY";
    WorkspaceWorkspaceType["Discoverable"] = "DISCOVERABLE";
    WorkspaceWorkspaceType["Open"] = "OPEN";
})(WorkspaceWorkspaceType = exports.WorkspaceWorkspaceType || (exports.WorkspaceWorkspaceType = {}));
//# sourceMappingURL=strict-index.js.map