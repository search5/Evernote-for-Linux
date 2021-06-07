"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestLogger = void 0;
const logger_1 = require("./logger");
/* tslint:disable:no-console */
class TestLogger {
    constructor(config, parentArgs = []) {
        this.config = config;
        this.parentArgs = parentArgs;
        this.warnings = [];
        this.errors = [];
        this.fatals = [];
    }
    trace(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.TRACE) {
            console.trace(...this.parentArgs.concat(args));
        }
    }
    info(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.INFO) {
            console.info(...this.parentArgs.concat(args));
        }
    }
    debug(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.DEBUG) {
            console.debug(...this.parentArgs.concat(args));
        }
    }
    warn(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.WARN) {
            console.warn(...this.parentArgs.concat(args));
        }
        this.warnings.push(args.join(' '));
    }
    error(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.ERROR) {
            console.error(...this.parentArgs.concat(args));
        }
        this.errors.push(args.join(' '));
    }
    fatal(...args) {
        if (this.config.console && this.config.console.level <= logger_1.LogLevel.FATAL) {
            console.error(...this.parentArgs.concat(args));
        }
        this.fatals.push(args.join(' '));
    }
    createChildLogger(topic) {
        return this;
    }
    reset() {
        const warnings = this.warnings;
        const errors = this.errors;
        const fatals = this.fatals;
        this.warnings = [];
        this.errors = [];
        this.fatals = [];
        return {
            warnings,
            errors,
            fatals,
        };
    }
}
exports.TestLogger = TestLogger;
//# sourceMappingURL=TestLogger.js.map