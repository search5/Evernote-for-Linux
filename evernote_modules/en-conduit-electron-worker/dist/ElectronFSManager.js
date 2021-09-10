"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronFSManager = void 0;
const conduit_core_1 = require("conduit-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class ElectronFSManager extends conduit_core_1.FileSystemManager {
    joinPath(trc, paths) {
        return path_1.default.join(...paths);
    }
    async deletePathImpl(trc, path) {
        await fs_extra_1.default.remove(path);
    }
}
exports.ElectronFSManager = ElectronFSManager;
//# sourceMappingURL=ElectronFSManager.js.map