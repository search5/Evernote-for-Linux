"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteMerge = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_thrift_connector_1 = require("en-thrift-connector");
const Helpers_1 = require("./Helpers");
const NOTE_CONTENT_START_MARKER = '<en-note>';
const NOTE_CONTENT_END_MARKER = '</en-note>';
function getSanitizedLabel(label) {
    return label
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function getCombinedInnerContent(notes, separateContent, keepLabels) {
    let combinedContent = '';
    notes.forEach((note, noteIndex) => {
        if (note.content) {
            const startIndex = note.content.indexOf(NOTE_CONTENT_START_MARKER);
            const endIndex = note.content.indexOf(NOTE_CONTENT_END_MARKER);
            if (startIndex === -1 || endIndex === -1) {
                conduit_utils_1.logger.warn(`Note content in unexpected format for note ${note.label}`);
                return;
            }
            let content = note.content.slice(startIndex + NOTE_CONTENT_START_MARKER.length, endIndex);
            if (keepLabels) {
                content = `<h1><b>${getSanitizedLabel(note.label)}</b></h1><div><br /></div>${content}`;
            }
            if (separateContent && noteIndex !== notes.length - 1) {
                content = `${content}<div><br /></div><hr />`;
            }
            combinedContent += content;
        }
    });
    return combinedContent;
}
function getMergedContent(notes, separateContent, keepLabels) {
    const combinedInnerContent = getCombinedInnerContent(notes, separateContent, keepLabels);
    return `<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>${combinedInnerContent}</en-note>`;
}
async function getBestContainer(context, notes, containerID) {
    var _a, _b;
    conduit_core_1.validateDB(context);
    if (containerID) {
        const containerContext = await conduit_utils_1.withError(Helpers_1.getSyncContextForContainer(context, containerID));
        if (containerContext.data) {
            return { syncContext: containerContext.data, containerID };
        }
    }
    for (const note of notes) {
        if (!note) {
            continue;
        }
        const parentID = (_b = (_a = conduit_utils_1.firstStashEntry(note.inputs.parent)) === null || _a === void 0 ? void 0 : _a.srcID) !== null && _b !== void 0 ? _b : null;
        if (parentID) {
            const containerContext = await conduit_utils_1.withError(Helpers_1.getSyncContextForContainer(context, parentID));
            if (containerContext.data) {
                return { syncContext: containerContext.data, containerID: parentID };
            }
        }
    }
    // revert to default notebook.
    const defaultNotebook = await context.db.traverseGraph(context, { id: conduit_core_1.PERSONAL_USER_ID, type: en_core_entity_types_1.CoreEntityTypes.User }, [{
            edge: ['outputs', 'defaultNotebook'],
            type: en_core_entity_types_1.CoreEntityTypes.Notebook,
        }]);
    if (!defaultNotebook.length) {
        throw new conduit_utils_1.NotFoundError(containerID || '', 'Could not fetch target container nor default notebook for merged note');
    }
    containerID = defaultNotebook[0].id;
    const syncContext = await Helpers_1.getSyncContextForContainer(context, containerID);
    return { syncContext, containerID };
}
async function noteMergeResolver(parent, args, context, info) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    conduit_core_1.validateDB(context);
    if (args.noteIDs.length < 2) {
        throw new conduit_utils_1.InvalidParameterError('Need at least 2 notes for merge operation');
    }
    let sourceNote = null;
    const failedNotes = [];
    const noteContentAndLabels = [];
    const attachmentDatas = {};
    const tags = new Set();
    const taskGroupNoteLevelIDs = new Set();
    const tasks = [];
    const newTagLabels = new Set();
    const notes = await context.db.batchGetNodes(context, en_core_entity_types_1.CoreEntityTypes.Note, args.noteIDs);
    const { syncContext, containerID } = await getBestContainer(context, notes, args.container);
    const syncContextMetadata = await context.db.getSyncContextMetadata(context, syncContext);
    if (!syncContextMetadata) {
        throw new conduit_utils_1.NotFoundError(syncContext, 'SyncContextMetadata not found');
    }
    const userID = syncContextMetadata.userID;
    // generate noteID and seed
    const noteGenID = conduit_core_1.GuidGenerator.generateID(userID, en_core_entity_types_1.CoreEntityTypes.Note);
    noteGenID.push(userID.toString());
    const noteID = noteGenID[1];
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note) {
            conduit_utils_1.logger.warn(`noteMerge: note ${args.noteIDs[i]} not found in graph. Ignoring note.`);
            failedNotes.push(args.noteIDs[i]);
            continue;
        }
        const noteSyncContext = await context.db.getBestSyncContextForNode(context.trc, note);
        const noteSyncContextMetadata = await context.db.getSyncContextMetadata(context, noteSyncContext);
        if (!noteSyncContextMetadata) {
            conduit_utils_1.logger.warn(`noteMerge: failed to fetch syncContext metadata. Ignoring note ${note.id} `);
            failedNotes.push(note.id);
            continue;
        }
        const noteAuth = en_thrift_connector_1.decodeAuthData(noteSyncContextMetadata.authToken);
        const { data: noteData, err } = await conduit_utils_1.withError(Helpers_1.getInfoFromNote(context, noteAuth, note, noteSyncContextMetadata, noteSyncContext, userID, noteID, syncContext, false, info));
        if (!noteData || err) {
            conduit_utils_1.logger.warn(`Merge note failed to fetch note info for note. Ignoring note ${note.id} `, err);
            failedNotes.push(note.id);
            continue;
        }
        const { noteContent, tags: noteTags, tagLabelsToCreate, attachmentDatas: noteAttachmentDatas, tasksData: noteTasksData, } = noteData;
        noteContentAndLabels.push({ content: noteContent, label: note.label });
        noteTags.forEach(tag => tags.add(tag));
        tagLabelsToCreate.forEach(label => newTagLabels.add(label));
        noteAttachmentDatas.forEach(data => {
            if (!attachmentDatas[data.hash]) {
                attachmentDatas[data.hash] = data;
            }
        });
        if (noteTasksData) {
            tasks.push(...noteTasksData.tasks);
            noteTasksData.taskGroupNoteLevelIDs.forEach(id => taskGroupNoteLevelIDs.add(id));
        }
        if (!sourceNote) {
            sourceNote = note;
        }
    }
    const mergedContent = getMergedContent(noteContentAndLabels, args.separateContent, args.keepLabels);
    const tasksData = tasks.length ? { taskGroupNoteLevelIDs: Array.from(taskGroupNoteLevelIDs), tasks } : null;
    // dispatch noteImportInternal mutator
    const mutatorParams = {
        noteGenID,
        noteContent: mergedContent,
        tasksData: tasksData ? conduit_utils_1.safeStringify(tasksData) : undefined,
        untitledNoteLabel: args.label,
        attachments: conduit_utils_1.safeStringify(Object.values(attachmentDatas)),
        tags: Array.from(tags),
        newTagLabels: Array.from(newTagLabels),
        container: containerID,
        label: args.label,
        created: (_a = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.created) !== null && _a !== void 0 ? _a : Date.now(),
        subjectDate: (_b = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.subjectDate) !== null && _b !== void 0 ? _b : undefined,
        contentClass: (_c = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.contentClass) !== null && _c !== void 0 ? _c : undefined,
        latitude: (_d = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Location.latitude) !== null && _d !== void 0 ? _d : undefined,
        longitude: (_e = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Location.longitude) !== null && _e !== void 0 ? _e : undefined,
        altitude: (_f = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Location.altitude) !== null && _f !== void 0 ? _f : undefined,
        placeName: (_g = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Location.placeName) !== null && _g !== void 0 ? _g : undefined,
        author: (_h = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Editor.author) !== null && _h !== void 0 ? _h : undefined,
        source: (_j = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Source.source) !== null && _j !== void 0 ? _j : undefined,
        sourceUrl: (_k = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Source.sourceURL) !== null && _k !== void 0 ? _k : undefined,
        sourceApplication: (_l = sourceNote === null || sourceNote === void 0 ? void 0 : sourceNote.NodeFields.Attributes.Source.sourceApplication) !== null && _l !== void 0 ? _l : undefined,
        notesToTrash: !args.keepOriginalNotes ? args.noteIDs.filter(id => !(failedNotes.includes(id))) : undefined,
    };
    const mutation = await context.db.runMutator(context.trc, 'noteImportInternal', mutatorParams);
    return { mergedNoteID: mutation.results.result, failedNotes };
}
exports.noteMerge = {
    args: conduit_core_1.schemaToGraphQLArgs({
        noteIDs: conduit_utils_1.ListOf('ID'),
        container: conduit_utils_1.NullableID,
        label: 'string',
        separateContent: 'boolean',
        keepLabels: 'boolean',
        keepOriginalNotes: 'boolean',
    }),
    type: conduit_core_1.schemaToGraphQLType(conduit_utils_1.NullableStruct({
        mergedNoteID: 'string',
        failedNotes: conduit_utils_1.ListOf('ID'),
    }, 'noteMergeResult')),
    resolve: noteMergeResolver,
};
//# sourceMappingURL=NoteMerge.js.map