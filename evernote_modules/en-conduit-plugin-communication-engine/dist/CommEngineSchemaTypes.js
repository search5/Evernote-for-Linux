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
    templateUri: conduit_utils_1.NullableString,
    contentVariablesJson: conduit_utils_1.NullableString,
}, 'CommEngineMessageContent');
exports.ResponseSchema = conduit_utils_1.Struct({
    messages: conduit_utils_1.ListOfStructs({
        key: conduit_utils_1.NullableString,
        priority: conduit_utils_1.NullableInt,
        content: conduit_utils_1.Nullable(MessageContentSchema),
        messageContent: conduit_utils_1.Nullable(MessageContentSchema),
        placement: conduit_utils_1.NullableInt,
        offline: conduit_utils_1.NullableBoolean,
        expires: conduit_utils_1.NullableNumber,
    }, 'CommEngineMessage'),
    messageRequestGuid: conduit_utils_1.NullableString,
    config: conduit_utils_1.NullableStruct({
        cooldownPeriodMillis: conduit_utils_1.NullableInt,
    }, 'CommEngineConfig'),
}, 'CommEngineResponseSchema');
//# sourceMappingURL=CommEngineSchemaTypes.js.map