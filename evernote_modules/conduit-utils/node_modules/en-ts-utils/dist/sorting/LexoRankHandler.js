"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexoRankHandler = void 0;
const Errors_1 = require("../Errors");
const lexoRank_1 = require("./lexoRank");
const LexoRankDistributor_1 = require("./LexoRankDistributor");
/*
  Use the LexoRankHandler class to calculate string value sort weights (ranks) for ordered items.
*/
class LexoRankHandler {
    constructor(maxLength) {
        this.mMaxLength = maxLength;
    }
    maxLength() {
        return this.mMaxLength;
    }
    totalMax() {
        return lexoRank_1.LexoRankEndWeight;
    }
    totalMin() {
        return lexoRank_1.LexoRankMinChar;
    }
    /*
      Parameters:
        light: The lower value weight
        heavy: The higher value weight
      Returns:
        A weight as close as possible to the mid point between the min and max.
      Throws:
        OutOfRangeError
          This means a distribute is required to redistribute weights among the items.
    */
    between(light, heavy) {
        const result = lexoRank_1.lexoRank(light, heavy);
        if (result === light) {
            throw new Errors_1.OutOfRangeError('no more weights between light and heavy');
        }
        else if (result.length >= this.mMaxLength) {
            throw new Errors_1.OutOfRangeError('calculated weight is greater than maxLengt()');
        }
        return result;
    }
    /*
      Parameters:
        count: The total number of items we need to initialize with weights
      Returns:
        A an array of strings with weights in min -> max order.
          Attempts to leave space at the beginning and end of the weight to allow sorts at the top and bottom of lists.
      Throws:
        InvalidParameterError
          This means that count is less then or equal to the min/max values allowed.
    */
    distribute(count) {
        // Lazy construction allows for deterministic static property calculation/memory usage only when needed.
        return new LexoRankDistributor_1.LexoRankDistributor().distribute(count);
    }
}
exports.LexoRankHandler = LexoRankHandler;
//# sourceMappingURL=LexoRankHandler.js.map