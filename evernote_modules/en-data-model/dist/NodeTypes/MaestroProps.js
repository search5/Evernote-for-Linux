"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.maestroPropsTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.maestroPropsTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.MaestroProps,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        jsonValue: 'string',
    },
};
//# sourceMappingURL=MaestroProps.js.map