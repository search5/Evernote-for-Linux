"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareList = void 0;
const Types_1 = require("./Types");
function compareList(originalListParam, newList, parent) {
    const originalList = originalListParam.filter(i => !!i);
    const result = [];
    newList.forEach(newItem => {
        const originalNode = originalList.find(item => {
            return item.NodeFields.noteLevelID === newItem.noteLevelID;
        });
        if (!originalNode) {
            result.push({
                status: Types_1.ComparisonStatus.added,
                inputNode: newItem,
                parent,
            });
            return;
        }
        result.push({
            status: comparison(originalNode, newItem),
            inputNode: newItem,
            parent,
            originalNode,
        });
    });
    const deletedItems = originalList
        .filter(item => !newList.find(newItem => newItem.noteLevelID === item.NodeFields.noteLevelID))
        .map(originalNode => ({ status: Types_1.ComparisonStatus.deleted, originalNode }));
    result.push.apply(result, deletedItems);
    return result;
}
exports.compareList = compareList;
const comparison = (originalNode, newNode) => {
    // Special treatment for label
    const labelField = 'label';
    if ((newNode[labelField] !== undefined) && originalNode.label !== newNode[labelField]) {
        return Types_1.ComparisonStatus.modified;
    }
    for (const nodeField in originalNode.NodeFields) {
        if (originalNode.NodeFields[nodeField] !== newNode[nodeField] &&
            newNode[nodeField] !== undefined &&
            !(!originalNode.NodeFields[nodeField] && !newNode[nodeField]) // empty string and null is not enough difference
        ) {
            return Types_1.ComparisonStatus.modified;
        }
    }
    return Types_1.ComparisonStatus.same;
};
//# sourceMappingURL=Comparison.js.map