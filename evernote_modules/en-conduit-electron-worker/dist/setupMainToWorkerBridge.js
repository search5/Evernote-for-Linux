"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConduitEvent = exports.setupMainToWorkerBridge = exports.setVerboseTracing = void 0;
const conduit_ipc_messages_1 = require("conduit-ipc-messages");
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger = conduit_utils_1.createLogger('conduit: mainIPC');
const NO_RESPONSE = Symbol('NO_RESPONSE');
const windowToWatcherMap = {};
const windowToRecorderMap = {};
function setVerboseTracing(val) {
    TraceController === null || TraceController === void 0 ? void 0 : TraceController.setVerboseTracing(val);
}
exports.setVerboseTracing = setVerboseTracing;
class ElectronTraceController extends conduit_utils_1.EventTraceControllerBase {
    openWriteStream(filename) {
        const filePath = path_1.default.join(electron_1.remote.app.getPath('downloads'), filename);
        const fileName = filePath.slice(0, -4);
        const extension = filePath.slice(-4, filePath.length);
        let safeFilePath = filePath;
        let i = 1;
        // Avoid overwriting an existing file
        while (fs_1.default.existsSync(safeFilePath)) {
            // Take the current file name and splice an incremented index to it, ensuring the extension is preserved
            safeFilePath = `${fileName} (${i})${extension}`;
            i++;
        }
        logger.info('Starting trace logging into ' + safeFilePath);
        this.writeStream = fs_1.default.createWriteStream(safeFilePath);
    }
    writeData(data) {
        if (this.writeStream) {
            this.writeStream.write(data);
        }
    }
    closeWriteStream() {
        if (this.writeStream) {
            this.writeStream.close();
            this.writeStream = undefined;
        }
    }
}
const TraceController = new ElectronTraceController();
class ElectronRendererEventRecorder {
    constructor(sender, senderID) {
        this.sender = sender;
        this.senderID = senderID;
    }
    startTracing(_, pid, start) {
        this.sender.send(en_conduit_electron_shared_1.ElectronIPCChannel, {
            action: conduit_ipc_messages_1.IPCMessageID.START_TRACING,
            initialSenderID: this.senderID,
            data: {
                pid,
                start,
            },
        });
    }
    stopTracing() {
        this.sender.send(en_conduit_electron_shared_1.ElectronIPCChannel, {
            action: conduit_ipc_messages_1.IPCMessageID.STOP_TRACING,
            initialSenderID: this.senderID,
        });
    }
}
function handleWatcherUpdate(sender, watcherGuid, initialSenderID) {
    try {
        sender.send(en_conduit_electron_shared_1.ElectronIPCChannel, {
            action: conduit_ipc_messages_1.IPCMessageID.WATCHER_UPDATE,
            data: { watcherGuid },
            initialSenderID,
        });
    }
    catch (err) {
        logger.error('Error in handleWatcherUpdate ', err);
    }
}
async function handleMessage(conduit, message, sender) {
    var _a, _b;
    switch (message.action) {
        case conduit_ipc_messages_1.IPCMessageID.GET_DATA: {
            const { query, vars, priority, debugTrace, watcherGuid } = message.data;
            if (watcherGuid) {
                (_b = windowToWatcherMap[(_a = message.initialSenderID) !== null && _a !== void 0 ? _a : 'main']) === null || _b === void 0 ? void 0 : _b.add(watcherGuid);
            }
            return await conduit.getData(query, vars, watcherGuid ? {
                watcherGuid,
                priority,
                debugTrace,
                onUpdate: () => handleWatcherUpdate(sender, watcherGuid, message.initialSenderID),
            } : undefined);
        }
        case conduit_ipc_messages_1.IPCMessageID.SET_SUB_ACTIVE: {
            const { watcherGuid, active } = message.data;
            if (!watcherGuid) {
                throw new Error('No watcherGuid to set active');
            }
            return await conduit.setSubscriptionActive(watcherGuid, active);
        }
        case conduit_ipc_messages_1.IPCMessageID.PAUSE_SUBSCRIPTIONS: {
            const { isPaused } = message.data;
            return await conduit.pauseSubscriptions(isPaused);
        }
        case conduit_ipc_messages_1.IPCMessageID.UNSUBSCRIBE: {
            const { watcherGuid } = message.data;
            if (!watcherGuid) {
                throw new Error('No watcherGuid to unsubscribe to');
            }
            return await conduit.unSubscribe(watcherGuid);
        }
        case conduit_ipc_messages_1.IPCMessageID.CLEAR_GRAPH:
            return await conduit.clearGraph(message.data.clearAuth);
        case conduit_ipc_messages_1.IPCMessageID.START_UPLOAD:
            return await conduit.startUpload(message.data.params);
        case conduit_ipc_messages_1.IPCMessageID.UPLOAD_CHUNK:
            return await conduit.uploadChunk(message.data.chunk, message.data.context);
        case conduit_ipc_messages_1.IPCMessageID.UPLOAD_FILE:
            return await conduit.uploadFile(message.data.params);
        case conduit_ipc_messages_1.IPCMessageID.FINISH_UPLOAD:
            return await conduit.finishUpload(message.data.context);
        case conduit_ipc_messages_1.IPCMessageID.CANCEL_UPLOAD:
            return await conduit.cancelUpload(message.data.context);
        case conduit_ipc_messages_1.IPCMessageID.RECORD_TRACE_EVENTS:
            try {
                TraceController.recordTraceEvents(message.data.events);
            }
            catch (err) {
                logger.error('Error calling TraceController.recordTraceEvents', err);
            }
            return NO_RESPONSE;
        case conduit_ipc_messages_1.IPCMessageID.REQUEST_START_TRACING:
            TraceController.startTracing(message.data);
            return;
        case conduit_ipc_messages_1.IPCMessageID.REQUEST_STOP_TRACING:
            return await TraceController.stopTracing();
        case conduit_ipc_messages_1.IPCMessageID.SET_LOG_LEVEL:
            await conduit.setLogLevel(message.data.logLevel);
            return NO_RESPONSE;
        case conduit_ipc_messages_1.IPCMessageID.CONDUIT_EVENT:
            logger.debug('worker receieved event');
            return NO_RESPONSE;
        case conduit_ipc_messages_1.IPCMessageID.HELLO:
        case conduit_ipc_messages_1.IPCMessageID.GOODBYE:
        case conduit_ipc_messages_1.IPCMessageID.WATCHER_UPDATE:
        case conduit_ipc_messages_1.IPCMessageID.START_TRACING:
        case conduit_ipc_messages_1.IPCMessageID.STOP_TRACING:
        case conduit_ipc_messages_1.IPCMessageID.RESUBSCRIBE:
            return;
        default:
            const { action } = message;
            throw conduit_utils_1.absurd(action, `unexpected switch case in Electron Worker IPC handler ${action}`);
    }
}
async function unsubscribeWatchers(conduit, watchers) {
    const promises = [];
    watchers.forEach(watcherGuid => promises.push(conduit.unSubscribe(watcherGuid)));
    await conduit_utils_1.allWithError(promises);
}
function setupMainToWorkerBridge(conduit) {
    electron_1.ipcRenderer.on(en_conduit_electron_shared_1.ElectronIPCChannel, async (event, message) => {
        var _a;
        const { sender } = event;
        const initialSender = (_a = message.initialSenderID) !== null && _a !== void 0 ? _a : 'main';
        if (message.action === conduit_ipc_messages_1.IPCMessageID.HELLO) {
            if (Boolean(windowToWatcherMap[initialSender])) {
                logger.warn(`Duplicate HELLO message from ${initialSender}`);
            }
            windowToWatcherMap[initialSender] = new Set();
            windowToRecorderMap[initialSender] = new ElectronRendererEventRecorder(sender, message.initialSenderID);
            TraceController.registerRecorder(windowToRecorderMap[initialSender]);
        }
        else if (message.action === conduit_ipc_messages_1.IPCMessageID.GOODBYE) {
            if (windowToRecorderMap[initialSender]) {
                TraceController.unregisterRecorder(windowToRecorderMap[initialSender]);
                delete windowToRecorderMap[initialSender];
            }
            const isMain = message.initialSenderID === undefined;
            if (isMain) {
                try {
                    await conduit.destructor();
                    sender.send('deinit-result', null);
                    return;
                }
                catch (e) {
                    logger.error('There was an error shutting down Conduit:', e);
                    sender.send('deinit-result', e.message);
                    return;
                }
            }
            if (windowToWatcherMap[initialSender]) {
                unsubscribeWatchers(conduit, windowToWatcherMap[initialSender])
                    .finally(() => {
                    delete windowToWatcherMap[initialSender];
                })
                    .catch(err => {
                    logger.error('Error trying to unsubscribe conduit watchers', err);
                });
            }
            else {
                logger.error('Cannot unsubscribe to watchers that do not exist');
            }
        }
        else {
            const resp = {
                action: message.action,
                id: message.id,
            };
            handleMessage(conduit, message, sender)
                .then(result => {
                if (result === NO_RESPONSE) {
                    return;
                }
                sender.send(en_conduit_electron_shared_1.ElectronIPCChannel, Object.assign(Object.assign({}, resp), { result, initialSenderID: message.initialSenderID }));
            })
                .catch(err => {
                sender.send(en_conduit_electron_shared_1.ElectronIPCChannel, Object.assign(Object.assign({}, resp), { error: conduit_utils_1.serializeError(err), initialSenderID: message.initialSenderID }));
            });
        }
    });
}
exports.setupMainToWorkerBridge = setupMainToWorkerBridge;
function sendConduitEvent(conduitEvent, data) {
    try {
        electron_1.ipcRenderer.send(en_conduit_electron_shared_1.ElectronIPCChannel, {
            action: conduit_ipc_messages_1.IPCMessageID.CONDUIT_EVENT,
            data: { conduitEvent, conduitEventData: data },
        });
    }
    catch (err) {
        logger.error('Error in sendConduitEvent ', err);
    }
}
exports.sendConduitEvent = sendConduitEvent;
//# sourceMappingURL=setupMainToWorkerBridge.js.map