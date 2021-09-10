"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = void 0;
const conduit_utils_1 = require("conduit-utils");
class ResourceManager {
    constructor(di) {
        this.di = di;
    }
    async getResourceUrl(trc, res) {
        if (!this.di.urlEncoder) {
            return res.remoteUrl;
        }
        const activeUserID = await this.di.getCurrentUserID(trc, null);
        if (activeUserID === null) {
            throw new conduit_utils_1.NoUserError('Missing current user');
        }
        return this.di.urlEncoder(res.parentID, res.hash, res.remoteUrl, conduit_utils_1.keyStringForUserID(activeUserID));
    }
    constructFileRemoteURL(authHost, path) {
        return `${this.di.getFileServiceHost(authHost)}${path}`;
    }
    async getFallbackPath(trc) {
        const fallbackPath = this.di.resourceUploadFailFallbackPath;
        if (fallbackPath) {
            const resp = await conduit_utils_1.withError(this.di.getCurrentUsername(trc));
            if (resp.err || !resp.data) {
                conduit_utils_1.logger.error('ResourceManager getCurrentUsername failed ', resp.err);
                return null;
            }
            return [fallbackPath, resp.data];
        }
        return null;
    }
    async copyResourceToFallbackPath(trc, params) {
        const fallbackPath = await this.getFallbackPath(trc);
        if (fallbackPath) {
            return await this.copyResourceToPath(trc, params, [...fallbackPath, params.destFilename]);
        }
    }
}
exports.ResourceManager = ResourceManager;
//# sourceMappingURL=ResourceManager.js.map