"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronNotificationConverter = void 0;
const conduit_view_types_1 = require("conduit-view-types");
const en_conduit_plugin_scheduled_notification_shared_1 = require("en-conduit-plugin-scheduled-notification-shared");
function getElectronNotificationConverter(di) {
    function getOnClickHandler({ name, target }) {
        return target ? () => {
            di.emitEvent(conduit_view_types_1.ConduitEvent.NOTIFICATION_ACTION, { name, target });
        } : undefined;
    }
    const converter = {
        convert: (data) => {
            var _a;
            const onClick = getOnClickHandler({ name: data.clickNotificationActionName, target: data.clickNotificationActionTarget });
            return {
                id: data.id,
                title: data.title || en_conduit_plugin_scheduled_notification_shared_1.NOTIFICATION_DEFAULT_TITLE,
                body: data.body,
                onClick,
                iconPath: di.getIconPath(),
                buttons: (_a = data.buttons) === null || _a === void 0 ? void 0 : _a.map(button => ({
                    text: button.text,
                    onClick: getOnClickHandler(button.action),
                })),
                closeButtonText: data.closeButtonText,
            };
        },
    };
    return converter;
}
exports.getElectronNotificationConverter = getElectronNotificationConverter;
//# sourceMappingURL=ElectronNotificationConverter.js.map