"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependencyRefsForSN = void 0;
const conduit_utils_1 = require("conduit-utils");
function getDependencyRefsForSN(sn) {
    const scheduling = conduit_utils_1.firstStashEntry(sn.inputs.scheduling);
    const dataSource = conduit_utils_1.firstStashEntry(sn.outputs.dataSource);
    if (!scheduling || !dataSource) {
        return null;
    }
    return {
        schedulingRef: { type: scheduling.srcType, id: scheduling.srcID },
        dataSourceRef: { type: dataSource.dstType, id: dataSource.dstID },
    };
}
exports.getDependencyRefsForSN = getDependencyRefsForSN;
//# sourceMappingURL=ScheduledNotificationUtils.js.map