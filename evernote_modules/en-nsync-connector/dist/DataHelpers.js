"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataHelpers = void 0;
function createDataHelpers(host, resourceManager) {
    return {
        constructFileServiceURL: (path) => {
            if (!resourceManager) {
                return path;
            }
            return resourceManager.constructFileRemoteURL(host, path);
        },
    };
}
exports.createDataHelpers = createDataHelpers;
//# sourceMappingURL=DataHelpers.js.map