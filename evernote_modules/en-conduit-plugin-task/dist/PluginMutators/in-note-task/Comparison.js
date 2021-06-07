"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareList = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Types_1 = require("./Types");
function compareList(loadedList, newList, parent, graphDbListParam) {
    const graphDbList = graphDbListParam.filter(i => !!i);
    const result = [];
    /*
    * in the following table T means has value and F means does not have value
    *
    * loadedTaskGroupList     taskGroupList     graphDB       Action
    * T                       T                 T             Update (if different from loaded AND graphDb)
    * T                       T                 F             Do Nothing
    * T                       F                 T             Delete
    * T                       F                 F             Do Nothing
    * F                       T                 T             Update (if different from graphDb)
    * F                       T                 F             Create New
    * F                       F                 T             Do Nothing
    * F                       F                 F             N/A
    * */
    newList.forEach(newItem => {
        const loadedNode = loadedList.find(item => {
            return item.noteLevelID === newItem.noteLevelID;
        });
        const graphDbNode = graphDbList.find(item => {
            return item.NodeFields.noteLevelID === newItem.noteLevelID;
        });
        if (loadedNode && !graphDbNode) {
            result.push({
                status: Types_1.ComparisonStatus.notInGraphDb,
                inputNode: newItem,
                parent,
            });
        }
        else if (!loadedNode && !graphDbNode) {
            result.push({
                status: Types_1.ComparisonStatus.added,
                inputNode: newItem,
                parent,
            });
        }
        else if (loadedNode && graphDbNode) {
            let comparison = compareWithLoaded(loadedNode, newItem);
            if (comparison.status === Types_1.ComparisonStatus.modified) {
                comparison = compareWithGraphDb(graphDbNode, newItem);
            }
            result.push({
                status: comparison.status,
                modificationType: comparison.modificationType,
                inputNode: newItem,
                parent,
                loadedNode,
                graphDbNode,
            });
        }
        else if (!loadedNode && graphDbNode) {
            const { status, modificationType } = compareWithGraphDb(graphDbNode, newItem);
            result.push({
                status,
                modificationType,
                inputNode: newItem,
                parent,
                loadedNode,
                graphDbNode,
            });
        }
        else {
            throw new Error('Unhandled case in inNoteTaskApplyChanges => compareList');
        }
    });
    const deletedItems = loadedList
        .filter(loadedNode => !newList.find(newItem => newItem.noteLevelID === loadedNode.noteLevelID))
        .filter(loadedNode => graphDbList.find(graphDbItem => graphDbItem.NodeFields.noteLevelID === loadedNode.noteLevelID))
        .map(loadedNode => ({
        status: Types_1.ComparisonStatus.deleted,
        loadedNode,
        graphDbNode: graphDbList.find(graphDbItem => graphDbItem.NodeFields.noteLevelID === loadedNode.noteLevelID),
    }));
    result.push.apply(result, deletedItems);
    return result;
}
exports.compareList = compareList;
const compareWithGraphDb = (GraphDbNode, newNode) => {
    const modificationType = {
        props: false,
        assignee: false,
    };
    // Special treatment for label
    const labelField = 'label';
    if ((newNode[labelField] !== undefined) && GraphDbNode.label !== newNode[labelField]) {
        modificationType.props = true;
    }
    for (const nodeField in GraphDbNode.NodeFields) {
        if (GraphDbNode.NodeFields[nodeField] !== newNode[nodeField] &&
            newNode[nodeField] !== undefined &&
            !(!GraphDbNode.NodeFields[nodeField] && !newNode[nodeField]) // empty string and null is not enough difference
        ) {
            if (nodeField === 'assigneeEmail') {
                modificationType.assignee = true;
            }
            else {
                modificationType.props = true;
            }
        }
    }
    if (GraphDbNode.type === en_data_model_1.EntityTypes.Task) {
        const assignee = conduit_utils_1.firstStashEntry(GraphDbNode.outputs.assignee);
        if ((assignee === null || assignee === void 0 ? void 0 : assignee.dstID) !== newNode.assigneeID) {
            modificationType.assignee = true;
        }
    }
    return {
        status: (modificationType.props || modificationType.assignee) ? Types_1.ComparisonStatus.modified : Types_1.ComparisonStatus.same,
        modificationType,
    };
};
const compareWithLoaded = (loadedNode, newNode) => {
    const modificationType = {
        props: false,
        assignee: false,
    };
    // Special treatment for label
    const labelField = 'label';
    if ((newNode[labelField] !== undefined) && loadedNode[labelField] !== newNode[labelField]) {
        modificationType.props = true;
    }
    for (const nodeField in loadedNode) {
        if (loadedNode[nodeField] !== newNode[nodeField] &&
            newNode[nodeField] !== undefined &&
            !(!loadedNode[nodeField] && !newNode[nodeField]) && // empty string and null is not enough difference// empty string and null is not enough difference
            nodeField !== 'reminders') {
            if (['assigneeID', 'assigneeEmail'].includes(nodeField)) {
                modificationType.assignee = true;
            }
            else {
                modificationType.props = true;
            }
        }
    }
    return {
        status: (modificationType.props || modificationType.assignee) ? Types_1.ComparisonStatus.modified : Types_1.ComparisonStatus.same,
        modificationType,
    };
};
//# sourceMappingURL=Comparison.js.map