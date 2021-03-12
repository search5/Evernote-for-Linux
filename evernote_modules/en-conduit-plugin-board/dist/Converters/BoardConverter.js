"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_nsync_connector_1 = require("en-nsync-connector");
const BoardConstants_1 = require("../BoardConstants");
const getBoardNode = async (trc, instance, context) => {
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const board = Object.assign(Object.assign({}, initial), { type: BoardConstants_1.BoardEntityTypes.Board, NodeFields: {
            boardType: instance.boardType,
            created: instance.created,
            updated: instance.updated,
            headerBG: en_nsync_connector_1.toBlobV2Fields(instance.headerBG),
            headerBGMime: instance.headerBGMime,
            headerBGFileName: instance.headerBGFileName,
            headerBGPreviousUpload: en_nsync_connector_1.toBlobV2Fields(instance.headerBGPreviousUpload),
            headerBGPreviousUploadMime: instance.headerBGPreviousUploadMime,
            headerBGPreviousUploadFileName: instance.headerBGPreviousUploadFileName,
            freeTrialExpiration: instance.freeTrialExpiration,
            desktop: {
                layout: instance.desktop.layout,
            },
            mobile: {
                layout: instance.mobile.layout,
            },
            calendarVersion: instance.calendarVersion,
            tasksVersion: instance.tasksVersion,
        }, inputs: {}, outputs: {
            children: {},
        }, CacheFields: undefined, CacheState: undefined });
    return {
        nodes: {
            nodesToUpsert: [board],
            nodesToDelete: [],
        },
    };
};
exports.getBoardNode = getBoardNode;
//# sourceMappingURL=BoardConverter.js.map