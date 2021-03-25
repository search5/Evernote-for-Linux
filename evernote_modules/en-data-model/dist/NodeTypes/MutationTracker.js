"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutationTrackerTypeDef = exports.MUTATION_TRACKER_REF = void 0;
const conduit_storage_1 = require("conduit-storage");
const EntityConstants_1 = require("../EntityConstants");
const MUTATION_TRACKER_ID = 'MutationTracker';
exports.MUTATION_TRACKER_REF = { id: MUTATION_TRACKER_ID, type: EntityConstants_1.InternalEntityTypes.MutationTracker };
exports.mutationTrackerTypeDef = {
    name: EntityConstants_1.InternalEntityTypes.MutationTracker,
    syncSource: conduit_storage_1.SyncSource.NSYNC,
    nsyncFeatureGroup: 'Core',
    schema: {
        updated: 'number',
    },
};
//# sourceMappingURL=MutationTracker.js.map