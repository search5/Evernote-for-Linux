"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const en_nsync_connector_1 = require("en-nsync-connector");
const getBoardNode = async (trc, instance, context) => {
    const initial = en_nsync_connector_1.createInitialNode(instance);
    if (!initial) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    const board = Object.assign(Object.assign({}, initial), { type: en_data_model_1.EntityTypes.Board, NodeFields: {
            boardType: instance.boardType,
            isCustomized: instance.isCustomized,
            internalID: instance.internalID,
            serviceLevel: instance.serviceLevel,
            created: instance.created,
            updated: instance.updated,
            headerBG: en_nsync_connector_1.toBlobV2Fields(instance.headerBG),
            headerBGMime: instance.headerBGMime,
            headerBGFileName: instance.headerBGFileName,
            headerBGPreviousUpload: en_nsync_connector_1.toBlobV2Fields(instance.headerBGPreviousUpload),
            headerBGPreviousUploadMime: instance.headerBGPreviousUploadMime,
            headerBGPreviousUploadFileName: instance.headerBGPreviousUploadFileName,
            headerBGMode: instance.headerBGMode,
            headerBGColor: instance.headerBGColor,
            greetingText: instance.greetingText,
            freeTrialExpiration: instance.freeTrialExpiration,
            desktop: {
                layout: instance.desktop.layout,
            },
            mobile: {
                layout: instance.mobile.layout,
            },
            calendarVersion: instance.calendarVersion,
            tasksVersion: instance.tasksVersion,
            coreVersion: instance.coreVersion,
            extraVersion: instance.extraVersion,
            filteredNotesVersion: instance.filteredNotesVersion,
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