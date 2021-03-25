"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// These are the types returned from the nsync service to Conduit. They are NOT the same as the protobuf types:
// - there are a couple of fields that undergo conversion when returned from nsync service
// - instanceAttributes are parsed and expanded into fields in nsync service
// - some protobuf stuff is corrected, such as optionality of all fields and Long types converted to number
// See https://source.build.etonreve.com/projects/MS/repos/nsync-service/browse/src/util/document-convertors.ts#163
__exportStar(require("./CommonTypes"), exports);
__exportStar(require("./EntityInstances"), exports);
__exportStar(require("./SyncDocuments"), exports);
__exportStar(require("./SyncInstances"), exports);
//# sourceMappingURL=index.js.map