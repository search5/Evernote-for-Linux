"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getENBoardPlugin = exports.WidgetType = exports.FormFactor = void 0;
const BoardBootstrap_1 = require("./BoardBootstrap");
const BoardConstants_1 = require("./BoardConstants");
const BoardCustomize_1 = require("./BoardCustomize");
const BoardConverter_1 = require("./Converters/BoardConverter");
const WidgetContentConflictConverter_1 = require("./Converters/WidgetContentConflictConverter");
const WidgetConverter_1 = require("./Converters/WidgetConverter");
const Board_1 = require("./EntityTypes/Board");
const Widget_1 = require("./EntityTypes/Widget");
const WidgetContentConflict_1 = require("./EntityTypes/WidgetContentConflict");
const BoardMutators_1 = require("./Mutators/BoardMutators");
const WidgetMutators_1 = require("./Mutators/WidgetMutators");
const NotePin_1 = require("./NotePin");
var BoardConstants_2 = require("./BoardConstants");
Object.defineProperty(exports, "FormFactor", { enumerable: true, get: function () { return BoardConstants_2.FormFactor; } });
Object.defineProperty(exports, "WidgetType", { enumerable: true, get: function () { return BoardConstants_2.WidgetType; } });
const FIVE_MB_BASE64 = 7182747; // ceil(5 MiB limit * 1.37 approximation of average increase) for Base64 encoding without compression.
var NSyncEntityType;
(function (NSyncEntityType) {
    NSyncEntityType[NSyncEntityType["BOARD"] = 12] = "BOARD";
    NSyncEntityType[NSyncEntityType["WIDGET"] = 13] = "WIDGET";
    NSyncEntityType[NSyncEntityType["WIDGET_CONTENT_CONFLICT"] = 18] = "WIDGET_CONTENT_CONFLICT";
})(NSyncEntityType || (NSyncEntityType = {}));
function getENBoardPlugin() {
    return {
        name: 'ENBoard',
        defineMutators: di => {
            const mutators = {
                notePin: NotePin_1.createNotePinDefinition(),
                boardBootstrap: BoardBootstrap_1.createBoardBootstrapDefinition(di),
                boardCustomize: BoardCustomize_1.createBoardCustomizeDefinition(),
            };
            return mutators;
        },
        defineQueries: di => {
            const queries = {
                'Board.headerBG': di.fileResolver(BoardConstants_1.BoardEntityTypes.Board, 'headerBG', false),
                'Board.headerBGPreviousUpload': di.fileResolver(BoardConstants_1.BoardEntityTypes.Board, 'headerBGPreviousUpload', false),
            };
            return queries;
        },
        entityTypes: di => {
            const entityTypes = {
                [BoardConstants_1.BoardEntityTypes.Board]: {
                    typeDef: Board_1.boardTypeDef,
                    indexConfig: Board_1.boardIndexConfig,
                    nsyncConverters: { [NSyncEntityType.BOARD]: BoardConverter_1.getBoardNode },
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
                [BoardConstants_1.BoardEntityTypes.Widget]: {
                    typeDef: Widget_1.widgetTypeDef,
                    indexConfig: Widget_1.createWidgetIndexConfig(di),
                    nsyncConverters: { [NSyncEntityType.WIDGET]: WidgetConverter_1.getWidgetNode },
                },
                [BoardConstants_1.BoardEntityTypes.WidgetContentConflict]: {
                    typeDef: WidgetContentConflict_1.widgetContentConflictTypeDef,
                    indexConfig: WidgetContentConflict_1.widgetContentConflictIndexConfig,
                    nsyncConverters: { [NSyncEntityType.WIDGET_CONTENT_CONFLICT]: WidgetContentConflictConverter_1.getWidgetContentConflictNodeAndEdges },
                },
            };
            return entityTypes;
        },
        mutatorDefs: di => {
            const result = Object.assign(Object.assign({}, BoardMutators_1.createBoardMutators(di)), WidgetMutators_1.createWidgetMutators(di));
            return result;
        },
        mutationRules: di => {
            // BoardRules - Temporarily disabled until we can better control this through a release.
            return [];
        },
    };
}
exports.getENBoardPlugin = getENBoardPlugin;
//# sourceMappingURL=index.js.map