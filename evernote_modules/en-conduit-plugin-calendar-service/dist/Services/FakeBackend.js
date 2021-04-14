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
const CalendarServiceType_1 = require("../CalendarServiceType");
const GoogleServices_1 = require("./GoogleServices");
/**
 * This class makes requests directly to google and then transforms the response to what the plugin should receive from the microservice.
 * This is to enable dogfooding, should be deleted once quasar connection to the ms is available.
 */
class FakeBackend {
    constructor(httpClient) {
        this.OAuthCredential = null;
        this.googleServices = new GoogleServices_1.GoogleServices(httpClient);
    }
    /**
     * @param  {ENThriftGraphQLContext} context
     * @returns Promise
     */
    async getAccessToken(context) {
        // TODO: extend for multiple accouns when ready
        try {
            if (this.OAuthCredential === null || this.OAuthCredential.expiresAfter < Date.now()) {
                const authToken = await conduit_core_1.retrieveAuthorizedToken(context);
                const googleOAuth = await en_thrift_connector_1.getScopedGoogleOAuthCredential(context.trc, context.thriftComm, authToken || '', '/auth/calendar');
                const gapiCredential = en_conduit_plugin_google_services_1.transformOAuthToServiceCredential(googleOAuth);
                this.OAuthCredential = gapiCredential;
            }
            return this.OAuthCredential.accessToken;
        }
        catch (err) {
            throw new Error('getAccessToken: Could not get access token from the monolith');
        }
    }
    /**
     * @param  {ENThriftGraphQLContext} context?
     * @returns Promise
     */
    async getCalendarAccounts(context) {
        // TODO: adapt for multiple accounts when ready
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar File data.');
        const accessToken = await this.getAccessToken(context);
        const googleCalendars = await this.googleServices.listCalendars(accessToken, context);
        return [{
                id: 'GOOGLE;example@gmail.com',
                provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
                calendarUserId: 'example@gmail.com',
                isConnected: true,
                calendars: googleCalendars.items.map((calendar) => this.transformUserCalendar(calendar)),
            }];
    }
    /**
     * Should be different from the query above once multiple accounts are supported
     * @param  {ENThriftGraphQLContext} context?
     * @returns Promise
     */
    async getCalendarAccount(id, context) {
        // TODO: adapt for multiple accounts when ready
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar File data.');
        const accessToken = await this.getAccessToken(context);
        const googleCalendars = await this.googleServices.listCalendars(accessToken, context);
        return {
            id: 'GOOGLE;example@gmail.com',
            provider: CalendarServiceType_1.CalendarProvider.GOOGLE,
            calendarUserId: 'example@gmail.com',
            isConnected: true,
            calendars: googleCalendars.items.map((calendar) => this.transformUserCalendar(calendar)),
        };
    }
    /**
     * @param  {string} from
     * @param  {string} to
     * @param  {CalendarProvider} provider?
     * @param  {ENThriftGraphQLContext} context?
     */
    async getEvents(from, to, provider, context) {
        // TODO: get all the accounts the user is connected to from all providers
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar data.');
        const accessToken = await this.getAccessToken(context);
        const calendarAccounts = await this.getCalendarAccounts(context);
        const events = [];
        let userCalendarExternalId;
        const promises = [];
        for (const account of calendarAccounts) {
            for (const calendar of account.calendars) {
                userCalendarExternalId = calendar.userCalendarExternalId;
                (calendarId => {
                    promises.push(this.googleServices.listEvents(accessToken, context, from, to, calendarId)
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
                    const retry = await this.googleServices.listEvents(accessToken, context, from, to, idFromErrorMessage)
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
    async getEvent(id, context) {
        // TODO: Use provider and user id to find the correct event. Wait for multiple accounts
        conduit_core_1.validateDB(context, 'Must be authenticated to retrieve Google Calendar File data.');
        id = id.replace('_CalendarEvent', '');
        const [userCalendarExternalId, calendarEventExternalId] = id.split(';');
        const accessToken = await this.getAccessToken(context);
        const calendarResponse = await this.googleServices.getCalendarById(accessToken, context, userCalendarExternalId);
        const calendar = this.transformUserCalendar(calendarResponse);
        const externalEvent = await this.googleServices.getEventById(accessToken, context, userCalendarExternalId, calendarEventExternalId);
        const event = this.transformCalendarEvent(externalEvent, userCalendarExternalId, calendar.data.displayColor);
        return event;
    }
    /**
     * CONVERTERS: These private methods just perform a transformation from what we receive from google to what the plugin will receive from the ms.
     */
    transformUserCalendar(externalCalendar) {
        return {
            id: 'GOOGLE;example@gmail.com',
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
                isOwned: true,
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
            recurrence: undefined,
            start: this.isEventAllDay(externalEvent) ? this.ExternalDateStringToTimestamp(externalEvent.start.date) : this.ExternalDateStringToTimestamp(externalEvent.start.dateTime),
            end: this.isEventAllDay(externalEvent) ? this.ExternalDateStringToTimestamp(externalEvent.end.date) : this.ExternalDateStringToTimestamp(externalEvent.end.dateTime),
            isAllDay: this.isEventAllDay(externalEvent),
            attendees: JSON.stringify(this.buildAttendees(externalEvent.attendees)),
            displayColor: externalEvent.colorId ? this.googleServices.getColorById(externalEvent.colorId, 'event') : calendarColor,
            iCalendarUid: externalEvent.iCalUID,
            links: JSON.stringify(this.getLinks(externalEvent)),
            creator: {
                email: externalEvent.creator.email,
                displayName: externalEvent.creator.displayName,
                avatar: null,
            },
            organizer: {
                email: externalEvent.organizer.email,
                displayName: externalEvent.organizer.displayName,
                avatar: null,
            },
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
}
exports.FakeBackend = FakeBackend;
//# sourceMappingURL=FakeBackend.js.map