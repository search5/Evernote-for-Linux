"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncTracePool = exports.traceAsync = exports.traceMarker = exports.traceTestCounts = exports.traceCounts = exports.traceEventEndWhenSettled = exports.traceEventEnd = exports.traceEventStart = exports.createTraceContext = exports.ProcessTraceRecorder = void 0;
const _1 = require("./");
const EVENTS_PER_BATCH = 50;
let gTracingState = null;
class EventTraceRecorderImpl {
    constructor() {
        this.controller = null;
        this.events = [];
    }
    startTracing(controller, pid, start) {
        this.controller = controller;
        gTracingState = {
            pid,
            start,
            recordedThreadMetadatas: {},
        };
    }
    stopTracing() {
        const pid = gTracingState === null || gTracingState === void 0 ? void 0 : gTracingState.pid;
        const controller = this.controller;
        const events = this.events;
        gTracingState = null;
        this.controller = null;
        this.events = [];
        if (!pid || !controller) {
            return;
        }
        events.push({
            ph: 'FLUSH',
            pid,
        });
        controller.recordTraceEvents(events);
    }
    pushEvent(ev) {
        if (!this.controller) {
            return;
        }
        this.events.push(ev);
        if (this.events.length >= EVENTS_PER_BATCH) {
            this.controller.recordTraceEvents(this.events);
            this.events = [];
        }
    }
}
exports.ProcessTraceRecorder = new EventTraceRecorderImpl();
let gThreadCounter = 0;
let gLastTime = 0;
function time() {
    const now = Date.now() * 1000; // in microseconds
    if (gLastTime < now) {
        gLastTime = now;
    }
    else {
        gLastTime++;
    }
    if (gTracingState) {
        return gLastTime - gTracingState.start;
    }
    return gLastTime;
}
function createTraceContext(name, testEventTracker = null) {
    return {
        name,
        threadName: name,
        tid: ++gThreadCounter,
        testEventTracker,
    };
}
exports.createTraceContext = createTraceContext;
function warmupTraceContext(trc) {
    if (!gTracingState) {
        return;
    }
    if (!gTracingState.recordedThreadMetadatas[trc.tid]) {
        gTracingState.recordedThreadMetadatas[trc.tid] = trc.threadName;
        exports.ProcessTraceRecorder.pushEvent({
            ph: 'M',
            name: 'thread_name',
            pid: gTracingState.pid,
            tid: trc.tid,
            args: {
                name: trc.threadName,
            },
        });
    }
}
function traceEventStart(trc, name, args) {
    if (!gTracingState) {
        return;
    }
    warmupTraceContext(trc);
    exports.ProcessTraceRecorder.pushEvent({
        ph: trc.id ? 'b' : 'B',
        name,
        ts: time(),
        pid: gTracingState.pid,
        tid: trc.tid,
        id: trc.id,
        cat: 'default',
        args: args || {},
    });
}
exports.traceEventStart = traceEventStart;
function traceEventEnd(trc, name, err) {
    if (!gTracingState) {
        return;
    }
    exports.ProcessTraceRecorder.pushEvent({
        ph: trc.id ? 'e' : 'E',
        name,
        ts: time(),
        pid: gTracingState.pid,
        tid: trc.tid,
        id: trc.id,
        cat: 'default',
        args: !err ? undefined : {
            err: String(err),
        },
    });
}
exports.traceEventEnd = traceEventEnd;
async function traceEventEndWhenSettled(trc, name, p) {
    if (!gTracingState) {
        return p;
    }
    const res = await _1.withError(p);
    traceEventEnd(trc, name, res.err);
    return _1.unwrapErrOrData(res);
}
exports.traceEventEndWhenSettled = traceEventEndWhenSettled;
function traceCounts(trc, name, deltas) {
    if (!gTracingState) {
        return;
    }
    warmupTraceContext(trc);
    exports.ProcessTraceRecorder.pushEvent({
        ph: 'C',
        name,
        ts: time(),
        pid: gTracingState.pid,
        tid: trc.tid,
        cat: 'default',
        args: deltas,
    });
}
exports.traceCounts = traceCounts;
function traceTestCounts(trc, deltas) {
    if (!trc.testEventTracker) {
        return;
    }
    for (const key in deltas) {
        trc.testEventTracker[key] = (trc.testEventTracker[key] || 0) + deltas[key];
    }
}
exports.traceTestCounts = traceTestCounts;
function traceMarker(trc, name, args, scope = 'process') {
    if (!gTracingState) {
        return;
    }
    warmupTraceContext(trc);
    exports.ProcessTraceRecorder.pushEvent({
        ph: 'i',
        name,
        ts: time(),
        pid: gTracingState.pid,
        tid: trc.tid,
        id: trc.id,
        s: scope === 'process' ? 'p' : 't',
        cat: 'default',
        args: args || {},
    });
}
exports.traceMarker = traceMarker;
function traceAsync(target, ...decoratorArgs) {
    if (typeof target === 'string') {
        // when called with a string it is being used as a factory
        return (t, pk, d) => {
            if (target) {
                pk = target + '.' + pk;
            }
            return traceAsync(t, pk, d, decoratorArgs);
        };
    }
    const propertyKey = decoratorArgs[0];
    const descriptor = decoratorArgs[1];
    const loggedArgNames = decoratorArgs[2];
    const method = descriptor.value;
    descriptor.value = function (...methodArgs) {
        const trc = methodArgs[0];
        let eventArgs;
        if (gTracingState && loggedArgNames && loggedArgNames.length) {
            eventArgs = {};
            for (let i = 0; i < loggedArgNames.length; ++i) {
                const name = loggedArgNames[i];
                const arg = methodArgs[i + 1];
                if (name) {
                    eventArgs[name] = (name.endsWith('Count') && Array.isArray(arg)) ? arg.length : arg;
                }
            }
        }
        traceEventStart(trc, propertyKey, eventArgs);
        return traceEventEndWhenSettled(trc, propertyKey, method.apply(this, methodArgs));
    };
}
exports.traceAsync = traceAsync;
class AsyncTracePool {
    constructor(name) {
        this.name = name;
        this.asyncPool = [];
        this.count = 0;
    }
    destructor() {
        this.asyncPool = [];
    }
    alloc(testEventTracker = null) {
        let trc = this.asyncPool.shift();
        if (!trc) {
            trc = createTraceContext(`${this.name}[${this.count++}]`, null);
        }
        trc.testEventTracker = testEventTracker;
        return trc;
    }
    async runTraced(testEventTracker, func) {
        const trc = this.alloc(testEventTracker);
        return this.releaseWhenSettled(trc, func(trc));
    }
    release(trc) {
        this.asyncPool.unshift(trc);
    }
    async releaseWhenSettled(trc, p) {
        const res = await _1.withError(p);
        this.release(trc);
        return _1.unwrapErrOrData(res);
    }
}
exports.AsyncTracePool = AsyncTracePool;
//# sourceMappingURL=EventTracer.js.map