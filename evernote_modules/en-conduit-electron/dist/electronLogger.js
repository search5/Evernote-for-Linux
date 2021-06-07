"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.electronLogger = void 0;
const bunyan_1 = __importDefault(require("bunyan"));
const bunyan_prettystream_1 = __importDefault(require("bunyan-prettystream"));
const bunyan_rotating_file_stream_1 = __importDefault(require("bunyan-rotating-file-stream"));
const conduit_utils_1 = require("conduit-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function electronLogger(config) {
    // Console output is always enabled
    const consoleLevel = config.console ? config.console.level : bunyan_1.default.WARN;
    const prettyStdOut = new bunyan_prettystream_1.default();
    prettyStdOut.pipe(process.stdout);
    const streams = [{
            stream: prettyStdOut,
            level: consoleLevel,
        }];
    if (config.file) {
        // Create logs folder
        fs_extra_1.default.mkdirpSync(path_1.default.dirname(config.file.name));
        const rfs = new bunyan_rotating_file_stream_1.default({
            path: config.file.name,
            totalFiles: 10,
            threshold: '10m',
            totalSize: '100m',
            gzip: true,
        });
        rfs.on('newfile', async () => {
            if (!config.file) {
                throw new Error('No file name found for electronLogger');
            }
            const initialData = config.fileHeaderText || 'No initial data';
            // eslint-disable-next-line max-len
            fs_extra_1.default.appendFileSync(config.file.name, `********\n* The Activity Log may contain information about your account and notes.\n* For example, the titles of some of your notes may be mentioned in this log file.\n* When providing log information, feel free to edit the file to remove anything\n* you do not want to send us.\n********\n\n${initialData}\n\n`);
        });
        streams.push({
            stream: rfs,
            level: config.file.level,
        });
    }
    // Create backend
    const loggerOptions = {
        name: config.name,
        streams,
        serializers: bunyan_1.default.stdSerializers,
        src: true,
    };
    conduit_utils_1.logger.safetyCheckLevels(bunyan_1.default.levelFromName);
    const logInstance = bunyan_1.default.createLogger(loggerOptions);
    return bindLogger(logInstance);
}
exports.electronLogger = electronLogger;
function bindLogger(instance, topic = '') {
    const resp = {
        info: instance.info.bind(instance, topic),
        warn: instance.warn.bind(instance, topic),
        trace: instance.trace.bind(instance, topic),
        error: instance.error.bind(instance, topic),
        debug: instance.debug.bind(instance, topic),
        fatal: instance.fatal.bind(instance, topic),
        setLogLevel: (level) => { instance.level(level); },
    };
    resp.createChildLogger = (topicName) => {
        return bindLogger(instance.child({ topicName }), topicName);
    };
    return resp;
}
//# sourceMappingURL=electronLogger.js.map