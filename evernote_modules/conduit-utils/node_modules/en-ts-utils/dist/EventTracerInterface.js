"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTraceControllerBase = void 0;
const _1 = require("./");
const EventTracer_1 = require("./EventTracer");
class EventTraceControllerBase {
    constructor() {
        this.isFirst = false;
        this.start = 0;
        this.pidCounter = 1;
        this.recorders = {};
        this.pendingFlush = {};
        // always include this process's trace recorder
        this.registerRecorder(EventTracer_1.ProcessTraceRecorder);
    }
    registerRecorder(recorder) {
        const pid = this.pidCounter++;
        this.recorders[pid] = recorder;
        if (this.start) {
            // controller is already tracing, so send the startTracing command immediately
            recorder.startTracing(this, pid, this.start);
        }
    }
    unregisterRecorder(recorder) {
        for (const key in this.recorders) {
            if (this.recorders[key] === recorder) {
                delete this.recorders[key];
                this.recorderFlushed(Number(key));
                break;
            }
        }
    }
    startTracing(config) {
        this.isFirst = true;
        this.start = Date.now() * 1000; // in microseconds;
        if (config.filename) {
            this.openWriteStream(config.filename);
        }
        if (config.statsFor) {
            this.stats = config.statsFor.reduce((stats, name) => {
                stats[name] = {
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    active: [],
                };
                return stats;
            }, {});
        }
        for (const key in this.recorders) {
            const pid = Number(key);
            this.recorders[key].startTracing(this, pid, this.start);
        }
    }
    async stopTracing() {
        // tell recorders to stop and flush
        this.pendingFlush = Object.assign({}, this.recorders);
        if (!_1.isStashEmpty(this.pendingFlush)) {
            this.flushWait = _1.cancellableSleep(2000);
            const p = this.flushWait.promise;
            for (const key in this.pendingFlush) {
                this.pendingFlush[key].stopTracing();
            }
            // wait for recorders to flush
            await p;
        }
        if (!this.isFirst) {
            // close out JSON array
            this.writeData('\n]\n');
        }
        // write the file
        this.closeWriteStream();
        // return stats
        return this.stats || {};
    }
    recorderFlushed(pid) {
        var _a;
        if (!this.flushWait) {
            return;
        }
        delete this.pendingFlush[pid];
        if (_1.isStashEmpty(this.pendingFlush)) {
            (_a = this.flushWait) === null || _a === void 0 ? void 0 : _a.cancel();
            this.flushWait = undefined;
        }
    }
    updateStats(stats, duration) {
        stats.count += 1;
        stats.totalTime += duration;
        stats.avgTime = stats.totalTime / stats.count;
    }
    recordTraceEvents(events) {
        for (const ev of events) {
            if (ev.ph === 'FLUSH') {
                this.recorderFlushed(ev.pid);
                return;
            }
            // try to remove tid collisions between pids
            ev.tid += ev.pid * 1000;
            let prefix = ',\n  ';
            if (this.isFirst) {
                this.writeData('[');
                this.isFirst = false;
                prefix = '\n  ';
            }
            this.writeData(prefix + JSON.stringify(ev));
            if (this.stats && this.stats.hasOwnProperty(ev.name)) {
                const stats = this.stats[ev.name];
                switch (ev.ph) {
                    case 'B':
                    case 'b':
                        stats.active.push(ev);
                        break;
                    case 'E':
                    case 'e':
                        // find matching B/b event
                        const targetPhase = ev.ph === 'E' ? 'B' : 'b';
                        let startEvent = null;
                        for (let i = stats.active.length - 1; i >= 0; --i) {
                            const aEvent = stats.active[i];
                            if (aEvent.ph === targetPhase && aEvent.pid === ev.pid && aEvent.tid === ev.tid && aEvent.id === ev.id) {
                                startEvent = aEvent;
                                stats.active.splice(i, 1);
                                break;
                            }
                        }
                        if (startEvent) {
                            this.updateStats(stats, ev.ts - startEvent.ts);
                        }
                        break;
                    case 'X':
                        this.updateStats(stats, ev.dur);
                        break;
                    case 'i':
                        this.updateStats(stats, 0);
                        break;
                }
            }
        }
    }
}
exports.EventTraceControllerBase = EventTraceControllerBase;
//# sourceMappingURL=EventTracerInterface.js.map