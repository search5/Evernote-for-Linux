"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronResourceManager = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_electron_1 = require("en-conduit-electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const fs_extra_1 = __importDefault(require("fs-extra"));
const hashFile_1 = require("./hashFile");
class ElectronResourceManager extends conduit_core_1.ResourceManager {
    async fetchResource(trc, res, fetchFromService) {
        const url = await this.getResourceUrl(trc, res);
        const { key, encodedCookieStr, resourceFilePath, mimeFilePath, resourceUrl } = en_conduit_electron_1.decodeResourceUrl(url);
        if (fetchFromService || !fs_extra_1.default.existsSync(resourceFilePath) || !fs_extra_1.default.existsSync(mimeFilePath)) {
            // assuming worker in renderer!
            const message = { key, resourceUrl, resourceFilePath, mimeFilePath, encodedCookieStr };
            await electron_1.ipcRenderer.invoke(en_conduit_electron_shared_1.ElectronContentFetchChannel, message);
        }
    }
    async deleteResource(trc, res) {
        const url = await this.getResourceUrl(trc, res);
        const { resourceFilePath, mimeFilePath } = en_conduit_electron_1.decodeResourceUrl(url);
        await fs_extra_1.default.remove(resourceFilePath);
        await fs_extra_1.default.remove(mimeFilePath);
    }
    async getResourceContent(trc, res) {
        const url = await this.getResourceUrl(trc, res);
        const { resourceFilePath } = en_conduit_electron_1.decodeResourceUrl(url);
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs_extra_1.default.existsSync(resourceFilePath)) {
                    reject(new Error(`File does not exist at: ${resourceFilePath}`));
                }
                else {
                    const result = await conduit_utils_1.withError(fs_extra_1.default.readFile(resourceFilePath));
                    if (result.err) {
                        reject(result.err);
                    }
                    else {
                        resolve(result.data);
                    }
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    // get the hash and size of a resource before staging it for upload
    async getFileInfo(trc, filePath, fileData) {
        if (fileData) {
            return {
                hash: conduit_utils_1.md5(fileData),
                size: fileData.length,
            };
        }
        else if (filePath) {
            return {
                hash: await hashFile_1.hashFile(filePath),
                size: (await fs_extra_1.default.stat(filePath)).size,
            };
        }
        else {
            throw new conduit_utils_1.MissingParameterError('Cannot upload a resource without filePath or fileData');
        }
    }
    async copyResource(trc, from, to) {
        const fromUrl = await this.getResourceUrl(trc, from);
        const { resourceFilePath: fromResourceFilePath, mimeFilePath: fromMimeFilePath } = en_conduit_electron_1.decodeResourceUrl(fromUrl);
        const toUrl = await this.getResourceUrl(trc, to);
        const { resourceFilePath: toResourceFilePath, mimeFilePath: toMimeFilePath } = en_conduit_electron_1.decodeResourceUrl(toUrl);
        if (!await fs_extra_1.default.pathExists(fromResourceFilePath)) {
            throw new conduit_utils_1.NotFoundError(from.hash, `Tried to copy a non-existent resource`);
        }
        await fs_extra_1.default.ensureFile(toMimeFilePath);
        await fs_extra_1.default.copyFile(fromMimeFilePath, toMimeFilePath);
        await fs_extra_1.default.ensureFile(toResourceFilePath);
        await fs_extra_1.default.copyFile(fromResourceFilePath, toResourceFilePath);
    }
    // move or save the resource to resourceFilePath and write the mimeType into mimeFilePath
    // returns the encoded url
    async stageResourceForUpload(trc, params) {
        const url = await this.getResourceUrl(trc, params);
        const { resourceFilePath, mimeFilePath } = en_conduit_electron_1.decodeResourceUrl(url);
        const fileData = params.fileData;
        const filePath = params.filePath;
        if (filePath) {
            await fs_extra_1.default.ensureFile(resourceFilePath);
            if (params.takeFileOwnership) {
                try {
                    await fs_extra_1.default.move(filePath, resourceFilePath);
                }
                catch (err) {
                    conduit_utils_1.logger.warn('Failed to move resource file, falling back to copy', err);
                    await fs_extra_1.default.copyFile(filePath, resourceFilePath);
                }
            }
            else {
                await fs_extra_1.default.copyFile(filePath, resourceFilePath);
            }
        }
        else if (fileData) {
            await fs_extra_1.default.ensureFile(resourceFilePath);
            await fs_extra_1.default.writeFile(resourceFilePath, fileData);
        }
        else {
            throw new conduit_utils_1.MissingParameterError('Cannot upload a resource without filePath or fileData');
        }
        await fs_extra_1.default.ensureFile(mimeFilePath);
        await fs_extra_1.default.writeFile(mimeFilePath, params.mimeType, 'utf-8');
        return url;
    }
    async resourceUploadDone(trc, res, isMarkedForOffline) {
        // noop
    }
    async deleteCacheForUser(trc, userID) {
        await en_conduit_electron_1.deleteCacheForUser(userID);
    }
    async downloadUrl(trc, url) {
        const message = { fileUrl: url };
        const response = await electron_1.ipcRenderer.invoke(en_conduit_electron_shared_1.ElectronExternalUrlFetchChannel, message);
        return {
            filePath: response.filePath,
            mimeType: response.mime,
        };
    }
}
__decorate([
    conduit_utils_1.traceAsync
], ElectronResourceManager.prototype, "copyResource", null);
exports.ElectronResourceManager = ElectronResourceManager;
//# sourceMappingURL=WorkerResourceProxy.js.map