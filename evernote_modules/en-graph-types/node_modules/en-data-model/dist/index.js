"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDeterministicIdGenerator = exports.validateEntity = exports.validateDataAgainstSchema = exports.ValidationError = exports.agentFromUserID = exports.NullUserID = exports.ClientNSyncTypes = void 0;
const schema_embed_1 = require("./schema-embed");
const ClientNSyncTypes = __importStar(require("./sync-types"));
const ts_types_1 = require("./ts-types");
const ajv_1 = __importDefault(require("ajv"));
const en_ts_utils_1 = require("en-ts-utils");
__exportStar(require("./schema-embed"), exports);
__exportStar(require("./ts-types"), exports);
exports.ClientNSyncTypes = __importStar(require("./sync-types"));
const gValidator = new ajv_1.default({
    useDefaults: false,
    validateSchema: true,
    allErrors: true,
    missingRefs: true,
    schemas: schema_embed_1.SchemaArray,
});
const gFillDefaultsValidator = new ajv_1.default({
    useDefaults: true,
    validateSchema: true,
    allErrors: true,
    missingRefs: true,
    schemas: schema_embed_1.SchemaArray,
});
exports.NullUserID = 0;
function agentFromUserID(userID) {
    return {
        id: userID.toString(),
        type: ts_types_1.AgentType.USER,
    };
}
exports.agentFromUserID = agentFromUserID;
class ValidationError extends Error {
    constructor(schemaName, message, details) {
        super(message);
        this.schemaName = schemaName;
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
function validateDataAgainstSchema(schema, fillDefaults, data) {
    const ajv = fillDefaults ? gFillDefaultsValidator : gValidator;
    let isInlineSchema = true;
    let validator;
    let schemaName = '<inline schema>';
    if (typeof schema === 'string') {
        isInlineSchema = false;
        schemaName = schema;
        validator = ajv.getSchema(`${schemaName}.schema.json`);
    }
    else {
        try {
            validator = ajv.compile(schema);
        }
        catch (error) {
            throw new ValidationError(schemaName, 'schema compilation failed', error);
        }
    }
    if (!validator) {
        throw new ValidationError(schemaName, isInlineSchema ? 'failed to compile inline schema' : 'failed to find schema', schemaName);
    }
    if (!validator(data)) {
        throw new ValidationError(schemaName, 'validation failed', ajv.errorsText(validator.errors));
    }
}
exports.validateDataAgainstSchema = validateDataAgainstSchema;
function validateEntity(ent, fillDefaults) {
    validateDataAgainstSchema(ent.type + 'Entity', fillDefaults, ent);
}
exports.validateEntity = validateEntity;
// Using an IIFE here over a Copy Constructor for most possible compatibility.
exports.DefaultDeterministicIdGenerator = (() => {
    /* Must map to NSync Type Numbers */
    const entityTypeMap = new Map();
    entityTypeMap.set(ts_types_1.EntityType.Note, ClientNSyncTypes.EntityType.NOTE);
    entityTypeMap.set(ts_types_1.EntityType.Notebook, ClientNSyncTypes.EntityType.NOTEBOOK);
    entityTypeMap.set(ts_types_1.EntityType.Workspace, ClientNSyncTypes.EntityType.WORKSPACE);
    entityTypeMap.set(ts_types_1.EntityType.Attachment, ClientNSyncTypes.EntityType.ATTACHMENT);
    entityTypeMap.set(ts_types_1.EntityType.Tag, ClientNSyncTypes.EntityType.TAG);
    entityTypeMap.set(ts_types_1.EntityType.SavedSearch, ClientNSyncTypes.EntityType.SAVED_SEARCH);
    entityTypeMap.set(ts_types_1.EntityType.Shortcut, ClientNSyncTypes.EntityType.SHORTCUT);
    // entityTypeMap.set(EntityType.RecipientSettings, 7);
    // entityTypeMap.set(EntityType.NoteTags, 8);
    // entityTypeMap.set(EntityType.NoteAttachments, 9);
    // entityTypeMap.set(EntityType.AccessInfo, 10);
    // entityTypeMap.set(EntityType.MutationTracker, 11);
    entityTypeMap.set(ts_types_1.EntityType.Board, ClientNSyncTypes.EntityType.BOARD);
    entityTypeMap.set(ts_types_1.EntityType.Widget, ClientNSyncTypes.EntityType.WIDGET);
    // entityTypeMap.set(EntityType.TaskGroup, 14);
    // entityTypeMap.set(EntityType.Task, 15);
    return new en_ts_utils_1.DeterministicIdGenerator(entityTypeMap);
})();
//# sourceMappingURL=index.js.map