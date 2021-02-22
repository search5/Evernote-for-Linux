"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadonlyIndexingTree = exports.sumDataChildCount = void 0;
const conduit_utils_1 = require("conduit-utils");
function sumDataChildCount(data, start, stop) {
    const startIdx = start !== undefined && start >= 0 && start <= data.length ? start : 0;
    const stopIdx = stop !== undefined && stop >= 0 && stop < data.length ? stop : data.length;
    return stopIdx - startIdx;
}
exports.sumDataChildCount = sumDataChildCount;
class ReadonlyIndexingTree {
    constructor(db, tableName, order = 100, comparator, rootID = 'b.tree.root') {
        this.db = db;
        this.tableName = tableName;
        this.order = order;
        this.comparator = comparator;
        this.rootID = rootID;
    }
    async validate() {
        const trc = conduit_utils_1.createTraceContext('tree-validation');
        const tree = await this.inMemoryTree(trc);
        this.validateInternal(tree);
    }
    validateRelations(tree) {
        for (const key in tree) {
            const node = tree[key];
            if (node.parent) {
                if (!tree.hasOwnProperty(node.parent)) {
                    throw new Error(`Orphan node in tree`);
                }
                const parent = tree[node.parent];
                if (!parent.refs.find(e => e.ref === node.id)) {
                    throw new Error(`Parent node has lost child`);
                }
            }
        }
    }
    validateInOrderLeaves(tree) {
        const root = tree[this.rootID];
        const queue = [root];
        let prev;
        let current;
        while (queue.length && !this.isLeafNode(queue[0])) {
            const innerNode = queue.shift();
            for (const ref of innerNode.refs) {
                queue.push(tree[ref.ref]);
            }
        }
        while (queue.length) {
            prev = current;
            current = queue.shift();
            if (!current) {
                continue;
            }
            if (!this.isLeafNode(current)) {
                throw new Error(`Leaves must all be at the same level`);
            }
            if (current.prev) {
                if (!prev) {
                    throw new Error(`Shouldn't happen`);
                }
                if (!this.isLeafNode(prev)) {
                    throw new Error(`First leaf in the tree should not have a prev pointer`);
                }
                if (current.prev !== prev.id) {
                    throw new Error(`Leaf.prev does not correspond to the in-order traversal of the tree`);
                }
            }
            if (current.next) {
                if (!queue.length) {
                    throw new Error(`Last leaf in the tree should not have a next pointer`);
                }
                if (current.next !== queue[0].id) {
                    throw new Error(`Leaf.next does not correspond to the in-order traversal of the tree`);
                }
            }
        }
    }
    validateInternal(tree) {
        if (!Object.keys(tree).length) {
            return;
        }
        const root = tree[this.rootID];
        if (!root) {
            throw new conduit_utils_1.NotFoundError(`No root node in the tree`);
        }
        this.validateRelations(tree);
        this.validateInOrderLeaves(tree);
        let current = root;
        // Traverse to leftmost leaf
        while (!this.isLeafNode(current)) {
            current = tree[current.refs[0].ref];
            if (!current) {
                throw new conduit_utils_1.NotFoundError(`Failed to traverse to leftmost leaf`);
            }
        }
        if (current.prev) {
            throw new Error(`Leftmost leaf must not have a pointer to the previous leaf`);
        }
        let totalChildren = 0;
        const leftLeaf = current;
        // Traverse to the rightmost leaf
        while (current.next) {
            totalChildren += sumDataChildCount(current.data);
            current = tree[current.next];
            if (!current || !this.isLeafNode(current)) {
                throw new Error(`prev and next pointers must point only to other leaf nodes`);
            }
        }
        totalChildren += sumDataChildCount(current.data);
        const rightLeaf = current;
        // Traverse back the other way
        while (current.prev) {
            current = tree[current.prev];
            if (!current || !this.isLeafNode(current)) {
                throw new Error(`prev and next pointers must point only to other leaf nodes`);
            }
        }
        if (current.id !== leftLeaf.id) {
            throw new Error(`Malformed linked list`);
        }
        // Go back up the right side validating that it is the rightmost ref at each point
        current = tree[rightLeaf.id];
        let childID = current.id;
        while (childID !== this.rootID) {
            if (!current.parent) {
                throw new Error(`Nodes below root must always have a parent`);
            }
            current = tree[current.parent];
            if (current.refs[current.refs.length - 1].ref !== childID) {
                throw new Error(`Right most leaf must be located on the far right traversal`);
            }
            childID = current.id;
        }
        // Validate correct child count of root
        const treeChildCount = this.isLeafNode(current) ? sumDataChildCount(current.data) : current.childCount;
        if (treeChildCount !== totalChildren) {
            throw new Error(`Tree has incorrect child count. Got: ${treeChildCount}, expected: ${totalChildren}`);
        }
    }
    async inMemoryTree(trc) {
        const root = await this.fetchRootNode(trc, null);
        if (!root) {
            return {};
        }
        else if (this.isLeafNode(root)) {
            return { [this.rootID]: root };
        }
        const tree = {};
        const stack = [root];
        while (stack.length) {
            const current = stack.pop();
            if (current) {
                tree[current.id] = current;
                if (!this.isLeafNode(current)) {
                    for (const ref of current.refs) {
                        const child = await this.fetchTreeNode(trc, null, ref.ref);
                        if (!child) {
                            throw new conduit_utils_1.NotFoundError(`Error retrieving tree node: ${ref.ref}`);
                        }
                        if (this.isLeafNode(child)) {
                            const childCount = sumDataChildCount(child.data);
                            if (ref.childCount !== childCount) {
                                throw new Error(`Incorrect inner node ref child count. Got: ${childCount}, expected: ${ref.childCount}`);
                            }
                        }
                        stack.push(child);
                    }
                }
            }
        }
        return tree;
    }
    async allKeys(trc, watcher, ascending = true, filter) {
        const res = [];
        await this.walkLeaves(trc, watcher, ascending, async (key) => {
            if (!filter || filter(key)) {
                res.push(key);
            }
        }, null);
        return res;
    }
    async numberOfLeaves(trc, watcher) {
        const node = await this.fetchRootNode(trc, watcher);
        if (!node) {
            return 0;
        }
        if (this.isLeafNode(node)) {
            return node.data.length;
        }
        return node.childCount;
    }
    async walkLeaves(trc, watcher, ascending = true, perItemHandler, perLeafHandler) {
        let node = await this.fetchRootNode(trc, watcher);
        if (node) {
            while (node && !this.isLeafNode(node)) {
                const ref = node.refs[ascending ? 0 : node.refs.length - 1];
                node = await this.fetchTreeNode(trc, watcher, ref.ref);
            }
            do {
                node = node;
                if (perLeafHandler) {
                    await perLeafHandler(node);
                }
                if (perItemHandler) {
                    await conduit_utils_1.loopArray(node.data, async (item) => {
                        return await perItemHandler(item);
                    }, ascending);
                }
                if (ascending && node.next) {
                    node = await this.fetchTreeNode(trc, watcher, node.next);
                }
                else if (!ascending && node.prev) {
                    node = await this.fetchTreeNode(trc, watcher, node.prev);
                }
                else {
                    node = null;
                }
            } while (node);
        }
    }
    sumDataBetweenKeys(leaf, leftKey, rightKey) {
        if (!leaf.data.length) {
            return 0;
        }
        const leftIndex = this.getIndexForKey(leaf.data, leftKey, false, true).index;
        const rightIndex = this.getIndexForKey(leaf.data, rightKey, false, false).index;
        if (leftIndex === rightIndex && leftIndex >= 0 && leftIndex < leaf.data.length) {
            // Handle edge case: The drifting keys traversed to the same index.
            // We need to determine if the index they traversed to is valid or not
            const rightKeyCmp = this.comparator(leaf.data[leftIndex], rightKey).cmp;
            const leftKeyCmp = this.comparator(leaf.data[leftIndex], leftKey).cmp;
            if (leftKeyCmp === rightKeyCmp && leftKeyCmp === 0) {
                // Another edge case: not a drifting key, but the left and right keys are the same and the key is actually in the tree
                return 1;
            }
            const left = rightKeyCmp <= 0 && leftKeyCmp > 0;
            const right = rightKeyCmp < 0 && leftKeyCmp >= 0;
            if (left || right) {
                return 1;
            }
            else {
                return 0;
            }
        }
        return rightIndex - leftIndex + 1;
    }
    sumRefsChildrenInclusive(parent, startIdx, stopIdx) {
        let sum = 0;
        if (startIdx >= parent.refs.length || startIdx < 0 || stopIdx >= parent.refs.length || stopIdx < 0) {
            return sum;
        }
        for (let i = startIdx; i <= stopIdx; i++) {
            const ref = parent.refs[i];
            sum += ref.childCount;
        }
        return sum;
    }
    async getNumberOfItemsOnSideOfKey(trc, watcher, key, node, toTheLeft) {
        const stack = [node];
        let current;
        let total = 0;
        let inNodeContainingKey = 0;
        let nodeContainingKey = null;
        while (stack.length) {
            current = stack.pop();
            if (!current) {
                throw new conduit_utils_1.InternalError(`Tree is malformed or 'getNumberOfItems' is incorrect, shouldn't happen`);
            }
            if (this.isLeafNode(current)) {
                nodeContainingKey = current;
                const indexInfo = this.getIndexForKey(current.data, key, false, true);
                if (toTheLeft) {
                    // if it's a right key and it's exactly on a value, include the value by moving the index over
                    if (indexInfo.exactMatch) {
                        indexInfo.index++;
                    }
                    inNodeContainingKey = sumDataChildCount(current.data, undefined, indexInfo.index);
                    total += inNodeContainingKey;
                }
                else {
                    inNodeContainingKey = sumDataChildCount(current.data, indexInfo.index);
                    total += inNodeContainingKey;
                }
            }
            else {
                const foundRef = this.findRefForKey(key, current.keys, current.refs);
                if (toTheLeft) {
                    total += this.sumRefsChildrenInclusive(current, 0, foundRef.refIdx - 1);
                }
                else {
                    total += this.sumRefsChildrenInclusive(current, foundRef.refIdx + 1, current.refs.length - 1);
                }
                const child = await this.fetchTreeNode(trc, watcher, foundRef.ref.ref);
                if (!child) {
                    throw new conduit_utils_1.InternalError(`Tree is malformed or 'getNumberOfItemsBetweenKeys' is incorrect, shouldn't happen`);
                }
                stack.push(child);
            }
        }
        if (!nodeContainingKey) {
            throw new conduit_utils_1.InternalError(`Unable to find LeafNode for key`);
        }
        return {
            total,
            inNodeContainingKey,
            nodeContainingKey,
        };
    }
    async getNumberOfItemsBetweenKeys(trc, watcher, key1, key2) {
        const root = await this.fetchRootNode(trc, watcher);
        if (!root) {
            return 0;
        }
        let leftKey;
        let rightKey;
        if (this.comparator(key1, key2).cmp < 0) {
            leftKey = key1;
            rightKey = key2;
        }
        else {
            leftKey = key2;
            rightKey = key1;
        }
        if (this.isLeafNode(root)) {
            return this.sumDataBetweenKeys(root, leftKey, rightKey);
        }
        let current = root;
        let leftRef = this.findRefForKey(leftKey, current.keys, current.refs);
        let rightRef = this.findRefForKey(rightKey, current.keys, current.refs);
        // Find the first node where the left and right keys split to new nodes if applicable
        while (leftRef.ref.ref === rightRef.ref.ref) {
            current = await this.fetchTreeNode(trc, watcher, leftRef.ref.ref);
            if (!current) {
                throw new conduit_utils_1.InternalError(`Tree is malformed or 'getNumberOfItemsBetweenKeys' is incorrect, shouldn't happen`);
            }
            if (this.isLeafNode(current)) {
                break;
            }
            leftRef = this.findRefForKey(leftKey, current.keys, current.refs);
            rightRef = this.findRefForKey(rightKey, current.keys, current.refs);
        }
        if (this.isLeafNode(current)) {
            return this.sumDataBetweenKeys(current, leftKey, rightKey);
        }
        // Current is an inner node where the left and right keys exist in different child sub-trees
        const numberBetweenTopSplit = this.sumRefsChildrenInclusive(current, leftRef.refIdx + 1, rightRef.refIdx - 1);
        const leftNode = await this.fetchTreeNode(trc, watcher, leftRef.ref.ref);
        const rightNode = await this.fetchTreeNode(trc, watcher, rightRef.ref.ref);
        if (!leftNode || !rightNode) {
            throw new conduit_utils_1.InternalError(`Tree is malformed or 'getNumberOfItemsBetweenKeys' is incorrect, shouldn't happen`);
        }
        const numberRightOfLeftRefChildren = await this.getNumberOfItemsOnSideOfKey(trc, watcher, leftKey, leftNode, false);
        const numberLeftOfRightRefChildren = await this.getNumberOfItemsOnSideOfKey(trc, watcher, rightKey, rightNode, true);
        return numberRightOfLeftRefChildren.total + numberBetweenTopSplit + numberLeftOfRightRefChildren.total;
    }
    async getKeyInRefsAtIndex(trc, watcher, refs, index, endKey) {
        let currentRefs = refs;
        let offset = index;
        let node = null;
        while (!node || !this.isLeafNode(node)) {
            for (const ref of currentRefs) {
                if (ref.childCount > offset) {
                    node = await this.fetchTreeNode(trc, watcher, ref.ref);
                    if (!node) {
                        throw new conduit_utils_1.InternalError(`Tree is malformed in super-scroll`);
                    }
                    if (!this.isLeafNode(node)) {
                        currentRefs = node.refs;
                    }
                    break;
                }
                else {
                    offset -= ref.childCount;
                }
            }
            if (!node) {
                break;
            }
        }
        if (!node || !this.isLeafNode(node)) {
            return {
                key: null,
                offset,
            }; // Not enough items in tree
        }
        const stopIndex = endKey ? this.getIndexForKey(node.data, endKey, false, false).index : node.data.length - 1;
        if (offset < 0 || offset > stopIndex) {
            conduit_utils_1.logger.warn(`Unexpectly got an index out of bounds during super-scroll`);
            return {
                key: null,
                offset,
            };
        }
        return {
            key: node.data[offset],
            offset,
        };
    }
    getKeyAtIndexBetweenKeysInLeaf(leaf, index, leftKey, rightKey) {
        const leftIndex = leftKey ? this.getIndexForKey(leaf.data, leftKey, false, false).index : 0;
        const rightIndex = rightKey ? this.getIndexForKey(leaf.data, rightKey, false, false).index : leaf.data.length - 1;
        if (rightIndex - leftIndex < index) {
            throw new Error(`Index out of bounds: ${index}`);
        }
        return leaf.data[leftIndex + index];
    }
    async getKeyAtIndexBetweenKeys(trc, watcher, key1, key2, index) {
        const keyCmp = this.comparator(key1, key2).cmp;
        if (keyCmp === 0) {
            return index === 0 ? key1 : null;
        }
        const root = await this.fetchRootNode(trc, watcher);
        if (!root) {
            return null;
        }
        let leftKey;
        let rightKey;
        if (keyCmp < 0) {
            leftKey = key1;
            rightKey = key2;
        }
        else {
            leftKey = key2;
            rightKey = key1;
        }
        if (index === 0) {
            return leftKey;
        }
        if (this.isLeafNode(root)) {
            return this.getKeyAtIndexBetweenKeysInLeaf(root, index, leftKey, rightKey);
        }
        let current = root;
        let leftRef = this.findRefForKey(leftKey, current.keys, current.refs);
        let rightRef = this.findRefForKey(rightKey, current.keys, current.refs);
        // Find the first node where the left and right keys split to new nodes if applicable
        while (leftRef.ref.ref === rightRef.ref.ref) {
            current = await this.fetchTreeNode(trc, watcher, leftRef.ref.ref);
            if (!current) {
                throw new conduit_utils_1.InternalError(`Tree is malformed or 'getKeyAtIndexBetweenKeys' is incorrect, shouldn't happen`);
            }
            if (this.isLeafNode(current)) {
                break;
            }
            leftRef = this.findRefForKey(leftKey, current.keys, current.refs);
            rightRef = this.findRefForKey(rightKey, current.keys, current.refs);
        }
        if (this.isLeafNode(current)) {
            return this.getKeyAtIndexBetweenKeysInLeaf(current, index, leftKey, rightKey);
        }
        // Current is an inner node where the left and right keys exist in different child sub-trees
        let offset = index;
        let res = null;
        const leftNode = await this.fetchTreeNode(trc, watcher, leftRef.ref.ref);
        if (!leftNode) {
            throw new conduit_utils_1.InternalError(`Tree is malformed or 'getKeyAtIndexBetweenKeys' is incorrect, shouldn't happen`);
        }
        const numberRightOfLeftRefChildren = await this.getNumberOfItemsOnSideOfKey(trc, watcher, leftKey, leftNode, false);
        if (numberRightOfLeftRefChildren.total > offset) {
            // Desired key lies under left ref
            if (numberRightOfLeftRefChildren.inNodeContainingKey > offset) {
                const foundIndex = this.getIndexForKey(numberRightOfLeftRefChildren.nodeContainingKey.data, leftKey, false, false).index;
                return numberRightOfLeftRefChildren.nodeContainingKey.data[foundIndex + offset];
            }
            // Just find the best ref according to the offset, no need to worry about left key, just don't go past the right key
            offset -= numberRightOfLeftRefChildren.inNodeContainingKey;
            let parent = await this.fetchTreeNode(trc, watcher, numberRightOfLeftRefChildren.nodeContainingKey.parent);
            if (!parent) {
                throw new conduit_utils_1.InternalError(`No parent found, shouldn't happen`);
            }
            let refIdx = this.findRefForKey(leftKey, parent.keys, parent.refs).refIdx + 1;
            // Need to get refs after the node containing the start key
            let searchRefs = parent.refs.slice(refIdx);
            res = await this.getKeyInRefsAtIndex(trc, watcher, searchRefs, offset, rightKey);
            offset = res.offset;
            if (!res.key && offset >= 0) {
                // We can go potentially up one more level
                parent = await this.fetchTreeNode(trc, watcher, parent.parent);
                if (!parent) {
                    throw new conduit_utils_1.InternalError(`No parent found, shouldn't happen`);
                }
                refIdx = this.findRefForKey(leftKey, parent.keys, parent.refs).refIdx + 1;
                // Need to get refs after the node containing the start key
                searchRefs = parent.refs.slice(refIdx);
                res = await this.getKeyInRefsAtIndex(trc, watcher, searchRefs, offset, rightKey);
            }
            return res.key;
        }
        offset -= numberRightOfLeftRefChildren.total;
        const numberBetweenTopSplit = this.sumRefsChildrenInclusive(current, leftRef.refIdx + 1, rightRef.refIdx - 1);
        if (numberBetweenTopSplit > offset) {
            // Just find the best ref according to the offset, no need to worry about left key, just don't go past the right key
            const searchRefs = current.refs.slice(leftRef.refIdx + 1, rightRef.refIdx);
            res = await this.getKeyInRefsAtIndex(trc, watcher, searchRefs, offset, rightKey);
            return res.key;
        }
        offset -= numberBetweenTopSplit;
        // Desired key lies under right ref
        const rightNode = await this.fetchTreeNode(trc, watcher, rightRef.ref.ref);
        if (!rightNode) {
            throw new conduit_utils_1.InternalError(`Tree is malformed or 'getKeyAtIndexBetweenKeys' is incorrect, shouldn't happen`);
        }
        const numberLeftOfRightRefChildren = await this.getNumberOfItemsOnSideOfKey(trc, watcher, rightKey, rightNode, true);
        if (numberLeftOfRightRefChildren.total - numberLeftOfRightRefChildren.inNodeContainingKey > offset && !this.isLeafNode(rightNode)) {
            // Desired key lies under right ref but not in the last node
            // Just find the best ref according to the offset, no need to worry about left key or the right key, you won't go past it
            res = await this.getKeyInRefsAtIndex(trc, watcher, rightNode.refs, offset, rightKey);
            return res.key;
        }
        else if (numberLeftOfRightRefChildren.total > offset) {
            // Desired keys lies in the last node
            offset -= (numberLeftOfRightRefChildren.total - numberLeftOfRightRefChildren.inNodeContainingKey);
            return numberLeftOfRightRefChildren.nodeContainingKey.data[offset];
        }
        else {
            return null; // Not enough items in tree
        }
    }
    async findLeafAndIndex(trc, watcher, key) {
        const root = await this.fetchRootNode(trc, watcher);
        let leaf;
        try {
            if (root) {
                leaf = await this.findLeafNodeRecursive(trc, watcher, key, root);
            }
            else {
                leaf = null;
            }
        }
        catch (error) {
            throw new conduit_utils_1.NotFoundError(key.join(':::'), `Unable to find IndexingTree node, reason: ${error}`);
        }
        if (!leaf || !leaf.data.length) {
            return null;
        }
        const index = this.getIndexForKey(leaf.data, key, false, false).index;
        return {
            index,
            leaf,
        };
    }
    async find(trc, watcher, key) {
        const root = await this.fetchRootNode(trc, watcher);
        let leaf;
        try {
            if (root) {
                leaf = await this.findLeafNodeRecursive(trc, watcher, key, root);
            }
            else {
                leaf = null;
            }
        }
        catch (error) {
            throw new conduit_utils_1.NotFoundError(key.join(':::'), `Unable to find IndexingTree node, reason: ${error}`);
        }
        if (!leaf || !leaf.data.length) {
            return null;
        }
        const index = this.getIndexForKey(leaf.data, key, false, false).index;
        if (index < 0 || index >= leaf.data.length) {
            return null;
        }
        return leaf.data[index];
    }
    async getDepth(trc, watcher) {
        let node = await this.fetchRootNode(trc, watcher);
        let count = 1;
        if (node) {
            while (!this.isLeafNode(node)) {
                if (!node || node.refs.length <= 0) {
                    throw new Error('Inner node has no leaves!');
                }
                node = await this.fetchTreeNode(trc, watcher, node.refs[0].ref);
                count++;
            }
            return count;
        }
        return -1;
    }
    async printTree(trc, root, asError = false, message) {
        let node;
        if (!root) {
            node = await this.fetchRootNode(trc, null);
        }
        else {
            node = root;
        }
        if (node) {
            if (!this.isLeafNode(node)) {
                this.printInnerNode(node, asError);
                for (const ref of node.refs) {
                    const child = await this.fetchTreeNode(trc, null, ref.ref);
                    if (child) {
                        await this.printTree(trc, child, asError);
                    }
                }
            }
            else {
                this.printLeafNode(node, asError);
            }
        }
        if (asError) {
            message && conduit_utils_1.logger.error(message);
        }
        else {
            message && conduit_utils_1.logger.info(message);
        }
    }
    printInnerNode(node, asError) {
        if (asError) {
            conduit_utils_1.logger.error(`ID: ${node.id}`);
            conduit_utils_1.logger.error(`Parent: ${node.parent}`);
            conduit_utils_1.logger.error(`Child Count: ${node.childCount}`);
            conduit_utils_1.logger.error(`Keys: ${node.keys}`);
            conduit_utils_1.logger.error(`Refs: ${node.refs.map(e => JSON.stringify(e))}`);
            conduit_utils_1.logger.error('-----------------------------------');
        }
        else {
            conduit_utils_1.logger.info(`ID: ${node.id}`);
            conduit_utils_1.logger.info(`Parent: ${node.parent}`);
            conduit_utils_1.logger.info(`Child Count: ${node.childCount}`);
            conduit_utils_1.logger.info(`Keys: ${node.keys}`);
            conduit_utils_1.logger.info(`Refs: ${node.refs.map(e => JSON.stringify(e))}`);
            conduit_utils_1.logger.info('-----------------------------------');
        }
    }
    printLeafNode(node, asError) {
        if (asError) {
            conduit_utils_1.logger.error(`ID: ${node.id}`);
            conduit_utils_1.logger.error(`Parent: ${node.parent}`);
            conduit_utils_1.logger.error(`Previous: ${node.prev}`);
            conduit_utils_1.logger.error(`Next: ${node.next}`);
            conduit_utils_1.logger.error(`Data: [\n${node.data.map(key => JSON.stringify(key)).join('\n')}\n]`);
            conduit_utils_1.logger.error('-----------------------------------');
        }
        else {
            conduit_utils_1.logger.info(`ID: ${node.id}`);
            conduit_utils_1.logger.info(`Parent: ${node.parent}`);
            conduit_utils_1.logger.info(`Previous: ${node.prev}`);
            conduit_utils_1.logger.info(`Next: ${node.next}`);
            conduit_utils_1.logger.info(`Data: [\n${node.data.map(key => JSON.stringify(key)).join('\n')}\n]`);
            conduit_utils_1.logger.info('-----------------------------------');
        }
    }
    isLeafNode(node) {
        return !node.hasOwnProperty('keys');
    }
    /* This is the most sensitive method in the tree, changing it can break everything
    Params:
    - data: the keys to search
    - target: the key to find the index to insert for or the location of the closest matching key in the data
    - findExact: optimizes the search performance to only look for an exact match
    -- NOTE: when findExact is true this can return -1, use with caution
    - forInsert:
    --- true: only to be used when adding a new key to the inner nodes' keys or the leaf nodes' data
    --- false: used for traversing or finding an item in the inner nodes' keys or the leaf nodes' data
    Return:
    - index: the index to insert a key or the index of the closest matching key
    -- NOTE: when findExact is true this can return -1, use with caution
    - exactMatch: whether or not a key is deeply equal to the one located at the returned index
    */
    getIndexForKey(data, target, findExact, forInsert) {
        if (findExact && forInsert) {
            throw new conduit_utils_1.InternalError(`Should not be looking for an exact match during insert`);
        }
        if (!findExact) {
            const firstCmp = this.comparator(target, data[0]);
            if (firstCmp.cmp < 0) {
                return { exactMatch: false, index: 0 };
            }
            const lastCmp = this.comparator(target, data[data.length - 1]);
            if (lastCmp.cmp > 0) {
                return { exactMatch: false, index: forInsert ? data.length : data.length - 1 };
            }
        }
        let i = 0;
        let j = data.length;
        let mid = 0;
        while (i < j) {
            mid = Math.floor((i + j) / 2);
            const midCmp = this.comparator(target, data[mid]);
            if (midCmp.cmp === 0) {
                return { exactMatch: true, index: mid };
            }
            if (midCmp.cmp < 0) {
                if (!findExact && mid > 0) {
                    // Check the previous value
                    const previousCmp = this.comparator(target, data[mid - 1]);
                    if (previousCmp.cmp > 0) {
                        if (midCmp.matchesAllRequiredFields) {
                            return { exactMatch: false, index: mid };
                        }
                        else if (previousCmp.matchesAllRequiredFields) {
                            return { exactMatch: false, index: forInsert ? mid : mid - 1 };
                        }
                        else {
                            // This case happens when inserting a new set of match fields (i.e. adding a new note into a new notebook)
                            // Or this can happen when traversing inner nodes as not every cluster is guranteed to be in the inner nodes' keys
                            return { exactMatch: false, index: forInsert ? mid : mid - 1 };
                        }
                    }
                }
                j = mid;
            }
            else {
                if (!findExact && mid < data.length - 1) {
                    // Check the next value
                    const nextCmp = this.comparator(target, data[mid + 1]);
                    if (nextCmp.cmp < 0) {
                        if (midCmp.matchesAllRequiredFields) {
                            return { exactMatch: false, index: forInsert ? mid + 1 : mid };
                        }
                        else if (nextCmp.matchesAllRequiredFields) {
                            return { exactMatch: false, index: mid + 1 };
                        }
                        else {
                            // This case happens when inserting a new set of match fields (i.e. adding a new note into a new notebook)
                            // Or this can happen when traversing inner nodes as not every cluster is guranteed to be in the inner nodes' keys
                            return { exactMatch: false, index: forInsert ? mid + 1 : mid };
                        }
                    }
                }
                i = mid + 1;
            }
        }
        // Only happens when findExact is true and there is no matching key in the data
        // The ternary here is only out of paranoia
        return { exactMatch: false, index: findExact ? -1 : mid };
    }
    findRefForKey(target, keys, refs) {
        const found = this.getIndexForKey(keys, target, false, false);
        let refIdx = found.index;
        if (found.exactMatch) {
            refIdx = found.index + 1;
        }
        else if (found.index < keys.length) {
            if (this.comparator(target, keys[found.index]).cmp > 0) {
                refIdx = found.index + 1;
            }
        }
        return {
            ref: refs[refIdx],
            refIdx,
            exactMatch: found.exactMatch,
            keyIdx: found.index,
        };
    }
    async findLeafNodeRecursive(trc, watcher, key, node) {
        if (this.isLeafNode(node)) {
            return node;
        }
        // Drill down
        const foundRef = this.findRefForKey(key, node.keys, node.refs);
        const foundNode = await this.fetchTreeNode(trc, watcher, foundRef.ref.ref);
        if (!foundNode) {
            return null;
        }
        return await this.findLeafNodeRecursive(trc, watcher, key, foundNode);
    }
    async fetchLeavesInRange(trc, watcher, left, right) {
        const leaves = [left];
        if (left.id === right.id) {
            return leaves;
        }
        let currentLeaf = left;
        while (currentLeaf.next && currentLeaf.next !== right.id) {
            currentLeaf = await this.fetchTreeNode(trc, watcher, currentLeaf.next);
            if (currentLeaf) {
                leaves.push(currentLeaf);
            }
            else {
                break;
            }
        }
        leaves.push(right);
        return leaves;
    }
    async fetchRootNode(trc, watcher) {
        return this.fetchTreeNode(trc, watcher, this.rootID);
    }
    async fetchTreeNode(trc, watcher, ref) {
        if (ref) {
            return await this.db.getValue(trc, watcher, this.tableName, ref) || null;
        }
        else {
            return null;
        }
    }
}
__decorate([
    conduit_utils_1.traceAsync('Index')
], ReadonlyIndexingTree.prototype, "allKeys", null);
__decorate([
    conduit_utils_1.traceAsync('Index')
], ReadonlyIndexingTree.prototype, "findLeafAndIndex", null);
__decorate([
    conduit_utils_1.traceAsync('Index')
], ReadonlyIndexingTree.prototype, "find", null);
exports.ReadonlyIndexingTree = ReadonlyIndexingTree;
//# sourceMappingURL=ReadonlyIndexingTree.js.map