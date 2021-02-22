"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashDiffToResourceUpdate = exports.calcResourceHashDiff = exports.extractResourceHashDiff = exports.extractResourceHashes = void 0;
const sax_parser_1 = require("sax-parser");
function getAttrValue(attrs, attr) {
    for (const kv of attrs) {
        if (kv[0] === attr) {
            return kv[1];
        }
    }
    return undefined;
}
function extractResourceHashes(enml) {
    const hashes = new Set();
    const parser = new sax_parser_1.SaxParser((p) => {
        p.onStartElementNS((elem, attrs) => {
            const hash = elem === 'en-media' ? getAttrValue(attrs, 'hash') : undefined;
            const loading = elem === 'en-media' ? getAttrValue(attrs, 'loading') : false;
            if (hash && !loading) {
                hashes.add(hash);
            }
        });
    });
    parser.parseString(enml);
    return hashes;
}
exports.extractResourceHashes = extractResourceHashes;
/**
 * Find resource hash diffs, extracting the hashes from content ENML if necessary
 */
function extractResourceHashDiff(oldContentOrHashes, newContentOrHashes) {
    const oldHashes = oldContentOrHashes instanceof Set ? oldContentOrHashes : extractResourceHashes(oldContentOrHashes);
    const newHashes = newContentOrHashes instanceof Set ? newContentOrHashes : extractResourceHashes(newContentOrHashes);
    return calcResourceHashDiff(oldHashes, newHashes);
}
exports.extractResourceHashDiff = extractResourceHashDiff;
function calcResourceHashDiff(oldHashes, newHashes) {
    const hashDiff = {};
    oldHashes.forEach(hash => {
        if (!newHashes.has(hash)) {
            hashDiff[hash] = false;
        }
    });
    newHashes.forEach(hash => {
        if (!oldHashes.has(hash)) {
            hashDiff[hash] = true;
        }
    });
    return hashDiff;
}
exports.calcResourceHashDiff = calcResourceHashDiff;
function hashDiffToResourceUpdate(hashDiff) {
    const update = {
        activateResourcesWithBodyHashes: [],
        deactivateResourcesWithBodyHashes: [],
    };
    for (const hash in hashDiff) {
        const val = hashDiff[hash];
        if (val === true) {
            update.activateResourcesWithBodyHashes.push(hash);
        }
        else if (val === false) {
            update.deactivateResourcesWithBodyHashes.push(hash);
        }
    }
    return update;
}
exports.hashDiffToResourceUpdate = hashDiffToResourceUpdate;
//# sourceMappingURL=EnmlUtils.js.map