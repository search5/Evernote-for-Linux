"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateShortCutEntry = exports.reconcileIncomingShortcuts = void 0;
const conduit_utils_1 = require("conduit-utils");
/**
 *  map Type to [min, max] entries in shortcut
 *  https://source.build.etonreve.com/projects/WEB/repos/web/browse/webclient/webclient-client/src/main/java/com/evernote/web/client/edam/type/ShortcutType.java
 */
const ShortCutTypeLimits = {
    Note: [1, 2],
    Notebook: [1, 1],
    SavedSearch: [1, 1],
    Stack: [1, 1],
    Tag: [1, 2],
    Trash: [0, 0],
    Workspace: [1, 1],
};
// The currentShortcuts object will be modified in this function
async function reconcileIncomingShortcuts(incomingShortcuts, currentShortcuts, process) {
    let inserts = [];
    let deletes = 0;
    const existingIDs = [];
    const existingMap = {};
    let incoming = 0;
    let existing = 0;
    let current = 0;
    let lastOrder = '';
    async function processInserts(low, high) {
        if (inserts.length === 0) {
            return;
        }
        for (const sc of inserts) {
            low = conduit_utils_1.lexoRank(low, high || '');
            sc.NodeFields.sortOrder = low;
            await process(sc.id, sc);
        }
        inserts = [];
    }
    // Pre processing *THIS MODIFIES THE currentShortcuts OBJECT*
    for (let i = 0; i < currentShortcuts.nodes.length; i++) {
        const currID = currentShortcuts.nodes[i].id;
        if (incomingShortcuts.nodeMap[currentShortcuts.nodes[i].id] === undefined) {
            await process(currID);
            currentShortcuts.nodes.splice(i, 1);
            delete currentShortcuts.nodeMap[currID];
            deletes++;
            i--;
        }
        else {
            currentShortcuts.nodeMap[currID] -= deletes;
        }
    }
    incomingShortcuts.nodes.forEach(incSC => {
        if (currentShortcuts.nodeMap[incSC.id] !== undefined) {
            existingMap[incSC.id] = existingIDs.length;
            existingIDs.push(incSC.id);
        }
    });
    while (incoming < incomingShortcuts.nodes.length && current < currentShortcuts.nodes.length) {
        const currID = currentShortcuts.nodes[current].id;
        const incomingSC = incomingShortcuts.nodes[incoming];
        const incomingID = incomingSC.id;
        if (currID !== incomingID) {
            const currPos = currentShortcuts.nodeMap[incomingID];
            const existingPos = existingMap[currID];
            // Deletes are handled above, so no need to take care of that here
            if (currPos === undefined) {
                // Handle the incoming ID being a new shortcut
                inserts.push(incomingSC);
                incoming++;
                continue;
            }
            else if (existingPos === undefined) {
                // This shouldn't happen, as it is handeled in the first loop above
                continue;
            }
            else {
                // Both elements are found, now it gets complicated
                const relCurPos = currPos - current;
                const relExistingPos = existingPos - existing;
                if (relCurPos - relExistingPos === 0) {
                    // Both elements were found at a relative distance from eachother, this is a swap
                    // Update only the incoming node (current node will get updated when second mismatch is found)
                    const setOrder = currentShortcuts.nodes[current].NodeFields.sortOrder;
                    await processInserts(lastOrder, setOrder);
                    incomingSC.NodeFields.sortOrder = setOrder;
                    await process(incomingID, incomingSC);
                    lastOrder = setOrder;
                    current++;
                    incoming++;
                    existing++;
                }
                else if (relCurPos < 0 || relExistingPos < relCurPos) {
                    // The incoming element was moved
                    inserts.push(incomingSC);
                    incoming++;
                    existing++;
                }
                else {
                    current++;
                }
            }
        }
        else {
            await processInserts(lastOrder, currentShortcuts.nodes[current].NodeFields.sortOrder);
            lastOrder = currentShortcuts.nodes[current].NodeFields.sortOrder;
            current++;
            incoming++;
            existing++;
        }
    }
    while (incoming < incomingShortcuts.nodes.length) {
        inserts.push(incomingShortcuts.nodes[incoming]);
        incoming++;
    }
    await processInserts(lastOrder);
    // Correct for order conflicts - should probably split this into a sperate function?
    const clean = [];
    const conflicts = [];
    for (let i = 1; i < currentShortcuts.nodes.length; i++) {
        const sc = currentShortcuts.nodes[i];
        const prevSc = currentShortcuts.nodes[i - 1];
        if (prevSc && sc.NodeFields.sortOrder === prevSc.NodeFields.sortOrder) {
            conflicts.push(sc);
        }
        else {
            clean.push(sc);
        }
    }
    for (let i = 0, j = 0; i < conflicts.length; i++) {
        const conflict = conflicts[i];
        while (clean[j] && clean[j].NodeFields.sortOrder <= conflict.NodeFields.sortOrder) {
            j++;
        }
        const low = clean[j - 1] && clean[j - 1].NodeFields.sortOrder || '';
        const high = clean[j] && clean[j].NodeFields.sortOrder || '';
        const newSc = Object.assign(Object.assign({}, conflict), { NodeFields: Object.assign(Object.assign({}, conflict.NodeFields), { sortOrder: conduit_utils_1.lexoRank(low, high) }) });
        await process(newSc.id, newSc);
        clean.splice(j, 0, newSc);
        j--;
    }
}
exports.reconcileIncomingShortcuts = reconcileIncomingShortcuts;
// here corresponding monolith logic
// https://source.build.etonreve.com/projects/WEB/repos/web/browse/webclient/webclient-client/src/main/java/com/evernote/web/client/edam/type/ShortcutType.java
function validateShortCutEntry(shortCutEntry) {
    function logInvalid() {
        conduit_utils_1.logger.warn('Unknown or invalid data type for shortcut entry', shortCutEntry);
    }
    if (!shortCutEntry.length) {
        logInvalid();
        return false;
    }
    const type = shortCutEntry[0];
    if (!ShortCutTypeLimits[type]) {
        logInvalid();
        return false;
    }
    const [min, max] = ShortCutTypeLimits[type];
    const valueLength = shortCutEntry.length - 1; // first is key entry;
    if (valueLength < min || valueLength > max) {
        logInvalid();
        return false;
    }
    else {
        return true;
    }
}
exports.validateShortCutEntry = validateShortCutEntry;
//# sourceMappingURL=ShortcutHelpers.js.map