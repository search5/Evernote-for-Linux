"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.getNoteImportPlugin = void 0;
const NoteImportMutators = __importStar(require("./Mutators/NoteImportMutators"));
const NoteCopy_1 = require("./NoteCopy");
const NoteImport_1 = require("./NoteImport");
function getNoteImportPlugin(thriftComm) {
    return {
        name: 'NoteImport',
        defineMutators: () => (Object.assign({ noteImport: NoteImport_1.noteImportPlugin }, NoteCopy_1.getNoteCopyPlugin(thriftComm))),
        mutatorDefs: () => {
            return Object.assign({}, NoteImportMutators);
        },
    };
}
exports.getNoteImportPlugin = getNoteImportPlugin;
//# sourceMappingURL=index.js.map