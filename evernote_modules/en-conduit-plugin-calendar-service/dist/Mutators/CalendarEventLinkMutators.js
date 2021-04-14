"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
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
exports.checkNoteEditPermissionByNoteId = exports.calendarEventLinkDelete = exports.calendarEventLinkCreate = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const CalendarConstants_1 = require("../CalendarConstants");
const CalendarServiceType_1 = require("../CalendarServiceType");
exports.calendarEventLinkCreate = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    requiredParams: {
        eventID: 'string',
        noteID: 'ID',
        isLinkedToAllInstances: 'boolean',
        provider: 'string',
        calendarUserId: 'string',
        userCalendarExternalId: 'string',
        calendarEventExternalId: 'string',
        isAccountConnected: 'boolean',
        summary: 'string',
        isAllDay: 'boolean',
        start: 'timestamp',
        end: 'timestamp',
        iCalendarUid: 'string',
        isBusy: 'boolean',
        status: Object.values(CalendarServiceType_1.CalendarEventStatus),
        links: 'string',
        creatorEmail: 'string',
        organizerEmail: 'string',
        attendees: 'string',
    },
    optionalParams: {
        deleted: 'timestamp',
        displayColor: 'string',
        description: 'string',
        location: 'string',
        recurrentEventId: 'string',
        recurrence: 'string',
        creatorDisplayName: 'string',
        creatorAvatar: 'string',
        organizerDisplayName: 'string',
        organizerAvatar: 'string',
    },
    execute: async (trc, ctx, params) => {
        return await calendarEventLinkCreatePlan(trc, ctx, params);
    },
};
exports.calendarEventLinkDelete = {
    type: conduit_core_1.MutatorRemoteExecutorType.Local,
    requiredParams: {
        calendarEventLinkId: 'ID',
    },
    optionalParams: {},
    execute: async (trc, ctx, params) => {
        return await CalendarEventLinkDeletePlan(trc, ctx, params);
    },
};
async function calendarEventLinkCreatePlan(trc, ctx, params) {
    const plan = {
        results: {},
        ops: [],
    };
    const { noteID, isLinkedToAllInstances, creatorEmail, creatorAvatar, creatorDisplayName, organizerEmail, organizerAvatar, organizerDisplayName, eventID } = params, calendarEventParams = __rest(params, ["noteID", "isLinkedToAllInstances", "creatorEmail", "creatorAvatar", "creatorDisplayName", "organizerEmail", "organizerAvatar", "organizerDisplayName", "eventID"]);
    const containerRef = { id: noteID, type: en_core_entity_types_1.CoreEntityTypes.Note };
    const note = await ctx.fetchEntity(trc, containerRef);
    if (!note) {
        throw new conduit_utils_1.NotFoundError(noteID, `Not found event Note ${noteID}`);
    }
    // check permissions on note
    const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
    const policy = await en_core_entity_types_1.commandPolicyOfNote(noteID, permContext);
    if (!policy.canEditContent) {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
    const calendarEventGenID = await ctx.generateDeterministicIDWithPrefix(trc, ctx.userID, CalendarConstants_1.CalendarEntityTypes.CalendarEvent, eventID);
    const calendarEventID = calendarEventGenID[1];
    const noteLinks = await ctx.traverseGraph(trc, note, [{ edge: ['outputs', 'calendarEventLinks'], type: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink }]);
    // avoid linking again this note to the same event
    if (noteLinks && noteLinks.length > 0) {
        for (const link of noteLinks) {
            const events = await ctx.traverseGraph(trc, link, [{ edge: ['outputs', 'calendarEvent'], type: CalendarConstants_1.CalendarEntityTypes.CalendarEvent }]);
            for (const event of events) {
                if (event.id === calendarEventID) {
                    return {
                        results: { result: calendarEventID },
                        ops: [],
                    };
                }
            }
        }
    }
    const calendarEventLinkGenID = await ctx.generateID(trc, ctx.userID, CalendarConstants_1.CalendarEntityTypes.CalendarEventLink);
    const calendarEventLinkID = calendarEventLinkGenID[1];
    const calendarEventLinkRef = { id: calendarEventLinkID, type: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink };
    const calendarEventLinkEntity = ctx.createEntity(calendarEventLinkRef, {
        isLinkedToAllInstances,
        linkedTimestamp: ctx.timestamp,
    }, ctx.userID);
    const calendarEventRef = { id: calendarEventID, type: CalendarConstants_1.CalendarEntityTypes.CalendarEvent };
    const CalendarEventEntity = ctx.createEntity(calendarEventRef, Object.assign(Object.assign({}, calendarEventParams), { created: ctx.timestamp, lastModified: ctx.timestamp, creator: { email: creatorEmail, displayName: creatorDisplayName, avatar: creatorAvatar }, organizer: { email: organizerEmail, displayName: organizerDisplayName, avatar: organizerAvatar } }), ctx.userID);
    plan.results.result = calendarEventID;
    plan.ops.push({
        changeType: 'Node:CREATE',
        node: calendarEventLinkEntity,
        id: calendarEventLinkGenID,
    }, {
        changeType: 'Edge:MODIFY',
        edgesToCreate: [{
                srcID: params.noteID, srcType: en_core_entity_types_1.CoreEntityTypes.Note, srcPort: 'calendarEventLinks',
                dstID: calendarEventLinkID, dstType: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink, dstPort: 'note',
            }],
    }, {
        changeType: 'Node:CREATE',
        node: CalendarEventEntity,
        id: calendarEventGenID,
    }, {
        changeType: 'Edge:MODIFY',
        edgesToCreate: [{
                srcID: calendarEventLinkRef.id, srcType: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink, srcPort: 'calendarEvent',
                dstID: calendarEventRef.id, dstType: CalendarConstants_1.CalendarEntityTypes.CalendarEvent, dstPort: 'calendarEventLinks',
            }],
    });
    return plan;
}
async function CalendarEventLinkDeletePlan(trc, ctx, params) {
    const plan = {
        results: {},
        ops: [],
    };
    const calendarEventLinkRef = { id: params.calendarEventLinkId, type: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink };
    const calendarEventLink = await ctx.fetchEntity(trc, calendarEventLinkRef);
    if (!calendarEventLink) {
        throw new conduit_utils_1.NotFoundError(calendarEventLinkRef.id, 'Missing calendarEventLink in calendarEventLinkDelete');
    }
    const note = await ctx.traverseGraph(trc, calendarEventLinkRef, [{ edge: ['inputs', 'note'], type: en_core_entity_types_1.CoreEntityTypes.Note }]);
    if (!note || !note.length) {
        throw new conduit_utils_1.NotFoundError(params.calendarEventLinkId, `Not found CalendarEventLink's parent Note ${params.calendarEventLinkId}`);
    }
    await checkNoteEditPermissionByNoteId(trc, ctx, note[0].id);
    plan.results.result = calendarEventLinkRef.id;
    plan.ops.push({
        changeType: 'Node:DELETE',
        nodeRef: calendarEventLinkRef,
    }, {
        changeType: 'Edge:MODIFY',
        edgesToDelete: [
            { dstID: params.calendarEventLinkId, dstType: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink, dstPort: 'calendarEventLinks' },
            { srcID: params.calendarEventLinkId, srcType: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink, srcPort: 'note' },
        ],
    });
    const calendarEvent = await ctx.traverseGraph(trc, calendarEventLinkRef, [{ edge: ['outputs', 'calendarEvent'], type: CalendarConstants_1.CalendarEntityTypes.CalendarEvent }]);
    if (!calendarEvent || !calendarEvent.length) {
        throw new conduit_utils_1.NotFoundError(params.calendarEventLinkId, `Not found CalendarEventLink's related CalendarEvent ${params.calendarEventLinkId}`);
    }
    // get the calendarEvent links to se if it should be deleted
    const calendarEventLinksfromCalendarEvent = await ctx.traverseGraph(trc, calendarEvent[0], [{ edge: ['inputs', 'calendarEventLinks'], type: CalendarConstants_1.CalendarEntityTypes.CalendarEventLink }]);
    if (calendarEventLinksfromCalendarEvent.length === 1 && calendarEventLinksfromCalendarEvent[0].id === params.calendarEventLinkId) {
        plan.ops.push({
            changeType: 'Node:DELETE',
            nodeRef: calendarEvent[0],
        });
    }
    return plan;
}
async function checkNoteEditPermissionByNoteId(trc, ctx, noteId) {
    const permContext = new en_core_entity_types_1.MutationPermissionContext(trc, ctx);
    const policy = await en_core_entity_types_1.commandPolicyOfNote(noteId, permContext);
    if (!policy.canEditContent) {
        throw new conduit_utils_1.PermissionError('Permission Denied');
    }
}
exports.checkNoteEditPermissionByNoteId = checkNoteEditPermissionByNoteId;
//# sourceMappingURL=CalendarEventLinkMutators.js.map