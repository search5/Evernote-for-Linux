"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionIndexConfig = exports.promotionTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.promotionTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.Promotion,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        optedOut: 'boolean',
        shownCount: 'number',
        timeLastShown: 'timestamp',
    },
};
exports.promotionIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.promotionTypeDef, {
    indexResolvers: {
        shownCount: conduit_storage_1.getIndexByResolverForPrimitives(exports.promotionTypeDef, ['NodeFields', 'shownCount']),
        timeLastShown: conduit_storage_1.getIndexByResolverForPrimitives(exports.promotionTypeDef, ['NodeFields', 'timeLastShown']),
    },
    queries: {
        Promotions: {
            sort: [
                { field: 'shownCount', order: 'ASC' },
                { field: 'timeLastShown', order: 'ASC' },
            ],
            params: {},
        },
    },
});
//# sourceMappingURL=Promotion.js.map