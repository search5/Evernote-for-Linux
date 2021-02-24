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
exports.MultiUserManager = exports.getDBName = void 0;
const conduit_storage_1 = require("conduit-storage");
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const MULTI_USER_DB_NAME = '_ConduitMultiUserDB';
const MULTI_USER_TABLE = 'MultiUsers';
const CURRENT_USER_TABLE = 'CurrentUser';
const AUTH_TABLE = 'Auth';
const CURRENT_USER_KEY = 'CURRENT_USER_KEY';
function validateIsAuthTokenAndState(val) {
    const obj = conduit_storage_1.validateIsObject(val);
    if (obj && obj.token !== undefined && obj.state && obj.userID) {
        return obj;
    }
    return null;
}
function getPrefix(userID) {
    return `UDB-${conduit_utils_1.keyStringForUserID(userID)}`;
}
function getDBName(userID, name) {
    const unsafeName = getPrefix(userID) + '+' + name;
    // the returned value can be used as filename on various platforms, hence restricting db name to the smallest set of legal characters.
    return unsafeName.replace(/[^\w\-+_]+/gi, '');
}
exports.getDBName = getDBName;
class MultiUserManager {
    constructor(di) {
        this.di = di;
        this.currentUserID = null;
        this.mutex = new conduit_utils_1.Mutex('MultiUserManager');
    }
    async destructor() {
        if (this.multiUserStore) {
            await this.multiUserStore.destructor();
            this.multiUserStore = undefined;
        }
        if (this.cache) {
            await this.cache.destructor();
            this.cache = undefined;
        }
        await this.mutex.destructor();
    }
    async init(trc, noSetActiveAccount = false) {
        this.multiUserStore = await this.di.KeyValStorage(trc, MULTI_USER_DB_NAME);
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('Error initting the key value store');
        }
        this.multiUserStore.addChangeHandler(this.di.WatchTree);
        this.secureStorage = this.di.SecureStorage && this.di.SecureStorage();
        this.cache = await this.di.KeyValStorageMem(trc, 'MultiUserManagerCache');
        this.cache.addChangeHandler(this.di.WatchTree);
        if (noSetActiveAccount) {
            return;
        }
        const currentUserAndPrefix = await this.multiUserStore.getValue(trc, null, CURRENT_USER_TABLE, CURRENT_USER_KEY);
        if (currentUserAndPrefix) {
            try {
                const userID = currentUserAndPrefix.userID ? conduit_utils_1.userIDForKeyString(currentUserAndPrefix.userID) : null;
                await this.setCurrentUser(trc, userID);
            }
            catch (e) {
                await this.setCurrentUser(trc, null);
                conduit_utils_1.logger.warn(`Unable to restore user ${currentUserAndPrefix.userID}. Reset current user to no one. `, e);
            }
        }
    }
    getFullDBName(name) {
        if (!this.currentUserID) {
            throw new conduit_utils_1.InternalError('Asking for full db name without a signed in user');
        }
        return getDBName(this.currentUserID, name);
    }
    async getCurrentUserID(trc, watcher) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('Asking for userID before init');
        }
        const res = await this.multiUserStore.getValue(trc, watcher, CURRENT_USER_TABLE, CURRENT_USER_KEY);
        return (res && res.userID) ? conduit_utils_1.userIDForKeyString(res.userID) : null;
    }
    async setUserInfo(trc, info) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        // update user information
        const prefix = getPrefix(conduit_utils_1.userIDForKeyString(info.userID));
        const newMultiUser = Object.assign(Object.assign({}, info), { prefix });
        delete newMultiUser.userID;
        await this.multiUserStore.transact(trc, 'MUM.setUserInfo', async (db) => {
            await db.setValue(trc, MULTI_USER_TABLE, info.userID, newMultiUser);
        });
    }
    setCurrentUserID(userID) {
        if (this.currentUserID !== userID) {
            this.currentUserID = userID;
            return true;
        }
        return false;
    }
    async setCurrentUser(trc, userID, logout, extra) {
        return await this.mutex.runInMutex(trc, 'MUM.setCurrentUser', async () => {
            return await this.setCurrentUserInternal(trc, userID, logout, extra);
        });
    }
    async getUsers(trc, watcher) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const keyStringUserIDs = await this.multiUserStore.getKeys(trc, watcher, MULTI_USER_TABLE);
        if (!keyStringUserIDs) {
            throw new conduit_utils_1.InternalError('Missing multi user table');
        }
        const userList = {};
        // feel a little dirty dumping/recreating a table this way, but it should be small.
        for (const keyStringUserID of keyStringUserIDs) {
            const userInfo = await this.multiUserStore.getValue(trc, watcher, MULTI_USER_TABLE, keyStringUserID);
            if (!userInfo) {
                throw new conduit_utils_1.InternalError('Found empty entry in multi user table');
            }
            userList[keyStringUserID] = userInfo;
        }
        return userList;
    }
    async hasUser(trc, userID) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const userInfo = await this.multiUserStore.getValue(trc, null, MULTI_USER_TABLE, conduit_utils_1.keyStringForUserID(userID));
        return Boolean(userInfo);
    }
    // not passing userID will get auth and state of the currently activated user.
    async getAuthTokenAndState(trc, watcher, userID) {
        var _a;
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const currUserID = await this.getCurrentUserID(trc, null);
        userID = userID !== null && userID !== void 0 ? userID : (currUserID || undefined);
        if (!userID) {
            return null;
        }
        const tempTokenAndState = await this.getCachedAuthTokenAndState(trc, watcher, userID);
        if (tempTokenAndState) {
            return tempTokenAndState;
        }
        const authData = await this.multiUserStore.getValue(trc, watcher, AUTH_TABLE, conduit_utils_1.keyStringForUserID(userID));
        let token;
        const state = (authData === null || authData === void 0 ? void 0 : authData.state) || conduit_view_types_1.AuthState.NoAuth;
        const tokenKey = conduit_storage_1.getSecureStorageKey(conduit_utils_1.keyStringForUserID(userID));
        if (this.secureStorage) {
            token = await this.secureStorage.getString(trc, tokenKey);
        }
        else {
            token = (_a = authData === null || authData === void 0 ? void 0 : authData.token) !== null && _a !== void 0 ? _a : null;
        }
        const ret = {
            userID,
            token,
            state,
        };
        await this.setCachedAuthTokenAndState(trc, ret);
        return ret;
    }
    async getAllAuthTokenAndStates(trc, watcher) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const userIDs = (await this.multiUserStore.getKeys(trc, null, MULTI_USER_TABLE)).map(e => conduit_utils_1.userIDForKeyString(e));
        const ret = [];
        for (const userID of userIDs) {
            const auth = await this.getAuthTokenAndState(trc, watcher, userID);
            if (auth) {
                ret.push(auth);
            }
        }
        return ret;
    }
    async setAuthTokenAndState(trc, argAuth) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const auth = Object.assign({}, argAuth);
        if (!auth.token && auth.state === conduit_view_types_1.AuthState.Authorized) {
            auth.state = conduit_view_types_1.AuthState.NoAuth;
        }
        const userID = argAuth.userID;
        const keyStringUserID = conduit_utils_1.keyStringForUserID(userID);
        const tokenKey = conduit_storage_1.getSecureStorageKey(keyStringUserID);
        await this.multiUserStore.transact(trc, 'MUM.setAuthTokenAndState', async (db) => {
            let prevAuthData = await db.getValue(trc, null, AUTH_TABLE, keyStringUserID);
            if (!prevAuthData) {
                prevAuthData = {
                    userID,
                    cookieAuth: false,
                    isBusinessAccount: false,
                    state: conduit_view_types_1.AuthState.NoAuth,
                    token: null,
                };
            }
            if (prevAuthData.state !== auth.state) {
                conduit_utils_1.logger.info('AuthState changed', { from: prevAuthData.state, to: auth.state });
            }
            // set state
            let newAuthData = SimplyImmutable.updateImmutable(prevAuthData, ['state'], auth.state);
            // set token
            if (!this.secureStorage) {
                newAuthData = SimplyImmutable.updateImmutable(newAuthData, ['token'], auth.token);
            }
            if (auth.hasOwnProperty('isBusinessAccount')) {
                newAuthData = SimplyImmutable.updateImmutable(newAuthData, ['isBusinessAccount'], auth.isBusinessAccount);
            }
            if (auth.hasOwnProperty('cookieAuth')) {
                newAuthData = SimplyImmutable.updateImmutable(newAuthData, ['cookieAuth'], Boolean(auth.cookieAuth));
            }
            // cache token and state in memory
            await this.setCachedAuthTokenAndState(trc, { userID, token: auth.token, state: auth.state });
            if (prevAuthData !== newAuthData) {
                await db.setValue(trc, AUTH_TABLE, keyStringUserID, newAuthData);
            }
        });
        if (auth.token !== undefined) {
            this.persistAuthTokenSecurely(trc, tokenKey, auth.token);
        }
    }
    async clearAuth(trc, userID) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('Unable to clear auth. Multi user store not initialized');
        }
        await this.multiUserStore.transact(trc, 'MultiUserManager.clearAuth', async (db) => {
            await this.clearAuthInternal(trc, userID, db, false);
        });
    }
    async clearAuthInternal(trc, userID, db, invalidateToken) {
        const keyStringUserID = conduit_utils_1.keyStringForUserID(userID);
        const prevAuthData = await db.getValue(trc, null, AUTH_TABLE, keyStringUserID);
        if (!prevAuthData) {
            // no auth found. No need to clear.
            return;
        }
        const oldState = prevAuthData.state;
        const newState = conduit_view_types_1.AuthState.NoAuth;
        if (oldState !== newState) {
            conduit_utils_1.logger.info('AuthState changed', { from: oldState, to: newState });
        }
        if (invalidateToken) {
            const tokenAndState = await this.getAuthTokenAndState(trc, null, userID);
            conduit_utils_1.logger.debug(`invalidate auth token of ${userID} (${tokenAndState === null || tokenAndState === void 0 ? void 0 : tokenAndState.state})`);
            tokenAndState && this.di.invalidateAuthToken(trc, tokenAndState).catch(e => {
                // ignore failure to invalidate auth token. We must remove it from our databases.
                conduit_utils_1.logger.warn('Unable to invalidate auth token: ', e);
            });
        }
        const tokenKey = conduit_storage_1.getSecureStorageKey(keyStringUserID);
        this.persistAuthTokenSecurely(trc, tokenKey, null);
        await db.setValue(trc, AUTH_TABLE, keyStringUserID, {
            cookieAuth: false,
            isBusinessAccount: false,
            state: newState,
            token: null,
        });
        await this.removeCachedAuthTokenAndState(trc, userID);
    }
    async removeAllUsers(trc, userIDs, keepData) {
        if (!userIDs.length) {
            return;
        }
        if (this.currentUserID && userIDs.includes(this.currentUserID)) {
            throw new Error('Remove current user is forbidden.');
        }
        await this.mutex.runInMutex(trc, 'MUM remove user entries', async () => {
            if (!this.multiUserStore) {
                throw new conduit_utils_1.InternalError('multi user store not initialized');
            }
            // wipe targeted users in MULTI_USER_TABLE out first to prevent them from being chosen as current user.
            await this.multiUserStore.transact(trc, 'MUM.removeAllUser', async (db) => {
                for (const userID of userIDs) {
                    await db.removeValue(trc, MULTI_USER_TABLE, conduit_utils_1.keyStringForUserID(userID));
                }
            });
            await this.multiUserStore.transact(trc, 'MUM.removeAllUser.clearAuth', async (db) => {
                for (const userID of userIDs) {
                    await this.clearAuthInternal(trc, userID, db, true);
                }
            });
            if (!keepData) {
                await this.di.onUsersRemoved(trc, userIDs);
            }
        });
    }
    async isBusinessAccount(trc) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('Unable to check business. Multi user store not initialized');
        }
        const userID = await this.getCurrentUserID(trc, null);
        if (!userID) {
            throw new Error('Unable to check business of no user');
        }
        const authData = await this.multiUserStore.getValue(trc, null, AUTH_TABLE, conduit_utils_1.keyStringForUserID(userID));
        if (!authData) {
            throw new Error('Unable to find auth data of user.');
        }
        return authData.isBusinessAccount;
    }
    async cookieAuth(trc) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('Unable to check cookie auth. Multi user store not initialized');
        }
        const userID = await this.getCurrentUserID(trc, null);
        if (!userID) {
            throw new Error('Unable to check cookie auth of no user');
        }
        const authData = await this.multiUserStore.getValue(trc, null, AUTH_TABLE, conduit_utils_1.keyStringForUserID(userID));
        if (!authData) {
            throw new Error('Unable to find auth data of user.');
        }
        return authData.cookieAuth;
    }
    persistAuthTokenSecurely(trc, tokenKey, token) {
        // Write token into secure storage last, no await because the storage can take infinite time to process the write.
        // Keytar/keychain access on mac is such storage sometimes.
        // auth tokens are read from the cache and only from secureStorage if the cache does not have them.
        if (this.secureStorage) {
            const calledAt = Date.now();
            this.secureStorage.replaceString(trc, tokenKey, token)
                .then(() => {
                const duration = Date.now() - calledAt;
                if (duration >= 30000) {
                    conduit_utils_1.logger.error('SecureStorage write takes too long to finish');
                }
                else {
                    conduit_utils_1.logger.debug(`SecureStorage write takes ${duration} ms to finish`);
                }
            })
                .catch(e => {
                conduit_utils_1.logger.error('SecureStorage fails to write: ', e);
            });
        }
    }
    async setCurrentUserInternal(trc, unsafeID, logout, extra) {
        if (!this.multiUserStore) {
            throw new conduit_utils_1.InternalError('multi user store not initialized');
        }
        const currentUserID = await this.getCurrentUserID(trc, null) || null;
        if (unsafeID === currentUserID) {
            if (unsafeID === this.currentUserID) {
                return false;
            }
            // Occurs on first start. MUM's in-memory state has different user ID (null) than database does.
            const safeID = unsafeID !== null ? await this.assertValidUserAuthToken(trc, unsafeID) : null;
            this.setCurrentUserID(safeID);
            await this.di.onCurrentUserSet(trc, safeID, extra);
            return true;
        }
        // Change current to no user.
        // Handles logout.
        if (unsafeID === null) {
            await this.multiUserStore.transact(trc, 'MUM.setCurrentUser', async (db) => {
                await db.setValue(trc, CURRENT_USER_TABLE, CURRENT_USER_KEY, {
                    userID: null,
                    prefix: null,
                });
                if (logout && currentUserID) {
                    await db.removeValue(trc, MULTI_USER_TABLE, conduit_utils_1.keyStringForUserID(currentUserID));
                }
            });
            if (logout && currentUserID) {
                await this.removeCachedAuthTokenAndState(trc, currentUserID);
            }
            this.setCurrentUserID(null);
            await this.di.onCurrentUserSet(trc, unsafeID, extra);
            return true;
        }
        // we have a userID, so get the user
        const id = await this.assertValidUserAuthToken(trc, unsafeID);
        const multiUser = await this.multiUserStore.getValue(trc, null, MULTI_USER_TABLE, conduit_utils_1.keyStringForUserID(id));
        const prefixInDB = multiUser && multiUser.prefix;
        // new start (so we have no stored user nor prefix)
        // Handles new login
        if (!prefixInDB) {
            const newPrefix = getPrefix(id);
            await this.multiUserStore.transact(trc, 'MUM.setCurrentUser', async (db) => {
                // a setUserInfo will fill these later
                const newMultiUser = {
                    email: '',
                    fullName: '',
                    username: '',
                    businessName: '',
                    photoUrl: '',
                    prefix: newPrefix,
                };
                const keyStringUserID = conduit_utils_1.keyStringForUserID(id);
                await db.setValue(trc, MULTI_USER_TABLE, keyStringUserID, newMultiUser);
                await db.setValue(trc, CURRENT_USER_TABLE, CURRENT_USER_KEY, {
                    userID: keyStringUserID,
                    prefix: newPrefix,
                });
            });
            this.setCurrentUserID(id);
            await this.di.onCurrentUserSet(trc, id, extra);
            return true;
            // user already in DB. just set current user to that user
            // Handles switch
        }
        else {
            await this.multiUserStore.transact(trc, 'MUM.setCurrentUser', async (db) => {
                const keyStringUserID = conduit_utils_1.keyStringForUserID(id);
                await db.setValue(trc, CURRENT_USER_TABLE, CURRENT_USER_KEY, {
                    userID: keyStringUserID,
                    prefix: prefixInDB,
                });
                // switching user on logout. Need to remove current user from the user db.
                if (currentUserID && logout) {
                    await db.removeValue(trc, MULTI_USER_TABLE, conduit_utils_1.keyStringForUserID(currentUserID));
                }
            });
            this.setCurrentUserID(id);
            await this.di.onCurrentUserSet(trc, id, extra);
            return true;
        }
    }
    async assertValidUserAuthToken(trc, id) {
        const authToken = await this.getAuthTokenAndState(trc, null, id);
        if (!authToken || !authToken.token) {
            // Stop any attempt to set a user current without auth token.
            throw new Error('Unable to switch account without its auth data');
        }
        return id;
    }
    async getCachedAuthTokenAndState(trc, watcher, userID) {
        if (!this.cache) {
            throw new conduit_utils_1.InternalError('not initialized');
        }
        return await this.cache.getValidatedValue(trc, watcher, AUTH_TABLE, conduit_utils_1.keyStringForUserID(userID), validateIsAuthTokenAndState);
    }
    async setCachedAuthTokenAndState(trc, state) {
        if (!this.cache) {
            throw new conduit_utils_1.InternalError('not initialized');
        }
        await this.cache.transact(trc, 'MUM.setCachedAuthTokenAndState', async (db) => {
            await db.setValue(trc, AUTH_TABLE, conduit_utils_1.keyStringForUserID(state.userID), state);
        });
    }
    async removeCachedAuthTokenAndState(trc, userID) {
        if (!this.cache) {
            throw new conduit_utils_1.InternalError('not initialized');
        }
        const keyStringUserID = conduit_utils_1.keyStringForUserID(userID);
        await this.cache.transact(trc, 'MUM.removeCachedAuthTokenAndState', async (db) => {
            await db.setValue(trc, AUTH_TABLE, keyStringUserID, {
                userID,
                token: null,
                state: conduit_view_types_1.AuthState.NoAuth,
            });
        });
    }
}
exports.MultiUserManager = MultiUserManager;
//# sourceMappingURL=MultiUserManager.js.map