"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeBackend = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_conduit_plugin_google_services_1 = require("en-conduit-plugin-google-services");
const en_thrift_connector_1 = require("en-thrift-connector");
const CalendarConstants_1 = require("../CalendarConstants");
const CalendarServiceType_1 = require("../CalendarServiceType");
const GoogleServices_1 = require("./GoogleServices");
/**
 * This class makes requests directly to google and then transforms the response to what the plugin should receive from the microservice.
 * This is to enable dogfooding, should be deleted once quasar connection to the ms is available.
 */
class FakeBackend {
    constructor(httpClient) {
        this.googleServices = new GoogleServices_1.GoogleServices(httpClient);
    }
    /**
     * @param  {ENThriftGraphQLContext} context
     * @returns Promise
     */
    async getAccessToken(context) {
        // TODO: extend for multiple accouns when ready
        try {
            const authToken = await conduit_core_1.retrieveAuthorizedToken(context);
            const googleOAuth = await en_thrift_connector_1.getScopedGoogleOAuthCredential(context.trc, context.thriftComm, authToken || '', '/auth/calendar');
            const gapiCredential = en_conduit_plugin_google_services_1.transformOAuthToServiceCredential(googleOAuth);
            return gapiCredential.accessToken;
        }
        catch (err) {
            throw new Error(`getAccessToken: Could not get access token from the monolith. ${err}`);
        }
    }
    /**
     * @param  {string} accessToken
     * @param  {TracingContext} trc
     * @returns Promise
     */
    async getCalendarAccounts(context, accessToken) {
        // TODO: adapt for multiple accounts when ready
        conduit_core_1.validateDB(context);
        const calendarAccounts = await context.db.getGraphNodesByType(context.trc, null, CalendarConstants_1.CalendarEntityTypes.CalendarAccount);
        let calendarAccount;
        if (!calendarAccounts.length) {
            const mutation = await context.db.runMutator(context.trc, 'calendarAccountCreate', {
                calendarAccountId: 'GOOGLE;example@gmail.com',
                isConnected: true
            });
            calendarAccount = {
                id: mutation.results.result,
                provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
                calendarUserId: 'example@gmail.com',
                isConnected: true,
                calendars: [],
            };
        }
        else {
            calendarAccount = {
                id: calendarAccounts[0].id,
                provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
                calendarUserId: 'example@gmail.com',
                isConnected: calendarAccounts[0].NodeFields.isConnected,
                calendars: [],
            };
        }
        const calendars = await this.getCalendarsForAccount(context, accessToken, calendarAccount);
        calendarAccount.calendars = calendars;
        return [calendarAccount];
    }
    /**
     * Will be different from the query above once multiple accounts are supported
     * @param  {string} accessToken
     * @param  {TracingContext} trc
     * @param  {string} id
     * @returns Promise
     */
    async getCalendarAccount(context, accessToken, id) {
        conduit_core_1.validateDB(context);
        // TODO: adapt for multiple accounts when ready
        const calendarAccountNode = await context.db.getNode(context, { id: id, type: CalendarConstants_1.CalendarEntityTypes.CalendarAccount });
        if (!calendarAccountNode) {
            throw new conduit_utils_1.NotFoundError('calendarAccountById: calendarAccount not found in graphDB');
        }
        const calendarAccount = {
            id: calendarAccountNode.id,
            provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
            calendarUserId: 'example@gmail.com',
            isConnected: calendarAccountNode.NodeFields.isConnected,
            calendars: [],
        };
        const calendars = await this.getCalendarsForAccount(context, accessToken, calendarAccount);
        calendarAccount.calendars = calendars;
        return calendarAccount;
    }
    /**
     * @param  {string} from
     * @param  {string} to
     * @param  {CalendarProvider} provider?
     * @param  {ENThriftGraphQLContext} context?
     */
    async getEvents(context, accessToken, from, to, provider) {
        // TODO: get all the accounts the user is connected to from all providers
        const calendarAccounts = await this.getCalendarAccounts(context, accessToken);
        const events = [];
        let userCalendarExternalId;
        const promises = [];
        for (const account of calendarAccounts) {
            for (const calendar of account.calendars) {
                userCalendarExternalId = calendar.userCalendarExternalId;
                (calendarId => {
                    promises.push(this.googleServices.listEvents(context.trc, accessToken, from, to, calendarId)
                        .then(result => {
                        return result.items.map((externalEvent) => this.transformCalendarEvent(externalEvent, calendarId, calendar.data.displayColor));
                    }));
                })(userCalendarExternalId);
            }
        }
        const chunks = conduit_utils_1.chunkArray(promises, 10);
        for (const chunk of chunks) {
            const results = await conduit_utils_1.allWithError(chunk);
            for (const ErrOrData of results) {
                if (ErrOrData.data) {
                    events.push(ErrOrData.data);
                }
                else {
                    // no need for a regex, we can just get the enclosing brackets of the id to extract it from the error message
                    const idFromErrorMessage = ErrOrData.err.message.slice(49, ErrOrData.err.message.indexOf(']', 49));
                    const retry = await this.googleServices.listEvents(context.trc, accessToken, from, to, idFromErrorMessage)
                        .then(result => {
                        return result.items.map((externalEvent) => this.transformCalendarEvent(externalEvent, idFromErrorMessage, null));
                    }).catch(err => {
                        // retry failed, ommiting this calendar from results
                    });
                    events.push([retry]);
                }
            }
        }
        return events.reduce((acc, val) => acc.concat(val), []);
    }
    /**
     * @param  {ENThriftGraphQLContext} context
     * @param  {CalendarProvider} provider
     * @param  {string} calendaruserId
     * @param  {string} userCalendarExternalId
     * @param  {string} calendarEventExternalId
     */
    async getEvent(context, accessToken, id) {
        // TODO: Use provider and user id to find the correct event. Wait for multiple accounts
        id = id.replace('_CalendarEvent', '');
        const [userCalendarExternalId, calendarEventExternalId] = id.split(';');
        const calendarResponse = await this.googleServices.getCalendarById(context.trc, accessToken, userCalendarExternalId);
        const externalEvent = await this.googleServices.getEventById(context.trc, accessToken, userCalendarExternalId, calendarEventExternalId);
        const event = this.transformCalendarEvent(externalEvent, userCalendarExternalId, this.getCalendarColor(calendarResponse));
        return event;
    }
    async getCalendarsForAccount(context, accessToken, calendarAccount) {
        conduit_core_1.validateDB(context);
        const googleCalendars = await this.googleServices.listCalendars(context.trc, accessToken);
        const calendars = googleCalendars.items.map((calendar) => this.transformUserCalendar(calendar, calendarAccount.id));
        const calendarNodes = await context.db.batchGetNodes(context, CalendarConstants_1.CalendarEntityTypes.UserCalendarSettings, calendars.map((cal) => `${cal.id}_UserCalendarSettings`));
        let calendarNode;
        const isActiveDefault = true;
        for (let i = 0; i < calendars.length; i++) {
            calendarNode = calendarNodes[i];
            if (!calendarNode) {
                const mutation = await context.db.runMutator(context.trc, 'userCalendarSettingsCreate', {
                    userCalendarSettingsId: calendars[i].id,
                    parentAccount: calendarAccount.id,
                    isActive: isActiveDefault,
                });
                calendars[i].id = mutation.results.result;
                calendars[i].isActive = isActiveDefault;
            }
            else {
                calendars[i].id = calendarNode.id;
                calendars[i].isActive = calendarNode.NodeFields.isActive;
            }
        }
        return calendars;
    }
    /**
     * CONVERTERS: These private methods just perform a transformation from what we receive from google to what the plugin will receive from the ms.
     */
    transformUserCalendar(externalCalendar, calendarAccountId) {
        return {
            id: `${calendarAccountId};${externalCalendar.id}`,
            provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
            calendarUserId: 'example@gmail.com',
            userCalendarExternalId: externalCalendar.id,
            isActive: true,
            data: {
                displayName: externalCalendar.summaryOverride ? externalCalendar.summaryOverride : externalCalendar.summary,
                description: externalCalendar.description ? externalCalendar.description : null,
                displayColor: this.getCalendarColor(externalCalendar),
                timezone: externalCalendar.timeZone ? externalCalendar.timeZone : null,
                isPrimary: externalCalendar.primary ? externalCalendar.primary : false,
                isOwned: externalCalendar.accessRole && externalCalendar.accessRole === 'owner' ? true : false,
            },
        };
    }
    transformCalendarEvent(externalEvent, calendarId, calendarColor) {
        return {
            id: `${calendarId};${externalEvent.id}`,
            provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
            calendarUserId: 'example@gmail.com',
            userCalendarExternalId: calendarId ? calendarId : 'primary',
            calendarEventExternalId: externalEvent.id,
            created: this.ExternalDateStringToTimestamp(externalEvent.created),
            lastModified: this.ExternalDateStringToTimestamp(externalEvent.updated),
            isAccountConnected: true,
            summary: externalEvent.summary,
            description: externalEvent.description ? externalEvent.description : null,
            isBusy: this.isBusy(externalEvent),
            status: this.getEventStatus(externalEvent),
            location: externalEvent.location ? externalEvent.location : null,
            recurrentEventId: this.isEventRecurrent(externalEvent) ? externalEvent.recurringEventId : null,
            recurrence: null,
            start: this.isEventAllDay(externalEvent) ? this.ExternalDateStringToTimestamp(externalEvent.start.date) : this.ExternalDateStringToTimestamp(externalEvent.start.dateTime),
            end: this.isEventAllDay(externalEvent) ? this.ExternalDateStringToTimestamp(externalEvent.end.date) : this.ExternalDateStringToTimestamp(externalEvent.end.dateTime),
            isAllDay: this.isEventAllDay(externalEvent),
            attendees: JSON.stringify(this.buildAttendees(externalEvent.attendees)),
            displayColor: externalEvent.colorId ? this.googleServices.getColorById(externalEvent.colorId, 'event') : calendarColor,
            iCalendarUid: externalEvent.iCalUID,
            links: JSON.stringify(this.getLinks(externalEvent)),
            eventCreator: {
                email: externalEvent.creator.email,
                displayName: externalEvent.creator.displayName,
                avatar: null,
            },
            eventOrganizer: {
                email: externalEvent.organizer.email,
                displayName: externalEvent.organizer.displayName,
                avatar: null,
            },
            deletionTime: this.getDeletionTime(externalEvent),
        };
    }
    getCalendarColor(calendar) {
        if (calendar.backgroundColor) {
            return calendar.backgroundColor;
        }
        else if (calendar.colorId) {
            return this.googleServices.getColorById(calendar.colorId, 'calendar');
        }
        return null;
    }
    /**
     * @param event
     * @returns boolean - whether the event marks the slot as busy or free
     */
    isBusy(event) {
        if (event.transparency) {
            if (event.transparency === 'transparent') {
                return false;
            }
            else if (event.transparency === 'opaque') {
                return true;
            }
            throw Error('isBusy: Unexpected value received');
        }
        return true;
    }
    getEventStatus(event) {
        if (event.status) {
            if (event.status === 'confirmed') {
                return CalendarServiceType_1.CalendarEventStatus.CONFIRMED;
            }
            else if (event.status === 'tentative') {
                return CalendarServiceType_1.CalendarEventStatus.TENTATIVE;
            }
            else if (event.status === 'cancelled') {
                return CalendarServiceType_1.CalendarEventStatus.CANCELED;
            }
            throw Error('getEventStatus: Invalid status property from google');
        }
        throw Error('getEventStatus: No incoming event status from google');
    }
    getLinks(event) {
        const results = [];
        if (event.conferenceData) {
            for (const entryPoint of event.conferenceData.entryPoints) {
                if (entryPoint.entryPointType === 'video') {
                    results.push({
                        type: CalendarServiceType_1.CalendarEventUriType.CONFERENCE,
                        description: entryPoint.label,
                        uri: entryPoint.uri,
                    });
                }
            }
        }
        if (event.htmlLink) {
            results.push({
                type: CalendarServiceType_1.CalendarEventUriType.WEB,
                description: '',
                uri: event.htmlLink,
            });
        }
        return results;
    }
    isEventRecurrent(event) {
        if (event.recurringEventId) {
            return true;
        }
        return false;
    }
    isEventAllDay(event) {
        if (event.start.dateTime && event.end.dateTime) {
            return false;
        }
        else if (event.start.date && event.end.date) {
            return true;
        }
        // https://developers.google.com/calendar/concepts/events-calendars#types_of_events
        throw Error('isEventAllDay: Received invalid event times. Missing properties or mixed all day dates with datetimes');
    }
    buildAttendees(attendees) {
        if (attendees === undefined) {
            return [];
        }
        if (Array.isArray(attendees)) {
            return attendees.map(attendee => {
                let status;
                if (attendee.responseStatus === 'accepted') {
                    status = CalendarServiceType_1.CalendarEventAttendeeStatus.ACCEPTED;
                }
                else if (attendee.responseStatus === 'declined') {
                    status = CalendarServiceType_1.CalendarEventAttendeeStatus.DECLINED;
                }
                else if (attendee.responseStatus === 'tentative') {
                    status = CalendarServiceType_1.CalendarEventAttendeeStatus.TENTATIVE;
                }
                else if (attendee.responseStatus === 'needsAction') {
                    status = CalendarServiceType_1.CalendarEventAttendeeStatus.NEEDSACTION;
                }
                else {
                    status = CalendarServiceType_1.CalendarEventAttendeeStatus.NEEDSACTION;
                }
                return {
                    contact: {
                        email: attendee.email,
                        displayName: attendee.displayName ? attendee.displayName : null,
                        avatar: null,
                    },
                    responseStatus: status,
                    isOptional: attendee.optional ? attendee.optional : false,
                    isResource: attendee.resource ? attendee.resource : false,
                    isSelf: attendee.self ? attendee.self : false,
                };
            });
        }
        return [];
    }
    /**
     * This method receives a RFC3339 compliant datetime string and converts it to a UTC timestamp.
     * @param datetime - like "2020-11-18T00:20:50.52Z" or "2020-11-18T00:20:50.52-08:00"
     */
    ExternalDateStringToTimestamp(datetime) {
        const result = Date.parse(datetime);
        if (Number.isNaN(result)) {
            throw new Error('ExternalDateStringToTimestamp: Could not parse date string');
        }
        return result;
    }
    getDeletionTime(event) {
        if (event.status === 'cancelled') {
            return Date.now();
        }
        return null;
    }
}
exports.FakeBackend = FakeBackend;
//# sourceMappingURL=FakeBackend.js.map