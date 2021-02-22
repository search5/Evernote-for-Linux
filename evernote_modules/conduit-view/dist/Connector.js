"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.setConduitLogLevel = exports.removeConduitEventHandler = exports.addConduitEventHandler = exports.waitForAttachmentUpload = exports.uploadFile = exports.uploadData = exports.connector = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Query_1 = require("./Query");
const ViewTracing_1 = require("./ViewTracing");
class ViewConnector {
    constructor() {
        // NOTE: this function will never throw an exception
        this.query = async (query, vars, watcher) => {
            try {
                let queryToSend = query;
                await this.conduitInitialized;
                if (typeof query === 'object') {
                    if (query.cacheID) {
                        queryToSend = query.cacheID;
                    }
                }
                const res = await this.conduit.getData(queryToSend, vars, watcher);
                if (typeof query === 'object' && res.cacheID) {
                    query.cacheID = res.cacheID;
                }
                return res;
            }
            catch (err) {
                if (err instanceof conduit_utils_1.CachedQueryError) {
                    if (typeof query === 'object') {
                        query.cacheID = null;
                        return this.query(query, vars, watcher);
                    }
                }
                if (err instanceof conduit_utils_1.MultiError) {
                    return { error: err };
                }
                return { error: new conduit_utils_1.MultiError([err]) };
            }
        };
        this.setSubscriptionActive = async (watcherGuid, active) => {
            await this.conduitInitialized;
            return this.conduit.setSubscriptionActive(watcherGuid, active);
        };
        this.unSubscribe = async (watcherGuid) => {
            await this.conduitInitialized;
            return this.conduit.unSubscribe(watcherGuid);
        };
        this.pauseSubscriptions = async () => {
            return ViewTracing_1.traceUserEvent('pauseSubscriptions', {}, async () => {
                await this.conduitInitialized;
                return this.conduit.pauseSubscriptions(true);
            });
        };
        this.resumeSubscriptions = async () => {
            return ViewTracing_1.traceUserEvent('resumeSubscriptions', {}, async () => {
                await this.conduitInitialized;
                return this.conduit.pauseSubscriptions(false);
            });
        };
        this.conduitInitialized = new Promise(resolve => this.resolveConduitInitialized = resolve);
    }
    init(conduit, noFreezeImmutable) {
        if (this.conduit) {
            throw new Error('Conduit-View already has a defined conduit');
        }
        if (noFreezeImmutable) {
            SimplyImmutable.freezeImmutableStructures(false);
        }
        this.conduit = conduit;
        this.resolveConduitInitialized();
    }
    deinit() {
        this.conduit = undefined;
        this.conduitInitialized = new Promise(resolve => this.resolveConduitInitialized = resolve);
    }
    async startUpload(params) {
        await this.conduitInitialized;
        return this.conduit.startUpload(params);
    }
    async uploadChunk(chunk, context) {
        await this.conduitInitialized;
        return this.conduit.uploadChunk(chunk, context);
    }
    async finishUpload(context) {
        await this.conduitInitialized;
        return this.conduit.finishUpload(context);
    }
    async cancelUpload(context) {
        await this.conduitInitialized;
        return this.conduit.cancelUpload(context);
    }
    async uploadFile(params) {
        let path = '';
        if (conduit_view_types_1.isLocalUpload(params)) {
            path = params.path;
        }
        return ViewTracing_1.traceUserEvent('uploadFile', { path }, async () => {
            await this.conduitInitialized;
            return this.conduit.uploadFile(params);
        });
    }
    async startTracing(config) {
        await this.conduitInitialized;
        return this.conduit.startTracing(config);
    }
    async stopTracing() {
        await this.conduitInitialized;
        return this.conduit.stopTracing();
    }
    async setLogLevel(level) {
        await this.conduitInitialized;
        return this.conduit.setLogLevel(level);
    }
    async addConduitEventHandler(event, func) {
        await this.conduitInitialized;
        this.conduit.addConduitEventHandler(event, func);
    }
    async removeConduitEventHandler(event, func) {
        await this.conduitInitialized;
        this.conduit.removeConduitEventHandler(event, func);
    }
}
exports.connector = new ViewConnector();
async function uploadData(parentID, parentType, data, filename, mime, blobRef, applicationData, progressCB) {
    return ViewTracing_1.traceUserEvent('uploadData', { filename }, async () => {
        const upload = await exports.connector.startUpload({
            parentID,
            parentType,
            filename,
            mime,
            blobRef,
            applicationData,
        });
        for (let offset = 0; offset < data.length; offset += upload.maxChunkSize) {
            progressCB && progressCB(offset / data.length);
            await exports.connector.uploadChunk(data.slice(offset, offset + upload.maxChunkSize), upload);
        }
        return await exports.connector.finishUpload(upload);
    });
}
exports.uploadData = uploadData;
async function uploadFile(params) {
    return await exports.connector.uploadFile(params);
}
exports.uploadFile = uploadFile;
const FlushMutations = Query_1.gql `
  mutation {
    ForceDownsync(wait: true, flushMutations: true) {
      success
    }
  }
`;
const GetAttachmentInfo = Query_1.gql `
query ($attachmentID: String!) {
  Attachment(id: $attachmentID) {
    width
    height
    data {
      url
    }
  }
}
`;
async function waitForAttachmentUpload(attachmentID) {
    return ViewTracing_1.traceUserEvent('waitForAttachmentUpload', { attachmentID }, async () => {
        await Query_1.execute(FlushMutations);
        const res = await Query_1.execute(GetAttachmentInfo, { attachmentID });
        return {
            width: res.width,
            height: res.height,
            url: res.data.url,
        };
    });
}
exports.waitForAttachmentUpload = waitForAttachmentUpload;
async function addConduitEventHandler(event, func) {
    await exports.connector.addConduitEventHandler(event, func);
}
exports.addConduitEventHandler = addConduitEventHandler;
async function removeConduitEventHandler(event, func) {
    await exports.connector.removeConduitEventHandler(event, func);
}
exports.removeConduitEventHandler = removeConduitEventHandler;
async function setConduitLogLevel(level) {
    await exports.connector.setLogLevel(level);
}
exports.setConduitLogLevel = setConduitLogLevel;
//# sourceMappingURL=Connector.js.map