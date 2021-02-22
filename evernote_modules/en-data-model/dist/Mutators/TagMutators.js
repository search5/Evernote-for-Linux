"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagRemoveParent = exports.tagAddChildTag = exports.tagRemoveNote = exports.tagAddNote = exports.tagDelete = exports.tagSetName = exports.tagCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const AccountLimits_1 = require("../AccountLimits");
const CommandPolicyRules_1 = require("../CommandPolicyRules");
const EntityConstants_1 = require("../EntityConstants");
const ShareUtils_1 = require("../ShareUtils");
exports.tagCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        name: 'string',
    },
    optionalParams: {
        note: 'ID',
        creationEventLabel: 'string',
        tagAddNoteEventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        // Check account limit
        const limits = await ctx.fetchEntity(trc, AccountLimits_1.ACCOUNT_LIMITS_REF);
        if (!limits) {
            throw new conduit_utils_1.NotFoundError(AccountLimits_1.ACCOUNT_LIMITS_REF.id, 'Missing limits');
        }
        const count = limits.NodeFields.Counts.userTagCount;
        const max = limits.NodeFields.Limits.userTagCountMax;
        if (count >= max) {
            // TODO: make errors use actual fields once conduit errors are fully separated from thrift errors
            new conduit_utils_1.ServiceError('LIMIT_REACHED', EntityConstants_1.CoreEntityTypes.Tag, 'type=LIMIT_REACHED thriftExceptionParameter=Tag limit=userTagCountMax');
        }
        let note = null;
        if (params.note) {
            note = await ctx.fetchEntity(trc, { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note });
            if (!note) {
                throw new conduit_utils_1.NotFoundError(params.note, 'note id listed is not valid');
            }
            /*
            // race condition in client syncing causes memberships to not be there to check for the
            // container's privilege in some automated tests. Try this again once nsync is in
            const permContext: MutationPermissionContext = new MutationPermissionContext(trc, ctx);
            const policy = await commandPolicyOfNote(note.id, permContext);
            if (!policy.canTag || !policy.canCreateTag) {
              throw new PermissionError('Permission Denied: cannot create tag');
            }
            */
        }
        // determine which account this tag should be created in
        const owner = note || ctx.vaultUserID || ctx.userID;
        const tagGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Tag);
        const tagID = tagGenID[1];
        const tagEntity = ctx.createEntity({ id: tagID, type: EntityConstants_1.CoreEntityTypes.Tag }, {
            label: params.name,
        });
        const plan = {
            result: tagID,
            ops: [{
                    changeType: 'Node:CREATE',
                    node: tagEntity,
                    id: tagGenID,
                    remoteFields: {},
                }],
        };
        ctx.updateAnalytics({
            tagCreate: {
                category: 'tag',
                action: 'create',
                label: params.creationEventLabel,
            },
        });
        if (note) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: note.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'tags',
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
                        ['note-guid']: note.id,
                    },
                },
            });
        }
        return plan;
    },
};
exports.tagSetName = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        tag: 'ID',
        name: 'string',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        if (ctx.vaultUserID) {
            throw new conduit_utils_1.PermissionError('Permission Denied: business cannot update tags');
        }
        const tagRef = { id: params.tag, type: EntityConstants_1.CoreEntityTypes.Tag };
        const tag = await ctx.fetchEntity(trc, tagRef);
        if (!tag) {
            throw new conduit_utils_1.NotFoundError(params.tag, 'Missing tag referenced in tagAddNote');
        }
        const fields = {
            label: params.name,
        };
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:UPDATE',
                    nodeRef: tagRef,
                    node: ctx.assignFields(tagRef.type, fields),
                }],
        };
        ctx.updateAnalytics({
            tagRename: {
                category: 'tag',
                action: 'rename',
                label: params.eventLabel,
                dimensions: {
                    ['tag-guid']: tagRef.id,
                },
            },
        });
        return plan;
    },
};
async function traverseChildrenRecursive(trc, context, root) {
    const list = [root.id];
    const children = await context.traverseGraph(trc, root, [{
            edge: ['outputs', 'children'],
            type: EntityConstants_1.CoreEntityTypes.Tag,
        }]);
    const childrenTags = await context.fetchEntities(trc, EntityConstants_1.CoreEntityTypes.Tag, children.filter(e => e.edge).map(e => e.edge.dstID));
    if (!childrenTags) {
        return list;
    }
    const tags = childrenTags.filter(e => e !== null);
    for (const tag of tags) {
        list.push(...(await traverseChildrenRecursive(trc, context, tag)));
    }
    return list;
}
exports.tagDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        tag: 'ID',
    },
    optionalParams: {
        removeChildren: 'boolean',
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        if (ctx.vaultUserID) {
            throw new conduit_utils_1.PermissionError('Permission Denied: business cannot delete tags');
        }
        const tagRef = { id: params.tag, type: EntityConstants_1.CoreEntityTypes.Tag };
        const tag = await ctx.fetchEntity(trc, tagRef);
        if (!tag) {
            throw new conduit_utils_1.NotFoundError(params.tag, 'Missing tag to delete');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Node:DELETE',
                    nodeRef: tagRef,
                }],
        };
        if (params.removeChildren) {
            // First child is actually the root
            const children = await traverseChildrenRecursive(trc, ctx, tag);
            const ops = [];
            for (const childID of children) {
                ops.push({
                    changeType: 'Node:DELETE',
                    nodeRef: { id: childID, type: EntityConstants_1.CoreEntityTypes.Tag },
                });
                ctx.updateAnalytics({
                    [`tagDelete:${childID}`]: {
                        category: 'tag',
                        action: 'delete',
                        label: params.eventLabel,
                        dimensions: {
                            ['tag-guid']: childID,
                            // TODO(ME) need to check entity owner
                            ['is-content-owner']: tag.syncContexts.includes(conduit_core_1.PERSONAL_USER_CONTEXT),
                        },
                    },
                });
            }
            plan.ops = ops;
        }
        else {
            ctx.updateAnalytics({
                tagDelete: {
                    category: 'tag',
                    action: 'delete',
                    label: params.eventLabel,
                    dimensions: {
                        ['tag-guid']: tag.id,
                        // TODO(ME) need to check entity owner
                        ['is-content-owner']: tag.syncContexts.includes(conduit_core_1.PERSONAL_USER_CONTEXT),
                    },
                },
            });
        }
        return plan;
    },
};
exports.tagAddNote = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        tag: 'ID',
        note: 'ID',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        const tagRef = { id: params.tag, type: EntityConstants_1.CoreEntityTypes.Tag };
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        // fetching for validation... otherwise it looks like it would add a dummy node?
        const tag = await ctx.fetchEntity(trc, tagRef);
        if (!tag) {
            throw new conduit_utils_1.NotFoundError(tagRef.id, 'Missing tag referenced in tagAddNote');
        }
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(noteRef.id, 'Missing note referenced in tagAddNote');
        }
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
        if (!policy.canTag) {
            throw new conduit_utils_1.PermissionError('Permission Denied: cannot add tag');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: noteRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'tags',
                            dstID: tagRef.id, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'refs',
                        }],
                }],
        };
        ctx.updateAnalytics({
            tagAddNote: {
                category: 'tag',
                action: 'apply-to-note',
                label: params.eventLabel,
                dimensions: {
                    ['tag-guid']: tag.id,
                    ['note-guid']: note.id,
                },
            },
        });
        return plan;
    },
};
exports.tagRemoveNote = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        tag: 'ID',
        note: 'ID',
    },
    optionalParams: {
        eventLabel: 'string',
    },
    execute: async (trc, ctx, params) => {
        const tagRef = { id: params.tag, type: EntityConstants_1.CoreEntityTypes.Tag };
        const noteRef = { id: params.note, type: EntityConstants_1.CoreEntityTypes.Note };
        // fetching for validation...
        const tag = await ctx.fetchEntity(trc, tagRef);
        if (!tag) {
            throw new conduit_utils_1.NotFoundError(tagRef.id, 'Missing tag referenced in tagRemoveNote');
        }
        const note = await ctx.fetchEntity(trc, noteRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(noteRef.id, 'Missing note referenced in tagRemoveNote');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            srcID: noteRef.id, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'tags',
                            dstID: tagRef.id, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'refs',
                        }],
                }],
        };
        ctx.updateAnalytics({
            tagAddNote: {
                category: 'tag',
                action: 'remove-from-note',
                label: params.eventLabel,
                dimensions: {
                    ['tag-guid']: tag.id,
                    ['note-guid']: note.id,
                },
            },
        });
        return plan;
    },
};
exports.tagAddChildTag = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        parent: 'ID',
        child: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const parentRef = { id: params.parent, type: EntityConstants_1.CoreEntityTypes.Tag };
        const childRef = { id: params.child, type: EntityConstants_1.CoreEntityTypes.Tag };
        // fetching for validation...
        const parent = await ctx.fetchEntity(trc, parentRef);
        if (!parent) {
            throw new conduit_utils_1.NotFoundError(parentRef.id, 'Missing tag referenced in tagRemoveNote');
        }
        const child = await ctx.fetchEntity(trc, childRef);
        if (!child) {
            throw new conduit_utils_1.NotFoundError(childRef.id, 'Missing tag referenced in tagRemoveNote');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToCreate: [{
                            srcID: parent.id, srcType: EntityConstants_1.CoreEntityTypes.Tag, srcPort: 'children',
                            dstID: child.id, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'parent',
                        }],
                    edgesToDelete: [{
                            // remove any existing parent tag edge on child tag
                            dstID: child.id, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'parent',
                        }],
                }],
        };
        return plan;
    },
};
exports.tagRemoveParent = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        tag: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        const tagRef = { id: params.tag, type: EntityConstants_1.CoreEntityTypes.Tag };
        // fetching for validation...
        const tag = await ctx.fetchEntity(trc, tagRef);
        if (!tag) {
            throw new conduit_utils_1.NotFoundError(params.tag, 'Missing tag referenced in tagRemoveNote');
        }
        const plan = {
            result: null,
            ops: [{
                    changeType: 'Edge:MODIFY',
                    edgesToDelete: [{
                            dstID: tagRef.id, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'parent',
                        }],
                }],
        };
        return plan;
    },
};
//# sourceMappingURL=TagMutators.js.map