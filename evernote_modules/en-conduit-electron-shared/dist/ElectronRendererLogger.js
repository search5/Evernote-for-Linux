"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronRendererLogger = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const _1 = require("./");
/* tslint:disable:no-console */
class ElectronRendererLogger {
    constructor(name, sendToConsole, parentArgs = []) {
        this.name = name;
        this.sendToConsole = sendToConsole;
        this.parentArgs = parentArgs;
    }
    createChildLogger(topic) {
        const logger = new ElectronRendererLogger(this.name, this.sendToConsole);
        logger.topicName = topic;
        electron_1.ipcRenderer.send(_1.ElectronLogChannel, { type: 'CREATE_CHILD_LOGGER', topic, data: {} });
        return logger;
    }
    trace(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.TRACE, args);
        if (this.sendToConsole) {
            console.trace(this.name, args);
        }
    }
    info(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.INFO, args);
        if (this.sendToConsole) {
            console.info(this.name, args);
        }
    }
    debug(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.DEBUG, args);
        if (this.sendToConsole) {
            console.debug(this.name, args);
        }
    }
    warn(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.WARN, args);
        if (this.sendToConsole) {
            console.warn(this.name, args);
        }
    }
    error(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.ERROR, args);
        if (this.sendToConsole) {
            console.error(this.name, args);
        }
    }
    fatal(...args) {
        args = this.parentArgs.concat(args);
        this.sendLog(_1.ElectronLogLevel.FATAL, args);
        if (this.sendToConsole) {
            console.error(this.name, args);
        }
    }
    getMessage(...args) {
        let message = `${this.name} `;
        args.map(arg => message += conduit_utils_1.safeStringify(arg));
        return message;
    }
    sendLog(logLevel, ...args) {
        const message = this.getMessage(args);
        electron_1.ipcRenderer.send(_1.ElectronLogChannel, { type: logLevel, topic: this.topicName, logData: message });
    }
}
exports.ElectronRendererLogger = ElectronRendererLogger;
//# sourceMappingURL=ElectronRendererLogger.js.map