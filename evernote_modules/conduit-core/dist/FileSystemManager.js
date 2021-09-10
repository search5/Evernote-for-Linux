"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemManager = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
class FileSystemManager {
    constructor(di, storagePath) {
        this.di = di;
        this.storagePath = storagePath;
    }
    async getStoragePath(trc) {
        if (!this.storagePath) {
            throw new Error(`Conduit file system storage path is empty ${this.storagePath}`);
        }
        return this.storagePath;
    }
    async getUserStoragePath(trc) {
        const fsPath = await this.getStoragePath(trc);
        const username = await this.di.getCurrentUsername(trc);
        if (!username) {
            throw new conduit_utils_1.NoUserError('username is null');
        }
        return this.joinPath(trc, [fsPath, username]);
    }
    async deletePathForUser(trc) {
        const path = await this.getUserStoragePath(trc);
        await this.deletePathImpl(trc, path);
    }
    emitFatalError(data) {
        conduit_utils_1.logger.error('FSManager: emitting fatal error ', data);
        this.di.emitEvent(conduit_view_types_1.ConduitEvent.FATAL_ERROR, data);
    }
}
exports.FileSystemManager = FileSystemManager;
//# sourceMappingURL=FileSystemManager.js.map