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
exports.registerBoardWidgetUntitledMigration = exports.updateUntitledBoardWidgets = void 0;
const en_data_model_1 = require("en-data-model");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Migrations_1 = require("../SyncFunctions/Migrations");
async function updateUntitledBoardWidgets(trc, tx) {
    const widgets = await tx.getGraphNodesByType(trc, null, en_data_model_1.EntityTypes.Widget);
    const boards = await tx.getGraphNodesByType(trc, null, en_data_model_1.EntityTypes.Board);
    const conflicts = await tx.getGraphNodesByType(trc, null, en_data_model_1.EntityTypes.WidgetContentConflict);
    for (const node of [...widgets, ...boards, ...conflicts]) {
        if (node.label !== 'Untitled') {
            continue;
        }
        const syncContext = node.syncContexts[0];
        const newNode = SimplyImmutable.replaceImmutable(node, ['label'], '');
        await tx.replaceNode(trc, syncContext, newNode);
    }
}
exports.updateUntitledBoardWidgets = updateUntitledBoardWidgets;
function registerBoardWidgetUntitledMigration() {
    // conduit v2 - remove widget labels that have "Untitled" as the label
    Migrations_1.registerMigrationFunctionByName('BoardWidget-Untitled-1.39', async (trc, params) => {
        await params.syncEngine.transact(trc, 'SchemaMigration: BoardWidget-Untitled-1.39', async (tx) => {
            await updateUntitledBoardWidgets(trc, tx);
        });
    });
}
exports.registerBoardWidgetUntitledMigration = registerBoardWidgetUntitledMigration;
//# sourceMappingURL=BoardWidgetMigrations.js.map