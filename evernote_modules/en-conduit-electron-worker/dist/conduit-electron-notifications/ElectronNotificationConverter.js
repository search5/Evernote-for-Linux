"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronNotificationConverter = void 0;
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_plugin_task_1 = require("en-conduit-plugin-task");
function getElectronNotificationConverter(di) {
    // TODO(droth) handle buttons
    const converter = {
        convert: (data) => {
            const onClick = data.clickNotificationActionTarget ? () => {
                di.emitEvent(conduit_view_types_1.ConduitEvent.NOTIFICATION_ACTION, { name: data.clickNotificationActionName, target: data.clickNotificationActionTarget });
            }
                : undefined;
            return {
                id: data.id,
                title: en_conduit_plugin_task_1.NOTIFICATION_DEFAULT_TITLE,
                body: data.body,
                onClick,
                iconPath: di.getIconPath(),
            };
        },
    };
    return converter;
}
exports.getElectronNotificationConverter = getElectronNotificationConverter;
//# sourceMappingURL=ElectronNotificationConverter.js.map