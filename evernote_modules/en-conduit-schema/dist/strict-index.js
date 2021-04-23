"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotebookChildNotesOrderBy = exports.NotebookAllMembershipsOrderBy = exports.NoteAllMembershipsOrderBy = exports.NapMigrationStateType = exports.MonetizationClientType = exports.MessageSortField = exports.MessageFilterField = exports.MembershipSortField = exports.MembershipsInParentOrderBy = exports.MembershipsForMeOrderBy = exports.MembershipsForMeInParentOrderBy = exports.MembershipRecipientType = exports.MembershipPrivilege = exports.MembershipFilterField = exports.MarketingEmailType = exports.MaestroRequestingEnvironment = exports.MaestroPlatform = exports.MaestroClientType = exports.LoginStatus = exports.InvitationType = exports.InvitationSortField = exports.InvitationsForMeOrderBy = exports.InvitationFilterField = exports.IndexOrderType = exports.GoogleScopesEnum = exports.FeatureRolloutClientType = exports.CommEngineEventType = exports.CommEngineClientType = exports.ClientPlatform = exports.CalendarProvider = exports.CalendarNotificationOptions = exports.CalendarEventStatus = exports.BusinessUserType = exports.BusinessUserRole = exports.BoardType = exports.BoardSortField = exports.BoardServiceLevels = exports.BoardPlatformWidgetsPlatform = exports.BoardMutableWidgetTypes = exports.BoardMobileLayout = exports.BoardFormFactor = exports.BoardFilterField = exports.BoardDesktopLayout = exports.BoardBackgroundMode = exports.BetaFeatureSortField = exports.BetaFeatureFilterField = exports.AuthStateEnum = exports.AttachmentSortField = exports.AttachmentFilterField = exports.AdaptiveDownsyncTypeEnum = void 0;
exports.SyncProgressTypeEnum = exports.SupportedPlacement = exports.StackSortField = exports.StackFilterField = exports.StackedNotebookSortField = exports.SignInMethod = exports.ShortcutSortField = exports.ShortcutFilterField = exports.SharedWithMeField = exports.ServiceProvider = exports.SearchLogEventTypeProperty = exports.SearchExTextField = exports.SearchExSortOrder = exports.SearchExResultType = exports.SearchExLocalSearchMode = exports.ScheduledNotificationType = exports.ScheduledNotificationSortField = exports.ScheduledNotificationFilterField = exports.SavedSearchSortField = exports.SavedSearchFilterField = exports.ReminderStatus = exports.ReminderSortField = exports.ReminderFilterField = exports.ReminderDateUiOption = exports.PublishedNotebooksSortField = exports.PublishedNotebooksFilterField = exports.PublishedNotebookAccessStatus = exports.PromotionSortField = exports.PromotionFilterField = exports.ProfileStatus = exports.ProfileSortField = exports.ProfileFilterField = exports.PremiumOrderStatus = exports.NotesWithRemindersOrderBy = exports.NoteSortField = exports.NotesNotInTrashOrderBy = exports.NotesInWorkspaceOrderBy = exports.NotesInTrashOrderBy = exports.NotesInParentOrderBy = exports.NoteOwnMembershipsOrderBy = exports.NoteHistoryLayout = exports.NoteFilterField = exports.NoteContentInfoSortField = exports.NoteContentInfoFilterField = exports.NotebookSortField = exports.NotebooksOrderBy = exports.NotebooksInWorkspaceOrderBy = exports.NotebookReminderNotesOrderBy = exports.NotebookOwnMembershipsOrderBy = exports.NotebookFilterField = void 0;
exports.WorkspaceType = exports.WorkspaceSortField = exports.WorkspaceReminderNotesOrderBy = exports.WorkspaceOwnMembershipsOrderBy = exports.WorkspaceLayoutStyle = exports.WorkspaceFilterField = exports.WorkspaceDirectorySortField = exports.WorkspaceDirectoryFilterField = exports.WorkspaceDescendentNotesOrderBy = exports.WorkspaceChildNotesOrderBy = exports.WorkspaceChildNotebooksOrderBy = exports.WorkspaceAllMembershipsOrderBy = exports.WorkspaceAccessStatus = exports.WidgetType = exports.WidgetTabs = exports.WidgetSortField = exports.WidgetsInBoardPlatform = exports.WidgetFilterField = exports.WidgetContentConflictSortField = exports.WidgetContentConflictFilterField = exports.UserServiceLevelV2 = exports.UserServiceLevel = exports.UserReminderEmailConfig = exports.UserPrivilegeLevel = exports.TsdVariation = exports.TsdType = exports.ThreadSortField = exports.ThreadFilterField = exports.TaskUserSettingsSortField = exports.TaskUserSettingsFilterField = exports.TaskStatus = exports.TaskSortField = exports.TaskOwnMembershipsOrderBy = exports.TaskNotesNotInTrashOrderBy = exports.TaskFilterField = exports.TaskDueDateUiOption = exports.TaskAllMembershipsOrderBy = exports.TagSortField = exports.TagsOrderBy = exports.TagsAllowedField = exports.TagHierarchySortField = exports.TagHierarchyFilterField = exports.TagFilterField = exports.TagChildTagsOrderBy = void 0;
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
var BoardBackgroundMode;
(function (BoardBackgroundMode) {
    BoardBackgroundMode["None"] = "None";
    BoardBackgroundMode["Image"] = "Image";
    BoardBackgroundMode["Color"] = "Color";
})(BoardBackgroundMode = exports.BoardBackgroundMode || (exports.BoardBackgroundMode = {}));
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
    BoardFilterField["InternalId"] = "internalID";
    BoardFilterField["IsCustomized"] = "isCustomized";
    BoardFilterField["ServiceLevel"] = "serviceLevel";
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
    BoardFilterField["HeaderBgMode"] = "headerBGMode";
    BoardFilterField["HeaderBgColorLight"] = "headerBGColor_light";
    BoardFilterField["HeaderBgColorDark"] = "headerBGColor_dark";
    BoardFilterField["GreetingText"] = "greetingText";
    BoardFilterField["DesktopLayout"] = "desktop_layout";
    BoardFilterField["MobileLayout"] = "mobile_layout";
    BoardFilterField["FreeTrialExpiration"] = "freeTrialExpiration";
    BoardFilterField["Updated"] = "updated";
    BoardFilterField["TasksVersion"] = "tasksVersion";
    BoardFilterField["CalendarVersion"] = "calendarVersion";
    BoardFilterField["FilteredNotesVersion"] = "filteredNotesVersion";
    BoardFilterField["ExtraVersion"] = "extraVersion";
    BoardFilterField["CoreVersion"] = "coreVersion";
    BoardFilterField["Label"] = "label";
})(BoardFilterField = exports.BoardFilterField || (exports.BoardFilterField = {}));
var BoardFormFactor;
(function (BoardFormFactor) {
    BoardFormFactor["Desktop"] = "Desktop";
    BoardFormFactor["Mobile"] = "Mobile";
})(BoardFormFactor = exports.BoardFormFactor || (exports.BoardFormFactor = {}));
var BoardMobileLayout;
(function (BoardMobileLayout) {
    BoardMobileLayout["SingleColumnStack"] = "SingleColumnStack";
})(BoardMobileLayout = exports.BoardMobileLayout || (exports.BoardMobileLayout = {}));
var BoardMutableWidgetTypes;
(function (BoardMutableWidgetTypes) {
    BoardMutableWidgetTypes["Pinned"] = "Pinned";
    BoardMutableWidgetTypes["ScratchPad"] = "ScratchPad";
    BoardMutableWidgetTypes["FilteredNotes"] = "FilteredNotes";
})(BoardMutableWidgetTypes = exports.BoardMutableWidgetTypes || (exports.BoardMutableWidgetTypes = {}));
var BoardPlatformWidgetsPlatform;
(function (BoardPlatformWidgetsPlatform) {
    BoardPlatformWidgetsPlatform["Mobile"] = "mobile";
    BoardPlatformWidgetsPlatform["Desktop"] = "desktop";
})(BoardPlatformWidgetsPlatform = exports.BoardPlatformWidgetsPlatform || (exports.BoardPlatformWidgetsPlatform = {}));
var BoardServiceLevels;
(function (BoardServiceLevels) {
    BoardServiceLevels["Free"] = "FREE";
    BoardServiceLevels["Plus"] = "PLUS";
    BoardServiceLevels["Premium"] = "PREMIUM";
    BoardServiceLevels["Personal"] = "PERSONAL";
    BoardServiceLevels["Professional"] = "PROFESSIONAL";
    BoardServiceLevels["Teams"] = "TEAMS";
    BoardServiceLevels["Basic"] = "BASIC";
    BoardServiceLevels["Business"] = "BUSINESS";
})(BoardServiceLevels = exports.BoardServiceLevels || (exports.BoardServiceLevels = {}));
var BoardSortField;
(function (BoardSortField) {
    BoardSortField["Created"] = "created";
    BoardSortField["IsSupported"] = "isSupported";
    BoardSortField["Id"] = "id";
    BoardSortField["BoardType"] = "boardType";
    BoardSortField["InternalId"] = "internalID";
    BoardSortField["IsCustomized"] = "isCustomized";
    BoardSortField["ServiceLevel"] = "serviceLevel";
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
    BoardSortField["HeaderBgMode"] = "headerBGMode";
    BoardSortField["HeaderBgColorLight"] = "headerBGColor_light";
    BoardSortField["HeaderBgColorDark"] = "headerBGColor_dark";
    BoardSortField["GreetingText"] = "greetingText";
    BoardSortField["DesktopLayout"] = "desktop_layout";
    BoardSortField["MobileLayout"] = "mobile_layout";
    BoardSortField["FreeTrialExpiration"] = "freeTrialExpiration";
    BoardSortField["Updated"] = "updated";
    BoardSortField["TasksVersion"] = "tasksVersion";
    BoardSortField["CalendarVersion"] = "calendarVersion";
    BoardSortField["FilteredNotesVersion"] = "filteredNotesVersion";
    BoardSortField["ExtraVersion"] = "extraVersion";
    BoardSortField["CoreVersion"] = "coreVersion";
    BoardSortField["Label"] = "label";
})(BoardSortField = exports.BoardSortField || (exports.BoardSortField = {}));
var BoardType;
(function (BoardType) {
    BoardType["Home"] = "Home";
})(BoardType = exports.BoardType || (exports.BoardType = {}));
var BusinessUserRole;
(function (BusinessUserRole) {
    BusinessUserRole["Admin"] = "ADMIN";
    BusinessUserRole["Normal"] = "NORMAL";
})(BusinessUserRole = exports.BusinessUserRole || (exports.BusinessUserRole = {}));
var BusinessUserType;
(function (BusinessUserType) {
    BusinessUserType["Unknown"] = "UNKNOWN";
    BusinessUserType["PersonalOnly"] = "PERSONAL_ONLY";
    BusinessUserType["Legacy"] = "LEGACY";
    BusinessUserType["BusinessOnly"] = "BUSINESS_ONLY";
})(BusinessUserType = exports.BusinessUserType || (exports.BusinessUserType = {}));
var CalendarEventStatus;
(function (CalendarEventStatus) {
    CalendarEventStatus["Confirmed"] = "CONFIRMED";
    CalendarEventStatus["Canceled"] = "CANCELED";
    CalendarEventStatus["Tentative"] = "TENTATIVE";
})(CalendarEventStatus = exports.CalendarEventStatus || (exports.CalendarEventStatus = {}));
var CalendarNotificationOptions;
(function (CalendarNotificationOptions) {
    CalendarNotificationOptions["ThirtyBefore"] = "THIRTY_BEFORE";
    CalendarNotificationOptions["TenBefore"] = "TEN_BEFORE";
    CalendarNotificationOptions["FiveBefore"] = "FIVE_BEFORE";
    CalendarNotificationOptions["AtStart"] = "AT_START";
    CalendarNotificationOptions["AtEnd"] = "AT_END";
    CalendarNotificationOptions["FiveAfter"] = "FIVE_AFTER";
    CalendarNotificationOptions["Off"] = "OFF";
})(CalendarNotificationOptions = exports.CalendarNotificationOptions || (exports.CalendarNotificationOptions = {}));
var CalendarProvider;
(function (CalendarProvider) {
    CalendarProvider["Google"] = "GOOGLE";
    CalendarProvider["Outlook"] = "OUTLOOK";
    CalendarProvider["Other"] = "OTHER";
})(CalendarProvider = exports.CalendarProvider || (exports.CalendarProvider = {}));
var ClientPlatform;
(function (ClientPlatform) {
    ClientPlatform["Android"] = "ANDROID";
    ClientPlatform["Ios"] = "IOS";
    ClientPlatform["Mac"] = "MAC";
})(ClientPlatform = exports.ClientPlatform || (exports.ClientPlatform = {}));
var CommEngineClientType;
(function (CommEngineClientType) {
    CommEngineClientType["Mac"] = "MAC";
    CommEngineClientType["Windows"] = "WINDOWS";
    CommEngineClientType["Ios"] = "IOS";
    CommEngineClientType["Android"] = "ANDROID";
    CommEngineClientType["Web"] = "WEB";
    CommEngineClientType["Clipper"] = "CLIPPER";
    CommEngineClientType["Ion"] = "ION";
    CommEngineClientType["Boron"] = "BORON";
})(CommEngineClientType = exports.CommEngineClientType || (exports.CommEngineClientType = {}));
var CommEngineEventType;
(function (CommEngineEventType) {
    CommEngineEventType["Show"] = "SHOW";
    CommEngineEventType["Dismiss"] = "DISMISS";
    CommEngineEventType["Track"] = "TRACK";
    CommEngineEventType["Errorevent"] = "ERROREVENT";
})(CommEngineEventType = exports.CommEngineEventType || (exports.CommEngineEventType = {}));
var FeatureRolloutClientType;
(function (FeatureRolloutClientType) {
    FeatureRolloutClientType["Mobile"] = "mobile";
    FeatureRolloutClientType["Desktop"] = "desktop";
})(FeatureRolloutClientType = exports.FeatureRolloutClientType || (exports.FeatureRolloutClientType = {}));
var GoogleScopesEnum;
(function (GoogleScopesEnum) {
    GoogleScopesEnum["Drive"] = "DRIVE";
    GoogleScopesEnum["Calendar"] = "CALENDAR";
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
var InvitationType;
(function (InvitationType) {
    InvitationType["Unknown"] = "UNKNOWN";
    InvitationType["Note"] = "NOTE";
    InvitationType["Notebook"] = "NOTEBOOK";
})(InvitationType = exports.InvitationType || (exports.InvitationType = {}));
var LoginStatus;
(function (LoginStatus) {
    LoginStatus["Unknown"] = "UNKNOWN";
    LoginStatus["InvalidFormat"] = "INVALID_FORMAT";
    LoginStatus["NotFound"] = "NOT_FOUND";
    LoginStatus["InvitePending"] = "INVITE_PENDING";
    LoginStatus["PasswordReset"] = "PASSWORD_RESET";
    LoginStatus["Password"] = "PASSWORD";
    LoginStatus["Sso"] = "SSO";
})(LoginStatus = exports.LoginStatus || (exports.LoginStatus = {}));
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
    MembershipPrivilege["Complete"] = "COMPLETE";
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
var NapMigrationStateType;
(function (NapMigrationStateType) {
    NapMigrationStateType["Unknown"] = "UNKNOWN";
    NapMigrationStateType["Legacy"] = "LEGACY";
    NapMigrationStateType["MigrateOnLogin"] = "MIGRATE_ON_LOGIN";
    NapMigrationStateType["Migrated"] = "MIGRATED";
    NapMigrationStateType["MigrationFailed"] = "MIGRATION_FAILED";
    NapMigrationStateType["MigratedNapOnly"] = "MIGRATED_NAP_ONLY";
    NapMigrationStateType["NotFound"] = "NOT_FOUND";
})(NapMigrationStateType = exports.NapMigrationStateType || (exports.NapMigrationStateType = {}));
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
var NotebooksInWorkspaceOrderBy;
(function (NotebooksInWorkspaceOrderBy) {
    NotebooksInWorkspaceOrderBy["Label"] = "label";
    NotebooksInWorkspaceOrderBy["Updated"] = "updated";
    NotebooksInWorkspaceOrderBy["Created"] = "created";
})(NotebooksInWorkspaceOrderBy = exports.NotebooksInWorkspaceOrderBy || (exports.NotebooksInWorkspaceOrderBy = {}));
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
var NoteHistoryLayout;
(function (NoteHistoryLayout) {
    NoteHistoryLayout["Embed"] = "EMBED";
    NoteHistoryLayout["Nativeembed"] = "NATIVEEMBED";
    NoteHistoryLayout["Web"] = "WEB";
    NoteHistoryLayout["Iphone"] = "IPHONE";
    NoteHistoryLayout["Android"] = "ANDROID";
    NoteHistoryLayout["Ipad"] = "IPAD";
    NoteHistoryLayout["Wp7"] = "WP7";
    NoteHistoryLayout["App"] = "APP";
    NoteHistoryLayout["Micro"] = "MICRO";
    NoteHistoryLayout["Oauthmicro"] = "OAUTHMICRO";
    NoteHistoryLayout["Small"] = "SMALL";
    NoteHistoryLayout["Mobile"] = "MOBILE";
    NoteHistoryLayout["Webembed"] = "WEBEMBED";
    NoteHistoryLayout["Mac"] = "MAC";
})(NoteHistoryLayout = exports.NoteHistoryLayout || (exports.NoteHistoryLayout = {}));
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
var NotesInWorkspaceOrderBy;
(function (NotesInWorkspaceOrderBy) {
    NotesInWorkspaceOrderBy["Updated"] = "updated";
    NotesInWorkspaceOrderBy["Label"] = "label";
    NotesInWorkspaceOrderBy["Created"] = "created";
})(NotesInWorkspaceOrderBy = exports.NotesInWorkspaceOrderBy || (exports.NotesInWorkspaceOrderBy = {}));
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
var PremiumOrderStatus;
(function (PremiumOrderStatus) {
    PremiumOrderStatus["None"] = "NONE";
    PremiumOrderStatus["Pending"] = "PENDING";
    PremiumOrderStatus["Active"] = "ACTIVE";
    PremiumOrderStatus["Failed"] = "FAILED";
    PremiumOrderStatus["CancellationPending"] = "CANCELLATION_PENDING";
    PremiumOrderStatus["Canceled"] = "CANCELED";
})(PremiumOrderStatus = exports.PremiumOrderStatus || (exports.PremiumOrderStatus = {}));
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
var PublishedNotebookAccessStatus;
(function (PublishedNotebookAccessStatus) {
    PublishedNotebookAccessStatus["Open"] = "OPEN";
    PublishedNotebookAccessStatus["Member"] = "MEMBER";
})(PublishedNotebookAccessStatus = exports.PublishedNotebookAccessStatus || (exports.PublishedNotebookAccessStatus = {}));
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
var ReminderDateUiOption;
(function (ReminderDateUiOption) {
    ReminderDateUiOption["DateTime"] = "date_time";
    ReminderDateUiOption["DateOnly"] = "date_only";
    ReminderDateUiOption["RelativeToDue"] = "relative_to_due";
})(ReminderDateUiOption = exports.ReminderDateUiOption || (exports.ReminderDateUiOption = {}));
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
    ScheduledNotificationFilterField["DataCalendarEventId"] = "data_calendarEventId";
    ScheduledNotificationFilterField["DataNotificationTime"] = "data_notificationTime";
    ScheduledNotificationFilterField["DataClientType"] = "data_clientType";
    ScheduledNotificationFilterField["DataTitle"] = "data_title";
    ScheduledNotificationFilterField["DataStartTime"] = "data_startTime";
    ScheduledNotificationFilterField["DataEndTime"] = "data_endTime";
    ScheduledNotificationFilterField["DataLocation"] = "data_location";
    ScheduledNotificationFilterField["DataNoteId"] = "data_noteID";
    ScheduledNotificationFilterField["Label"] = "label";
})(ScheduledNotificationFilterField = exports.ScheduledNotificationFilterField || (exports.ScheduledNotificationFilterField = {}));
var ScheduledNotificationSortField;
(function (ScheduledNotificationSortField) {
    ScheduledNotificationSortField["Id"] = "id";
    ScheduledNotificationSortField["ScheduledNotificationType"] = "scheduledNotificationType";
    ScheduledNotificationSortField["Created"] = "created";
    ScheduledNotificationSortField["Updated"] = "updated";
    ScheduledNotificationSortField["Mute"] = "mute";
    ScheduledNotificationSortField["DataCalendarEventId"] = "data_calendarEventId";
    ScheduledNotificationSortField["DataNotificationTime"] = "data_notificationTime";
    ScheduledNotificationSortField["DataClientType"] = "data_clientType";
    ScheduledNotificationSortField["DataTitle"] = "data_title";
    ScheduledNotificationSortField["DataStartTime"] = "data_startTime";
    ScheduledNotificationSortField["DataEndTime"] = "data_endTime";
    ScheduledNotificationSortField["DataLocation"] = "data_location";
    ScheduledNotificationSortField["DataNoteId"] = "data_noteID";
    ScheduledNotificationSortField["Label"] = "label";
})(ScheduledNotificationSortField = exports.ScheduledNotificationSortField || (exports.ScheduledNotificationSortField = {}));
var ScheduledNotificationType;
(function (ScheduledNotificationType) {
    ScheduledNotificationType["TaskReminder"] = "TaskReminder";
    ScheduledNotificationType["Calendar"] = "Calendar";
})(ScheduledNotificationType = exports.ScheduledNotificationType || (exports.ScheduledNotificationType = {}));
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
var SignInMethod;
(function (SignInMethod) {
    SignInMethod["Nap"] = "NAP";
    SignInMethod["Legacy"] = "Legacy";
})(SignInMethod = exports.SignInMethod || (exports.SignInMethod = {}));
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
var TaskAllMembershipsOrderBy;
(function (TaskAllMembershipsOrderBy) {
    TaskAllMembershipsOrderBy["Created"] = "created";
    TaskAllMembershipsOrderBy["Label"] = "label";
})(TaskAllMembershipsOrderBy = exports.TaskAllMembershipsOrderBy || (exports.TaskAllMembershipsOrderBy = {}));
var TaskDueDateUiOption;
(function (TaskDueDateUiOption) {
    TaskDueDateUiOption["DateTime"] = "date_time";
    TaskDueDateUiOption["DateOnly"] = "date_only";
})(TaskDueDateUiOption = exports.TaskDueDateUiOption || (exports.TaskDueDateUiOption = {}));
var TaskFilterField;
(function (TaskFilterField) {
    TaskFilterField["Parent"] = "parent";
    TaskFilterField["Assignee"] = "assignee";
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
var TaskOwnMembershipsOrderBy;
(function (TaskOwnMembershipsOrderBy) {
    TaskOwnMembershipsOrderBy["Created"] = "created";
    TaskOwnMembershipsOrderBy["Label"] = "label";
})(TaskOwnMembershipsOrderBy = exports.TaskOwnMembershipsOrderBy || (exports.TaskOwnMembershipsOrderBy = {}));
var TaskSortField;
(function (TaskSortField) {
    TaskSortField["Parent"] = "parent";
    TaskSortField["Assignee"] = "assignee";
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
var TsdType;
(function (TsdType) {
    TsdType["RegularTsd"] = "REGULAR_TSD";
    TsdType["TargetedUpsell"] = "TARGETED_UPSELL";
})(TsdType = exports.TsdType || (exports.TsdType = {}));
var TsdVariation;
(function (TsdVariation) {
    TsdVariation["DialogVar1"] = "DIALOG_VAR1";
    TsdVariation["Fullscreen1ButtonDismiss"] = "FULLSCREEN1BUTTON_DISMISS";
    TsdVariation["Fullscreen1ButtonNodismiss"] = "FULLSCREEN1BUTTON_NODISMISS";
    TsdVariation["Fullscreen1ButtonTierpath"] = "FULLSCREEN1BUTTON_TIERPATH";
    TsdVariation["Fullscreen1ButtonVar2"] = "FULLSCREEN1BUTTON_VAR2";
    TsdVariation["Fullscreen3ButtonsDefault"] = "FULLSCREEN3BUTTONS_DEFAULT";
    TsdVariation["Fullscreen3ButtonsDismiss"] = "FULLSCREEN3BUTTONS_DISMISS";
    TsdVariation["Fullscreen3ButtonsNodismiss"] = "FULLSCREEN3BUTTONS_NODISMISS";
    TsdVariation["Fullscreen3ButtonsBeforefle"] = "FULLSCREEN3BUTTONS_BEFOREFLE";
    TsdVariation["ModalDefault"] = "MODAL_DEFAULT";
    TsdVariation["NotificationAspirational"] = "NOTIFICATION_ASPIRATIONAL";
    TsdVariation["NotificationStorage"] = "NOTIFICATION_STORAGE";
    TsdVariation["SheetAspirational"] = "SHEET_ASPIRATIONAL";
    TsdVariation["SheetStorage"] = "SHEET_STORAGE";
    TsdVariation["BannerLearnmore"] = "BANNER_LEARNMORE";
    TsdVariation["BannerUpgrade"] = "BANNER_UPGRADE";
    TsdVariation["FullscreenSinglesday"] = "FULLSCREEN_SINGLESDAY";
    TsdVariation["FullscreenDiscount"] = "FULLSCREEN_DISCOUNT";
    TsdVariation["FullscreenNewyear"] = "FULLSCREEN_NEWYEAR";
    TsdVariation["TestUnsupported"] = "TEST_UNSUPPORTED";
})(TsdVariation = exports.TsdVariation || (exports.TsdVariation = {}));
var UserPrivilegeLevel;
(function (UserPrivilegeLevel) {
    UserPrivilegeLevel["Normal"] = "NORMAL";
    UserPrivilegeLevel["Premium"] = "PREMIUM";
    UserPrivilegeLevel["Vip"] = "VIP";
    UserPrivilegeLevel["Manager"] = "MANAGER";
    UserPrivilegeLevel["Support"] = "SUPPORT";
    UserPrivilegeLevel["Admin"] = "ADMIN";
})(UserPrivilegeLevel = exports.UserPrivilegeLevel || (exports.UserPrivilegeLevel = {}));
var UserReminderEmailConfig;
(function (UserReminderEmailConfig) {
    UserReminderEmailConfig["DoNotSend"] = "DO_NOT_SEND";
    UserReminderEmailConfig["SendDailyEmail"] = "SEND_DAILY_EMAIL";
})(UserReminderEmailConfig = exports.UserReminderEmailConfig || (exports.UserReminderEmailConfig = {}));
var UserServiceLevel;
(function (UserServiceLevel) {
    UserServiceLevel["Basic"] = "BASIC";
    UserServiceLevel["Plus"] = "PLUS";
    UserServiceLevel["Premium"] = "PREMIUM";
    UserServiceLevel["Business"] = "BUSINESS";
})(UserServiceLevel = exports.UserServiceLevel || (exports.UserServiceLevel = {}));
var UserServiceLevelV2;
(function (UserServiceLevelV2) {
    UserServiceLevelV2["Free"] = "FREE";
    UserServiceLevelV2["Plus"] = "PLUS";
    UserServiceLevelV2["Premium"] = "PREMIUM";
    UserServiceLevelV2["Personal"] = "PERSONAL";
    UserServiceLevelV2["Professional"] = "PROFESSIONAL";
    UserServiceLevelV2["Teams"] = "TEAMS";
})(UserServiceLevelV2 = exports.UserServiceLevelV2 || (exports.UserServiceLevelV2 = {}));
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
    WidgetFilterField["Created"] = "created";
    WidgetFilterField["WidgetType"] = "widgetType";
    WidgetFilterField["IsEnabled"] = "isEnabled";
    WidgetFilterField["SelectedTab"] = "selectedTab";
    WidgetFilterField["MutableWidgetType"] = "mutableWidgetType";
    WidgetFilterField["IsSupportedV3"] = "isSupportedV3";
    WidgetFilterField["Id"] = "id";
    WidgetFilterField["BoardType"] = "boardType";
    WidgetFilterField["SoftDelete"] = "softDelete";
    WidgetFilterField["InternalId"] = "internalID";
    WidgetFilterField["MobilePanelKey"] = "mobile_panelKey";
    WidgetFilterField["MobileWidth"] = "mobile_width";
    WidgetFilterField["MobileHeight"] = "mobile_height";
    WidgetFilterField["DesktopPanelKey"] = "desktop_panelKey";
    WidgetFilterField["DesktopSortWeight"] = "desktop_sortWeight";
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
    WidgetFilterField["FilteredNotesQueryQuery"] = "filteredNotesQuery_query";
    WidgetFilterField["BackgroundColorLight"] = "backgroundColor_light";
    WidgetFilterField["BackgroundColorDark"] = "backgroundColor_dark";
    WidgetFilterField["Label"] = "label";
})(WidgetFilterField = exports.WidgetFilterField || (exports.WidgetFilterField = {}));
var WidgetsInBoardPlatform;
(function (WidgetsInBoardPlatform) {
    WidgetsInBoardPlatform["Mobile"] = "mobile";
    WidgetsInBoardPlatform["Desktop"] = "desktop";
})(WidgetsInBoardPlatform = exports.WidgetsInBoardPlatform || (exports.WidgetsInBoardPlatform = {}));
var WidgetSortField;
(function (WidgetSortField) {
    WidgetSortField["Parent"] = "parent";
    WidgetSortField["ContentProvider"] = "contentProvider";
    WidgetSortField["MobileSortWeight"] = "mobile_sortWeight";
    WidgetSortField["Created"] = "created";
    WidgetSortField["WidgetType"] = "widgetType";
    WidgetSortField["IsEnabled"] = "isEnabled";
    WidgetSortField["SelectedTab"] = "selectedTab";
    WidgetSortField["MutableWidgetType"] = "mutableWidgetType";
    WidgetSortField["IsSupportedV3"] = "isSupportedV3";
    WidgetSortField["Id"] = "id";
    WidgetSortField["BoardType"] = "boardType";
    WidgetSortField["SoftDelete"] = "softDelete";
    WidgetSortField["InternalId"] = "internalID";
    WidgetSortField["MobilePanelKey"] = "mobile_panelKey";
    WidgetSortField["MobileWidth"] = "mobile_width";
    WidgetSortField["MobileHeight"] = "mobile_height";
    WidgetSortField["DesktopPanelKey"] = "desktop_panelKey";
    WidgetSortField["DesktopSortWeight"] = "desktop_sortWeight";
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
    WidgetSortField["FilteredNotesQueryQuery"] = "filteredNotesQuery_query";
    WidgetSortField["BackgroundColorLight"] = "backgroundColor_light";
    WidgetSortField["BackgroundColorDark"] = "backgroundColor_dark";
    WidgetSortField["Label"] = "label";
})(WidgetSortField = exports.WidgetSortField || (exports.WidgetSortField = {}));
var WidgetTabs;
(function (WidgetTabs) {
    WidgetTabs["WebClips"] = "WebClips";
    WidgetTabs["Audio"] = "Audio";
    WidgetTabs["Emails"] = "Emails";
    WidgetTabs["Images"] = "Images";
    WidgetTabs["Documents"] = "Documents";
    WidgetTabs["Recent"] = "Recent";
    WidgetTabs["Suggested"] = "Suggested";
})(WidgetTabs = exports.WidgetTabs || (exports.WidgetTabs = {}));
var WidgetType;
(function (WidgetType) {
    WidgetType["Tags"] = "Tags";
    WidgetType["Shortcuts"] = "Shortcuts";
    WidgetType["Pinned"] = "Pinned";
    WidgetType["OnboardingChecklist"] = "OnboardingChecklist";
    WidgetType["ScratchPad"] = "ScratchPad";
    WidgetType["Notes"] = "Notes";
    WidgetType["Notebooks"] = "Notebooks";
    WidgetType["Clipped"] = "Clipped";
    WidgetType["Calendar"] = "Calendar";
    WidgetType["Tasks"] = "Tasks";
    WidgetType["FilteredNotes"] = "FilteredNotes";
    WidgetType["Extra"] = "Extra";
})(WidgetType = exports.WidgetType || (exports.WidgetType = {}));
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
var WorkspaceChildNotebooksOrderBy;
(function (WorkspaceChildNotebooksOrderBy) {
    WorkspaceChildNotebooksOrderBy["Label"] = "label";
    WorkspaceChildNotebooksOrderBy["Updated"] = "updated";
    WorkspaceChildNotebooksOrderBy["Created"] = "created";
})(WorkspaceChildNotebooksOrderBy = exports.WorkspaceChildNotebooksOrderBy || (exports.WorkspaceChildNotebooksOrderBy = {}));
var WorkspaceChildNotesOrderBy;
(function (WorkspaceChildNotesOrderBy) {
    WorkspaceChildNotesOrderBy["Label"] = "label";
    WorkspaceChildNotesOrderBy["Created"] = "created";
    WorkspaceChildNotesOrderBy["Updated"] = "updated";
})(WorkspaceChildNotesOrderBy = exports.WorkspaceChildNotesOrderBy || (exports.WorkspaceChildNotesOrderBy = {}));
var WorkspaceDescendentNotesOrderBy;
(function (WorkspaceDescendentNotesOrderBy) {
    WorkspaceDescendentNotesOrderBy["Updated"] = "updated";
    WorkspaceDescendentNotesOrderBy["Label"] = "label";
    WorkspaceDescendentNotesOrderBy["Created"] = "created";
})(WorkspaceDescendentNotesOrderBy = exports.WorkspaceDescendentNotesOrderBy || (exports.WorkspaceDescendentNotesOrderBy = {}));
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
    WorkspaceFilterField["AccessStatus"] = "accessStatus";
    WorkspaceFilterField["Description"] = "description";
    WorkspaceFilterField["WorkspaceType"] = "workspaceType";
    WorkspaceFilterField["Created"] = "created";
    WorkspaceFilterField["Updated"] = "updated";
    WorkspaceFilterField["Viewed"] = "viewed";
    WorkspaceFilterField["DefaultRole"] = "defaultRole";
    WorkspaceFilterField["IsSample"] = "isSample";
    WorkspaceFilterField["NotesCount"] = "notesCount";
    WorkspaceFilterField["NotebooksCount"] = "notebooksCount";
})(WorkspaceFilterField = exports.WorkspaceFilterField || (exports.WorkspaceFilterField = {}));
var WorkspaceLayoutStyle;
(function (WorkspaceLayoutStyle) {
    WorkspaceLayoutStyle["List"] = "LIST";
    WorkspaceLayoutStyle["Board"] = "BOARD";
})(WorkspaceLayoutStyle = exports.WorkspaceLayoutStyle || (exports.WorkspaceLayoutStyle = {}));
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
var WorkspaceSortField;
(function (WorkspaceSortField) {
    WorkspaceSortField["Label"] = "label";
    WorkspaceSortField["Id"] = "id";
    WorkspaceSortField["AccessStatus"] = "accessStatus";
    WorkspaceSortField["Description"] = "description";
    WorkspaceSortField["WorkspaceType"] = "workspaceType";
    WorkspaceSortField["Created"] = "created";
    WorkspaceSortField["Updated"] = "updated";
    WorkspaceSortField["Viewed"] = "viewed";
    WorkspaceSortField["DefaultRole"] = "defaultRole";
    WorkspaceSortField["IsSample"] = "isSample";
    WorkspaceSortField["NotesCount"] = "notesCount";
    WorkspaceSortField["NotebooksCount"] = "notebooksCount";
})(WorkspaceSortField = exports.WorkspaceSortField || (exports.WorkspaceSortField = {}));
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["InviteOnly"] = "INVITE_ONLY";
    WorkspaceType["Discoverable"] = "DISCOVERABLE";
    WorkspaceType["Open"] = "OPEN";
})(WorkspaceType = exports.WorkspaceType || (exports.WorkspaceType = {}));
//# sourceMappingURL=strict-index.js.map