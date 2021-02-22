"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCMessageID = void 0;
var IPCMessageID;
(function (IPCMessageID) {
    IPCMessageID["CLEAR_GRAPH"] = "ClearGraph";
    IPCMessageID["GET_DATA"] = "GetData";
    IPCMessageID["UNSUBSCRIBE"] = "Unsubscribe";
    IPCMessageID["WATCHER_UPDATE"] = "WatcherUpdate";
    IPCMessageID["START_UPLOAD"] = "StartUpload";
    IPCMessageID["UPLOAD_CHUNK"] = "UploadChunk";
    IPCMessageID["FINISH_UPLOAD"] = "FinishUpload";
    IPCMessageID["CANCEL_UPLOAD"] = "CancelUpload";
    IPCMessageID["UPLOAD_FILE"] = "UploadFile";
    IPCMessageID["HELLO"] = "Hello";
    IPCMessageID["GOODBYE"] = "Goodbye";
    IPCMessageID["SET_SUB_ACTIVE"] = "SetSubscriptionActive";
    IPCMessageID["PAUSE_SUBSCRIPTIONS"] = "PauseSubscriptions";
    IPCMessageID["START_TRACING"] = "StartTracing";
    IPCMessageID["RECORD_TRACE_EVENTS"] = "RecordTraceEvents";
    IPCMessageID["STOP_TRACING"] = "StopTracing";
    IPCMessageID["SET_LOG_LEVEL"] = "SetLogLevel";
    IPCMessageID["REQUEST_START_TRACING"] = "RequestStartTracing";
    IPCMessageID["REQUEST_STOP_TRACING"] = "RequestStopTracing";
    IPCMessageID["CONDUIT_EVENT"] = "ConduitEvent";
    IPCMessageID["RESUBSCRIBE"] = "Resubscribe";
})(IPCMessageID = exports.IPCMessageID || (exports.IPCMessageID = {}));
//# sourceMappingURL=MessageTypes.js.map