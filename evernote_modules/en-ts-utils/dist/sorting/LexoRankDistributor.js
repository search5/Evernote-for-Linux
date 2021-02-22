"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 * Provides a method for distributing weights evenly across an array of sorted items.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexoRankDistributor = void 0;
const Errors_1 = require("../Errors");
const lexoRank_1 = require("./lexoRank");
/*
  * Invalid array length in Javascript at this value,
  * which is less than Number.MAX_SAFE_INTEGER and is plenty large, so lets stop here.
  *    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Invalid_array_length
  */
const InvalidArrayLengthThreshold = 4294967296;
class LexoRankDistributor {
    constructor() {
        // Lazy initialization of these static, deterministic properties.
        LexoRankDistributor.calculateDeterministicProperties();
    }
    // TODO: With a static characterset, these calculations are 100% deterministic and could come from a predetermined lookup table.
    static calculateDeterministicProperties() {
        if (!this.sDistributorProperties) {
            const minChar = lexoRank_1.LexoRankMinChar.charCodeAt(0);
            const maxChar = lexoRank_1.LexoRankMaxChar.charCodeAt(0);
            const characterSet = [];
            for (let i = 0; i <= maxChar - minChar; i++) {
                characterSet[i] = String.fromCharCode(minChar + i);
            }
            let itemsAllowed = -1;
            let depthOuter = 0;
            const itemsAllowedByDepth = [];
            /*
              * SUM[characterBreadth^1...characterBreadth^(maxDepth)]
              * For this algorithm to work, we can never allow anyone to take the 'A' character, so we subtract 1 to prevent that.
              * We want to go over the thresold once, and then protect the limit on count allowing us to approach the true limit
              *  as close as possible.
              */
            while (itemsAllowed < InvalidArrayLengthThreshold) {
                depthOuter++; // Index = 0 equals a tree depth of 1
                itemsAllowed += Math.pow(characterSet.length, depthOuter);
                /*
                  * SUM[characterBreadth^0...characterBreadth^(maxDepth-depth-1)]
                  * Each depth addition to the tree adds a whole new set of depth calcs
                  */
                // TODO: Fill this array in reverse, skipping the last this.depthCalcs.reverse() call (its never more than 11 items, so not a big deal).
                const depthCalcs = [];
                for (let depthInner = 0; depthInner < depthOuter; depthInner++) {
                    depthCalcs[depthInner] = Math.pow(characterSet.length, depthInner);
                    if (depthInner > 0) {
                        // Each traversal of the tree can add hold its amount + the previous amount
                        depthCalcs[depthInner] += depthCalcs[depthInner - 1];
                    }
                }
                // Must reverse, as the nodes at the top of the tree hold more nodes than the leaves
                depthCalcs.reverse();
                // Index = 0 equals a tree depth of 1
                itemsAllowedByDepth.push({
                    itemsAllowed,
                    depthCalcs,
                });
            }
            /*
              * These values are 100% deterministic, so once set, they will always be the same
              * However, in a multi-threaded environment, we need to ensure an atomic transaction.
              * So, let's set a single memory reference at the very end which will always be safe once it is set.
              *      (even if multiple threads set it)
              */
            LexoRankDistributor.sDistributorProperties = {
                characterSet,
                itemsAllowedByDepth,
            };
        }
    }
    distribute(count) {
        const { itemsAllowed, depthCalcs } = this.getItemsAllowedAtDepth(count);
        const result = new Array(count);
        /*
          * Our increment in floating point format - the increment is defined as the space between items and the edges.
          *    So +1 to the count.
          */
        const incrementWithDecimal = itemsAllowed / (count + 1);
        /*
          * Since we want to leave extra room at the beginning and end of the distribute array, we need count + 1 gaps.
          * We chose Math.floor here for consistency with this.between. Note that because of our use of floor, the gap at the end
          *    will usually have an extra space (but not always).
          */
        let increment = Math.floor(incrementWithDecimal);
        let remainder = incrementWithDecimal % 1;
        /*
          * Since we used Math.floor in the above calculation, there is a chance we have an increment of zero if count = maxItems,
          *    and we need to set it to one to fix the special case.
          * We could choose Math.ceil in the above calculation, but then our logic would behavior differently than this.between
          *    in the 1 item case.
          */
        if (increment === 0) {
            increment = 1;
            remainder = 0; // No overflow in this situation
        }
        let runningTotal = increment;
        let overflow = 0;
        let i = 0;
        result[i] = this.toWeight(runningTotal, depthCalcs);
        i++;
        for (; i < count; i++) {
            runningTotal += increment;
            overflow += remainder;
            // We have exceeded 1 in our overflow, and should add 1 to the gap here to stay as even as possible.
            if (overflow >= 1) {
                runningTotal++;
                overflow--; // Reset the overflow by one so we can start over.
            }
            result[i] = this.toWeight(runningTotal, depthCalcs);
        }
        return result;
    }
    toWeight(index, depthCalcs) {
        const { characterSet } = LexoRankDistributor.sDistributorProperties;
        let result = '';
        let runningTotal = index;
        for (let depth = 0; depth < depthCalcs.length; depth++) {
            if (depth > 0) {
                runningTotal--; // Removing the increments for depth traversal.
            }
            const depthValue = depthCalcs[depth];
            const depthIndex = Math.floor(runningTotal / depthValue); // Calculating the index into our character set at this tree depth/string index
            runningTotal = (runningTotal % depthValue); // The remainder represents the value we need to use at the next depth/string index
            result += characterSet[depthIndex];
            if (runningTotal === 0) { // Required here in case our weight length is less than maxDepth
                break;
            }
        }
        return result;
    }
    getItemsAllowedAtDepth(count) {
        if (count <= 0) {
            throw new Errors_1.InvalidParameterError(`count (${count}) cannot be less than or equal to zero`);
        }
        else if (count >= InvalidArrayLengthThreshold) {
            throw new Errors_1.InvalidParameterError(`count (${count}) cannot be greater than or equal to ${InvalidArrayLengthThreshold}`);
        }
        // This default is an invalid value, but it won't stay like this for long...
        let result = { itemsAllowed: 0, depthCalcs: [] };
        const { itemsAllowedByDepth } = LexoRankDistributor.sDistributorProperties;
        /*
          * Find the optimal tree depth for our distribution; this minimizes storage impact.
          * Given the current characterset, there is not more than 11 items in this array.
          * Lastly, 1-3 iterations of this loop will satisfy 99.99% of our requirements.
          */
        for (const itemsAllowedDepthTemp of itemsAllowedByDepth) {
            result = itemsAllowedDepthTemp;
            if (count <= result.itemsAllowed) {
                break;
            }
        }
        // Count exceeds our maximum allowed depth (should never happen in practice given the checks above).
        if (count > result.itemsAllowed) {
            throw new Errors_1.InvalidParameterError(`count (${count}) cannot be greater than or equal to ${result.itemsAllowed}`);
        }
        return result;
    }
}
exports.LexoRankDistributor = LexoRankDistributor;
//# sourceMappingURL=LexoRankDistributor.js.map