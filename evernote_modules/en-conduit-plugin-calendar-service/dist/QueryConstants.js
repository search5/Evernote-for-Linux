"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALENDAR_EVENT_LINKS_QUERY = exports.CALENDAR_EVENT_QUERY = exports.CALENDAR_EVENTS_QUERY = exports.CALENDAR_ACCOUNT_QUERY = exports.CALENDAR_ACCOUNTS_QUERY = exports.CALENDAR_SETTINGS_QUERY = void 0;
exports.CALENDAR_SETTINGS_QUERY = `
query calendarSettings {
  calendarSettings {
    mobileReminders{
      openNoteMinutes
      createNoteMinutes
    }
    desktopReminders{
      openNoteMinutes
      createNoteMinutes
    }
    useTemplateForNewNotes
  }
}
`;
exports.CALENDAR_ACCOUNTS_QUERY = `
query calendarAccounts ($activeCalendarOnly: Boolean!) {
  calendarAccounts(activeCalendarOnly: $activeCalendarOnly) {
    id
    provider
    userIdFromExternalProvider
    isConnected
    calendars {
      id
      userCalendarExternalId
      isActive
      data{
        displayName
        displayColor
        description
        timezone
        isPrimary
        isOwned
      }
    }
  }
}
`;
exports.CALENDAR_ACCOUNT_QUERY = `
query calendarAccount ($id: String!) {
  calendarAccount(id: $id) {
    id
    provider
    userIdFromExternalProvider
    isConnected
    calendars{
      id
      userCalendarExternalId
      isActive
      data{
        displayName
        displayColor
        description
        timezone
        isPrimary
        isOwned
      }
    }
  }
}
`;
// REVIEW: check for optional parameters
exports.CALENDAR_EVENTS_QUERY = `
query calendarEvents ($from: Timestamp, $to: Timestamp, $provider: CalendarProvider) {
  calendarEvents(from: $from , to: $to, provider: $provider) {
    id
    provider
    userIdFromExternalProvider
    userCalendarExternalId
    calendarEventExternalId
    summary
    displayColor
    description
    location
    isAllDay
    start
    end
    isBusy
    status
    created
    lastModified
    eventCreator {
      email
      avatar
      displayName
    }
    eventOrganizer {
      email
      avatar
      displayName
    }
    links {
      type
      description
      uri
    }
    recurrence
    externalProviderDeleted
    isAccountConnected
    recurrentEventId
    isRecurrenceInstance
    iCalendarUid
    attendees {
      contact {
        email
        avatar
        displayName
      }
      isOptional
      responseStatus
      isResource
      isSelf
    }
  }
}
`;
exports.CALENDAR_EVENT_QUERY = `
query calendarEvent ($id: String!) {
  calendarEvent(id: $id) {
    id
    provider
    userIdFromExternalProvider
    userCalendarExternalId
    calendarEventExternalId
    summary
    displayColor
    description
    location
    isAllDay
    start
    end
    isBusy
    status
    created
    lastModified
    eventCreator {
      email
      avatar
      displayName
    }
    eventOrganizer {
      email
      avatar
      displayName
    }
    links {
      type
      description
      uri
    }
    recurrence
    externalProviderDeleted
    isAccountConnected
    recurrentEventId
    isRecurrenceInstance
    iCalendarUid
    attendees {
      contact {
        email
        avatar
        displayName
      }
      isOptional
      responseStatus
      isResource
      isSelf
    }
  }
}
`;
exports.CALENDAR_EVENT_LINKS_QUERY = `
query calendarEventLinks ($noteID: String!) {
  calendarEventLinks(noteID: $noteID) {
    id
    linkedTimestamp
    calendarEvent {
          id
      provider
      userIdFromExternalProvider
      userCalendarExternalId
      calendarEventExternalId
      summary
      displayColor
      description
      isAllDay
      start
      end
      isBusy
      status
      created
      lastModified
      eventCreator {
        email
        avatar
        displayName
      }
      eventOrganizer {
        email
        avatar
        displayName
      }
      links {
        type
        description
        url
      }
      recurrence
      externalProviderDeleted
      isAccountConnected
      recurrentEventId
      isRecurrenceInstance
      iCalendarUid
      attendees {
        contact {
          email
          avatar
          displayName
        }
        isOptional
        responseStatus
        isResource
        isSelf
      }
    }
  }
}
`;
//# sourceMappingURL=QueryConstants.js.map