"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedForWorkChat = exports.ATTACHMENT_IN_WORKCHAT_AVAILABILITY_DATE_TO = void 0;
// for new clients attachments should not be part of work chat, ION-12049
// legacy chat will display attachments as it is
exports.ATTACHMENT_IN_WORKCHAT_AVAILABILITY_DATE_TO = new Date(2020, 3, 21).getTime();
// test if message supported in workchat
function supportedForWorkChat(isAttachement, sentAt) {
    return !isAttachement || (Boolean(sentAt) && sentAt <= exports.ATTACHMENT_IN_WORKCHAT_AVAILABILITY_DATE_TO);
}
exports.supportedForWorkChat = supportedForWorkChat;
//# sourceMappingURL=WorkChatUtils.js.map