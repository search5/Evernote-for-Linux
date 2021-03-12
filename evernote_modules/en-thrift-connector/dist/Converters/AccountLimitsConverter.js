"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNodeTypeCount = exports.updateAccountLimitsNode = exports.initAccountLimitsNode = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Helpers_1 = require("../Helpers");
const EMPTY_RESOURCE_COUNTS = SimplyImmutable.deepFreeze({
    userNoteCount: 0,
    userNotebookCount: 0,
    userLinkedNotebookCount: 0,
    userTagCount: 0,
    userSavedSearchesCount: 0,
    userDeviceCount: 0,
    userWorkspaceCount: 0,
    userUploadedAmount: 0,
    userNoteAndNotebookSharesSentCount: 0,
});
// this should never actually get used, so initialize to 0s just to satisfy the compiler
const DEFAULT_ACCOUNT_LIMITS = {
    userMailLimitDaily: 0,
    noteSizeMax: 0,
    resourceSizeMax: 0,
    userLinkedNotebookMax: 0,
    uploadLimit: 0,
    userNoteCountMax: 0,
    userNotebookCountMax: 0,
    userTagCountMax: 0,
    noteTagCountMax: 0,
    userSavedSearchesMax: 0,
    noteResourceCountMax: 0,
    userDeviceLimit: 0,
    userAdvertisedDeviceLimit: 0,
    userWorkspaceCountMax: 0,
};
const TYPE_TO_COUNT_MAP = {
    Note: 'userNoteCount',
    Notebook: 'userNotebookCount',
    Tag: 'userTagCount',
    SavedSearch: 'userSavedSearchesCount',
    Workspace: 'userWorkspaceCount',
};
async function initAccountLimitsNode(trc, params, syncContext, auth, limits) {
    const current = await params.graphTransaction.getNode(trc, null, { id: en_core_entity_types_1.ACCOUNT_LIMITS_ID, type: en_core_entity_types_1.CoreEntityTypes.AccountLimits });
    let allowance = -1;
    try {
        const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
        const restrictions = await utilityStore.getUserRestrictions(trc, auth.token);
        allowance = restrictions.noteAndNotebookSharesAllowance;
        if (allowance === undefined || allowance === null) {
            return -1;
        }
    }
    catch (_a) {
        conduit_utils_1.logger.warn('Could not fetch sharesAllowance. Defaulting to unlimited');
    }
    await convertAccountLimitsFromService(trc, params, syncContext, {
        Limits: Object.assign({}, (limits || (current ? current.NodeFields.Limits : DEFAULT_ACCOUNT_LIMITS))),
        Counts: Object.assign({}, (current ? current.NodeFields.Counts : EMPTY_RESOURCE_COUNTS)),
    });
    await params.graphTransaction.setNodeCachedField(trc, { id: en_core_entity_types_1.ACCOUNT_LIMITS_ID, type: en_core_entity_types_1.CoreEntityTypes.AccountLimits }, 'noteAndNotebookSharesAllowance', allowance, {});
}
exports.initAccountLimitsNode = initAccountLimitsNode;
async function updateAccountLimitsNode(trc, params, syncContext, updatedCounts) {
    const current = await params.graphTransaction.getNode(trc, null, en_core_entity_types_1.ACCOUNT_LIMITS_REF);
    await convertAccountLimitsFromService(trc, params, syncContext, {
        Limits: Object.assign({}, (current ? current.NodeFields.Limits : DEFAULT_ACCOUNT_LIMITS)),
        Counts: Object.assign(Object.assign({}, (current ? current.NodeFields.Counts : EMPTY_RESOURCE_COUNTS)), updatedCounts),
    });
}
exports.updateAccountLimitsNode = updateAccountLimitsNode;
async function updateNodeTypeCount(trc, graphTransaction, syncContext, type, delta, customCountName) {
    const countField = customCountName || TYPE_TO_COUNT_MAP[type];
    if (!countField) {
        return;
    }
    const current = await graphTransaction.getNode(trc, null, en_core_entity_types_1.ACCOUNT_LIMITS_REF);
    if (!current) {
        return;
    }
    if (!current.syncContexts.includes(syncContext)) {
        if (!customCountName && type === en_core_entity_types_1.CoreEntityTypes.Notebook && syncContext.match(Helpers_1.LINKED_CONTEXT_REGEX)) {
            const accountLimitsContext = current.syncContexts[0]; // I can't think of a case where the AccountLimits node would have two syncContexts
            await graphTransaction.updateNode(trc, accountLimitsContext, en_core_entity_types_1.ACCOUNT_LIMITS_REF, {
                NodeFields: {
                    Counts: {
                        userLinkedNotebookCount: (current ? current.NodeFields.Counts.userLinkedNotebookCount : 0) + delta,
                    },
                },
            });
        }
        return;
    }
    await graphTransaction.updateNode(trc, syncContext, en_core_entity_types_1.ACCOUNT_LIMITS_REF, {
        NodeFields: {
            Counts: {
                [countField]: (current ? current.NodeFields.Counts[countField] : 0) + delta,
            },
        },
    });
}
exports.updateNodeTypeCount = updateNodeTypeCount;
async function convertAccountLimitsFromService(trc, params, syncContext, serviceData) {
    const limits = serviceData.Limits;
    const counts = serviceData.Counts;
    const accountLimits = {
        id: en_core_entity_types_1.ACCOUNT_LIMITS_ID,
        type: en_core_entity_types_1.CoreEntityTypes.AccountLimits,
        version: 0,
        syncContexts: [],
        localChangeTimestamp: 0,
        label: 'accountLimits',
        NodeFields: {
            Limits: Object.assign({}, limits),
            Counts: Object.assign({}, counts),
        },
        inputs: {},
        outputs: {},
    };
    await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, accountLimits);
}
//# sourceMappingURL=AccountLimitsConverter.js.map