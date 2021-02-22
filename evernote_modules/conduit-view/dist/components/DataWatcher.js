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
exports.DataWatcher = void 0;
const conduit_utils_1 = require("conduit-utils");
const react_1 = require("react");
const Query_1 = require("../Query");
const WatcherManager = __importStar(require("../WatcherManager"));
class DataWatcher extends react_1.PureComponent {
    constructor() {
        super(...arguments);
        this.watchers = {};
        this.activeWatchers = {};
        this.execute = Query_1.execute;
    }
    subscribe(...args) {
        const [query, vars, priority, debugTrace] = args;
        const unwrappedQuery = query instanceof Query_1.ConduitQuery ? query.query : query;
        const dataKey = Query_1.getUniqueQueryKey(unwrappedQuery, vars);
        if (!this.watchers[dataKey]) {
            // bind every time so the correct one can be unsubscribed
            const onUpdate = this.onUpdate.bind(this);
            this.watchers[dataKey] = [WatcherManager.getWatcher({
                    query,
                    vars,
                    priority: priority !== null && priority !== void 0 ? priority : conduit_utils_1.Priority.MEDIUM,
                    onUpdate,
                    debugTrace,
                }), onUpdate];
        }
        this.activeWatchers[dataKey] = true;
        return this.watchers[dataKey][0].getResult();
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        for (const key in this.watchers) {
            if (!this.activeWatchers[key]) {
                WatcherManager.releaseWatcher(...this.watchers[key]);
                delete this.watchers[key];
            }
        }
        // reset activeWatchers for the next render
        this.activeWatchers = {};
    }
    componentWillUnmount() {
        for (const key in this.watchers) {
            WatcherManager.releaseWatcher(...this.watchers[key]);
        }
        this.watchers = {};
    }
    onUpdate() {
        this.forceUpdate();
    }
}
exports.DataWatcher = DataWatcher;
//# sourceMappingURL=DataWatcher.js.map