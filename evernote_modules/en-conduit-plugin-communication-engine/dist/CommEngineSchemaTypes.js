"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseSchema = exports.ClientTypeSchema = exports.SupportedPlacementSchema = exports.CommEventSchema = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
exports.CommEventSchema = conduit_utils_1.Struct({
    timeOccurred: 'timestamp',
    messageKey: 'string',
    label: conduit_utils_1.NullableString,
    type: conduit_utils_1.NullableEnumWithKeys(en_conduit_sync_types_1.TCommEngineEventType, 'CommEngineEventType'),
}, 'CommEvent');
exports.SupportedPlacementSchema = conduit_utils_1.EnumWithKeys(en_conduit_sync_types_1.TCommEnginePlacement, 'SupportedPlacement');
exports.ClientTypeSchema = conduit_utils_1.EnumWithKeys(en_conduit_sync_types_1.TCommEngineClientType, 'CommEngineClientType');
// MessageContent is deprecated, remove on next breaking change
const MessageContentSchema = conduit_utils_1.Struct({
    templateUri: 'string',
    contentVariablesJson: 'string',
}, 'CommEngineMessageContent');
exports.ResponseSchema = conduit_utils_1.Struct({
    messages: conduit_utils_1.ListOfStructs({
        key: 'string',
        priority: 'int',
        content: MessageContentSchema,
        messageContent: MessageContentSchema,
        placement: 'int',
        offline: 'boolean',
        expires: 'number',
    }, 'CommEngineMessage'),
    messageRequestGuid: 'string',
    config: conduit_utils_1.Struct({
        cooldownPeriodMillis: 'int',
    }, 'CommEngineConfig'),
}, 'CommEngineResponseSchema');
//# sourceMappingURL=CommEngineSchemaTypes.js.map