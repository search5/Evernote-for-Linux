"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addIncrementallyIncreasingSuffix = void 0;
function addIncrementallyIncreasingSuffix(label) {
    const incrementallyIncreasingSuffix = /_[0-9]+$/.exec(label);
    if (incrementallyIncreasingSuffix) {
        const suffixNumber = parseInt(incrementallyIncreasingSuffix[0].replace('_', ''), 10);
        return `${label.substr(0, label.lastIndexOf('_'))}_${suffixNumber + 1}`;
    }
    return `${label}_1`;
}
exports.addIncrementallyIncreasingSuffix = addIncrementallyIncreasingSuffix;
//# sourceMappingURL=addIncrementallyIncreasingSuffix.js.map