"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploader = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const gTracePool = new conduit_utils_1.AsyncTracePool('FileUploader');
const CHUNK_SIZE = 100 * 1024;
const defaultMime = 'application/octet-stream';
function lastUrlSegment(url) {
    // Get the last path:
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment.split('?')[0];
}
function concatChunks(chunks, size) {
    if (!chunks.length) {
        throw new Error('no data to upload');
    }
    if (typeof chunks[0] === 'string') {
        return chunks.join('');
    }
    const res = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
        res.set(c, offset);
        offset += c.length;
    }
    return res;
}
function getDataInfo(data) {
    if (!data) {
        throw new conduit_utils_1.MissingParameterError('This platform only supports uploading file data, not a file by filename');
    }
    return {
        hash: conduit_utils_1.md5(data),
        size: data.length,
    };
}
class FileUploader {
    constructor(di, graphDB, resourceManager, stagedBlobManager) {
        this.di = di;
        this.graphDB = graphDB;
        this.resourceManager = resourceManager;
        this.stagedBlobManager = stagedBlobManager;
        this.pendingUpdates = {};
    }
    async startUpload(params) {
        const state = Object.assign(Object.assign({ trc: gTracePool.alloc(this.di.getTestEventTracker()), uploadID: this.di.uuid('FileUploader') }, params), { maxChunkSize: CHUNK_SIZE, chunks: [], totalSize: 0, applicationData: params.applicationData });
        const node = await this.graphDB.getNodeWithoutGraphQLContext(state.trc, { id: params.parentID, type: params.parentType });
        if (!node) {
            throw new conduit_utils_1.NotFoundError(params.parentID, 'parent node not found');
        }
        this.pendingUpdates[state.uploadID] = state;
        return {
            uploadID: state.uploadID,
            maxChunkSize: state.maxChunkSize,
        };
    }
    async uploadChunk(chunk, upload) {
        const state = this.pendingUpdates[upload.uploadID];
        if (!state) {
            // either a client bug or the Conduit worker restarted
            throw new conduit_utils_1.InternalError('Upload interrupted');
        }
        state.chunks.push(chunk);
        state.totalSize += chunk.length;
    }
    async cancelUpload(upload) {
        const state = this.pendingUpdates[upload.uploadID];
        if (!state) {
            // either a client bug or the Conduit worker restarted
            conduit_utils_1.logger.warn('No pending update found for cancel:', upload.uploadID);
            return;
        }
        delete this.pendingUpdates[upload.uploadID];
        gTracePool.release(state.trc);
    }
    async finishUpload(upload) {
        const state = this.pendingUpdates[upload.uploadID];
        if (!state) {
            // either a client bug or the Conduit worker restarted
            throw new conduit_utils_1.InternalError('Upload interrupted');
        }
        delete this.pendingUpdates[upload.uploadID];
        return await gTracePool.releaseWhenSettled(state.trc, this.doFileUpload(state.trc, Object.assign(Object.assign({}, state), { data: concatChunks(state.chunks, state.totalSize) })));
    }
    async getHashAndSize(trc, params) {
        return this.resourceManager ?
            await this.resourceManager.getFileInfo(trc, params.path, params.data) :
            getDataInfo(params.data);
    }
    async stringToArrayBuffer(str) {
        const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
    // handle externalUrl and fill in default filename if not present
    async handleExternalUrl(trc, params) {
        if (params.url) {
            if (!this.resourceManager && !this.di.getHttpTransport) {
                throw new conduit_utils_1.InvalidOperationError('Resource Manager or Http Transport required for external resource upload');
            }
            if (this.resourceManager) {
                const externalResource = await this.resourceManager.downloadUrl(trc, params.url);
                params = Object.assign(Object.assign({}, params), { path: externalResource.filePath, mime: params.mime || externalResource.mimeType || defaultMime, filename: params.filename || lastUrlSegment(params.url) });
            }
            else if (this.di.getHttpTransport) {
                const response = await this.di.getHttpTransport().request(trc, { method: 'GET', url: params.url });
                const resultAsArray = await this.stringToArrayBuffer(response.result ? response.result : '');
                params = Object.assign(Object.assign({}, params), { data: new Uint8Array(resultAsArray), mime: params.mime || response.contentType || defaultMime, filename: params.filename || lastUrlSegment(params.url) });
            }
        }
        return params;
    }
    fixupFilename(params, hash) {
        if (!params.filename) {
            params.filename = hash || Date.now().toString();
        }
    }
    async stageFileUpload(trc, params, userID, syncContext, hash, size, takeFileOwnership) {
        params = await this.handleExternalUrl(trc, params);
        this.fixupFilename(params, hash);
        const override = this.di.getFileUploaderOverride(params.parentType);
        if (override) {
            return await override.stageFileUpload(trc, this.stagedBlobManager, params, userID, syncContext, hash, size, takeFileOwnership);
        }
        throw new Error(`stageFileUpload not yet supported for parentType ${params.parentType}`);
    }
    async doFileUpload(trc, params) {
        const node = await this.graphDB.getNodeWithoutGraphQLContext(trc, { id: params.parentID, type: params.parentType });
        if (!node) {
            throw new conduit_utils_1.NotFoundError(params.parentID, 'Node not found');
        }
        params = await this.handleExternalUrl(trc, params);
        const { hash, size } = await this.getHashAndSize(trc, params);
        this.fixupFilename(params, hash);
        const override = this.di.getFileUploaderOverride(params.parentType);
        if (override) {
            return await override.doFileUpload(trc, this.graphDB, this.stagedBlobManager, params, hash, size);
        }
        const stagedBlobID = await this.stagedBlobManager.allocStagedBlobID(trc, params.parentType);
        try {
            const blobRef = params.blobRef;
            if (!blobRef) {
                throw new conduit_utils_1.MissingParameterError(`blobRef is a required field for file uploads to the file service (parentType=${params.parentType})`);
            }
            const blobDef = this.di.getFileUploaderBlobDef(params.parentType, blobRef);
            if (!blobDef) {
                throw new conduit_utils_1.NotFoundError(`${params.parentType}.${blobRef}`, 'No blob upload definition found for the requested parentType and blobRef');
            }
            const res = await this.graphDB.runMutator(trc, 'uploadFileInternal', {
                parentType: node.type,
                parentID: node.id,
                blobRef,
                mime: params.mime,
                hash,
                size,
                stagedBlobID,
                fileLocation: params.filename,
                blobDef,
            });
            await this.stagedBlobManager.stageBlobForUpload(trc, stagedBlobID, {
                parentType: node.type,
                parentID: node.id,
                hash,
                remoteUrl: res.results.result,
                mimeType: params.mime,
                fileData: params.data,
                filePath: params.path,
                owner: node.owner,
                takeFileOwnership: Boolean(params.url),
            });
            return {
                uploadedHash: hash,
                uploadedUrl: res.results.result || undefined,
                uploadTracker: res.mutationID,
            };
        }
        catch (err) {
            err = await this.stagedBlobManager.handleResourceUploadError(trc, stagedBlobID, params, err);
            throw err;
        }
    }
    async uploadFile(upload) {
        var _a;
        const trc = gTracePool.alloc(this.di.getTestEventTracker());
        let filename = '';
        if (conduit_view_types_1.isLocalUpload(upload)) {
            filename = (_a = upload.filename) !== null && _a !== void 0 ? _a : conduit_utils_1.basename(upload.path);
        }
        return await gTracePool.releaseWhenSettled(trc, this.doFileUpload(trc, Object.assign(Object.assign({}, upload), { filename, mime: conduit_view_types_1.isLocalUpload(upload) ? upload.mime : '' })));
    }
}
exports.FileUploader = FileUploader;
//# sourceMappingURL=FileUploader.js.map