"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
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
exports.ReadWriteIndexingTree = void 0;
const conduit_utils_1 = require("conduit-utils");
const SimplyImmutable = __importStar(require("simply-immutable"));
const ReadonlyIndexingTree_1 = require("./ReadonlyIndexingTree");
const VALIDATE_KEYS = false;
const REINDEXING_TIMEBOX = 1000;
function sumRefChildCounts(refs) {
    let childCount = 0;
    for (const ref of refs) {
        childCount += ref.childCount;
    }
    return childCount;
}
function findRefByID(refs, id) {
    for (let i = 0; i < refs.length; ++i) {
        if (refs[i].ref === id) {
            return i;
        }
    }
    return -1;
}
function validateCompoundKey(key) {
    for (let i = 0; i < key.length; ++i) {
        const comp = key[i];
        if (conduit_utils_1.isValuePrimitiveType(comp)) {
            continue;
        }
        if (typeof comp !== 'object') {
            throw new Error(`Invalid type in index key: element ${i}, value "${conduit_utils_1.safeStringify(comp)}"`);
        }
        if (!comp.id || !comp.type) {
            throw new Error(`Invalid EntityRef in index key: element ${i}, value "${conduit_utils_1.safeStringify(comp)}"`);
        }
    }
}
class ReadWriteIndexingTree extends ReadonlyIndexingTree_1.ReadonlyIndexingTree {
    constructor(uuid, db, tableName, order = 100, comparator, rootID) {
        super(db, tableName, order, comparator, rootID);
        this.uuid = uuid;
        this.db = db;
    }
    async replace(trc, oldKey, newKey) {
        if (conduit_utils_1.isEqual(oldKey, newKey)) {
            return;
        }
        await this.delete(trc, oldKey);
        await this.insert(trc, newKey);
    }
    async update(trc, oldKey, newKey) {
        if (conduit_utils_1.isEqual(oldKey, newKey)) {
            return;
        }
        await this.delete(trc, oldKey);
        return await this.insert(trc, newKey);
    }
    // @traceAsync('Index')
    async insert(trc, key) {
        VALIDATE_KEYS && validateCompoundKey(key);
        let root = await this.fetchRootNode(trc, null);
        if (!root || ((this.isLeafNode(root) && root.data.length === 0) || (!this.isLeafNode(root) && root.refs.length === 0))) {
            // First insert
            root = { data: [key], id: this.rootID };
            return await this.setTreeNode(trc, root);
        }
        return await this.insertRecursive(trc, key, root);
    }
    // @traceAsync('Index')
    async delete(trc, key) {
        const root = await this.fetchRootNode(trc, null);
        let leaf;
        try {
            if (root) {
                leaf = await this.findLeafNodeDeletingKey(trc, key, root);
            }
            else {
                leaf = null;
            }
        }
        catch (error) {
            throw new conduit_utils_1.NotFoundError(key.join(':::'), `Unable to find IndexingTree node, reason: ${error}`);
        }
        if (leaf && leaf.data.length < this.order) {
            const siblingToMerge = await this.tryToBorrowFromSiblings(trc, leaf);
            if (siblingToMerge) {
                return await this.mergeSiblingIntoLeaf(trc, siblingToMerge, leaf);
            }
        }
    }
    // Multi-functions
    async replaceMulti(trc, oldKeys, newKeys) {
        if (conduit_utils_1.isEqual(oldKeys, newKeys)) {
            return;
        }
        let cloned = false;
        for (let i = 0; i < newKeys.length; i++) {
            if (i >= oldKeys.length) {
                break;
            }
            if (conduit_utils_1.isEqual(newKeys[i], oldKeys[i])) {
                if (!cloned) {
                    oldKeys = [...oldKeys];
                    newKeys = [...newKeys];
                    cloned = true;
                }
                oldKeys.splice(i, 1);
                newKeys.splice(i, 1);
                i--;
            }
        }
        await this.deleteMulti(trc, oldKeys);
        await this.insertMulti(trc, newKeys);
    }
    async updateMulti(trc, keysToRemove, keysToInsert) {
        if (keysToInsert.length !== keysToRemove.length) {
            throw new Error('There must be a 1 to 1 mapping between keysToInsert and keysToRemove in updateMulti');
        }
        await this.deleteMulti(trc, keysToRemove);
        await this.insertMulti(trc, keysToInsert);
    }
    async insertMulti(trc, keys) {
        for (const key of keys) {
            await this.insert(trc, key);
        }
    }
    async deleteMulti(trc, keys) {
        for (const key of keys) {
            await this.delete(trc, key);
        }
    }
    // Internal insert
    async insertRecursive(trc, key, node) {
        if (!this.isLeafNode(node)) {
            // Drill down to leaf updating child counts along the way.
            const foundRef = this.findRefForKey(key, node.keys, node.refs);
            node = SimplyImmutable.incrementImmutable(node, ['refs', foundRef.refIdx, 'childCount'], 1);
            node = SimplyImmutable.incrementImmutable(node, ['childCount'], 1);
            await this.setTreeNode(trc, node);
            const nodeForRef = await this.fetchTreeNode(trc, null, foundRef.ref.ref); // Should never be null
            return await this.insertRecursive(trc, key, nodeForRef);
        }
        const found = this.getIndexForKey(node.data, key, false, true);
        if (found.exactMatch) {
            return;
        }
        node = SimplyImmutable.arraySpliceImmutable(node, ['data'], found.index, 0, key);
        if (node.data.length > 2 * this.order) {
            if (node.id === this.rootID) {
                node = SimplyImmutable.replaceImmutable(node, ['id'], this.uuid('ReadWriteIndexingTree'));
            }
            return await this.split(trc, node);
        }
        return await this.setTreeNode(trc, node);
    }
    async split(trc, leaf) {
        const mid = leaf.data[this.order]; // Copy key, don't push it like in the recursive version
        const rLeaf = {
            id: this.uuid('ReadWriteIndexingTree'),
            data: leaf.data.slice(this.order),
            parent: leaf.parent,
            prev: leaf.id,
            next: leaf.next,
        };
        if (leaf.next) {
            const forwardNode = await this.fetchTreeNode(trc, null, leaf.next);
            if (forwardNode) {
                await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(forwardNode, ['prev'], rLeaf.id));
            }
        }
        leaf = SimplyImmutable.replaceImmutable(leaf, ['next'], rLeaf.id);
        leaf = SimplyImmutable.arraySliceImmutable(leaf, ['data'], 0, this.order);
        return await this.splitRecursive(trc, leaf, rLeaf, mid);
    }
    createRefForNode(node) {
        return {
            ref: node.id,
            childCount: this.isLeafNode(node) ? ReadonlyIndexingTree_1.sumDataChildCount(node.data) : node.childCount,
        };
    }
    createOrUpdateParentRefsForSplitNode(lNode, rNode, key, parent) {
        const lRef = this.createRefForNode(lNode);
        const rRef = this.createRefForNode(rNode);
        const found = this.getIndexForKey(parent.keys, key, false, true);
        parent = SimplyImmutable.arraySpliceImmutable(parent, ['keys'], found.index, 0, key);
        const lRefIndex = findRefByID(parent.refs, lNode.id);
        const rRefIndex = findRefByID(parent.refs, rNode.id);
        if (lRefIndex < 0) {
            parent = SimplyImmutable.arraySpliceImmutable(parent, ['refs'], found.index, 0, lRef);
        }
        else {
            parent = SimplyImmutable.replaceImmutable(parent, ['refs', lRefIndex, 'childCount'], lRef.childCount);
        }
        if (rRefIndex < 0) {
            parent = SimplyImmutable.arraySpliceImmutable(parent, ['refs'], found.index + 1, 0, rRef);
        }
        else {
            parent = SimplyImmutable.replaceImmutable(parent, ['refs', rRefIndex, 'childCount'], rRef.childCount);
        }
        return parent;
    }
    async splitRecursive(trc, lNode, rNode, key) {
        let parent = null;
        if (lNode.parent) {
            parent = await this.fetchTreeNode(trc, null, lNode.parent);
        }
        if (!parent) {
            const lRef = this.createRefForNode(lNode);
            const rRef = this.createRefForNode(rNode);
            // Splitting the root node so create a new root node and set refs
            parent = {
                id: this.rootID,
                keys: [key],
                refs: [lRef, rRef],
                childCount: lRef.childCount + rRef.childCount,
            };
            await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(lNode, ['parent'], parent.id));
            await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(rNode, ['parent'], parent.id));
            return await this.setTreeNode(trc, parent);
        }
        parent = this.createOrUpdateParentRefsForSplitNode(lNode, rNode, key, parent);
        if (parent.keys.length <= 2 * this.order) {
            // Parent isn't overfilled, go ahead and set
            await this.setTreeNode(trc, lNode);
            await this.setTreeNode(trc, rNode);
            return await this.setTreeNode(trc, parent);
        }
        // Parent is overfilled, split and recurse
        if (parent.id === this.rootID) {
            // Parent is root, give it a regular id and reflect in children since we're about to split it
            parent = SimplyImmutable.replaceImmutable(parent, ['id'], this.uuid('ReadWriteIndexingTree'));
            const ps1 = [];
            for (const ref of parent.refs) {
                ps1.push(this.updateNodeParent(trc, ref, parent.id, true));
            }
            await conduit_utils_1.allSettled(ps1);
            lNode = SimplyImmutable.replaceImmutable(lNode, ['parent'], parent.id);
            rNode = SimplyImmutable.replaceImmutable(rNode, ['parent'], parent.id);
        }
        // Splitting now
        const midKey = parent.keys[this.order];
        const rKeys = parent.keys.slice(this.order + 1);
        const rRefs = parent.refs.slice(this.order + 1);
        parent = SimplyImmutable.arraySliceImmutable(parent, ['keys'], 0, this.order);
        parent = SimplyImmutable.arraySliceImmutable(parent, ['refs'], 0, this.order + 1);
        const rParent = {
            id: this.uuid('ReadWriteIndexingTree'),
            parent: parent.parent,
            keys: rKeys,
            refs: rRefs,
            childCount: sumRefChildCounts(rRefs),
        };
        // Update the child count since the parent was just split
        parent = SimplyImmutable.replaceImmutable(parent, ['childCount'], sumRefChildCounts(parent.refs));
        // We just split the parent so we need the edges on the new parent to reflect new relationships
        if (findRefByID(rRefs, lNode.id) >= 0) {
            lNode = SimplyImmutable.replaceImmutable(lNode, ['parent'], rParent.id);
        }
        if (findRefByID(rRefs, rNode.id) >= 0) {
            rNode = SimplyImmutable.replaceImmutable(rNode, ['parent'], rParent.id);
        }
        await this.setTreeNode(trc, lNode);
        await this.setTreeNode(trc, rNode);
        // Shift children to new parent
        const ps2 = [];
        for (const ref of rRefs) {
            if (ref.ref !== lNode.id && ref.ref !== rNode.id) {
                // lNode and rNode have already been moved to the new parent
                ps2.push(this.updateNodeParent(trc, ref, rParent.id));
            }
        }
        await conduit_utils_1.allSettled(ps2);
        return await this.splitRecursive(trc, parent, rParent, midKey);
    }
    async updateNodeParent(trc, ref, parent, onlyIfRootChild = false) {
        const node = await this.fetchTreeNode(trc, null, ref.ref);
        if (node && (!onlyIfRootChild || node.parent === this.rootID)) {
            await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(node, ['parent'], parent));
        }
    }
    async findLeafNodeDeletingKey(trc, key, node) {
        if (this.isLeafNode(node)) {
            // If at the leaf return the value
            const index = this.getIndexForKey(node.data, key, true, false);
            if (!index.exactMatch) {
                return node;
            }
            node = SimplyImmutable.arraySpliceImmutable(node, ['data'], index.index, 1);
            await this.setTreeNode(trc, node);
            return node;
        }
        // Recurse down the tree
        const foundRef = this.findRefForKey(key, node.keys, node.refs);
        const foundNode = await this.fetchTreeNode(trc, null, foundRef.ref.ref);
        if (!foundNode) {
            // Error because the tree is now corrupt as we decrement child counts on the way down
            throw new Error(`Unable to find node while deleting a key: ${key}`);
        }
        // Update child count
        node = SimplyImmutable.incrementImmutable(node, ['refs', foundRef.refIdx, 'childCount'], -1);
        node = SimplyImmutable.incrementImmutable(node, ['childCount'], -1);
        await this.setTreeNode(trc, node);
        // If the node we pass through during our walk has the key we're looking to delete we need to replace that key
        let foundLeaf = await this.findLeafNodeDeletingKey(trc, key, foundNode);
        if (!foundLeaf || !foundRef.exactMatch) {
            return foundLeaf;
        }
        if (foundLeaf.data.length < this.order) {
            // The node needs more data to adhere to the algorithm, try borrowing
            const didntBorrow = await this.tryToBorrowFromSiblings(trc, foundLeaf);
            if (!didntBorrow) {
                // Borrowing has side effects on parent and leaf so refetch
                foundLeaf = await this.fetchTreeNode(trc, null, foundLeaf.id);
                node = (await this.fetchTreeNode(trc, null, node.id));
            }
        }
        // Replace the key that was matched exactly with the first item in the leaf
        const replacementKey = foundLeaf.data[0];
        node = SimplyImmutable.replaceImmutable(node, ['keys', foundRef.keyIdx], replacementKey);
        await this.setTreeNode(trc, node);
        return foundLeaf;
    }
    // Returns the sibling matching preconditions for merge if can't borrow
    // If borrowing was successful then returns null as no merge is needed
    async tryToBorrowFromSiblings(trc, leaf) {
        let next = null;
        let prev = null;
        // Try to borrow from the next node
        // Try to borrow from the previous node
        let parent = await this.fetchTreeNode(trc, null, leaf.parent);
        if (!parent) {
            return null;
        }
        if (leaf.prev) {
            prev = await this.fetchTreeNode(trc, null, leaf.prev);
            if (prev && prev.data.length > this.order && prev.parent === leaf.parent) {
                // pop off the last element from prev
                const borrowed = prev.data[prev.data.length - 1];
                prev = SimplyImmutable.arrayPopImmutable(prev, ['data']);
                const replacementIndex = this.getIndexForKey(parent.keys, borrowed, false, true).index;
                if (replacementIndex >= 0 && replacementIndex < parent.keys.length) {
                    // Becuase the leaf is borrowing it's first key from the end of the previous leaf it must update it's key in the parent
                    parent = SimplyImmutable.arraySpliceImmutable(parent, ['keys'], replacementIndex, 1, borrowed);
                }
                // Update child counts on refs
                const indexOfSiblingRef = findRefByID(parent.refs, prev.id);
                const indexOfRef = findRefByID(parent.refs, leaf.id);
                parent = SimplyImmutable.incrementImmutable(parent, ['refs', indexOfSiblingRef, 'childCount'], -1);
                parent = SimplyImmutable.incrementImmutable(parent, ['refs', indexOfRef, 'childCount'], 1);
                await this.setTreeNode(trc, parent);
                await this.setTreeNode(trc, prev);
                // unshift on to leaf
                leaf = SimplyImmutable.arrayUnshiftImmutable(leaf, ['data'], borrowed);
                await this.setTreeNode(trc, leaf);
                return null;
            }
        }
        if (leaf.next) {
            next = await this.fetchTreeNode(trc, null, leaf.next);
            if (next && next.data.length > this.order && next.parent === leaf.parent) {
                // shift off the first element from next
                const borrowed = next.data[0];
                next = SimplyImmutable.arrayShiftImmutable(next, ['data']);
                const removedKeyIndex = this.getIndexForKey(parent.keys, borrowed, true, false);
                if (removedKeyIndex.exactMatch) {
                    // Because the parent uses the first leaf data key (which we just borrowed) we need to change the parent's key for the node we borrowed from
                    parent = SimplyImmutable.arraySpliceImmutable(parent, ['keys'], removedKeyIndex.index, 1, next.data[0]);
                }
                // Update child counts on refs
                const indexOfSiblingRef = findRefByID(parent.refs, next.id);
                const indexOfRef = findRefByID(parent.refs, leaf.id);
                parent = SimplyImmutable.incrementImmutable(parent, ['refs', indexOfSiblingRef, 'childCount'], -1);
                parent = SimplyImmutable.incrementImmutable(parent, ['refs', indexOfRef, 'childCount'], 1);
                await this.setTreeNode(trc, parent);
                await this.setTreeNode(trc, next);
                // push on to leaf
                leaf = SimplyImmutable.arrayPushImmutable(leaf, ['data'], borrowed);
                await this.setTreeNode(trc, leaf);
                return null;
            }
        }
        // If can't borrow from either then check for merge pre-conditions and return sibling to merge
        const shouldMergeNext = next && next.data.length + leaf.data.length <= 2 * this.order && next.parent === leaf.parent || false;
        const shouldMergePrev = prev && prev.data.length + leaf.data.length <= 2 * this.order && prev.parent === leaf.parent || false;
        return shouldMergePrev ? prev : shouldMergeNext ? next : null;
    }
    async mergeSiblingLeafData(trc, sibling, leaf) {
        if (sibling.id === leaf.next) {
            leaf = SimplyImmutable.replaceImmutable(leaf, ['next'], sibling.next);
            leaf = SimplyImmutable.arrayConcatImmutable(leaf, ['data'], sibling.data);
            if (leaf.next) {
                const next = await this.fetchTreeNode(trc, null, leaf.next);
                if (next) {
                    await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(next, ['prev'], leaf.id));
                }
            }
            return { newNode: leaf, removedNode: sibling };
        }
        else if (sibling.id === leaf.prev) {
            sibling = SimplyImmutable.replaceImmutable(sibling, ['next'], leaf.next);
            sibling = SimplyImmutable.arrayConcatImmutable(sibling, ['data'], leaf.data);
            if (sibling.next) {
                const next = await this.fetchTreeNode(trc, null, sibling.next);
                if (next) {
                    await this.setTreeNode(trc, SimplyImmutable.replaceImmutable(next, ['prev'], sibling.id));
                }
            }
            return { newNode: sibling, removedNode: leaf };
        }
        else {
            throw new Error('Unknown sibling');
        }
    }
    async mergeSiblingIntoLeaf(trc, sibling, leaf) {
        if (!leaf.parent) {
            return;
        }
        let parent = await this.fetchTreeNode(trc, null, leaf.parent);
        if (!parent) {
            return;
        }
        const { newNode, removedNode } = await this.mergeSiblingLeafData(trc, sibling, leaf);
        // Remove key of merged node from parent
        const parentRefIndex = findRefByID(parent.refs, removedNode.id);
        if (parentRefIndex < 0 || parentRefIndex >= parent.refs.length) {
            throw new Error(`Failed to find child ref in parent`);
        }
        const parentKeyIndex = parentRefIndex > 0 ? parentRefIndex - 1 : 0;
        parent = SimplyImmutable.arraySpliceImmutable(parent, ['keys'], parentKeyIndex, 1);
        parent = SimplyImmutable.arraySpliceImmutable(parent, ['refs'], parentRefIndex, 1);
        // Reflect new childCount in parent ref
        const indexOfRef = findRefByID(parent.refs, newNode.id);
        if (indexOfRef < 0) {
            throw new Error(`Was unable to find newly merged node in parent refs`);
        }
        parent = SimplyImmutable.replaceImmutable(parent, ['refs', indexOfRef, 'childCount'], ReadonlyIndexingTree_1.sumDataChildCount(newNode.data));
        // Reflect merged leaves in database
        await this.db.removeValue(trc, this.tableName, removedNode.id);
        await this.setTreeNode(trc, newNode);
        await this.setTreeNode(trc, parent);
        if (parent.keys.length < this.order) {
            await this.mergeInnerNodeRecursive(trc, parent);
        }
    }
    async fetchSiblingNodeFromParentOfChild(trc, child) {
        const parent = await this.fetchTreeNode(trc, null, child.parent);
        if (!parent) {
            return null;
        }
        const childRefIndex = findRefByID(parent.refs, child.id);
        if (childRefIndex < 0) {
            throw new Error('Child not found in parent, should not happen');
        }
        // Get sibling node
        let siblingRef;
        let usingNext;
        if (parent.refs.length < 2) {
            throw new Error('Absolutely should not happen, non root inner nodes should always have at least two children, very bad');
        }
        if (childRefIndex < parent.refs.length - 1) {
            siblingRef = parent.refs[childRefIndex + 1];
            usingNext = true;
        }
        else {
            siblingRef = parent.refs[childRefIndex - 1];
            usingNext = false;
        }
        const sibling = (await this.fetchTreeNode(trc, null, siblingRef.ref));
        return {
            lNode: usingNext ? child : sibling,
            rNode: usingNext ? sibling : child,
            parent,
        };
    }
    async replaceRoot(trc, node) {
        if (!node.parent && node.id === this.rootID) {
            throw new Error('Node is already root');
        }
        await this.db.removeValue(trc, this.tableName, node.id);
        await this.db.removeValue(trc, this.tableName, this.rootID);
        if (!this.isLeafNode(node)) {
            // reparent node's children
            const ps = [];
            for (const childRef of node.refs) {
                ps.push(this.updateNodeParent(trc, childRef, this.rootID));
            }
            await conduit_utils_1.allSettled(ps);
        }
        await this.setTreeNode(trc, SimplyImmutable.updateImmutable(node, { parent: undefined, id: this.rootID }));
    }
    async mergeInnerNodeRecursive(trc, node) {
        if (node.id === this.rootID) { // Can't merge the root node
            if (node.keys.length === 0 && node.refs.length === 1) {
                const newRoot = await this.fetchTreeNode(trc, null, node.refs[0].ref);
                if (newRoot) {
                    await this.replaceRoot(trc, newRoot);
                }
            }
            return;
        }
        const fetched = await this.fetchSiblingNodeFromParentOfChild(trc, node);
        if (!fetched) {
            throw new Error('Unable to fetch sibling node');
        }
        let { parent, lNode } = fetched;
        const { rNode } = fetched;
        // merge rNode keys and refs into lNode
        lNode = SimplyImmutable.arrayConcatImmutable(lNode, ['keys'], rNode.keys);
        lNode = SimplyImmutable.arrayConcatImmutable(lNode, ['refs'], rNode.refs);
        lNode = SimplyImmutable.incrementImmutable(lNode, ['childCount'], rNode.childCount);
        // Remove key of rNode from parent
        const parentRefIndex = findRefByID(parent.refs, rNode.id);
        if (parentRefIndex < 0 || parentRefIndex >= parent.refs.length) {
            throw new Error(`Failed to find child ref in parent`);
        }
        const parentKeyIndex = parentRefIndex > 0 ? parentRefIndex - 1 : 0;
        const parentKey = parent.keys[parentKeyIndex];
        parent = SimplyImmutable.arraySpliceImmutable(parent, ['keys'], parentKeyIndex, 1);
        parent = SimplyImmutable.arraySpliceImmutable(parent, ['refs'], parentRefIndex, 1);
        // Merged node needs new key as it now has #keys + 2 = #refs which is invalid
        const indexToInsertKey = this.getIndexForKey(lNode.keys, parentKey, false, true).index;
        if (indexToInsertKey < 0 || indexToInsertKey > lNode.keys.length) {
            return;
        }
        lNode = SimplyImmutable.arraySpliceImmutable(lNode, ['keys'], indexToInsertKey, 0, parentKey);
        // Reflect new childCount in parent ref
        const indexOfRef = findRefByID(parent.refs, lNode.id);
        if (indexOfRef >= 0) {
            parent = SimplyImmutable.replaceImmutable(parent, ['refs', indexOfRef, 'childCount'], lNode.childCount);
        }
        await this.db.removeValue(trc, this.tableName, rNode.id);
        if (parent.keys.length === 0) {
            await this.replaceRoot(trc, lNode);
            return;
        }
        // reparent rNode's children to lNode
        const ps = [];
        for (const childRef of rNode.refs) {
            ps.push(this.updateNodeParent(trc, childRef, lNode.id));
        }
        await conduit_utils_1.allSettled(ps);
        await this.setTreeNode(trc, lNode);
        await this.setTreeNode(trc, parent);
        if (parent.keys.length < this.order) {
            await this.mergeInnerNodeRecursive(trc, parent);
        }
    }
    async setTreeNode(trc, node) {
        return await this.db.setValue(trc, this.tableName, node.id, node, true);
    }
    async clearTree(trc) {
        const nodeIDs = [this.rootID];
        // walk tree to gather all nodes
        for (const id of nodeIDs) {
            const node = await this.fetchTreeNode(trc, null, id);
            if (node && !this.isLeafNode(node)) {
                for (const ref of node.refs) {
                    nodeIDs.push(ref.ref);
                }
            }
        }
        await conduit_utils_1.allSettled(nodeIDs.map(id => this.db.removeValue(trc, this.tableName, id)));
    }
    chunkToOrder(arr) {
        const groups = conduit_utils_1.chunkArray(arr, Math.floor(this.order * 1.5));
        if (groups.length > 1 && groups[groups.length - 1].length < this.order) {
            const last = groups.pop();
            groups[groups.length - 1].push(...last);
        }
        return groups;
    }
    leftmostLeafKey(node, nodeLookup) {
        while (!this.isLeafNode(node)) {
            node = nodeLookup[node.refs[0].ref];
        }
        return node.data[0];
    }
    makeInnerNodes(children, nodeLookup) {
        const groups = this.chunkToOrder(children);
        const nodes = groups.map(groupChildren => {
            const parentID = groups.length === 1 ? this.rootID : this.uuid('ReadWriteIndexingTree');
            const refs = [];
            const keys = [];
            for (const child of groupChildren) {
                let childCount = 0;
                if (this.isLeafNode(child)) {
                    childCount = ReadonlyIndexingTree_1.sumDataChildCount(child.data);
                }
                else {
                    childCount = child.childCount;
                }
                child.parent = parentID;
                refs.push({
                    ref: child.id,
                    childCount,
                });
                if (refs.length > 1) {
                    keys.push(this.leftmostLeafKey(child, nodeLookup));
                }
            }
            const node = {
                id: parentID,
                keys,
                refs,
                childCount: sumRefChildCounts(refs),
            };
            return node;
        });
        return nodes;
    }
    async rebuildTree(trc, allKeys) {
        if (!allKeys.length) {
            return;
        }
        let lastStart = Date.now();
        const sortedValues = allKeys.sort((a, b) => this.comparator(a, b).cmp);
        const leafDataGroups = this.chunkToOrder(sortedValues);
        const nodeLookup = {};
        const leafNodes = leafDataGroups.map(leafData => {
            const leaf = {
                id: leafDataGroups.length === 1 ? this.rootID : this.uuid('ReadWriteIndexingTree'),
                data: leafData,
                parent: undefined,
                prev: undefined,
                next: undefined,
            };
            return leaf;
        });
        for (let i = 0; i < leafNodes.length; ++i) {
            if (Date.now() - lastStart > REINDEXING_TIMEBOX) {
                await conduit_utils_1.sleep(50);
                lastStart = Date.now();
            }
            const prev = leafNodes[i - 1];
            const next = leafNodes[i + 1];
            leafNodes[i].prev = prev ? prev.id : undefined;
            leafNodes[i].next = next ? next.id : undefined;
        }
        let lastLevel = leafNodes;
        while (lastLevel.length > 1) {
            if (Date.now() - lastStart > REINDEXING_TIMEBOX) {
                await conduit_utils_1.sleep(50);
                lastStart = Date.now();
            }
            const nextLevel = this.makeInnerNodes(lastLevel, nodeLookup);
            for (const node of lastLevel) {
                if (Date.now() - lastStart > REINDEXING_TIMEBOX) {
                    await conduit_utils_1.sleep(50);
                    lastStart = Date.now();
                }
                nodeLookup[node.id] = node;
                await this.setTreeNode(trc, node);
            }
            lastLevel = nextLevel;
        }
        const rootNode = lastLevel[0];
        await this.setTreeNode(trc, rootNode);
    }
}
exports.ReadWriteIndexingTree = ReadWriteIndexingTree;
//# sourceMappingURL=ReadWriteIndexingTree.js.map