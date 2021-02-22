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
exports.Watcher = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Connector_1 = require("./Connector");
const Query_1 = require("./Query");
const logger = conduit_utils_1.createLogger('conduit:watcher');
// retries also happen in ConduitCore, to support `execute` calls, so keep this number low
const MAX_RETRIES = 10;
class Watcher {
    constructor(opts) {
        this.guid = 'Watcher-' + conduit_utils_1.uuid();
        this.debugTrace = false;
        this.retryCount = 0;
        this.active = true;
        this.triggerRequery = (response) => {
            if (response) {
                // TODO: Check if query and vars are the same
                if (response.error) {
                    response.error = conduit_utils_1.deserializeError(response.error);
                }
                this.updateResult(response, true);
            }
            else {
                this.requestQuery();
            }
        };
        if (!Connector_1.connector) {
            throw new Error('Conduit-view not yet initalized!');
        }
        this.lastResult = {
            loading: opts.query ? true : false,
            isStale: false,
            data: undefined,
            error: undefined,
            errors: undefined,
        };
        this.query = opts.query instanceof Query_1.ConduitQuery ? opts.query.query : opts.query;
        this.vars = opts.vars;
        this.key = Query_1.getUniqueQueryKey(this.query, this.vars);
        this.queryName = Query_1.getQueryName(this.query);
        this.ownerName = opts.ownerName || '<unknown>';
        this.subscribers = new Map();
        this.debugTrace = opts.debugTrace || false;
        this.trc = conduit_utils_1.createTraceContext(`${this.ownerName}.${this.queryName}`);
        this.subscribers.set(opts.onUpdate, opts.priority);
        this.priority = opts.priority;
        this.requestQuery();
    }
    destructor() {
        this.subscribers = new Map();
        this.query = undefined;
        this.vars = undefined;
        Connector_1.connector.unSubscribe(this.guid).catch(err => {
            logger.error('Watcher.destructor error in unSubscribe', err);
        });
    }
    removeSubscriber(subscriber) {
        this.subscribers.delete(subscriber);
        if (this.subscribers.size === 0) {
            this.active = false;
            Connector_1.connector.setSubscriptionActive(this.guid, false).catch(e => {
                logger.error('Unable to set watcher inactive', e);
            });
        }
        // recompute priority
        this.priority = conduit_utils_1.Priority.LOW;
        for (const [, priority] of this.subscribers.entries()) {
            if (priority !== undefined && priority < this.priority) {
                this.priority = priority;
            }
        }
        return this.subscribers.size;
    }
    addSubscriber(subscriber, priority, newOwnerName) {
        this.subscribers.set(subscriber, priority);
        if (priority < this.priority) {
            this.priority = priority;
        }
        if (!this.active) {
            this.active = true;
            Connector_1.connector.setSubscriptionActive(this.guid, true).catch(e => {
                logger.error('Unable to set watcher active', e);
            });
            this.ownerName = newOwnerName || '<unknown>';
            this.trc = conduit_utils_1.createTraceContext(`${this.ownerName}.${this.queryName}`);
            this.requestQuery();
        }
        subscriber(this.getResult());
    }
    getResult() {
        return this.lastResult;
    }
    getQuery() {
        return this.query;
    }
    getKey() {
        return this.key;
    }
    updateResult(response, doTracing) {
        if (response.isStale || !this.active) {
            // no need to fire any subscriber updates, the isStale flag is used just for new subscribers
            // that's also why it is ok to modify in place
            this.lastResult.isStale = true;
            return;
        }
        const newResult = {
            loading: false,
            data: SimplyImmutable.replaceImmutable(this.lastResult.data, conduit_view_types_1.drillDownIntoResponse(response.data)),
            isStale: false,
            error: response.error,
            errors: response.error ? response.error.errorList.map(e => e.message) : undefined,
        };
        const didChange = newResult.isStale !== this.lastResult.isStale ||
            newResult.loading !== this.lastResult.loading ||
            newResult.data !== this.lastResult.data ||
            conduit_utils_1.diffError(newResult.error, this.lastResult.error);
        if (didChange) {
            doTracing && conduit_utils_1.traceMarker(this.trc, this.queryName, this.vars, 'thread');
            this.lastResult = newResult;
            for (const [subscriber] of this.subscribers.entries()) {
                subscriber(newResult);
            }
        }
    }
    requestQuery() {
        if (!this.query) {
            return;
        }
        const queryRequested = this.query;
        const varsRequested = conduit_utils_1.safeStringify(this.vars);
        let isTracing = true;
        conduit_utils_1.traceEventStart(this.trc, this.queryName, this.vars);
        Connector_1.connector.query(this.query, this.vars || {}, {
            watcherGuid: this.guid,
            priority: this.priority,
            debugTrace: this.debugTrace,
            onUpdate: this.triggerRequery,
        }).then(response => {
            const didTrace = isTracing;
            if (isTracing) {
                conduit_utils_1.traceEventEnd(this.trc, this.queryName);
                isTracing = false;
            }
            if (this.query !== queryRequested || conduit_utils_1.safeStringify(this.vars) !== varsRequested) {
                // outdated response, ignore it
                return;
            }
            if (response.error && response.error.isRetryable() && this.retryCount < MAX_RETRIES) {
                this.retryCount++;
                this.triggerRequery();
                return;
            }
            this.retryCount = 0;
            this.updateResult(response, !didTrace);
        }).catch((e) => {
            // NOTE this should never happen anymore, since connector.query has a try-catch and returns the error in the Promise
            logger.error('Watcher caught query error', e);
        });
    }
}
exports.Watcher = Watcher;
//# sourceMappingURL=Watcher.js.map