"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
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
exports.registerRenameNoteContentInfoTaskGroups = void 0;
const SimplyImmutable = __importStar(require("simply-immutable"));
const Migrations_1 = require("../SyncFunctions/Migrations");
function registerRenameNoteContentInfoTaskGroups() {
    Migrations_1.registerMigrationFunctionByName('NCI-rename-taskgroup-1.29', async (trc, params) => {
        await params.syncEngine.transact(trc, 'SchemaMigration: NCI-rename-taskgroup-1.29', async (tx) => {
            const oldNodes = await tx.getGraphNodesByType(trc, null, 'NoteContentInfo');
            for (let node of oldNodes) {
                if (!node.syncContexts.length) {
                    continue;
                }
                node = SimplyImmutable.updateImmutable(node, ['NodeFields', 'taskGroupNoteLevelIDs'], node.NodeFields.taskGroups);
                node = SimplyImmutable.deleteImmutable(node, ['NodeFields', 'taskGroups']);
                await tx.replaceNode(trc, node.syncContexts[0], node);
            }
        });
    });
}
exports.registerRenameNoteContentInfoTaskGroups = registerRenameNoteContentInfoTaskGroups;
//# sourceMappingURL=NoteContentInfoRenameTaskGroups.js.map