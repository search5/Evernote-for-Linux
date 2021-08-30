"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_quasar_connector_1 = require("en-quasar-connector");
const getBoardNode = async (trc, instance, context) => {
    const board = en_quasar_connector_1.convertNsyncEntityToNode(instance, context);
    if (!board) {
        conduit_utils_1.logger.error('Missing initial values');
        return null;
    }
    return {
        nodes: {
            nodesToUpsert: [board],
            nodesToDelete: [],
        },
    };
};
exports.getBoardNode = getBoardNode;
//# sourceMappingURL=BoardConverter.js.map