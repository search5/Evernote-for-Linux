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
exports.useSubscription = void 0;
const conduit_utils_1 = require("conduit-utils");
const react_1 = require("react");
const simply_immutable_1 = require("simply-immutable");
const Query_1 = require("./Query");
const ViewTracing_1 = require("./ViewTracing");
const WatcherManager = __importStar(require("./WatcherManager"));
const gLoadingResult = {
    loading: true,
    isStale: false,
    data: undefined,
    error: undefined,
    errors: undefined,
};
function useSubscription(...args) {
    const ownerName = ViewTracing_1.getHookOwnerUnstable();
    const [wrappedQuery, newVars, priority, newNoQuery, shouldUseLayoutEffect] = args;
    const noQuery = Boolean(newNoQuery);
    // unwrap ConduitQuery so we can reference compare the memoized result of graphql-tag
    const query = wrappedQuery instanceof Query_1.ConduitQuery ? wrappedQuery.query : wrappedQuery;
    const [lastSubscriptionResult, setLastSubscriptionResult] = react_1.useState({
        result: gLoadingResult,
        query,
        vars: newVars || {},
    });
    // allow shallow compare of vars by using replaceImmutable
    const vars = simply_immutable_1.replaceImmutable(lastSubscriptionResult.vars, newVars || {});
    const resultRef = react_1.useRef(lastSubscriptionResult.result);
    const subscriptionResultIsValid = vars === lastSubscriptionResult.vars && query === lastSubscriptionResult.query;
    if (subscriptionResultIsValid) {
        // lastSubscriptionResult value is updated and matches our current vars and query, so use it
        resultRef.current = lastSubscriptionResult.result;
    }
    else if (!resultRef.current.loading) {
        // lastSubscriptionResult value is wrong, but our current resultRef is also wrong, so change it to have the loading state
        resultRef.current = gLoadingResult;
    }
    const overrideIsStale = react_1.useRef(noQuery);
    if (noQuery) {
        // noQuery=true allows returning the last subscription results if they are valid, but need to make sure isStale is
        // set to true until the next subscriptioin update comes in (after noQuery gets set back to false and the watcher calls onUpdate)
        overrideIsStale.current = true;
    }
    if (overrideIsStale.current && !resultRef.current.loading && !resultRef.current.isStale) {
        // when overrideIsStale is set we need isStale to be set, if not in the loading state
        resultRef.current = simply_immutable_1.updateImmutable(resultRef.current, ['isStale'], true);
    }
    function runQuery() {
        if (noQuery) {
            return () => undefined;
        }
        const onUpdate = (result) => {
            if (result.loading) {
                // always use the same shallow-comparable reference when in the loading state
                result = gLoadingResult;
            }
            // only call setLastSubscriptionResult if it would cause an actual change to the return value of useSubscription; this prevents unecessary rerenders
            if (!conduit_utils_1.isEqual(resultRef.current, result)) {
                overrideIsStale.current = false;
                setLastSubscriptionResult({
                    result,
                    query,
                    vars,
                });
            }
        };
        const watcher = WatcherManager.getWatcher({
            query,
            vars,
            priority: priority !== null && priority !== void 0 ? priority : conduit_utils_1.Priority.MEDIUM,
            onUpdate,
            ownerName,
        });
        return () => {
            WatcherManager.releaseWatcher(watcher, onUpdate);
        };
    }
    if (shouldUseLayoutEffect) {
        react_1.useLayoutEffect(() => {
            return runQuery();
        }, [query, vars, noQuery]);
    }
    else {
        react_1.useEffect(() => {
            return runQuery();
        }, [query, vars, noQuery]);
    }
    return resultRef.current;
}
exports.useSubscription = useSubscription;
//# sourceMappingURL=Hooks.js.map