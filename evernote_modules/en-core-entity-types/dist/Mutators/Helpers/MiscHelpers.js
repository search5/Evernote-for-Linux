"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genEntityLeaveOps = void 0;
const EntityConstants_1 = require("../../EntityConstants");
async function genEntityLeaveOps(trc, ctx, parent, plan) {
    const userMemberships = await ctx.queryGraph(trc, EntityConstants_1.CoreEntityTypes.Membership, 'MembershipsForMeInParent', {
        parent: { id: parent.id, type: parent.type },
    });
    for (const ownMembership of userMemberships) {
        plan.ops.push({
            changeType: 'Node:DELETE',
            nodeRef: { id: ownMembership.id, type: EntityConstants_1.CoreEntityTypes.Membership },
        });
    }
    const shortcuts = Object.values(parent.outputs.shortcut).map(edge => ({ id: edge.dstID, type: edge.dstType }));
    for (const shortcut of shortcuts) {
        plan.ops.push({
            changeType: 'Node:DELETE',
            nodeRef: { id: shortcut.id, type: shortcut.type },
        });
    }
    // run this operation on remote as well to immediately cleanup node in graph
    // instead of having to wait for expunges to come in next downsync cycle.
    plan.ops.push({
        changeType: 'Node:DELETE',
        nodeRef: parent,
        upsyncToDBOnly: true,
    });
}
exports.genEntityLeaveOps = genEntityLeaveOps;
//# sourceMappingURL=MiscHelpers.js.map