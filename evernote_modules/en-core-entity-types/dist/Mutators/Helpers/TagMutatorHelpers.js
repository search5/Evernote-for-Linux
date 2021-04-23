"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genTagCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const EntityConstants_1 = require("../../EntityConstants");
async function resolveTagLabelConflict(trc, ctx, tagName) {
    const [existingTag] = await ctx.queryGraph(trc, EntityConstants_1.CoreEntityTypes.Tag, 'TagsInSyncContext', { syncContext: ctx.vaultUserID ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, label: tagName, orderBy: 'label' });
    if (conduit_utils_1.isNullish(existingTag)) {
        return tagName;
    }
    // Follow legacy mac client behavior: adding suffix with number(start from 1)
    let suffix = 1;
    let label = `${tagName}_${suffix}`;
    while (true) {
        const [conflictNode] = await ctx.queryGraph(trc, EntityConstants_1.CoreEntityTypes.Tag, 'TagsInSyncContext', { syncContext: ctx.vaultUserID ? conduit_core_1.VAULT_USER_CONTEXT : conduit_core_1.PERSONAL_USER_CONTEXT, label, orderBy: 'label' });
        if (conduit_utils_1.isNullish(conflictNode)) {
            return label;
        }
        suffix++;
        label = `${tagName}_${suffix}`;
    }
}
async function genTagCreate(trc, ctx, params, plan, note = null, key) {
    const owner = note || ctx.vaultUserID || ctx.userID;
    const tagGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Tag, key);
    const label = await resolveTagLabelConflict(trc, ctx, params.name);
    const tagID = tagGenID[1];
    const tagEntity = ctx.createEntity({ id: tagID, type: EntityConstants_1.CoreEntityTypes.Tag }, { label });
    plan.results.result = tagID;
    plan.ops.push({
        changeType: 'Node:CREATE',
        node: tagEntity,
        id: tagGenID,
        remoteFields: {},
    });
    ctx.updateAnalytics({
        tagCreate: {
            category: 'tag',
            action: 'create',
            label: params.creationEventLabel,
        },
    });
    // const profileRef = await getAccountProfileRef(trc, ctx);
    // if (isNullish(profileRef)) {
    //   throw new NotFoundError('', 'Failed to find the current user\'s profile');
    // }
    // plan.ops.push({
    //   changeType: 'Edge:MODIFY',
    //   remoteFields: {},
    //   edgesToCreate: [{
    //     srcID: profileRef.id, srcType: CoreEntityTypes.Profile, srcPort: 'tags',
    //     dstID: tagID, dstType: CoreEntityTypes.Tag, dstPort: 'owner',
    //   }],
    // });
    if (conduit_utils_1.isNotNullish(params.note)) {
        plan.ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: params.note, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'tags',
                    dstID: tagID, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'refs',
                }],
        });
        ctx.updateAnalytics({
            tagAddNote: {
                category: 'tag',
                action: 'apply-to-note',
                label: params.tagAddNoteEventLabel,
                dimensions: {
                    ['tag-guid']: tagID,
                    ['note-guid']: params.note,
                },
            },
        });
    }
    return { tagID };
}
exports.genTagCreate = genTagCreate;
//# sourceMappingURL=TagMutatorHelpers.js.map