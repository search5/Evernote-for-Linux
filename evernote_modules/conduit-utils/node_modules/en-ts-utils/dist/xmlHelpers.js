"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeXML = exports.decodeXML = void 0;
function decodeXML(text) {
    return text
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/<br\/>/g, '\n');
}
exports.decodeXML = decodeXML;
function escapeXML(text) {
    return text
        .replace(/\n/g, '<br/>')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
exports.escapeXML = escapeXML;
//# sourceMappingURL=xmlHelpers.js.map