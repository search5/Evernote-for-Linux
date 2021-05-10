"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNoteEditPermissionByNoteId = exports.calendarEventUnlink = exports.calendarEventLinkInternal = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const en_data_model_1 = require("en-data-model");
const SimplyImmutable = __importStar(require("simply-immutable"));
const CalendarServiceType_1 = require("../CalendarServiceType");
const Utilities_1 = require("../Utilities");
exports.calendarEventLinkInternal = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    isInternal: true,
    params: {
        eventID: 'ID',
        noteID: 'ID',
        noteOwnerID: 'number',
        provider: 'string',
        userIdFromExternalProvider: 'string',
        userCalendarExternalId: 'string',
        calendarEventExternalId: 'string',
        isAccountConnected: 'boolean',
        isAllDay: 'boolean',
        start: 'timestamp',
        end: 'timestamp',
        iCalendarUid: 'string',
        isBusy: 'boolean',
        status: CalendarServiceType_1.CalendarEventStatusInputSchema,
        links: conduit_utils_1.ListOf(CalendarServiceType_1.CalendarEventUriInputSchema),
        eventCreator: CalendarServiceType_1.CalendarContactInputSchema,
        eventOrganizer: CalendarServiceType_1.CalendarContactInputSchema,
        attendees: conduit_utils_1.ListOf(CalendarServiceType_1.CalendarEventAttendeeInputSchema),
        summary: conduit_utils_1.NullableString,
        externalProviderDeleted: conduit_utils_1.NullableTimestamp,
        displayColor: conduit_utils_1.NullableString,
        description: conduit_utils_1.NullableString,
        location: conduit_utils_1.NullableString,
        recurrentEventId: conduit_utils_1.NullableString,
        recurrence: conduit_utils_1.NullableString,
        isRecurrenceInstance: conduit_utils_1.NullableBoolean,
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const { noteID, eventID, noteOwnerID } = params, calendarEventParams = __rest(params, ["noteID", "eventID", "noteOwnerID"]);
        const containerRef = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const note = await ctx.fetchEntity(trc, containerRef);
        if (!note) {
            throw new conduit_utils_1.NotFoundError(noteID, `Not found event Note ${noteID}`);
        }
        // check permissions on note
        const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
        const policy = await en_core_entity_types_1.commandPolicyOfNote(noteID, permContext);
        if (!policy.canEditContent) {
            throw new conduit_utils_1.PermissionError(`Permission Denied. Can't edit note`);
        }
        const linkedCalendarEvents = await ctx.traverseGraph(trc, note, [{ edge: ['outputs', 'calendarEvents'], type: en_data_model_1.EntityTypes.CalendarEvent }]);
        // avoid linking again this note to the same event
        if (linkedCalendarEvents && linkedCalendarEvents.length > 0) {
            for (const event of linkedCalendarEvents) {
                if (event.id === eventID) {
                    return {
                        results: { result: eventID },
                        ops: [],
                    };
                }
            }
        }
        const calendarEventRef = { id: eventID, type: en_data_model_1.EntityTypes.CalendarEvent };
        const calendarEventNode = await ctx.fetchEntity(trc, calendarEventRef);
        if (calendarEventNode) {
            plan.ops.push({
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: params.noteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'calendarEvents',
                        dstID: calendarEventRef.id, dstType: en_data_model_1.EntityTypes.CalendarEvent, dstPort: 'notes',
                    }],
            });
        }
        else {
            const calendarEventID = Utilities_1.convertEventGuidFromService(eventID);
            const calendarEventOptimisticID = SimplyImmutable.deepFreeze(['', calendarEventID, ctx.userID, ctx.userID]);
            const CalendarEventEntity = ctx.createEntity(calendarEventRef, Object.assign(Object.assign({}, calendarEventParams), { created: ctx.timestamp, lastModified: ctx.timestamp }), ctx.userID);
            plan.ops.push({
                changeType: 'Node:CREATE',
                node: CalendarEventEntity,
                id: calendarEventOptimisticID,
            }, {
                changeType: 'Edge:MODIFY',
                edgesToCreate: [{
                        srcID: params.noteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'calendarEvents',
                        dstID: calendarEventRef.id, dstType: en_data_model_1.EntityTypes.CalendarEvent, dstPort: 'notes',
                    }],
            });
        }
        plan.results.result = eventID;
        return plan;
    },
};
exports.calendarEventUnlink = {
    type: conduit_core_1.MutatorRemoteExecutorType.CommandService,
    params: {
        eventID: 'ID',
        noteID: 'ID',
    },
    execute: async (trc, ctx, params) => {
        const plan = {
            results: {},
            ops: [],
        };
        const calendarEventRef = { id: params.eventID, type: en_data_model_1.EntityTypes.CalendarEvent };
        const calendarEventNode = await ctx.fetchEntity(trc, calendarEventRef);
        if (!calendarEventNode) {
            throw new conduit_utils_1.NotFoundError(calendarEventRef.id, 'Could not fetch CalendarEvent in calendarEventUnlink');
        }
        const noteRef = { id: params.noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
        const noteNode = await ctx.fetchEntity(trc, noteRef);
        if (!noteNode) {
            throw new conduit_utils_1.NotFoundError(noteRef.id, 'Could not fetch Note in calendarEventUnlink');
        }
        await checkNoteEditPermissionByNoteId(trc, ctx, noteNode.id);
        plan.results.result = calendarEventRef.id;
        plan.ops.push({
            changeType: 'Edge:MODIFY',
            edgesToDelete: [
                {
                    srcID: params.noteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'calendarEvents',
                    dstID: calendarEventRef.id, dstType: en_data_model_1.EntityTypes.CalendarEvent, dstPort: 'notes',
                },
            ],
        });
        // Delete CalendarEvent Once it has no more notes associated
        const eventLinkedNotes = await ctx.traverseGraph(trc, calendarEventRef, [{ edge: ['inputs', 'notes'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
        if (eventLinkedNotes.length === 1 && eventLinkedNotes[0].id === params.noteID) {
            plan.ops.push({
                changeType: 'Node:DELETE',
                nodeRef: calendarEventRef,
            });
        }
        return plan;
    },
};
async function checkNoteEditPermissionByNoteId(trc, ctx, noteId) {
    const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
    const policy = await en_core_entity_types_1.commandPolicyOfNote(noteId, permContext);
    if (!policy.canEditContent) {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
}
exports.checkNoteEditPermissionByNoteId = checkNoteEditPermissionByNoteId;
//# sourceMappingURL=CalendarEventLinkMutators.js.map