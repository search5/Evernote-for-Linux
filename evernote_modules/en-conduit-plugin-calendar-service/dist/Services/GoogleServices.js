"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleServices = void 0;
const conduit_utils_1 = require("conduit-utils");
/**
 * Class to make direct http calls to google Calendar rest API.
 */
class GoogleServices {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * @param  {string} accessToken
     * @param  {ENThriftGraphQLContext} context
     * @returns Promise
     */
    async listCalendars(accessToken, context) {
        const requestParams = {
            method: 'GET',
            url: `https://www.googleapis.com`,
            path: `/calendar/v3/users/me/calendarList`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
        const httpresponse = await this.httpClient.request(context.trc, requestParams);
        return conduit_utils_1.safeParse(httpresponse.result);
    }
    /**
     * @param  {string} accessToken
     * @param  {ENThriftGraphQLContext} context
     * @param  {string} start - Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z.
     *  Milliseconds may be provided but are ignored.
     * @param  {string} end - Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z.
     *  Milliseconds may be provided but are ignored.
     * @param  {string} userCalendarId?
     * @returns Promise
     */
    async listEvents(accessToken, context, start, end, userCalendarExternalId) {
        try {
            let requestOptions;
            const baseOptions = {
                maxResults: 250,
                singleEvents: true,
                orderBy: 'startTime',
                timezone: 'Z',
            };
            if (start && end) {
                const startTime = new Date(start);
                const endTime = new Date(end);
                requestOptions = {
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                };
            }
            else if (start) {
                const startTime = new Date(start);
                requestOptions = {
                    timeMin: startTime.toISOString(),
                };
            }
            else if (end) {
                const endTime = new Date(end);
                requestOptions = {
                    timeMax: endTime.toISOString(),
                };
            }
            const queryParams = conduit_utils_1.toQueryString(Object.assign(Object.assign({}, baseOptions), requestOptions));
            const path = `/calendar/v3/calendars/${userCalendarExternalId ? conduit_utils_1.strictEncodeURI(userCalendarExternalId) : 'primary'}/events?${queryParams}`;
            const requestParams = {
                method: 'GET',
                url: `https://www.googleapis.com`,
                path,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const httpresponse = await this.httpClient.request(context.trc, requestParams);
            if (httpresponse.status >= 400) {
                throw new Error(`listEvents: could not fetch events, HTTP status code ${httpresponse.status}`);
            }
            const result = conduit_utils_1.safeParse(httpresponse.result);
            // do not pass down cancelled events as there's no backend and they're incomplete.
            result.items = result.items.filter((event) => event.status !== 'cancelled');
            return result;
        }
        catch (err) {
            throw new Error(`listEvents: failed to fetch events for calendar [${userCalendarExternalId ? userCalendarExternalId : 'primary'}]`);
        }
    }
    /**
     * @param  {string} accessToken
     * @param  {ENThriftGraphQLContext} context
     * @param  {string} userCalendarId
     * @param  {string} eventId
     * @returns Promise
     */
    async getEventById(accessToken, context, userCalendarId, eventId) {
        const path = '/calendar/v3/calendars/' + conduit_utils_1.strictEncodeURI(userCalendarId) + '/events/' + conduit_utils_1.strictEncodeURI(eventId);
        const requestParams = {
            method: 'GET',
            url: `https://www.googleapis.com`,
            path,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
        const httpresponse = await this.httpClient.request(context.trc, requestParams);
        return conduit_utils_1.safeParse(httpresponse.result);
    }
    async getCalendarById(accessToken, context, userCalendarId) {
        const path = '/calendar/v3/users/me/calendarList/' + conduit_utils_1.strictEncodeURI(userCalendarId);
        const requestParams = {
            method: 'GET',
            url: `https://www.googleapis.com`,
            path,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
        const httpresponse = await this.httpClient.request(context.trc, requestParams);
        return conduit_utils_1.safeParse(httpresponse.result);
    }
    /**
     * Get the current list of colors from Google. As it's a list that will hardly change in the 2 weeks that the direct connection should last
     * I'll just store it in an object.
     * @param  {string} colorId
     * @param  {'calendar'|'event'} kind
     * @returns any
     */
    getColorById(colorId, kind) {
        const colors = {
            kind: 'calendar#colors',
            updated: '2012-02-14T00:00:00.000Z',
            calendar: {
                1: {
                    background: '#ac725e',
                    foreground: '#1d1d1d',
                },
                2: {
                    background: '#d06b64',
                    foreground: '#1d1d1d',
                },
                3: {
                    background: '#f83a22',
                    foreground: '#1d1d1d',
                },
                4: {
                    background: '#fa573c',
                    foreground: '#1d1d1d',
                },
                5: {
                    background: '#ff7537',
                    foreground: '#1d1d1d',
                },
                6: {
                    background: '#ffad46',
                    foreground: '#1d1d1d',
                },
                7: {
                    background: '#42d692',
                    foreground: '#1d1d1d',
                },
                8: {
                    background: '#16a765',
                    foreground: '#1d1d1d',
                },
                9: {
                    background: '#7bd148',
                    foreground: '#1d1d1d',
                },
                10: {
                    background: '#b3dc6c',
                    foreground: '#1d1d1d',
                },
                11: {
                    background: '#fbe983',
                    foreground: '#1d1d1d',
                },
                12: {
                    background: '#fad165',
                    foreground: '#1d1d1d',
                },
                13: {
                    background: '#92e1c0',
                    foreground: '#1d1d1d',
                },
                14: {
                    background: '#9fe1e7',
                    foreground: '#1d1d1d',
                },
                15: {
                    background: '#9fc6e7',
                    foreground: '#1d1d1d',
                },
                16: {
                    background: '#4986e7',
                    foreground: '#1d1d1d',
                },
                17: {
                    background: '#9a9cff',
                    foreground: '#1d1d1d',
                },
                18: {
                    background: '#b99aff',
                    foreground: '#1d1d1d',
                },
                19: {
                    background: '#c2c2c2',
                    foreground: '#1d1d1d',
                },
                20: {
                    background: '#cabdbf',
                    foreground: '#1d1d1d',
                },
                21: {
                    background: '#cca6ac',
                    foreground: '#1d1d1d',
                },
                22: {
                    background: '#f691b2',
                    foreground: '#1d1d1d',
                },
                23: {
                    background: '#cd74e6',
                    foreground: '#1d1d1d',
                },
                24: {
                    background: '#a47ae2',
                    foreground: '#1d1d1d',
                },
            },
            event: {
                1: {
                    background: '#a4bdfc',
                    foreground: '#1d1d1d',
                },
                2: {
                    background: '#7ae7bf',
                    foreground: '#1d1d1d',
                },
                3: {
                    background: '#dbadff',
                    foreground: '#1d1d1d',
                },
                4: {
                    background: '#ff887c',
                    foreground: '#1d1d1d',
                },
                5: {
                    background: '#fbd75b',
                    foreground: '#1d1d1d',
                },
                6: {
                    background: '#ffb878',
                    foreground: '#1d1d1d',
                },
                7: {
                    background: '#46d6db',
                    foreground: '#1d1d1d',
                },
                8: {
                    background: '#e1e1e1',
                    foreground: '#1d1d1d',
                },
                9: {
                    background: '#5484ed',
                    foreground: '#1d1d1d',
                },
                10: {
                    background: '#51b749',
                    foreground: '#1d1d1d',
                },
                11: {
                    background: '#dc2127',
                    foreground: '#1d1d1d',
                },
            },
        };
        return colors[kind][colorId].background;
    }
}
exports.GoogleServices = GoogleServices;
//# sourceMappingURL=GoogleServices.js.map