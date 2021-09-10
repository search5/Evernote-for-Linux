"use strict";
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formDeterministicGamificationMilestoneIdParts = exports.maskLeadingSegment = void 0;
const maskLeadingSegment = (userID, milestoneKey) => {
    /*
       * The idea here, is to create a pseudo-random set values within a predefined range for certain Widgets, will be added in multiples.
       * Specifically, the Extra WidgetType, which will have a value of 11, and doubles the size of the Board for a user.
       *
       * Magic Numbers:
       *    63 has a bit representation of 0b111111, which is guaranteed to mask values up to 36, which works well for base36.
       *    546 creates a relatively even spread from 0-Z in this formula.
       *    1296 makes a stable leading segment of at least 3 characters.
       */
    const milestoneKeyValue = milestoneKey;
    return 1296 + ((63 & userID) + milestoneKeyValue) + (milestoneKeyValue * 546);
};
exports.maskLeadingSegment = maskLeadingSegment;
const formDeterministicGamificationMilestoneIdParts = (userID, milestoneKey) => {
    const milestoneNumber = exports.maskLeadingSegment(userID, milestoneKey);
    return [
        {
            parts: [milestoneNumber],
        },
    ];
};
exports.formDeterministicGamificationMilestoneIdParts = formDeterministicGamificationMilestoneIdParts;
//# sourceMappingURL=GamificationMilestoneSchema.js.map