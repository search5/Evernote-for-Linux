"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupElectronLogger = void 0;
const conduit_utils_1 = require("conduit-utils");
const electron_1 = require("electron");
const en_conduit_electron_shared_1 = require("en-conduit-electron-shared");
// Logger instances for topics created in renderer process
const loggers = {};
function getLogger(topic) {
    return topic && loggers[topic] || conduit_utils_1.logger;
}
function setupElectronLogger() {
    // setup listener for logs from renderer process
    electron_1.ipcMain.on(en_conduit_electron_shared_1.ElectronLogChannel, (event, message) => {
        const { type, topic, logData } = message;
        switch (type) {
            case en_conduit_electron_shared_1.ElectronLogLevel.TRACE:
                getLogger(topic).trace(logData);
                break;
            case en_conduit_electron_shared_1.ElectronLogLevel.DEBUG:
                getLogger(topic).debug(logData);
                break;
            case en_conduit_electron_shared_1.ElectronLogLevel.INFO:
                getLogger(topic).info(logData);
                break;
            case en_conduit_electron_shared_1.ElectronLogLevel.WARN:
                getLogger(topic).warn(logData);
                break;
            case en_conduit_electron_shared_1.ElectronLogLevel.ERROR:
                getLogger(topic).error(logData);
                break;
            case en_conduit_electron_shared_1.ElectronLogLevel.FATAL:
                getLogger(topic).fatal(logData);
                break;
            case 'CREATE_CHILD_LOGGER':
                if (!topic) {
                    throw new Error('Topic needed to create child logger');
                }
                if (conduit_utils_1.logger.createChildLogger) {
                    loggers[topic] = conduit_utils_1.createLogger(topic);
                }
                break;
            default:
                conduit_utils_1.absurd(type, 'Unexpected case in electron logs');
                break;
        }
    });
}
exports.setupElectronLogger = setupElectronLogger;
//# sourceMappingURL=setupElectronLogger.js.map