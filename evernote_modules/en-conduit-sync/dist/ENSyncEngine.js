"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENSyncEngine = exports.initUserSyncContext = exports.fillSyncContextMetadataToken = exports.sanitizeSyncContextMetadata = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Auth = __importStar(require("./Auth"));
const LinkedNotebookSync_1 = require("./SyncFunctions/LinkedNotebookSync");
const SharedNoteSync_1 = require("./SyncFunctions/SharedNoteSync");
const ENSyncManager_1 = require("./SyncManagement/ENSyncManager");
// hook into GraphStorageDB to remove auth token before persisting.
async function sanitizeSyncContextMetadata(trc, m) {
    if (m.isUser || m.isVaultUser) {
        return SimplyImmutable.updateImmutable(m, ['authToken'], null);
    }
    return m;
}
exports.sanitizeSyncContextMetadata = sanitizeSyncContextMetadata;
// hook into GraphStorageDB to fill auth token to metadata on database read.
async function fillSyncContextMetadataToken(trc, m, getAccountAuthToken) {
    if (m.isUser) {
        const tokenAndState = await getAccountAuthToken(trc, m.userID);
        if (!tokenAndState) {
            return m;
        }
        return SimplyImmutable.updateImmutable(m, ['authToken'], tokenAndState.token);
    }
    if (m.isVaultUser) {
        // vault user token is stored inside auth token of current user. Pass undefined to get current user auth token.
        const tokenAndState = await getAccountAuthToken(trc);
        if (!tokenAndState) {
            return m;
        }
        const token = Auth.decodeAuthData(tokenAndState.token);
        if (!token.vaultAuth) {
            return m;
        }
        return SimplyImmutable.updateImmutable(m, ['authToken'], Auth.encodeAuthData(token.vaultAuth));
    }
    return m;
}
exports.fillSyncContextMetadataToken = fillSyncContextMetadataToken;
async function initUserSyncContext(trc, graphTransaction, syncContext, // I'd like more type safety here, but it gets ugly fast
auth) {
    let metadata = await graphTransaction.getSyncContextMetadata(trc, null, syncContext);
    if (!metadata) {
        metadata = {
            userID: auth ? auth.userID : conduit_utils_1.NullUserID,
            authToken: null,
            isUser: syncContext === conduit_core_1.PERSONAL_USER_CONTEXT,
            isVaultUser: syncContext === conduit_core_1.VAULT_USER_CONTEXT,
            sharedNotebookGlobalID: null,
            sharedNotebookNoteStoreUrl: null,
            turboSyncNoteEditUpdateBuffer: en_thrift_connector_1.TURBO_SYNC_DEFAULTS.NOTE_EDIT_BUFFER,
            turboSyncNoteIdleUpdateBuffer: en_thrift_connector_1.TURBO_SYNC_DEFAULTS.NOTE_IDLE_BUFFER,
            sharedNoteID: null,
        };
    }
    else {
        metadata = SimplyImmutable.updateImmutable(metadata, {
            userID: auth ? auth.userID : conduit_utils_1.NullUserID,
            authToken: null,
        });
    }
    await graphTransaction.createSyncContext(trc, syncContext, metadata);
    return syncContext;
}
exports.initUserSyncContext = initUserSyncContext;
class ENSyncEngine extends conduit_core_1.SyncEngine {
    constructor(di, graphStorage, ephemeralState, thriftComm, localSettings, resourceManager, offlineContentStrategy, clientCredentials) {
        super(graphStorage, ephemeralState);
        this.di = di;
        this.thriftComm = thriftComm;
        this.localSettings = localSettings;
        this.resourceManager = resourceManager;
        this.offlineContentStrategy = offlineContentStrategy;
        this.clientCredentials = clientCredentials;
        this.authStr = null;
        this.auth = null;
        this.userId = conduit_utils_1.NullUserID;
        this.vaultUserId = conduit_utils_1.NullUserID;
        this.businessId = null;
        this.isDestroyed = false;
        this.importRemoteGraphDatabase = async (trc, filename) => {
            await this.graphStorage.importDatabase(trc, filename);
        };
        this.updateUser = async (trc, graphTransaction, user, isVaultUser, auth) => {
            var _a, _b, _c;
            const syncContext = await initUserSyncContext(trc, graphTransaction, isVaultUser ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, auth);
            const params = await en_thrift_connector_1.makeConverterParams({
                trc,
                graphTransaction,
                personalUserId: this.userId,
                vaultUserId: this.vaultUserId,
                localSettings: this.localSettings,
                offlineContentStrategy: this.offlineContentStrategy,
            });
            const userNode = await en_thrift_connector_1.convertUserFromService(trc, params, syncContext, user, isVaultUser);
            if (!isVaultUser) {
                const enLocale = (_a = userNode.NodeFields.Attributes.preferredLanguage) !== null && _a !== void 0 ? _a : undefined;
                // Needs to be mapped to BCP-47
                // https://appmakers.dev/bcp-47-language-codes-list/
                const enLocaleMap = {
                    en_US: 'en-US',
                    en_XA: 'en-XA',
                    in: 'id',
                    pt_BR: 'pt-BR',
                    zh_CN: 'zh-CN',
                    zh_TW: 'zh-TW',
                    zh_CN_yxbj: 'zh-CN',
                };
                const resolvedLocale = enLocale ? enLocaleMap[enLocale] || enLocale : enLocale;
                this.locale = resolvedLocale || await this.di.getSystemLocale();
                const oldLocale = await graphTransaction.getStoredLocale(trc, null);
                (_c = (_b = this.di).didSetLocale) === null || _c === void 0 ? void 0 : _c.call(_b, trc, this.locale);
                if ((!oldLocale && this.locale) || (this.locale && oldLocale !== this.locale)) {
                    // Going through the sync manager so that the loading screen appears
                    await this.syncManager.addReindexingActivity(trc, graphTransaction);
                }
                const userInfo = {
                    userID: conduit_utils_1.keyStringForUserID(userNode.NodeFields.internal_userID),
                    email: userNode.NodeFields.email || '',
                    username: userNode.NodeFields.username || '',
                    fullName: userNode.NodeFields.name || '',
                    photoUrl: userNode.NodeFields.photoUrl,
                    businessName: (user.businessUserInfo && user.businessUserInfo.businessName) || '',
                };
                await this.di.setUserInfo(trc, userInfo);
            }
            if (isVaultUser || !user.businessUserInfo) {
                await en_thrift_connector_1.initAccountLimitsNode(trc, Object.assign(Object.assign({}, params), { thriftComm: this.thriftComm }), syncContext, auth, user.accountLimits || undefined);
            }
        };
        this.createSyncEventStorage = () => {
            const storage = {
                transact: (newTrc, name, func) => {
                    return this.transact(newTrc, name, func);
                },
                getNode: async (newTrc, ref) => {
                    return await this.graphStorage.getNode(newTrc, null, ref, false);
                },
                getEdge: async (newTrc, ref) => {
                    return await this.graphStorage.getEdge(newTrc, null, ref);
                },
                getSyncState: (newTrc, watcher, path) => {
                    return this.graphStorage.getSyncState(newTrc, watcher, path);
                },
                getEphemeralFlag: (newTrc, table, key) => {
                    return this.getEphemeralFlag(newTrc, table, key);
                },
                transactEphemeral: (newTrc, name, func) => {
                    return this.transactEphemeral(newTrc, name, func);
                },
                getUserID: () => {
                    const authInner = this.syncManager.getAuth();
                    if (!authInner) {
                        throw new Error('Missing auth in initted SyncManager');
                    }
                    return authInner.userID;
                },
            };
            return storage;
        };
        this.syncManager = new ENSyncManager_1.ENSyncManager(Object.assign(Object.assign({}, di), { updateUser: this.updateUser, importDatabase: this.importRemoteGraphDatabase, initUserSyncContext }), thriftComm, this);
        this.di.setupSyncEventStorage(this.createSyncEventStorage());
    }
    async destructor(trc) {
        await this.syncManager.destructor(trc);
        this.isDestroyed = true;
    }
    setAuth(authStr) {
        this.authStr = authStr;
        this.auth = authStr ? Auth.decodeAuthData(authStr) : null;
        if (this.auth) {
            const { userID, businessID, serviceLevel, vaultAuth } = this.auth;
            this.userId = userID;
            this.vaultUserId = vaultAuth ? vaultAuth.userID : conduit_utils_1.NullUserID;
            this.businessId = businessID;
            conduit_utils_1.setDimension('userTier', serviceLevel);
            conduit_utils_1.setDimension('authenticatedGlobalUserId', `EN${userID}`);
            conduit_utils_1.setDimension('globalUserId', vaultAuth ? `EN${vaultAuth.userID}` : `EN${userID}`);
        }
        else {
            conduit_utils_1.setDimension('userTier', 0);
            conduit_utils_1.setDimension('authenticatedGlobalUserId', '');
            conduit_utils_1.setDimension('globalUserId', '');
        }
    }
    async fixupAuth(trc, tokenAndState) {
        return await Auth.fixupAuth(trc, this.thriftComm, tokenAndState);
    }
    async initAuth(trc, authStr, startSync = true, updateBeforeStart) {
        if (authStr === this.authStr) {
            conduit_utils_1.logger.info('Auth not change. Resume sync.');
            await this.syncManager.resumeSyncing(trc);
            return;
        }
        this.setAuth(authStr);
        if (authStr && updateBeforeStart) {
            conduit_utils_1.logger.info('SyncEngine: Updating user information for sync');
            this.locale = await this.transact(trc, 'initAuth filling user data', updateBeforeStart);
        }
        // syncing is "paused" if authString is null or it's not startSync
        await this.syncManager.initAuth(trc, this.auth, !authStr || !startSync);
    }
    getPersonalUserID() {
        return this.userId;
    }
    getVaultUserID() {
        return this.vaultUserId;
    }
    getBusinessID() {
        return this.businessId;
    }
    isEventServiceEnabled() {
        return this.syncManager.isEventServiceEnabled();
    }
    onDBClear(trc) {
        return this.syncManager.onDBClear(trc);
    }
    async startSyncing(trc) {
        if (!this.auth) {
            return;
        }
        await this.syncManager.resumeSyncing(trc);
    }
    async stopSyncing(trc) {
        if (!this.auth) {
            return;
        }
        await this.syncManager.pauseSyncing(trc);
    }
    async toggleNSync(trc, disable) {
        await this.syncManager.toggleEventSync(trc, disable);
    }
    async forceDownsyncUpdate(trc, timeout) {
        await this.syncManager.forceDownsyncUpdate(trc, timeout);
    }
    async forceNSyncFlush(trc) {
        return await this.syncManager.forceNSyncFlush(trc);
    }
    async disableSyncing(trc) {
        await this.syncManager.disableSyncing(trc);
    }
    async enableSyncing(trc) {
        await this.syncManager.enableSyncing(trc);
    }
    async needImmediateNotesDownsync(trc, args) {
        return await this.syncManager.needImmediateNotesDownsync(trc, args);
    }
    async immediateNotesDownsync(trc, args) {
        return await this.syncManager.immediateNotesDownsync(trc, args);
    }
    async cancelImmediateNotesDownsync(trc) {
        await this.syncManager.cancelImmediateNotesDownsync(trc);
    }
    async needContentFetchSync(trc) {
        return await this.syncManager.needContentFetchSync(trc);
    }
    async immediateContentFetchSync(trc, args) {
        return await this.syncManager.immediateContentFetchSync(trc, args);
    }
    async immediateDemandFetchNote(trc, args) {
        return await this.syncManager.immediateDemandFetchNote(trc, args);
    }
    async cancelContentFetchSync(trc) {
        return await this.syncManager.cancelContentFetchSync(trc);
    }
    isReadyForMutations() {
        if (!this.auth) {
            return true;
        }
        return this.syncManager.isReadyForMutations();
    }
    async waitUntilReadyForMutations(trc) {
        if (this.auth) {
            return this.syncManager.waitUntilReadyForMutations(trc);
        }
        return false;
    }
    suppressSyncForQuery(name) {
        this.syncManager.suppressSyncForQuery(name);
    }
    async transact(trc, name, func, tx, mutexTimeoutOverride) {
        if (this.isDestroyed) {
            throw new Error('SyncEngine destructed');
        }
        conduit_utils_1.traceEventStart(trc, name);
        if (tx) {
            return await conduit_utils_1.traceEventEndWhenSettled(trc, name, func(tx));
        }
        return await conduit_utils_1.traceEventEndWhenSettled(trc, name, this.graphStorage.transact(trc, name, func, mutexTimeoutOverride));
    }
    async transactEphemeral(trc, name, func, mutexTimeoutOverride) {
        conduit_utils_1.traceEventStart(trc, name);
        return await conduit_utils_1.traceEventEndWhenSettled(trc, name, this.ephemeralState.transact(trc, name, func, mutexTimeoutOverride));
    }
    async getEphemeralFlag(trc, tableName, key) {
        return await this.ephemeralState.getValidatedValue(trc, null, tableName, key, conduit_storage_1.validateIsBoolean);
    }
    async revalidateAuth(trc, err, tx) {
        const allMetadata = await this.graphStorage.getAllSyncContextMetadata(trc, null);
        for (const syncContext in allMetadata) {
            const metadata = allMetadata[syncContext];
            if (metadata.authToken === null) {
                continue;
            }
            const authData = Auth.decodeAuthData(metadata.authToken);
            const tokenHash = conduit_utils_1.hashTokenForAuthError(authData.token);
            if (err.tokenHash === tokenHash) {
                // found matching syncContext
                return await this.revalidateSyncContextAuth(trc, syncContext, metadata, allMetadata, err, tx);
            }
        }
        conduit_utils_1.logger.warn('Unable to revalidate auth token associated to an AuthError');
        return null;
    }
    async revalidateSyncContextAuth(trc, syncContext, metadata, allMetadata, origErr, tx) {
        const res = await conduit_utils_1.withError(Auth.revalidateSyncContextAuth(trc, this.thriftComm, syncContext, metadata, allMetadata, origErr));
        if (!res.err) {
            return res.data;
        }
        if (res.err instanceof Auth.RefreshUserTokenError) {
            const napTokenRefreshResult = await conduit_utils_1.withError(this.refreshUserToken(trc, metadata, res.err.tokenRefreshSource));
            if (napTokenRefreshResult.err) {
                throw napTokenRefreshResult.err;
            }
            return napTokenRefreshResult.data;
        }
        if (res.err instanceof Auth.RevalidateShareError && res.err.type === en_core_entity_types_1.CoreEntityTypes.Notebook) {
            if (await this.refreshSharedNotebookAuth(trc, res.err.shareGuid, syncContext, tx)) {
                // SharedNotebook access is still valid, just needed to refresh the auth token
                throw new conduit_utils_1.RetryError('reauthenticated to SharedNotebook', 0, conduit_utils_1.RetryErrorReason.AUTH_UPDATED);
            }
            // lost access to SharedNotebook
            throw new conduit_utils_1.NoAccessError(res.err.shareGuid, 'lost access to shared notebook');
        }
        if (res.err instanceof Auth.RevalidateShareError && res.err.type === en_core_entity_types_1.CoreEntityTypes.Note) {
            if (await this.refreshSharedNoteAuth(trc, res.err.shareGuid, tx)) {
                throw new conduit_utils_1.RetryError('reauthenticated to SharedNote', 0, conduit_utils_1.RetryErrorReason.AUTH_UPDATED);
            }
            // lost access to note
            throw new conduit_utils_1.NoAccessError(res.err.shareGuid, 'lost access to shared note');
        }
        throw res.err;
    }
    async refreshSharedNotebookAuth(trc, shareGuid, syncContext, tx) {
        const syncStatePath = ['sharing', 'sharedNotebooks', shareGuid];
        const shareState = await this.graphStorage.getSyncState(trc, null, syncStatePath);
        if (!shareState) {
            return false;
        }
        return await this.transact(trc, 'refreshSharedNotebookAuth', async (graphTransaction) => {
            if (!this.auth) {
                return false;
            }
            // try authenticating again, in case the token just expired
            const sharedNotebook = await en_thrift_connector_1.authenticateToSharedNotebook(trc, this.thriftComm, this.auth, shareGuid, shareState.noteStoreUrl);
            if (sharedNotebook) {
                // authentication succeeded, update stored auth token
                await graphTransaction.updateSyncState(trc, syncStatePath, {
                    notebookGuid: en_thrift_connector_1.convertGuidFromService(sharedNotebook.notebookGuid, en_core_entity_types_1.CoreEntityTypes.Notebook),
                    authStr: sharedNotebook.authStr,
                });
                conduit_utils_1.logger.info('refreshSharedNotebookAuth: auth refreshed for notebook ', sharedNotebook.notebookGuid);
                return true;
            }
            // notebook permissions revoked, cleanup share state and associated LinkedNotebooks
            conduit_utils_1.logger.info('refreshSharedNotebookAuth: Lost access to shared notebook ', shareGuid);
            await graphTransaction.deleteSyncState(trc, syncStatePath);
            shareState.linkedNotebook.guid && await LinkedNotebookSync_1.deleteLinkedNotebookContext(trc, graphTransaction, shareState.linkedNotebook.guid);
            await graphTransaction.deleteNode(trc, conduit_core_1.PERSONAL_USER_CONTEXT, { id: en_thrift_connector_1.convertGuidFromService(shareState.guid, en_core_entity_types_1.CoreEntityTypes.Invitation), type: en_core_entity_types_1.CoreEntityTypes.Invitation });
            await en_thrift_connector_1.expungeLinkedNotebooksOnService(trc, graphTransaction, this.thriftComm, this.auth, shareState.guid);
            return false;
        }, tx);
    }
    async refreshSharedNoteAuth(trc, noteGuid, tx) {
        const syncStatePath = ['sharing', 'sharedNotes', noteGuid];
        const shareState = await this.graphStorage.getSyncState(trc, null, syncStatePath);
        if (!shareState) {
            return false;
        }
        return await this.transact(trc, 'refreshSharedNoteAuth', async (graphTransaction) => {
            if (!this.auth) {
                return false;
            }
            const sharedNoteAuth = await en_thrift_connector_1.authenticateToNote(trc, this.thriftComm, this.auth, noteGuid, shareState.noteStoreUrl, shareState.shardId);
            if (sharedNoteAuth) {
                await graphTransaction.updateSyncState(trc, syncStatePath, {
                    noteGuid,
                    noteStoreUrl: shareState.noteStoreUrl,
                    shardID: shareState.shardId,
                    authStr: sharedNoteAuth.authStr,
                });
                conduit_utils_1.logger.info('refreshSharedNoteAuth: Auth refreshed for shared note ', noteGuid);
                return true;
            }
            // permission revoked, cleanup share state
            conduit_utils_1.logger.info('refreshSharedNoteAuth: Lost access to note ', noteGuid);
            await graphTransaction.deleteSyncState(trc, syncStatePath);
            await SharedNoteSync_1.deleteSharedNoteContext(trc, graphTransaction, noteGuid);
            return false;
        }, tx);
    }
    async refreshUserToken(trc, metadata, tokenRefreshSource) {
        if (!metadata.authToken) {
            return null;
        }
        const oldAuthData = Auth.decodeAuthData(metadata.authToken);
        if (tokenRefreshSource === Auth.TokenRefreshSource.NAP) {
            if (!this.di.getHttpTransport) {
                return null;
            }
            if (!this.clientCredentials) {
                return null; // there is no way to register session without client credentials
            }
            const authTokenAndState = await this.di.refreshAuthToken(trc, oldAuthData);
            const authData = authTokenAndState.token && Auth.decodeAuthData(authTokenAndState.token);
            if (authTokenAndState.state === conduit_view_types_1.AuthState.Authorized && authData && Auth.hasNAPData(authData)) { // authData could be null if the token is revoked
                const utility = this.thriftComm.getUtilityStore(authData.urls.utilityUrl);
                await Auth.registerSession(trc, utility, authData.token, authData.napAuthInfo.clientID, authData.napAuthInfo.refreshToken, this.clientCredentials);
            }
            return authTokenAndState;
        }
        return Auth.refreshJWTFromMonolith(trc, oldAuthData, this.thriftComm);
    }
    async configureIndexes(trc, setProgress) {
        return await this.graphStorage.configureIndexes(trc, this.locale, setProgress);
    }
    getClientCredentials() {
        var _a;
        return (_a = this.clientCredentials) !== null && _a !== void 0 ? _a : null;
    }
    getResourceManager() {
        return this.resourceManager;
    }
    isBackgroundNoteSyncFinished(trc) {
        return this.syncManager.isBackgroundNoteSyncFinished(trc);
    }
}
exports.ENSyncEngine = ENSyncEngine;
//# sourceMappingURL=ENSyncEngine.js.map