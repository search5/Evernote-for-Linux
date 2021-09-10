"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitRendererIPC = exports.ConduitElectronIPC = exports.getId = void 0;
const conduit_ipc_messages_1 = require("conduit-ipc-messages");
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const _1 = require("./");
const callbacks = {};
function getId() {
    return conduit_utils_1.uuid();
}
exports.getId = getId;
function isResponseToRenderer(initialSenderID) {
    return initialSenderID !== undefined && initialSenderID !== -1;
}
function isResponseToMain(initialSenderID) {
    return initialSenderID === -1;
}
class ConduitElectronIPC {
    constructor(sender, receiver, isMain, webContents) {
        this.sender = sender;
        this.receiver = receiver;
        this.isMain = isMain;
        this.webContents = webContents;
        this.dataWatcherCallbacks = {};
        this.emitter = new conduit_utils_1.ConduitEventEmitter();
        this.setupIPC();
    }
    getData(query, vars, watcher) {
        if (watcher) {
            this.dataWatcherCallbacks[watcher.watcherGuid] = watcher.onUpdate;
        }
        let queryToSend = query;
        if (typeof query === 'object' && query.kind === 'Document') {
            // if the query is an instance of graphql doc, sending it over electron ipc may crash the window
            queryToSend = graphql_1.print(query);
        }
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.GET_DATA,
            data: {
                query: queryToSend,
                vars,
                priority: watcher ? watcher.priority : conduit_utils_1.Priority.IMMEDIATE,
                debugTrace: watcher ? watcher.debugTrace : false,
                watcherGuid: watcher ? watcher.watcherGuid : undefined,
            },
        });
    }
    handleResubscribe() {
        for (const guid in this.dataWatcherCallbacks) {
            this.dataWatcherCallbacks[guid] &&
                this.dataWatcherCallbacks[guid]();
        }
    }
    emitEvent(conduitEvent, data) {
        this.emitter.emitEvent(conduitEvent, data);
        this.broadCastMessageToRenders({
            action: conduit_ipc_messages_1.IPCMessageID.CONDUIT_EVENT,
            data: { conduitEvent, conduitEventData: data },
            id: getId(),
        });
    }
    clearGraph(clearAuth) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.CLEAR_GRAPH,
            data: { clearAuth },
        });
    }
    unSubscribe(watcherGuid) {
        delete this.dataWatcherCallbacks[watcherGuid];
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.UNSUBSCRIBE,
            data: { watcherGuid },
        });
    }
    resubscribe() {
        if (!this.isMain) {
            return;
        }
        this.handleResubscribe();
        this.broadCastMessageToRenders({
            id: getId(),
            action: conduit_ipc_messages_1.IPCMessageID.RESUBSCRIBE,
        });
    }
    startUpload(params) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.START_UPLOAD,
            data: { params },
        });
    }
    setSubscriptionActive(watcherGuid, active) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.SET_SUB_ACTIVE,
            data: { watcherGuid, active },
        });
    }
    pauseSubscriptions(isPaused) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.PAUSE_SUBSCRIPTIONS,
            data: { isPaused },
        });
    }
    uploadChunk(chunk, context) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.UPLOAD_CHUNK,
            data: { chunk, context },
        });
    }
    finishUpload(context) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.FINISH_UPLOAD,
            data: { context },
        });
    }
    cancelUpload(context) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.CANCEL_UPLOAD,
            data: { context },
        });
    }
    uploadFile(params) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.UPLOAD_FILE,
            data: { params },
        });
    }
    startTracing(config) {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.REQUEST_START_TRACING,
            data: config,
        });
    }
    stopTracing() {
        return this.sendMessage({
            action: conduit_ipc_messages_1.IPCMessageID.REQUEST_STOP_TRACING,
            data: {},
        });
    }
    recordTraceEvents(events) {
        try {
            this.assertNotPaused(this.sender);
            this.sender.send(_1.ElectronIPCChannel, this.withMainId({
                action: conduit_ipc_messages_1.IPCMessageID.RECORD_TRACE_EVENTS,
                data: { events },
            }));
        }
        catch (e) {
            conduit_utils_1.logger.error('Failed to send RECORD_TRACE_EVENTS IPC message', e);
        }
    }
    addConduitEventHandler(event, func) {
        this.emitter.addEventListener(event, func);
    }
    removeConduitEventHandler(event, func) {
        this.emitter.removeEventListener(event, func);
    }
    setLogLevel(logLevel) {
        conduit_utils_1.setLogLevel(logLevel);
        if (!this.isMain) {
            return this.sendMessage({
                action: conduit_ipc_messages_1.IPCMessageID.SET_LOG_LEVEL,
                data: { logLevel },
            });
        }
        else {
            this.broadCastMessageToRenders({
                action: conduit_ipc_messages_1.IPCMessageID.SET_LOG_LEVEL,
                data: { logLevel },
                id: getId(),
            }, true);
            return Promise.resolve();
        }
    }
    deInit() {
        var _a;
        try {
            (_a = this.sender) === null || _a === void 0 ? void 0 : _a.send(_1.ElectronIPCChannel, { action: conduit_ipc_messages_1.IPCMessageID.GOODBYE });
        }
        catch (err) {
            conduit_utils_1.logger.error('failed to send goodbye', err);
        }
        this.receiver.removeAllListeners(_1.ElectronIPCChannel);
    }
    handleResponse(message) {
        switch (message.action) {
            case conduit_ipc_messages_1.IPCMessageID.GET_DATA:
            case conduit_ipc_messages_1.IPCMessageID.CLEAR_GRAPH:
            case conduit_ipc_messages_1.IPCMessageID.SET_SUB_ACTIVE:
            case conduit_ipc_messages_1.IPCMessageID.PAUSE_SUBSCRIPTIONS:
            case conduit_ipc_messages_1.IPCMessageID.UNSUBSCRIBE:
            case conduit_ipc_messages_1.IPCMessageID.START_UPLOAD:
            case conduit_ipc_messages_1.IPCMessageID.FINISH_UPLOAD:
            case conduit_ipc_messages_1.IPCMessageID.CANCEL_UPLOAD:
            case conduit_ipc_messages_1.IPCMessageID.UPLOAD_CHUNK:
            case conduit_ipc_messages_1.IPCMessageID.UPLOAD_FILE:
            case conduit_ipc_messages_1.IPCMessageID.REQUEST_START_TRACING:
            case conduit_ipc_messages_1.IPCMessageID.REQUEST_STOP_TRACING:
                const callback = callbacks[message.id];
                if (callback) {
                    callback({ id: message.id, result: message.result, error: message.error });
                }
                else {
                    throw new Error(`callback not found for message ${JSON.stringify(message)}`);
                }
                break;
            case conduit_ipc_messages_1.IPCMessageID.WATCHER_UPDATE:
                const cb = this.dataWatcherCallbacks[message.data.watcherGuid];
                const newData = message.data.newData;
                cb && cb(newData);
                break;
            case conduit_ipc_messages_1.IPCMessageID.START_TRACING:
                conduit_utils_1.ProcessTraceRecorder.startTracing(this, message.data.pid, message.data.start);
                break;
            case conduit_ipc_messages_1.IPCMessageID.STOP_TRACING:
                conduit_utils_1.ProcessTraceRecorder.stopTracing();
                break;
            case conduit_ipc_messages_1.IPCMessageID.SET_LOG_LEVEL:
                conduit_utils_1.setLogLevel(message.data.logLevel);
                break;
            case conduit_ipc_messages_1.IPCMessageID.RESUBSCRIBE:
                this.handleResubscribe();
                break;
            default:
                throw new Error(`unexpected switch case in Electron Renderer IPC handler ${conduit_utils_1.safeStringify(message)}`);
        }
    }
    isFromRenderer(sender) {
        return this.isMain;
    }
    setupIPC() {
        this.assertNotPaused(this.sender);
        this.sender.send(_1.ElectronIPCChannel, { action: conduit_ipc_messages_1.IPCMessageID.HELLO });
        this.receiver.on(_1.ElectronIPCChannel, ({ sender }, message) => {
            var _a, _b;
            if (message.action === conduit_ipc_messages_1.IPCMessageID.CONDUIT_EVENT) {
                this.emitter.emitEvent(message.data.conduitEvent, message.data.conduitEventData);
                // broadcast event to rendered process
                this.broadCastMessageToRenders(message);
                return;
            }
            if (this.isFromRenderer(sender)) {
                if (isResponseToRenderer(message.initialSenderID)) {
                    // Forward response
                    (_b = (_a = this.webContents) === null || _a === void 0 ? void 0 : _a.fromId(message.initialSenderID)) === null || _b === void 0 ? void 0 : _b.send(_1.ElectronIPCChannel, message);
                }
                else if (isResponseToMain(message.initialSenderID)) {
                    this.handleResponse(message);
                }
                else {
                    // Forward request to worker
                    try {
                        if (message.action === conduit_ipc_messages_1.IPCMessageID.SET_LOG_LEVEL) {
                            conduit_utils_1.setLogLevel(message.data.logLevel);
                            this.broadCastMessageToRenders(message, true);
                        }
                        else {
                            this.assertNotPaused(this.sender);
                            this.sender.send(_1.ElectronIPCChannel, Object.assign(Object.assign({}, message), { initialSenderID: sender.id }));
                        }
                    }
                    catch (e) {
                        conduit_utils_1.logger.error('failed to forward message to the worker', e);
                    }
                }
            }
            else {
                this.handleResponse(message);
            }
        });
    }
    withMainId(message) {
        if (this.isMain) {
            message.initialSenderID = -1;
        }
        return message;
    }
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            const id = getId();
            message.id = id;
            this.withMainId(message);
            callbacks[id] = ({ id: resId, error, result }) => {
                // First, remove this event listener so it won't get triggered again
                delete callbacks[resId];
                if (error) {
                    reject(conduit_utils_1.deserializeError(error));
                    return;
                }
                resolve(result);
            };
            try {
                this.assertNotPaused(this.sender);
                this.sender.send(_1.ElectronIPCChannel, message);
            }
            catch (e) {
                conduit_utils_1.logger.error('failed to send message core-wards', e);
            }
        });
    }
    broadCastMessageToRenders(message, withWorker) {
        var _a;
        if (!this.isMain) {
            return;
        }
        const renders = (_a = this.webContents) === null || _a === void 0 ? void 0 : _a.getAllWebContents();
        if (renders && renders.length) {
            for (const r of renders) {
                // dont sent to worker
                if (withWorker || r !== this.sender) {
                    try {
                        r.send(_1.ElectronIPCChannel, message);
                    }
                    catch (e) {
                        conduit_utils_1.logger.error('failed to forward event to the render', e);
                    }
                }
                else {
                    conduit_utils_1.logger.debug('skipping sent event to worker');
                }
            }
        }
    }
    assertNotPaused(sender) {
        if (!sender) {
            throw new Error('cannot send messages on paused IPC while conduit restarts');
        }
    }
}
exports.ConduitElectronIPC = ConduitElectronIPC;
class ConduitRendererIPC extends ConduitElectronIPC {
    constructor(ipcRenderer) {
        super(ipcRenderer, ipcRenderer, false);
    }
}
exports.ConduitRendererIPC = ConduitRendererIPC;
//# sourceMappingURL=ConduitElectronIPC.js.map