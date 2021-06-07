"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-bitwise */
var CLuceneFlags;
(function (CLuceneFlags) {
    CLuceneFlags[CLuceneFlags["STORE_YES"] = 1] = "STORE_YES";
    CLuceneFlags[CLuceneFlags["STORE_NO"] = 2] = "STORE_NO";
    CLuceneFlags[CLuceneFlags["STORE_COMPRESS"] = 4] = "STORE_COMPRESS";
    CLuceneFlags[CLuceneFlags["INDEX_NO"] = 16] = "INDEX_NO";
    CLuceneFlags[CLuceneFlags["INDEX_TOKENIZED"] = 32] = "INDEX_TOKENIZED";
    CLuceneFlags[CLuceneFlags["INDEX_UNTOKENIZED"] = 64] = "INDEX_UNTOKENIZED";
    CLuceneFlags[CLuceneFlags["INDEX_NONORMS"] = 128] = "INDEX_NONORMS";
    CLuceneFlags[CLuceneFlags["TERMVECTOR_NO"] = 256] = "TERMVECTOR_NO";
    CLuceneFlags[CLuceneFlags["TERMVECTOR_YES"] = 512] = "TERMVECTOR_YES";
    CLuceneFlags[CLuceneFlags["TERMVECTOR_WITH_POSITIONS"] = 1536] = "TERMVECTOR_WITH_POSITIONS";
    CLuceneFlags[CLuceneFlags["TERMVECTOR_WITH_OFFSETS"] = 2560] = "TERMVECTOR_WITH_OFFSETS";
    CLuceneFlags[CLuceneFlags["TERMVECTOR_WITH_POSITIONS_OFFSETS"] = 3584] = "TERMVECTOR_WITH_POSITIONS_OFFSETS";
})(CLuceneFlags = exports.CLuceneFlags || (exports.CLuceneFlags = {}));
class ENIndexSchemaBuilder {
    constructor() {
        this.scheme = { "properties": {} };
    }
    reset() {
        this.scheme = { "properties": {} };
    }
    addField(fieldName, fieldType, flags) {
        this.scheme['properties'][fieldName] = {};
        this.scheme['properties'][fieldName]['type'] = fieldType;
        this.scheme['properties'][fieldName]['flags'] = flags;
    }
    getScheme() {
        const result = this.scheme;
        this.reset();
        return result;
    }
}
exports.ENIndexSchemaBuilder = ENIndexSchemaBuilder;
function getNoteIndexSchema() {
    const schemeBuilder = new ENIndexSchemaBuilder();
    // todo:: export keyword, text fields to enum
    schemeBuilder.addField('_id', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('content', 'text', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_TOKENIZED);
    schemeBuilder.addField('nbGuid', 'keyword', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_TOKENIZED);
    schemeBuilder.addField('title', 'text', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_TOKENIZED);
    schemeBuilder.addField('titleRaw', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('created', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('updated', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    const noteScheme = schemeBuilder.getScheme();
    // todo:: use ENIndexName
    noteScheme['index'] = 'note';
    // todo:: export actions to enum?
    noteScheme['action'] = 'set_mapping';
    return noteScheme;
}
exports.getNoteIndexSchema = getNoteIndexSchema;
function getNotebookIndexSchema() {
    const schemeBuilder = new ENIndexSchemaBuilder();
    schemeBuilder.addField('_id', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('notebook', 'keyword', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('notebook_utf8', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    const notebookScheme = schemeBuilder.getScheme();
    notebookScheme['index'] = 'notebook';
    notebookScheme['action'] = 'set_mapping';
    notebookScheme['version'] = '1';
    return notebookScheme;
}
exports.getNotebookIndexSchema = getNotebookIndexSchema;
function getTagIndexSchema() {
    const schemeBuilder = new ENIndexSchemaBuilder();
    schemeBuilder.addField('_id', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('tag', 'keyword', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('tag_utf8', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    const tagScheme = schemeBuilder.getScheme();
    tagScheme['index'] = 'tag';
    tagScheme['action'] = 'set_mapping';
    tagScheme['version'] = '1';
    return tagScheme;
}
exports.getTagIndexSchema = getTagIndexSchema;
function getStackIndexSchema() {
    const schemeBuilder = new ENIndexSchemaBuilder();
    schemeBuilder.addField('_id', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('stack', 'keyword', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('stack_utf8', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    const stackScheme = schemeBuilder.getScheme();
    stackScheme['index'] = 'stack';
    stackScheme['action'] = 'set_mapping';
    stackScheme['version'] = '1';
    return stackScheme;
}
exports.getStackIndexSchema = getStackIndexSchema;
function getWorkspaceIndexSchema() {
    const schemeBuilder = new ENIndexSchemaBuilder();
    schemeBuilder.addField('_id', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('space', 'keyword', CLuceneFlags.STORE_NO | CLuceneFlags.INDEX_UNTOKENIZED);
    schemeBuilder.addField('space_utf8', 'keyword', CLuceneFlags.STORE_YES | CLuceneFlags.INDEX_UNTOKENIZED);
    const workspaceScheme = schemeBuilder.getScheme();
    workspaceScheme['index'] = 'space';
    workspaceScheme['action'] = 'set_mapping';
    workspaceScheme['version'] = '1';
    return workspaceScheme;
}
exports.getWorkspaceIndexSchema = getWorkspaceIndexSchema;
//# sourceMappingURL=ENSearchSchemas.js.map