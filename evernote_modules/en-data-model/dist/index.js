"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_CONTEXT_REGEX = exports.SHARED_NOTE_CONTEXT_REGEX = exports.LINKED_CONTEXT_REGEX = exports.MUTATION_TRACKER_REF = exports.validateAccountLimits = exports.getAccountProfileRef = exports.genNoteCreate = exports.parseAndValidateAttachmentCreateData = exports.genAttachmentCreateOps = exports.ACCOUNT_LIMITS_REF = exports.ACCOUNT_LIMITS_ID = void 0;
var AccountLimits_1 = require("./AccountLimits");
Object.defineProperty(exports, "ACCOUNT_LIMITS_ID", { enumerable: true, get: function () { return AccountLimits_1.ACCOUNT_LIMITS_ID; } });
Object.defineProperty(exports, "ACCOUNT_LIMITS_REF", { enumerable: true, get: function () { return AccountLimits_1.ACCOUNT_LIMITS_REF; } });
var AttachmentMutatorHelpers_1 = require("./Mutators/Helpers/AttachmentMutatorHelpers");
Object.defineProperty(exports, "genAttachmentCreateOps", { enumerable: true, get: function () { return AttachmentMutatorHelpers_1.genAttachmentCreateOps; } });
Object.defineProperty(exports, "parseAndValidateAttachmentCreateData", { enumerable: true, get: function () { return AttachmentMutatorHelpers_1.parseAndValidateAttachmentCreateData; } });
var NoteMutatorHelpers_1 = require("./Mutators/Helpers/NoteMutatorHelpers");
Object.defineProperty(exports, "genNoteCreate", { enumerable: true, get: function () { return NoteMutatorHelpers_1.genNoteCreate; } });
var Profile_1 = require("./Mutators/Helpers/Profile");
Object.defineProperty(exports, "getAccountProfileRef", { enumerable: true, get: function () { return Profile_1.getAccountProfileRef; } });
var MutatorHelpers_1 = require("./Mutators/MutatorHelpers");
Object.defineProperty(exports, "validateAccountLimits", { enumerable: true, get: function () { return MutatorHelpers_1.validateAccountLimits; } });
var MutationTracker_1 = require("./NodeTypes/MutationTracker");
Object.defineProperty(exports, "MUTATION_TRACKER_REF", { enumerable: true, get: function () { return MutationTracker_1.MUTATION_TRACKER_REF; } });
__exportStar(require("./CommandPolicyRules"), exports);
__exportStar(require("./EvernoteDataModel"), exports);
__exportStar(require("./EvernoteIndexer"), exports);
__exportStar(require("./MaestroProps"), exports);
__exportStar(require("./MembershipPrivilege"), exports);
__exportStar(require("./ShareUtils"), exports);
exports.LINKED_CONTEXT_REGEX = /^LinkedNotebook:/;
exports.SHARED_NOTE_CONTEXT_REGEX = /^SharedNote:/;
exports.EXTERNAL_CONTEXT_REGEX = /(^LinkedNotebook:|^SharedNote:)/;
//# sourceMappingURL=index.js.map