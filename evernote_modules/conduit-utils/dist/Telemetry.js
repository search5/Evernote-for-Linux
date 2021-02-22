"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDimensions = exports.setDimension = exports.recordException = exports.recordMetric = exports.recordEvent = exports.updateTelemetryFilterRules = exports.flushEvents = exports.applyTelemetryDestination = exports.Telemetry = exports.StartMetric = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const uuid_1 = __importDefault(require("uuid"));
class StartMetric {
    constructor(info) {
        this.info = info;
        this.start = Date.now();
    }
    done(extraInfo) {
        recordMetric(Object.assign(Object.assign(Object.assign({}, this.info), extraInfo), { duration: Date.now() - this.start }));
    }
}
exports.StartMetric = StartMetric;
class Telemetry {
    constructor(customLogger) {
        this.warnSent = false;
        this.destinations = [];
        this.logger = customLogger || en_ts_utils_1.logger;
    }
    applyTelemetryDestination(destination) {
        try {
            if (destination.setup && !destination.setup()) {
                this.logger.error(`Telemetry: Unable to setup destination ${destination.name}`);
                return;
            }
            this.logger.info(`Telemetry: New destination added - ${destination.name}`);
            this.destinations.push(destination);
        }
        catch (error) {
            this.logger.error(`Telemetry: Unable to setup destination ${destination.name} due an error`, error);
            return;
        }
    }
    flushEvents() {
        this.checkDestinationsPresence('Flushing events');
        this.destinations
            .forEach(destination => {
            if (destination.onFlush) {
                return destination.onFlush();
            }
        });
    }
    updateTelemetryFilterRules(props) {
        this.checkDestinationsPresence('Updating rules');
        this.destinations
            .forEach(destination => {
            if (destination.onUpdateRules) {
                return destination.onUpdateRules(props);
            }
        });
    }
    recordEvent(event, selectiveDestinations) {
        this.checkDestinationsPresence('Recording events');
        const eventIdForAllDestinations = uuid_1.default();
        Promise.all(this.destinations
            .filter(({ name }) => !this.excludeDestination(name, selectiveDestinations))
            .filter(destination => this.validEventOnDestination(destination, event))
            .map(dest => dest.onRecordEvent(event, eventIdForAllDestinations, selectiveDestinations))).catch(error => en_ts_utils_1.logger.error(`Telemetry::Error '${error}'`));
    }
    recordMetric(event, selectiveDestinations) {
        this.checkDestinationsPresence('Recording metrics');
        Promise.all(this.destinations
            .filter(({ name }) => !this.excludeDestination(name, selectiveDestinations))
            .filter(destination => this.validMetricOnDestination(destination, event))
            .map(dest => dest.onRecordMetric(event, selectiveDestinations))).catch(error => en_ts_utils_1.logger.error(`Telemetry::Error '${error}'`));
    }
    recordException(exception) {
        this.checkDestinationsPresence('Recording exceptions');
        const eventIdForAllDestinations = uuid_1.default();
        return Promise.all(this.destinations
            .map(destination => destination.onException && destination.onException(exception, eventIdForAllDestinations)));
    }
    setDimension(name, value) {
        this.checkDestinationsPresence('Setting dimensions');
        this.destinations.forEach(dest => {
            if (dest.onSetDimension) {
                dest.onSetDimension(name, value);
            }
        });
    }
    setDimensions(dimensions) {
        this.checkDestinationsPresence('Setting dimensions');
        this.destinations.forEach(dest => {
            if (dest.onSetDimensions) {
                dest.onSetDimensions(dimensions);
            }
            else if (dest.onSetDimension) {
                for (const [key, value] of Object.entries(dimensions)) {
                    dest.onSetDimension(key, value);
                }
            }
        });
    }
    validEventOnDestination(destination, event) {
        return destination.onRecordEvent && ((!destination.onFilterEvent) ? true : destination.onFilterEvent(event));
    }
    validMetricOnDestination(destination, metric) {
        return destination.onRecordMetric && ((!destination.onFilterMetric) ? true : destination.onFilterMetric(metric));
    }
    checkDestinationsPresence(action) {
        if (this.destinations.length === 0 && !this.warnSent) {
            en_ts_utils_1.logger.warn(`${action} without having a valid destination`);
            this.warnSent = true;
        }
    }
    excludeDestination(destinationName, selectiveDestinations) {
        if (!selectiveDestinations) {
            return false;
        }
        if (selectiveDestinations[destinationName] !== undefined) {
            return !selectiveDestinations[destinationName];
        }
        return selectiveDestinations.All === true;
    }
}
exports.Telemetry = Telemetry;
const telemetry = new Telemetry();
function applyTelemetryDestination(destination) {
    return telemetry.applyTelemetryDestination(destination);
}
exports.applyTelemetryDestination = applyTelemetryDestination;
function flushEvents() {
    return telemetry.flushEvents();
}
exports.flushEvents = flushEvents;
function updateTelemetryFilterRules(props) {
    return telemetry.updateTelemetryFilterRules(props);
}
exports.updateTelemetryFilterRules = updateTelemetryFilterRules;
function recordEvent(event, selectiveDestinations) {
    return telemetry.recordEvent(event, selectiveDestinations);
}
exports.recordEvent = recordEvent;
function recordMetric(event, selectiveDestinations) {
    return telemetry.recordMetric(event, selectiveDestinations);
}
exports.recordMetric = recordMetric;
function recordException(exception) {
    return telemetry.recordException(exception);
}
exports.recordException = recordException;
function setDimension(name, value) {
    return telemetry.setDimension(name, value);
}
exports.setDimension = setDimension;
function setDimensions(dimensions) {
    return telemetry.setDimensions(dimensions);
}
exports.setDimensions = setDimensions;
//# sourceMappingURL=Telemetry.js.map