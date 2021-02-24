"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.betaFeatureIndexConfig = exports.betaFeatureTypeDef = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
exports.betaFeatureTypeDef = {
    name: EntityConstants_1.CoreEntityTypes.BetaFeature,
    syncSource: conduit_storage_1.SyncSource.THRIFT,
    schema: {
        betaFeatureKey: 'number',
        isAvailable: 'boolean',
    },
};
exports.betaFeatureIndexConfig = conduit_storage_1.buildNodeIndexConfiguration(exports.betaFeatureTypeDef, {
    indexResolvers: {
        betaFeatureKey: conduit_storage_1.getIndexByResolverForPrimitives(exports.betaFeatureTypeDef, ['NodeFields', 'betaFeatureKey']),
        isAvailable: conduit_storage_1.getIndexByResolverForPrimitives(exports.betaFeatureTypeDef, ['NodeFields', 'isAvailable']),
    },
    queries: {
        BetaFeatures: {
            sort: [{ field: 'betaFeatureKey', order: 'ASC' }, { field: 'isAvailable', order: 'ASC' }],
            params: {},
        },
    },
});
//# sourceMappingURL=BetaFeature.js.map