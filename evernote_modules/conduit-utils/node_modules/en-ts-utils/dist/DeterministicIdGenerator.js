"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicIdGenerator = void 0;
const Errors_1 = require("./Errors");
class DeterministicIdGenerator {
    constructor(entityTypeMap) {
        this.entityTypeMap = entityTypeMap;
        this.reverseEntityTypeMap = new Map();
        for (const kvp of this.entityTypeMap) {
            const [entityType, entityTypeNumber] = kvp;
            if (this.reverseEntityTypeMap.has(entityTypeNumber)) {
                throw new Errors_1.InvalidParameterError('EntityType mappings must be unique in both directions');
            }
            this.reverseEntityTypeMap.set(entityTypeNumber, entityType);
        }
    }
    createId(params) {
        const { userID, entityType, leadingSegments } = params;
        const entityTypeNumber = this.entityTypeMap.get(entityType);
        if (entityTypeNumber === undefined) {
            throw new Errors_1.InvalidParameterError(`Cannot find EntityType '${entityType}'`);
        }
        const userIDReversed = this.toReversedBase36String(userID);
        // Master segment, required by all deterministic Ids; note that the EntityType is not base36 reversed.
        const masterSeg = `${userIDReversed}${DeterministicIdGenerator.sIdDelimiter}${entityTypeNumber}`;
        const leadingSegmentStrings = [];
        if (leadingSegments) {
            for (const segment of leadingSegments) {
                const { parts } = segment;
                if (parts.length === 0) {
                    throw new Errors_1.InvalidParameterError('segment.parts cannot be empty array');
                }
                leadingSegmentStrings.push(parts
                    .map(part => this.toReversedBase36String(part))
                    .join(DeterministicIdGenerator.sIdDelimiter));
            }
        }
        let result = masterSeg;
        if (leadingSegmentStrings.length > 0) {
            result = `${leadingSegmentStrings.join(DeterministicIdGenerator.sSegDelimiter)}${DeterministicIdGenerator.sSegDelimiter}${masterSeg}`;
        }
        if (result.length > 36) {
            throw new Errors_1.InvalidParameterError('DeterministicId cannot be longer than 36 characters');
        }
        return result;
    }
    parseId(deterministicId) {
        const segmentAsStrings = deterministicId.split(DeterministicIdGenerator.sSegDelimiter);
        const segments = [];
        const lastIndex = segmentAsStrings.length - 1;
        for (let i = 0; i <= lastIndex; i++) {
            const segmentAsString = segmentAsStrings[i];
            segments.push({
                parts: segmentAsString
                    .split(DeterministicIdGenerator.sIdDelimiter)
                    .map((s, index) => {
                    if (i === lastIndex) {
                        if (index === 0) {
                            return this.fromReversedBase36String(s); // The UserID field is base36 reversed.
                        }
                        else {
                            return parseInt(s, 10); // The EntityType field is not base36 reversed.
                        }
                    }
                    return this.fromReversedBase36String(s); // Everything else is base36 reversed.
                }),
            });
        }
        const masterSeg = segments[segments.length - 1].parts;
        const entityType = this.reverseEntityTypeMap.get(masterSeg[1]);
        if (!entityType) {
            throw new Errors_1.InvalidParameterError(`Cannot find EntityType as a Number '${masterSeg[1]}'`);
        }
        const result = {
            userID: masterSeg[0],
            entityType,
        };
        if (segments.length - 1 >= 1) {
            const leadingSegments = [];
            for (let i = 0; i < segments.length - 1; i++) {
                leadingSegments.push(segments[i]);
            }
            result.leadingSegments = leadingSegments;
        }
        return result;
    }
    isDeterministicId(id) {
        // Comprehensive pattern check
        if (!DeterministicIdGenerator.sRegex.test(id)) {
            return false;
        }
        const lastIndexOf = id.lastIndexOf(DeterministicIdGenerator.sIdDelimiter);
        // Accepted EntityType verification check
        const entityTypeNumber = parseInt(id.substring(lastIndexOf + 1), 10);
        if (!this.reverseEntityTypeMap.has(entityTypeNumber)) {
            return false;
        }
        return true;
    }
    toReversedBase36String(part) {
        // Specifications do not say whether toString returns upper or lower, so we force consistency here.
        return part.toString(36).toUpperCase().split('').reverse().join('');
    }
    fromReversedBase36String(part) {
        // Specification says parseInt has to support upper or lower case, so this should be safe.
        return parseInt(part.split('').reverse().join(''), 36);
    }
}
exports.DeterministicIdGenerator = DeterministicIdGenerator;
DeterministicIdGenerator.sIdDelimiter = '|';
DeterministicIdGenerator.sSegDelimiter = '_';
DeterministicIdGenerator.sRegex = /^((([A-Z0-9](\|[A-Z0-9])*)+)_)*[A-Z0-9]+\|\d+$/;
//# sourceMappingURL=DeterministicIdGenerator.js.map