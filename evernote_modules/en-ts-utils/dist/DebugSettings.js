"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDebugSetting = exports.initDebugSettings = void 0;
const gValues = {};
const gInterface = {
    resetAll: () => {
        for (const key in gValues) {
            // calls the setter defined in registerDebugSetting
            gInterface[key] = undefined;
        }
    },
};
let gPersistFunc = null;
try {
    global.__enDebug = gInterface; // Slightly conduit specific thing here, but a lot depends on this
}
catch (_) {
    // ignore
}
function initDebugSettings(persistedValues, persistFunc) {
    for (const key in persistedValues) {
        gInterface[key] = persistedValues[key];
    }
    gPersistFunc = persistFunc;
}
exports.initDebugSettings = initDebugSettings;
function registerDebugSetting(name, defaultValue, onChange) {
    if (gInterface.hasOwnProperty(name)) {
        return gInterface[name];
    }
    Object.defineProperty(gInterface, name, {
        get: () => {
            let value = gValues[name];
            if (value === undefined) {
                value = defaultValue;
            }
            return value;
        },
        set: (newValue) => {
            if (newValue === undefined) {
                delete gValues[name];
                newValue = defaultValue;
            }
            else {
                gValues[name] = newValue;
            }
            gPersistFunc && gPersistFunc(gValues);
            onChange(newValue);
        },
    });
    return gInterface[name];
}
exports.registerDebugSetting = registerDebugSetting;
//# sourceMappingURL=DebugSettings.js.map