"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlags = void 0;
class FeatureFlags {
    /**
     * Create new FeatureFlags, with optional overrides.
     * @param overrides Flags to override defaults.
     */
    constructor(overrides) {
        // **WARNING**: the offline search WON'T work correctly in the case of multiple conduit instances
        // due to the offline search global variables (the same state will be shared accross all instances)
        this.isOfflineSearchEnabled = false;
        this.isMonetizationServiceEnabled = false;
        this.isCalendarServiceEnabled = false;
        this.boardPluginFeatures = undefined; // Must assign to undefined for hasOwnProperty to detect.
        if (overrides) {
            for (const property in overrides) {
                if (this.hasOwnProperty(property)) {
                    this[property] = overrides[property];
                }
            }
        }
    }
}
exports.FeatureFlags = FeatureFlags;
//# sourceMappingURL=FeatureFlags.js.map