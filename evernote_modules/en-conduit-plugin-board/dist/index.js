"use strict";
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
exports.getENBoardPlugin = void 0;
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_home_data_model_1 = require("en-home-data-model");
const BoardBootstrap_1 = require("./BoardBootstrap");
const BoardCustomize_1 = require("./BoardCustomize");
const BoardCustomizeVerII_1 = require("./BoardCustomizeVerII");
const BoardConverter_1 = require("./Converters/BoardConverter");
const WidgetContentConflictConverter_1 = require("./Converters/WidgetContentConflictConverter");
const WidgetConverter_1 = require("./Converters/WidgetConverter");
const Board_1 = require("./EntityTypes/Board");
const Widget_1 = require("./EntityTypes/Widget");
const WidgetContentConflict_1 = require("./EntityTypes/WidgetContentConflict");
const BoardMutators_1 = require("./Mutators/BoardMutators");
const WidgetMutators_1 = require("./Mutators/WidgetMutators");
const NotePin_1 = require("./NotePin");
const BoardRules_1 = require("./Rules/BoardRules");
const Utilities = __importStar(require("./Utilities"));
const FIVE_MB_BASE64 = 7182747; // ceil(5 MiB limit * 1.37 approximation of average increase) for Base64 encoding without compression.
function getENBoardPlugin() {
    return {
        name: 'ENBoard',
        defineMutators: di => {
            const mutators = {
                // TODO: Remove this mutation after repackaging.
                notePin: NotePin_1.createNotePinDefinition(),
                boardBootstrap: BoardBootstrap_1.createBoardBootstrapDefinition(di),
                boardCustomize: BoardCustomize_1.createBoardCustomizeDefinition(),
                boardCustomizeVerII: BoardCustomizeVerII_1.createBoardCustomizeVerIIDefinition(),
            };
            return mutators;
        },
        defineQueries: di => {
            const queries = {
                'Board.headerBG': di.fileResolver(en_data_model_1.EntityTypes.Board, 'headerBG', false),
                'Board.headerBGPreviousUpload': di.fileResolver(en_data_model_1.EntityTypes.Board, 'headerBGPreviousUpload', false),
                ['Widget.mutableWidgetType']: {
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Nullable(en_home_data_model_1.MutableWidgetTypeSchema)),
                    resolve: async (widget, _, context) => {
                        const { boardType, mutableWidgetType, } = widget;
                        return Utilities.safeMutableWidgetType(boardType, mutableWidgetType);
                    },
                },
                ['Widget.selectedTab']: {
                    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.Nullable(en_home_data_model_1.WidgetSelectedTabsSchema)),
                    resolve: async (widget, _, context) => {
                        const { widgetType, selectedTab, } = widget;
                        return Utilities.safeSelectedTab(selectedTab, widgetType);
                    },
                },
            };
            return queries;
        },
        entityTypes: di => {
            const entityTypes = {
                [en_data_model_1.EntityTypes.Board]: {
                    typeDef: Board_1.boardTypeDef,
                    indexConfig: Board_1.boardIndexConfig,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.BOARD]: BoardConverter_1.getBoardNode },
                    blobUploadDefs: {
                        headerBG: {
                            customCommandName: 'boardSetHeaderBG',
                            paramIDName: 'board',
                            maxSize: FIVE_MB_BASE64,
                            mimeParam: 'headerBGMime',
                            fileParam: 'headerBGFileName',
                            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                        },
                        headerBGPreviousUpload: {
                            paramIDName: 'board',
                            customCommandName: 'boardSetPreviousHeaderBG',
                            maxSize: FIVE_MB_BASE64,
                            mimeParam: 'headerBGPreviousUploadMime',
                            fileParam: 'headerBGPreviousUploadFileName',
                            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                        },
                    },
                },
                [en_data_model_1.EntityTypes.Widget]: {
                    typeDef: Widget_1.widgetTypeDef,
                    indexConfig: Widget_1.createWidgetIndexConfig(),
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.WIDGET]: WidgetConverter_1.getWidgetNode },
                },
                [en_data_model_1.EntityTypes.WidgetContentConflict]: {
                    typeDef: WidgetContentConflict_1.widgetContentConflictTypeDef,
                    indexConfig: WidgetContentConflict_1.widgetContentConflictIndexConfig,
                    nsyncConverters: { [en_data_model_1.NSyncEntityType.WIDGET_CONTENT_CONFLICT]: WidgetContentConflictConverter_1.getWidgetContentConflictNodeAndEdges },
                },
            };
            return entityTypes;
        },
        mutatorDefs: di => {
            const result = Object.assign(Object.assign({}, BoardMutators_1.createBoardMutators(di)), WidgetMutators_1.createWidgetMutators(di));
            return result;
        },
        mutationRules: di => {
            return BoardRules_1.BoardRules;
        },
    };
}
exports.getENBoardPlugin = getENBoardPlugin;
//# sourceMappingURL=index.js.map