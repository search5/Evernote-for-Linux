//
// Autogenerated by Thrift Compiler (0.7.0-en-11139b3b5cb61e817408c6e84b0e1c258bf6c6ae)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


  // Define types and services

  var Thrift = require('evernote-thrift').Thrift;
  var Errors = require('./Errors');
  var Types = require('./Types');


  module.exports.MessageAttachmentType = {
    'NOTE' : 1,
    'NOTEBOOK' : 2
  };

  module.exports.PaginationDirection = {
    'OLDER' : 1,
    'NEWER' : 2
  };

  module.exports.MessageThreadChangeType = {
    'PARTICIPANT_ADDED' : 1,
    'PARTICIPANT_REMOVED' : 2,
    'MESSAGE_THREAD_RENAMED' : 3
  };

  module.exports.EDAM_MESSAGE_NEWEST_MESSAGE_ID = -1;

  module.exports.EDAM_MESSAGE_THREAD_CHANGE_SOMEBODY_USER_ID = 2147483647;

  module.exports.FIND_MESSAGE_FIELD_ID = 'id';

  module.exports.FIND_MESSAGE_FIELD_SENDER_ID = 'senderId';

  module.exports.FIND_MESSAGE_FIELD_THREAD_ID = 'threadId';

  module.exports.FIND_MESSAGE_FIELD_SENT_AT = 'sentAt';

  module.exports.FIND_MESSAGE_FIELD_BODY = 'body';

  module.exports.FIND_MESSAGE_FIELD_RESHARE_MESSAGE = 'reshareMessage';

  module.exports.FIND_MESSAGE_FIELD_DESTINATION_IDENTITY_IDS = 'destinationIdentityIds';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_GUID = 'attachmentGuid';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_SHARD = 'attachmentShardId';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_TYPE = 'attachmentType';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_TITLE = 'attachmentTitle';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_SNIPPET = 'attachmentSnippet';

  module.exports.FIND_MESSAGE_FIELD_ATTACHMENT_USER_ID = 'attachmentUserId';

  module.exports.EDAM_MESSAGE_THREAD_NAME_LEN_MIN = 1;

  module.exports.EDAM_MESSAGE_THREAD_NAME_LEN_MAX = 64;

  module.exports.EDAM_MESSAGE_THREAD_NAME_REGEX = '^[^\\p{Cc}\\p{Z}]([^\\p{Cc}\\p{Zl}\\p{Zp}]{0,62}[^\\p{Cc}\\p{Z}])?$';

  module.exports.FIND_MESSAGE_FIELDS = ['id','senderId','threadId','sentAt','body','attachmentGuid','attachmentShardId','attachmentType','attachmentTitle','attachmentSnippet'];

  module.exports.MessageAttachment = Thrift.Struct.define('MessageAttachment',  {
    1: { alias: 'guid', type: Thrift.Type.STRING },
    2: { alias: 'shardId', type: Thrift.Type.STRING },
    3: { alias: 'type', type: Thrift.Type.I32 },
    4: { alias: 'title', type: Thrift.Type.STRING },
    5: { alias: 'snippet', type: Thrift.Type.STRING },
    6: { alias: 'noteStoreUrl', type: Thrift.Type.STRING },
    7: { alias: 'userId', type: Thrift.Type.I32 },
    8: { alias: 'webApiUrlPrefix', type: Thrift.Type.STRING }
  });

  module.exports.MessageThreadChange = Thrift.Struct.define('MessageThreadChange',  {
    1: { alias: 'id', type: Thrift.Type.I64 },
    2: { alias: 'changeType', type: Thrift.Type.I32 },
    3: { alias: 'messageThreadId', type: Thrift.Type.I64 },
    4: { alias: 'changedByUserId', type: Thrift.Type.I32 },
    5: { alias: 'changedAt', type: Thrift.Type.I64 },
    6: { alias: 'eventId', type: Thrift.Type.I64 },
    7: { alias: 'stringValue', type: Thrift.Type.STRING },
    8: { alias: 'identityValue', type: Thrift.Type.STRUCT, def: Types.Identity }
  });

  module.exports.Message = Thrift.Struct.define('Message',  {
    1: { alias: 'id', type: Thrift.Type.I64 },
    2: { alias: 'senderId', type: Thrift.Type.I32 },
    3: { alias: 'messageThreadId', type: Thrift.Type.I64 },
    4: { alias: 'sentAt', type: Thrift.Type.I64 },
    5: { alias: 'body', type: Thrift.Type.STRING },
    6: { alias: 'attachments', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.MessageAttachment)  },
    7: { alias: 'eventId', type: Thrift.Type.I64 },
    8: { alias: 'reshareMessage', type: Thrift.Type.BOOL },
    9: { alias: 'destinationIdentityIds', type: Thrift.Type.SET, def: Thrift.Set.define(Thrift.Type.I64) }
  });

  module.exports.MessageThread = Thrift.Struct.define('MessageThread',  {
    1: { alias: 'id', type: Thrift.Type.I64 },
    2: { alias: 'participantIds', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.I64)  },
    3: { alias: 'snippet', type: Thrift.Type.STRING },
    4: { alias: 'threadMaxMessageId', type: Thrift.Type.I64 },
    5: { alias: 'lastMessageSentAt', type: Thrift.Type.I64 },
    6: { alias: 'name', type: Thrift.Type.STRING },
    8: { alias: 'groupThread', type: Thrift.Type.BOOL },
    9: { alias: 'threadMaxUserMessageId', type: Thrift.Type.I64 }
  });

  module.exports.UserThread = Thrift.Struct.define('UserThread',  {
    1: { alias: 'messageThread', type: Thrift.Type.STRUCT, def: module.exports.MessageThread },
    2: { alias: 'lastReadMessageId', type: Thrift.Type.I64 },
    3: { alias: 'maxDeletedMessageId', type: Thrift.Type.I64 },
    4: { alias: 'eventId', type: Thrift.Type.I64 }
  });

  module.exports.Destination = Thrift.Struct.define('Destination',  {
    1: { alias: 'messageThreadId', type: Thrift.Type.I64 },
    2: { alias: 'recipients', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Contact)  }
  });

  module.exports.UserMessagingInfo = Thrift.Struct.define('UserMessagingInfo',  {
    1: { alias: 'threads', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.UserThread)  },
    2: { alias: 'identities', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Identity)  }
  });

  module.exports.UserThreadInfo = Thrift.Struct.define('UserThreadInfo',  {
    1: { alias: 'messages', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.Message)  },
    2: { alias: 'hasMore', type: Thrift.Type.BOOL },
    3: { alias: 'threadChanges', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.MessageThreadChange)  }
  });

  module.exports.MessageFilter = Thrift.Struct.define('MessageFilter',  {
    1: { alias: 'startMessageId', type: Thrift.Type.I64 },
    2: { alias: 'direction', type: Thrift.Type.I32 }
  });

  module.exports.MessageSyncFilter = Thrift.Struct.define('MessageSyncFilter',  {
    1: { alias: 'afterEventId', type: Thrift.Type.I64 }
  });

  module.exports.MessageSyncChunk = Thrift.Struct.define('MessageSyncChunk',  {
    1: { alias: 'chunkMaxEventId', type: Thrift.Type.I64 },
    2: { alias: 'userMaxEventId', type: Thrift.Type.I64 },
    3: { alias: 'threads', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.UserThread)  },
    4: { alias: 'messages', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.Message)  },
    5: { alias: 'identities', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Identity)  },
    6: { alias: 'threadChanges', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.MessageThreadChange)  }
  });

  module.exports.FindMessagesFilter = Thrift.Struct.define('FindMessagesFilter',  {
    1: { alias: 'query', type: Thrift.Type.STRING },
    2: { alias: 'sortField', type: Thrift.Type.STRING },
    3: { alias: 'reverse', type: Thrift.Type.BOOL },
    4: { alias: 'includeBlocked', type: Thrift.Type.BOOL }
  });

  module.exports.FindMessagesResultSpec = Thrift.Struct.define('FindMessagesResultSpec',  {
    1: { alias: 'includeBody', type: Thrift.Type.BOOL },
    2: { alias: 'includeAttachments', type: Thrift.Type.BOOL },
    3: { alias: 'includeDestinationIdentityIds', type: Thrift.Type.BOOL }
  });

  module.exports.FindMessagesPagination = Thrift.Struct.define('FindMessagesPagination',  {
    1: { alias: 'afterMessageId', type: Thrift.Type.I64 },
    2: { alias: 'afterOffset', type: Thrift.Type.I32 }
  });

  module.exports.FindMessagesResult = Thrift.Struct.define('FindMessagesResult',  {
    1: { alias: 'messages', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.Message)  },
    2: { alias: 'totalMatched', type: Thrift.Type.I32 },
    3: { alias: 'nextPagination', type: Thrift.Type.STRUCT, def: module.exports.FindMessagesPagination }
  });

  module.exports.CreateMessageThreadSpec = Thrift.Struct.define('CreateMessageThreadSpec',  {
    1: { alias: 'message', type: Thrift.Type.STRUCT, def: module.exports.Message },
    2: { alias: 'participants', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Contact)  },
    3: { alias: 'messageThreadName', type: Thrift.Type.STRING },
    4: { alias: 'groupThread', type: Thrift.Type.BOOL },
    5: { alias: 'readStatus', type: Thrift.Type.BOOL }
  });

  module.exports.CreateMessageThreadResult = Thrift.Struct.define('CreateMessageThreadResult',  {
    1: { alias: 'messageId', type: Thrift.Type.I64 },
    2: { alias: 'messageThreadId', type: Thrift.Type.I64 },
    3: { alias: 'participantIds', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.I64)  }
  });

  module.exports.UpdateParticipantsSpec = Thrift.Struct.define('UpdateParticipantsSpec',  {
    1: { alias: 'threadId', type: Thrift.Type.I64 },
    2: { alias: 'participantsToAdd', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Contact)  },
    3: { alias: 'participantsToRemove', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.I64)  }
  });

  module.exports.UpdateParticipantsResult = Thrift.Struct.define('UpdateParticipantsResult',  {
    1: { alias: 'participantIdsToContact', type: Thrift.Type.MAP, def: Thrift.Map.define(Thrift.Type.I64, Thrift.Type.STRUCT, Types.Contact)  }
  });

  module.exports.ReinviteContactResult = Thrift.Struct.define('ReinviteContactResult',  {
    1: { alias: 'participantIds', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.I64)  }
  });

  module.exports.DateFilter = Thrift.Struct.define('DateFilter',  {
    1: { alias: 'sinceTimestamp', type: Thrift.Type.I64 }
  });

  var MessageStore = module.exports.MessageStore = {};

  MessageStore.sendMessage = Thrift.Method.define({
    alias: 'sendMessage',
    args: Thrift.Struct.define('sendMessageArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'message', type: Thrift.Type.STRUCT, def: module.exports.Message, index: 1 },
      3: { alias: 'destination', type: Thrift.Type.STRUCT, def: module.exports.Destination, index: 2 }
    }),
    result: Thrift.Struct.define('sendMessageResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.Message },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.sendMessageToThread = Thrift.Method.define({
    alias: 'sendMessageToThread',
    args: Thrift.Struct.define('sendMessageToThreadArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'message', type: Thrift.Type.STRUCT, def: module.exports.Message, index: 1 }
    }),
    result: Thrift.Struct.define('sendMessageToThreadResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.Message },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.sendMessageToThreadWithoutEmails = Thrift.Method.define({
    alias: 'sendMessageToThreadWithoutEmails',
    args: Thrift.Struct.define('sendMessageToThreadWithoutEmailsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'message', type: Thrift.Type.STRUCT, def: module.exports.Message, index: 1 }
    }),
    result: Thrift.Struct.define('sendMessageToThreadWithoutEmailsResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.Message },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.createMessageThread = Thrift.Method.define({
    alias: 'createMessageThread',
    args: Thrift.Struct.define('createMessageThreadArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'spec', type: Thrift.Type.STRUCT, def: module.exports.CreateMessageThreadSpec, index: 1 }
    }),
    result: Thrift.Struct.define('createMessageThreadResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.CreateMessageThreadResult },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.createMessageThreadWithoutEmails = Thrift.Method.define({
    alias: 'createMessageThreadWithoutEmails',
    args: Thrift.Struct.define('createMessageThreadWithoutEmailsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'spec', type: Thrift.Type.STRUCT, def: module.exports.CreateMessageThreadSpec, index: 1 }
    }),
    result: Thrift.Struct.define('createMessageThreadWithoutEmailsResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.CreateMessageThreadResult },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.updateParticipants = Thrift.Method.define({
    alias: 'updateParticipants',
    args: Thrift.Struct.define('updateParticipantsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'spec', type: Thrift.Type.STRUCT, def: module.exports.UpdateParticipantsSpec, index: 1 }
    }),
    result: Thrift.Struct.define('updateParticipantsResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.UpdateParticipantsResult },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.reinviteContact = Thrift.Method.define({
    alias: 'reinviteContact',
    args: Thrift.Struct.define('reinviteContactArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'threadId', type: Thrift.Type.I64, index: 1 },
      3: { alias: 'contact', type: Thrift.Type.STRUCT, def: Types.Contact, index: 2 }
    }),
    result: Thrift.Struct.define('reinviteContactResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.ReinviteContactResult },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.renameMessageThread = Thrift.Method.define({
    alias: 'renameMessageThread',
    args: Thrift.Struct.define('renameMessageThreadArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'threadId', type: Thrift.Type.I64, index: 1 },
      3: { alias: 'threadName', type: Thrift.Type.STRING, index: 2 }
    }),
    result: Thrift.Struct.define('renameMessageThreadResult', {
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.updateReadStatus = Thrift.Method.define({
    alias: 'updateReadStatus',
    args: Thrift.Struct.define('updateReadStatusArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'threadId', type: Thrift.Type.I64, index: 1 },
      3: { alias: 'messageId', type: Thrift.Type.I64, index: 2 }
    }),
    result: Thrift.Struct.define('updateReadStatusResult', {
      0: { alias: 'returnValue',type: Thrift.Type.I64 },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.updateDeleteStatus = Thrift.Method.define({
    alias: 'updateDeleteStatus',
    args: Thrift.Struct.define('updateDeleteStatusArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'threadId', type: Thrift.Type.I64, index: 1 },
      3: { alias: 'messageId', type: Thrift.Type.I64, index: 2 }
    }),
    result: Thrift.Struct.define('updateDeleteStatusResult', {
      0: { alias: 'returnValue',type: Thrift.Type.I64 },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.getMessages = Thrift.Method.define({
    alias: 'getMessages',
    args: Thrift.Struct.define('getMessagesArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'threadId', type: Thrift.Type.I64, index: 1 },
      3: { alias: 'filter', type: Thrift.Type.STRUCT, def: module.exports.MessageFilter, index: 2 }
    }),
    result: Thrift.Struct.define('getMessagesResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.UserThreadInfo },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.getThreads = Thrift.Method.define({
    alias: 'getThreads',
    args: Thrift.Struct.define('getThreadsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 }
    }),
    result: Thrift.Struct.define('getThreadsResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.UserMessagingInfo },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException }
    })
  });

  MessageStore.getThreadIdWithUser = Thrift.Method.define({
    alias: 'getThreadIdWithUser',
    args: Thrift.Struct.define('getThreadIdWithUserArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'user', type: Thrift.Type.STRUCT, def: Types.User, index: 1 }
    }),
    result: Thrift.Struct.define('getThreadIdWithUserResult', {
      0: { alias: 'returnValue',type: Thrift.Type.I64 },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.getMessageSyncChunk = Thrift.Method.define({
    alias: 'getMessageSyncChunk',
    args: Thrift.Struct.define('getMessageSyncChunkArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'filter', type: Thrift.Type.STRUCT, def: module.exports.MessageSyncFilter, index: 1 }
    }),
    result: Thrift.Struct.define('getMessageSyncChunkResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.MessageSyncChunk },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException }
    })
  });

  MessageStore.updateBlockStatus = Thrift.Method.define({
    alias: 'updateBlockStatus',
    args: Thrift.Struct.define('updateBlockStatusArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'userId', type: Thrift.Type.I32, index: 1 },
      3: { alias: 'blockStatus', type: Thrift.Type.BOOL, index: 2 }
    }),
    result: Thrift.Struct.define('updateBlockStatusResult', {
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.findMessages = Thrift.Method.define({
    alias: 'findMessages',
    args: Thrift.Struct.define('findMessagesArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'filter', type: Thrift.Type.STRUCT, def: module.exports.FindMessagesFilter, index: 1 },
      3: { alias: 'resultSpec', type: Thrift.Type.STRUCT, def: module.exports.FindMessagesResultSpec, index: 2 },
      4: { alias: 'maxMessages', type: Thrift.Type.I32, index: 3 },
      5: { alias: 'pagination', type: Thrift.Type.STRUCT, def: module.exports.FindMessagesPagination, index: 4 }
    }),
    result: Thrift.Struct.define('findMessagesResult', {
      0: { alias: 'returnValue',type: Thrift.Type.STRUCT, def: module.exports.FindMessagesResult },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException }
    })
  });

  MessageStore.validateRecipients = Thrift.Method.define({
    alias: 'validateRecipients',
    args: Thrift.Struct.define('validateRecipientsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'contacts', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Contact) , index: 1 }
    }),
    result: Thrift.Struct.define('validateRecipientsResult', {
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.validateContacts = Thrift.Method.define({
    alias: 'validateContacts',
    args: Thrift.Struct.define('validateContactsArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'contacts', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, Types.Contact) , index: 1 }
    }),
    result: Thrift.Struct.define('validateContactsResult', {
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'invalidContactsException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMInvalidContactsException }
    })
  });

  MessageStore.getAttachmentMessagesReceived = Thrift.Method.define({
    alias: 'getAttachmentMessagesReceived',
    args: Thrift.Struct.define('getAttachmentMessagesReceivedArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 }
    }),
    result: Thrift.Struct.define('getAttachmentMessagesReceivedResult', {
      0: { alias: 'returnValue',type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.Message)  },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
      3: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
    })
  });

  MessageStore.hasNonEmptyMessages = Thrift.Method.define({
    alias: 'hasNonEmptyMessages',
    args: Thrift.Struct.define('hasNonEmptyMessagesArgs', {
      1: { alias: 'authenticationToken', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'dateFilter', type: Thrift.Type.STRUCT, def: module.exports.DateFilter, index: 1 }
    }),
    result: Thrift.Struct.define('hasNonEmptyMessagesResult', {
      0: { alias: 'returnValue',type: Thrift.Type.BOOL },
      1: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
      2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException }
    })
  });

  // Define MessageStore Client

  function MessageStoreClient(output) {
    this.output = output;
    this.seqid = 0;
  }

  MessageStoreClient.prototype.sendMessage = function(authenticationToken, message, destination, callback) {
    var mdef = MessageStore.sendMessage;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.message = message;
    args.destination = destination;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.sendMessageToThread = function(authenticationToken, message, callback) {
    var mdef = MessageStore.sendMessageToThread;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.message = message;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.sendMessageToThreadWithoutEmails = function(authenticationToken, message, callback) {
    var mdef = MessageStore.sendMessageToThreadWithoutEmails;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.message = message;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.createMessageThread = function(authenticationToken, spec, callback) {
    var mdef = MessageStore.createMessageThread;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.spec = spec;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.createMessageThreadWithoutEmails = function(authenticationToken, spec, callback) {
    var mdef = MessageStore.createMessageThreadWithoutEmails;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.spec = spec;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.updateParticipants = function(authenticationToken, spec, callback) {
    var mdef = MessageStore.updateParticipants;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.spec = spec;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.reinviteContact = function(authenticationToken, threadId, contact, callback) {
    var mdef = MessageStore.reinviteContact;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.threadId = threadId;
    args.contact = contact;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.renameMessageThread = function(authenticationToken, threadId, threadName, callback) {
    var mdef = MessageStore.renameMessageThread;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.threadId = threadId;
    args.threadName = threadName;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.updateReadStatus = function(authenticationToken, threadId, messageId, callback) {
    var mdef = MessageStore.updateReadStatus;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.threadId = threadId;
    args.messageId = messageId;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.updateDeleteStatus = function(authenticationToken, threadId, messageId, callback) {
    var mdef = MessageStore.updateDeleteStatus;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.threadId = threadId;
    args.messageId = messageId;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.getMessages = function(authenticationToken, threadId, filter, callback) {
    var mdef = MessageStore.getMessages;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.threadId = threadId;
    args.filter = filter;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.getThreads = function(authenticationToken, callback) {
    var mdef = MessageStore.getThreads;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.getThreadIdWithUser = function(authenticationToken, user, callback) {
    var mdef = MessageStore.getThreadIdWithUser;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.user = user;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.getMessageSyncChunk = function(authenticationToken, filter, callback) {
    var mdef = MessageStore.getMessageSyncChunk;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.filter = filter;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.updateBlockStatus = function(authenticationToken, userId, blockStatus, callback) {
    var mdef = MessageStore.updateBlockStatus;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.userId = userId;
    args.blockStatus = blockStatus;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.findMessages = function(authenticationToken, filter, resultSpec, maxMessages, pagination, callback) {
    var mdef = MessageStore.findMessages;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.filter = filter;
    args.resultSpec = resultSpec;
    args.maxMessages = maxMessages;
    args.pagination = pagination;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.validateRecipients = function(authenticationToken, contacts, callback) {
    var mdef = MessageStore.validateRecipients;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.contacts = contacts;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.validateContacts = function(authenticationToken, contacts, callback) {
    var mdef = MessageStore.validateContacts;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.contacts = contacts;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.getAttachmentMessagesReceived = function(authenticationToken, callback) {
    var mdef = MessageStore.getAttachmentMessagesReceived;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MessageStoreClient.prototype.hasNonEmptyMessages = function(authenticationToken, dateFilter, callback) {
    var mdef = MessageStore.hasNonEmptyMessages;
    var args = new mdef.args();
    args.authenticationToken = authenticationToken;
    args.dateFilter = dateFilter;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  module.exports.MessageStore.Client = MessageStoreClient;

  // Define MessageStore Server

  function MessageStoreServer(service, stransport, Protocol) {
    var methodName;
      this.service = service;
      this.stransport = stransport;
      this.processor = new Thrift.Processor();
      for (methodName in MessageStore) {
        if (service[methodName]) {
          this.processor.addMethod(MessageStore[methodName], service[methodName].bind(service));
        }
      }
      this.stransport.process = function (input, output, noop) {
      var inprot = new Protocol(input);
      var outprot = new Protocol(output);
      this.processor.process(inprot, outprot, noop);
    }.bind(this);
  }

  MessageStoreServer.prototype.start = function () {
    this.stransport.listen();
  };
  MessageStoreServer.prototype.stop = function () {
    this.stransport.close();
  };

  module.exports.MessageStore.Server = MessageStoreServer;

