"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
exports.updateStackToServiceForPartialNb = exports.expungeLinkedNotebooksOnService = exports.removePartialNotebook = exports.processLinkedNotebooksForPartialNotebooks = exports.getExpungedLinkedNotebooks = exports.convertPartialNbGuidToSharedNbGuid = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_conduit_sync_types_1 = require("en-conduit-sync-types");
const en_core_entity_types_1 = require("en-core-entity-types");
const SimplyImmutable = __importStar(require("simply-immutable"));
const Auth_1 = require("../Auth");
const Converters_1 = require("./Converters");
const LINKED_NOTEBOOK_SYNC_STATE_PATH = ['sharing', 'linkedNotebooks'];
function convertSharedNbGuidToPartialNbGuid(sharedNbId) {
    // appending prefix to prevent any collisions between sharedNbId and actual notebook guids.
    return `lnb:${sharedNbId}`;
}
function convertSharedNbGuidToPartialNbNodeID(sharedNbId) {
    return Converters_1.convertGuidFromService(convertSharedNbGuidToPartialNbGuid(sharedNbId), en_core_entity_types_1.CoreEntityTypes.Notebook);
}
function convertPartialNbGuidToSharedNbGuid(partialNbId) {
    return partialNbId.slice('lnb:'.length);
}
exports.convertPartialNbGuidToSharedNbGuid = convertPartialNbGuidToSharedNbGuid;
function notebookServiceDataFromLinkedNb(linkedNb) {
    if (!linkedNb.guid || !linkedNb.sharedNotebookGlobalId || !linkedNb.shardId || !linkedNb.noteStoreUrl) {
        conduit_utils_1.logger.debug(`Ignoring linkedNotebook for partial notebooks because of incomplete information ${JSON.stringify(linkedNb)}`);
        return null;
    }
    const guid = convertSharedNbGuidToPartialNbGuid(linkedNb.sharedNotebookGlobalId);
    return {
        guid,
        isPartialNotebook: true,
        name: linkedNb.shareName,
        stack: linkedNb.stack,
        updateSequenceNum: linkedNb.updateSequenceNum,
        shardId: linkedNb.shardId,
        noteStoreUrl: linkedNb.noteStoreUrl,
    };
}
async function getLinkedNotebooksSyncState(trc, graphTransaction) {
    return await graphTransaction.getSyncState(trc, null, LINKED_NOTEBOOK_SYNC_STATE_PATH) || {};
}
async function replaceLinkedNotebooksSyncState(trc, graphTransaction, value) {
    return await graphTransaction.replaceSyncState(trc, LINKED_NOTEBOOK_SYNC_STATE_PATH, value);
}
// check if a partial notebook needs to be deleted from graph.
// we can remove partial nb if all linked nbs pointing to sharedNb are removed.
async function getPartialNbToRemoveForSharedNbId(trc, graphTransaction, sharedNbsSyncState, linkedNbsSyncState, sharedNotebookGlobalID) {
    const partialNbGuid = convertSharedNbGuidToPartialNbGuid(sharedNotebookGlobalID);
    if (sharedNbsSyncState[sharedNotebookGlobalID]) {
        // shared nb is already being synced. can remove partial nb.
        return partialNbGuid;
    }
    // check if any other linkedNb is linked to this shared NB.
    let removePartialNb = true;
    for (const guid in linkedNbsSyncState) {
        if (linkedNbsSyncState[guid] && linkedNbsSyncState[guid].sharedNotebookGlobalId === sharedNotebookGlobalID) {
            removePartialNb = false;
            break;
        }
    }
    return removePartialNb ? partialNbGuid : null;
}
async function getLinkedNotebooksFromSharedNbGlobalID(trc, graphTransaction, sharedNotebookGlobalID) {
    const linkedNbs = [];
    const syncState = await getLinkedNotebooksSyncState(trc, graphTransaction);
    for (const guid in syncState) {
        if (sharedNotebookGlobalID.indexOf(syncState[guid].sharedNotebookGlobalId) !== -1) {
            linkedNbs.push(guid);
        }
    }
    return linkedNbs;
}
async function getExpungedLinkedNotebooks(trc, graphTransaction, notebooks) {
    const sharedNotebookGlobalIDs = (notebooks || []).reduce((ar, nb) => {
        var _a;
        if (((_a = nb.recipientSettings) === null || _a === void 0 ? void 0 : _a.recipientStatus) === en_conduit_sync_types_1.TRecipientStatus.NOT_IN_MY_LIST && Boolean(nb.sharedNotebooks)) {
            const sharedNbIDs = nb.sharedNotebooks.filter(snb => Boolean(snb.globalId)).map(s => s.globalId);
            return ar.concat(sharedNbIDs);
        }
        return ar;
    }, []);
    const linkedNbs = await getLinkedNotebooksFromSharedNbGlobalID(trc, graphTransaction, sharedNotebookGlobalIDs);
    return linkedNbs;
}
exports.getExpungedLinkedNotebooks = getExpungedLinkedNotebooks;
async function processLinkedNotebooksForPartialNotebooks(trc, graphTransaction, businessID, linkedNbs, expungedLinkedNbs) {
    const partialNbsToAdd = [];
    const partialNbsToRemove = [];
    if (!linkedNbs && !expungedLinkedNbs) {
        return { partialNbsToAdd, partialNbsToRemove };
    }
    const sharedNbsToAdd = {};
    const sharedNbsToRemove = new Set();
    // update sync state
    const syncState = await getLinkedNotebooksSyncState(trc, graphTransaction);
    const linkedNbsSyncState = SimplyImmutable.cloneMutable(syncState);
    if (linkedNbs && linkedNbs.length) {
        for (const linkedNb of linkedNbs) {
            if (!linkedNb.guid || !linkedNb.sharedNotebookGlobalId) {
                continue;
            }
            if (businessID && linkedNb.businessId === businessID) {
                // ignore self shared linked nbs for business accounts.
                continue;
            }
            linkedNbsSyncState[linkedNb.guid] = { sharedNotebookGlobalId: linkedNb.sharedNotebookGlobalId };
            sharedNbsToAdd[linkedNb.sharedNotebookGlobalId] = linkedNb;
        }
    }
    if (expungedLinkedNbs && expungedLinkedNbs.length) {
        for (const expunged of expungedLinkedNbs) {
            if (linkedNbsSyncState[expunged]) {
                sharedNbsToRemove.add(linkedNbsSyncState[expunged].sharedNotebookGlobalId);
                delete linkedNbsSyncState[expunged];
            }
        }
    }
    await replaceLinkedNotebooksSyncState(trc, graphTransaction, linkedNbsSyncState);
    // check if partial notebooks need to be created/removed
    const sharedNbSyncState = await graphTransaction.getSyncState(trc, null, ['sharing', 'sharedNotebooks']);
    for (const shareNbId in sharedNbsToAdd) {
        if (sharedNbSyncState && sharedNbSyncState[sharedNbsToAdd[shareNbId].sharedNotebookGlobalId]) {
            // Invitation already accepted and notebook is being synced.
            continue;
        }
        const nbServiceData = notebookServiceDataFromLinkedNb(sharedNbsToAdd[shareNbId]);
        if (nbServiceData) {
            partialNbsToAdd.push(nbServiceData);
        }
    }
    for (const shareNbId of sharedNbsToRemove) {
        const partialNbGuid = await getPartialNbToRemoveForSharedNbId(trc, graphTransaction, sharedNbSyncState || {}, linkedNbsSyncState, shareNbId);
        if (partialNbGuid) {
            partialNbsToRemove.push(partialNbGuid);
        }
    }
    return { partialNbsToAdd, partialNbsToRemove };
}
exports.processLinkedNotebooksForPartialNotebooks = processLinkedNotebooksForPartialNotebooks;
// Remove partial notebook created for sharedNotebook
async function removePartialNotebook(trc, params, syncContext, sharedNotebookGlobalID, expungeLinkedNbOnService) {
    const linkedNbId = convertSharedNbGuidToPartialNbNodeID(sharedNotebookGlobalID);
    const partialNbNode = await params.graphTransaction.getNode(trc, null, { id: linkedNbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
    if (!partialNbNode) {
        return;
    }
    await params.graphTransaction.deleteNode(trc, syncContext, { id: linkedNbId, type: en_core_entity_types_1.CoreEntityTypes.Notebook });
    if (expungeLinkedNbOnService && params.personalAuth) {
        await expungeLinkedNotebooksOnService(trc, params.graphTransaction, params.thriftComm, params.personalAuth, sharedNotebookGlobalID);
    }
}
exports.removePartialNotebook = removePartialNotebook;
async function expungeLinkedNotebooksOnService(trc, graphTransaction, thriftComm, personalAuth, sharedNotebookGlobalID) {
    const linkedNbsToExpunge = [];
    const syncState = await getLinkedNotebooksSyncState(trc, graphTransaction);
    const linkedNbsSyncState = SimplyImmutable.cloneMutable(syncState);
    for (const guid in linkedNbsSyncState) {
        if (linkedNbsSyncState[guid].sharedNotebookGlobalId === sharedNotebookGlobalID) {
            linkedNbsToExpunge.push(guid);
            delete linkedNbsSyncState[guid];
        }
    }
    if (linkedNbsToExpunge.length) {
        // cleanup sync state
        await replaceLinkedNotebooksSyncState(trc, graphTransaction, linkedNbsSyncState);
        // expunge linked Nbs on service
        const noteStoreClient = thriftComm.getNoteStore(personalAuth.urls.noteStoreUrl);
        for (const guid of linkedNbsToExpunge) {
            await noteStoreClient.expungeLinkedNotebook(trc, personalAuth.token, guid);
        }
    }
}
exports.expungeLinkedNotebooksOnService = expungeLinkedNotebooksOnService;
async function updateStackToServiceForPartialNb(trc, params, notebook, stack) {
    if (!notebook.NodeFields.isPartialNotebook || !notebook.NodeFields.internal_linkedNotebookParams) {
        throw new conduit_utils_1.InternalError(`Incorrect partial notebook. ${conduit_utils_1.safeStringify(notebook)}`);
    }
    const { noteStoreUrl, shardId } = notebook.NodeFields.internal_linkedNotebookParams;
    if (!noteStoreUrl || !shardId) {
        throw new conduit_utils_1.InternalError(`Missing linkedNb params in partial Nb. ${conduit_utils_1.safeStringify(notebook)}`);
    }
    const { personalAuth, thriftComm } = params;
    const sharedNotebookGlobalId = convertPartialNbGuidToSharedNbGuid(Converters_1.convertGuidToService(notebook.id, en_core_entity_types_1.CoreEntityTypes.Notebook));
    // need to fetch sharedNB in order to get username without which updateLinkedNotebook fails.
    const sharedNotebook = await Auth_1.authenticateToSharedNotebook(trc, params.thriftComm, personalAuth, sharedNotebookGlobalId, noteStoreUrl);
    if (!sharedNotebook) {
        conduit_utils_1.logger.warn('Couldnt authenticate to shared nb. Possibly lost access ', sharedNotebookGlobalId);
        return null;
    }
    const personalNoteStore = thriftComm.getNoteStore(personalAuth.urls.noteStoreUrl);
    // need to fetch full linkedNb from service, updateLinkedNotebook is overwriting values that are not set.
    const linkedNb = await personalNoteStore.getOrCreateLinkedNotebook(trc, personalAuth.token, {
        sharedNotebookGlobalId,
        username: sharedNotebook.username,
        shareName: notebook.label,
        shardId,
    });
    const newLinkedNb = Object.assign(Object.assign({}, linkedNb), { stack });
    await personalNoteStore.updateLinkedNotebook(trc, personalAuth.token, newLinkedNb);
    return notebookServiceDataFromLinkedNb(newLinkedNb);
}
exports.updateStackToServiceForPartialNb = updateStackToServiceForPartialNb;
//# sourceMappingURL=LinkedNotebookHelpers.js.map