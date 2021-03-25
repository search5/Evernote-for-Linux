"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSetReminderSetting = void 0;
const conduit_core_1 = require("conduit-core");
const EntityConstants_1 = require("../EntityConstants");
const User_1 = require("../NodeTypes/User");
exports.userSetReminderSetting = {
    type: conduit_core_1.MutatorRemoteExecutorType.Thrift,
    requiredParams: {
        setting: Object.values(User_1.UserReminderEmailConfig),
    },
    optionalParams: {},
    execute: null,
    executeOnService: async (trc, ctx, params) => {
        return {
            command: 'UserUpdateReminderSetting',
            nodeType: EntityConstants_1.CoreEntityTypes.User,
            params,
            owner: ctx.userID,
        };
    },
};
//# sourceMappingURL=UserMutators.js.map