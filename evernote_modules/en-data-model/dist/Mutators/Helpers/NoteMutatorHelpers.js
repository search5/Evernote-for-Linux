"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genNoteCreate = exports.genNoteMoveToTrashOps = exports.getContainerForCreate = exports.canWriteNoteToContainer = exports.fetchContainer = exports.getNoteParentID = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const CommandPolicyRules_1 = require("../../CommandPolicyRules");
const EntityConstants_1 = require("../../EntityConstants");
const ShareUtils_1 = require("../../ShareUtils");
const Profile_1 = require("./Profile");
function getNoteParentID(note) {
    const parentEdge = conduit_utils_1.firstStashEntry(note.inputs.parent);
    return parentEdge ? parentEdge.srcID : null;
}
exports.getNoteParentID = getNoteParentID;
async function fetchContainer(trc, ctx, containerID) {
    // container type is unknown so attempt fetching both known types
    let container = await ctx.fetchEntity(trc, { id: containerID, type: EntityConstants_1.CoreEntityTypes.Notebook });
    if (!container) {
        container = await ctx.fetchEntity(trc, { id: containerID, type: EntityConstants_1.CoreEntityTypes.Workspace });
    }
    return container;
}
exports.fetchContainer = fetchContainer;
async function canWriteNoteToContainer(trc, ctx, container) {
    if (!container) {
        return false;
    }
    // TODO permissions checks
    return true;
}
exports.canWriteNoteToContainer = canWriteNoteToContainer;
async function getContainerForCreate(trc, ctx, containerID) {
    if (containerID) {
        const container = await fetchContainer(trc, ctx, containerID);
        if (await canWriteNoteToContainer(trc, ctx, container)) {
            return container;
        }
    }
    const defaultNotebook = await ctx.traverseGraph(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: EntityConstants_1.CoreEntityTypes.User }, [{
            edge: ['outputs', 'defaultNotebook'],
            type: EntityConstants_1.CoreEntityTypes.Notebook,
        }]);
    if (defaultNotebook.length) {
        const container = await ctx.fetchEntity(trc, defaultNotebook[0]);
        if (await canWriteNoteToContainer(trc, ctx, container)) {
            return container;
        }
    }
    const userNotebook = await ctx.traverseGraph(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: EntityConstants_1.CoreEntityTypes.User }, [{
            edge: ['outputs', 'userNotebook'],
            type: EntityConstants_1.CoreEntityTypes.Notebook,
        }]);
    if (userNotebook.length) {
        const container = await ctx.fetchEntity(trc, userNotebook[0]);
        if (await canWriteNoteToContainer(trc, ctx, container)) {
            return container;
        }
    }
    return null;
}
exports.getContainerForCreate = getContainerForCreate;
async function genNoteMoveToTrashOps(trc, ctx, noteRef, ops, targetContainer) {
    const note = await ctx.fetchEntity(trc, noteRef);
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteRef.id, 'Missing note to delete');
    }
    const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
    const policy = await CommandPolicyRules_1.commandPolicyOfNote(note.id, permContext);
    if (!policy.canMoveToTrash) {
        throw new conduit_utils_1.PermissionError('Permission Denied: cannot move note to trash');
    }
    const noteOwner = await ctx.resolveOwnerRef(trc, note);
    const isSharedWithMe = noteOwner !== ctx.userID && (!ctx.vaultUserID || noteOwner !== ctx.vaultUserID);
    const parentID = getNoteParentID(note);
    let container = targetContainer || null;
    if (!container) {
        container = parentID ? await fetchContainer(trc, ctx, parentID) : null;
    }
    if (!isSharedWithMe || !ctx.isOptimistic) {
        const fields = {
            deleted: ctx.thriftTimestamp,
        };
        const node = ctx.assignFields(EntityConstants_1.CoreEntityTypes.Note, fields);
        ops.push({
            changeType: 'Node:UPDATE',
            nodeRef: noteRef,
            node,
        });
    }
    else {
        ops.push({
            changeType: 'Node:DELETE',
            nodeRef: noteRef,
        });
        return;
    }
    if (!ctx.isOptimistic) {
        return;
    }
    ops.push({
        changeType: 'Edge:MODIFY',
        edgesToCreate: [],
        edgesToDelete: [{ dstID: note.id, dstPort: 'parent', dstType: note.type }],
    });
    if ((container === null || container === void 0 ? void 0 : container.type) === EntityConstants_1.CoreEntityTypes.Workspace) {
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: container.id, srcType: container.type, srcPort: 'childrenInTrash',
                    dstID: note.id, dstType: note.type, dstPort: 'parent',
                }],
            edgesToDelete: [],
        });
    }
    else if ((container === null || container === void 0 ? void 0 : container.type) === EntityConstants_1.CoreEntityTypes.Notebook) {
        ops.push({
            changeType: 'Edge:MODIFY',
            edgesToCreate: [{
                    srcID: container.id, srcType: container.type, srcPort: 'childrenInTrash',
                    dstID: note.id, dstType: note.type, dstPort: 'parent',
                }],
        });
    }
    const tags = await ctx.traverseGraph(trc, noteRef, [{ edge: ['outputs', 'tags'], type: EntityConstants_1.CoreEntityTypes.Tag }]);
    ops.push({
        changeType: 'Edge:MODIFY',
        edgesToCreate: tags.map(tag => {
            return {
                srcID: note.id, srcType: note.type, srcPort: 'tags',
                dstID: tag.id, dstType: tag.type, dstPort: 'refsInTrash',
            };
        }),
        edgesToDelete: tags.map(tag => {
            return {
                srcID: note.id, srcType: note.type, srcPort: 'tags',
                dstID: tag.id, dstType: tag.type, dstPort: 'refs',
            };
        }),
    });
}
exports.genNoteMoveToTrashOps = genNoteMoveToTrashOps;
async function genNoteCreate(trc, ctx, params, plan) {
    var _a, _b, _c, _d, _e;
    const container = await getContainerForCreate(trc, ctx, (_a = params.container) !== null && _a !== void 0 ? _a : null);
    if (!container) {
        throw new conduit_utils_1.NotFoundError('no valid container specified or available');
    }
    /*
    // race condition in client syncing causes memberships to not be there to check for the
    // container's privilege in some automated tests. Try this again once nsync is in
    const permContext: MutationPermissionContext = new MutationPermissionContext(trc, ctx);
    const policy = container.type === CoreEntityTypes.Notebook ?
      await commandPolicyOfNotebook(container.id, permContext) :
      await commandPolicyOfSpace(container.id, permContext);
    if (!policy.canCreateNote) {
      throw new PermissionError(`Permission Denied: cannot create Note in ${container.type}`);
    }
    */
    // we also need to know syncContext at the moment (determines shardID to create the note on)
    const user = await ctx.fetchEntity(trc, { id: conduit_core_1.PERSONAL_USER_ID, type: EntityConstants_1.CoreEntityTypes.User });
    if (!user) {
        throw new conduit_utils_1.NotFoundError(conduit_core_1.PERSONAL_USER_ID, 'Missing user in note creation');
    }
    const owner = container;
    let noteGenID = await ctx.generateID(trc, owner, EntityConstants_1.CoreEntityTypes.Note);
    if (params.noteGenID) {
        if (noteGenID[2].toString() !== params.noteGenID[2]) {
            throw new conduit_utils_1.InternalError(`noteCreate picked a different owner (${noteGenID[2]}) from the one passed in to the mutator (${params.noteGenID[2]})`);
        }
        noteGenID = [
            params.noteGenID[0],
            params.noteGenID[1],
            noteGenID[2],
            noteGenID[3],
        ];
    }
    const noteID = noteGenID[1];
    // NOTE: could specify this just as a delta if the underlying system created the node with defaults, but for now use a function
    const noteEntity = ctx.createEntity({ id: noteID, type: EntityConstants_1.CoreEntityTypes.Note }, {
        label: params.label || params.untitledNoteLabel,
        created: params.created || ctx.thriftTimestamp,
        updated: params.updated || ctx.thriftTimestamp,
        isUntitled: !params.label,
        internal_shareCountProfiles: {},
        ['Attributes.subjectDate']: params.subjectDate,
        ['Attributes.contentClass']: params.contentClass,
        ['Attributes.Location.latitude']: params.latitude,
        ['Attributes.Location.longitude']: params.longitude,
        ['Attributes.Location.altitude']: params.altitude,
        ['Attributes.Location.placeName']: params.placeName,
        ['Attributes.Reminder.reminderTime']: params.reminderTime,
        ['Attributes.Reminder.reminderDoneTime']: params.reminderDoneTime,
        ['Attributes.Reminder.reminderOrder']: params.reminderOrder,
        ['Attributes.Editor.author']: params.author || user.NodeFields.name,
        ['Attributes.Source.source']: params.source,
        ['Attributes.Source.sourceURL']: params.sourceUrl,
        ['Attributes.Source.sourceApplication']: params.sourceApplication,
    });
    const createRemoteFields = {
        applicationData: (_b = params.applicationData) !== null && _b !== void 0 ? _b : null,
        attachmentHashes: (_c = params.attachmentHashes) !== null && _c !== void 0 ? _c : [],
        notebookID: container.type === EntityConstants_1.CoreEntityTypes.Notebook ? container.id : null,
        workspaceID: container.type === EntityConstants_1.CoreEntityTypes.Workspace ? container.id : null,
        tagIDs: (_d = params.tags) !== null && _d !== void 0 ? _d : [],
        sourceNoteID: (_e = params.sourceNoteID) !== null && _e !== void 0 ? _e : null,
    };
    plan.ops.push({
        changeType: 'Node:CREATE',
        node: noteEntity,
        id: noteGenID,
        remoteFields: createRemoteFields,
        blobs: {
            content: {
                content: params.noteContent,
            },
        },
    });
    plan.ops.push({
        changeType: 'Edge:MODIFY',
        remoteFields: {},
        edgesToCreate: [{
                srcID: container.id, srcType: container.type, srcPort: 'children',
                dstID: noteID, dstType: EntityConstants_1.CoreEntityTypes.Note, dstPort: 'parent',
            }],
    });
    for (const tagID of (params.tags || [])) {
        // NOTE: assumes that the graph or plan validation will check if the targeted tags actually exist
        plan.ops.push({
            changeType: 'Edge:MODIFY',
            remoteFields: {},
            edgesToCreate: [{
                    srcID: noteID, srcType: EntityConstants_1.CoreEntityTypes.Note, srcPort: 'tags',
                    dstID: tagID, dstType: EntityConstants_1.CoreEntityTypes.Tag, dstPort: 'refs',
                }],
        });
    }
    if (ctx.isOptimistic) {
        const profile = await Profile_1.getAccountProfileRef(trc, ctx);
        if (profile) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: noteID, srcType: noteEntity.type, srcPort: 'creator',
                        dstID: profile.id, dstType: profile.type, dstPort: null,
                    }],
            });
        }
    }
    if (params.deleteSourceNote && params.sourceNoteID) {
        // delete needs to happen last, after attachment uploads for note copy (because the upload might need to read data from the source note)
        plan.lateOps = plan.lateOps || [];
        const permContext = new ShareUtils_1.MutationPermissionContext(trc, ctx);
        const policy = await CommandPolicyRules_1.commandPolicyOfNote(params.sourceNoteID, permContext);
        if (policy.canExpunge) {
            plan.lateOps.push({
                changeType: 'Node:DELETE',
                nodeRef: {
                    id: params.sourceNoteID,
                    type: EntityConstants_1.CoreEntityTypes.Note,
                },
            });
        }
        else if (policy.canMoveToTrash) {
            await genNoteMoveToTrashOps(trc, ctx, { id: params.sourceNoteID, type: EntityConstants_1.CoreEntityTypes.Note }, plan.lateOps);
        }
    }
    return { noteID, owner };
}
exports.genNoteCreate = genNoteCreate;
//# sourceMappingURL=NoteMutatorHelpers.js.map