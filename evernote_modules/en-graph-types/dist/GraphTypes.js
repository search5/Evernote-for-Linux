"use strict";
/*
 * Copyright 2020-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAssociationHalfDstRef = exports.isAssociationHalfSrcRef = exports.isAssociationRef = void 0;
function isAssociationRef(ref) {
    return 'src' in ref && 'dst' in ref;
}
exports.isAssociationRef = isAssociationRef;
function isAssociationHalfSrcRef(ref) {
    return 'src' in ref;
}
exports.isAssociationHalfSrcRef = isAssociationHalfSrcRef;
function isAssociationHalfDstRef(ref) {
    return 'dst' in ref;
}
exports.isAssociationHalfDstRef = isAssociationHalfDstRef;
//# sourceMappingURL=GraphTypes.js.map