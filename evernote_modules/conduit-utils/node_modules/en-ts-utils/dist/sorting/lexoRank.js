"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexoRank = exports.LexoRankDefaultChar = exports.LexoRankSafeMinChar = exports.LexoRankEndWeight = exports.LexoRankMaxChar = exports.LexoRankMinChar = void 0;
/*
 * Remove lower case from all possible lexorank algoritims. We do
 * this because the indexing doesn't respect case sorting, as we
 * rely on that for human readable sorting. Also remove numbers as
 * we sort numbers by numeric value in localeCompare, which will also
 * screw up things.
 */
exports.LexoRankMinChar = 'A'; // The true min, nothing can go above it; creates "deadlock" at the top of a list.
exports.LexoRankMaxChar = 'Z'; // This is the max char, but a sort weight can grow indefinitely unless an arbitrary cap is put on it.
exports.LexoRankEndWeight = ''; // The character used by the algorithm to mark either end of the character set.
exports.LexoRankSafeMinChar = 'B'; // Safe because it still allows sort weights above it
exports.LexoRankDefaultChar = 'M'; // A midway default value for entity values providing better distribution.
const gMinChar = exports.LexoRankMinChar.charCodeAt(0);
const gMaxChar = exports.LexoRankMaxChar.charCodeAt(0);
function lexoRank(light, heavy) {
    if (light === exports.LexoRankEndWeight && heavy === exports.LexoRankEndWeight) {
        return String.fromCharCode(gMinChar + 1);
    }
    else if (light === heavy) {
        return light; // No midpoint to be found!
    }
    if (light === exports.LexoRankEndWeight) {
        light = String.fromCharCode(gMinChar);
    }
    let i = 0;
    let rankl = light.length ? light.charCodeAt(i) : gMinChar;
    let rankh = heavy.length ? heavy.charCodeAt(i) : Math.min(gMaxChar, rankl + 16);
    let mid = Math.floor((rankl + rankh) / 2);
    let rank = '';
    while (rankl === rankh || mid === rankl) {
        rank += String.fromCharCode(rankl);
        i++;
        rankl = light.length > i ? light.charCodeAt(i) : gMinChar;
        rankh = heavy.length > i ? heavy.charCodeAt(i) : gMaxChar;
        mid = Math.floor((rankl + rankh) / 2);
    }
    while (mid > gMaxChar) {
        rank += String.fromCharCode(gMaxChar);
        mid -= gMaxChar - gMinChar;
    }
    rank += String.fromCharCode(mid);
    if (rank < light || (heavy !== exports.LexoRankEndWeight && rank > heavy)) {
        return light;
    }
    return rank;
}
exports.lexoRank = lexoRank;
//# sourceMappingURL=lexoRank.js.map