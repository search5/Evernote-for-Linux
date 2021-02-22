"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const QueryStringParser_1 = require("./QueryStringParser");
const QueryToken_1 = require("./QueryToken");
const FieldOperator_1 = require("./FieldOperator");
/**
 * Traverses query tree and does the actual job of printing result
 */
class ESQueryPrinter {
    constructor(dontPrintAnd, printWildcards) {
        this.sb = '';
        this.dontPrintAnd = dontPrintAnd;
        this.printWildcards = printWildcards;
    }
    beforeEnter(node) {
        if (node.parent !== null && this.useParentheses(node.token, node.parent.token)) {
            this.sb = this.sb.concat("(");
        }
    }
    enter(node) {
        const token = node.token;
        if (token.type === QueryToken_1.QSPTokenType.AND) {
            this.printAnd();
        }
        else if (token.type === QueryToken_1.QSPTokenType.NOT) {
            // Sometimes Lucene doesn't understand negated terms. To avoid this we transfrom negated term to `*:* AND -term`
            this.sb = this.sb.concat("*:*");
            this.printAnd();
            // negated coordinate operators require special care, since -altitude:>=1 also matches null values
            if (!this.childIsCoordinateOperator(node)) {
                this.sb = this.sb.concat("-");
            }
        }
        else if (token.type === QueryToken_1.QSPTokenType.OR) {
            this.sb = this.sb.concat(" OR ");
        }
        else if (token.type === QueryToken_1.QSPTokenType.ARGUMENT) {
            this.processArgument(node);
        }
        else {
            throw new Error("Error printing query for elastcisearch: Unknown token type");
        }
    }
    afterEnter(node) {
        if (node.parent !== null && this.useParentheses(node.token, node.parent.token)) {
            this.sb = this.sb.concat(")");
        }
    }
    printAnd() {
        if (this.dontPrintAnd) {
            this.sb = this.sb.concat(" ");
        }
        else {
            this.sb = this.sb.concat(" AND ");
        }
    }
    // Lucene doesn't respect operator precedence, so we should enclose all children
    // that have different type with parent.
    useParentheses(child, parent) {
        return child.type !== QueryToken_1.QSPTokenType.ARGUMENT && child.type !== parent.type;
    }
    toString() {
        return this.sb;
    }
    processArgument(node) {
        const token = node.token;
        if (token.isValidFieldOperator && token.isValidFieldValue) {
            this.processFieldOperator(node);
        }
        else {
            this.processText(token);
        }
    }
    processFieldOperator(node) {
        const token = node.token;
        if (token.fieldOperator === FieldOperator_1.QSPFieldOperator.todo) {
            this.sb = this.sb.concat("_en_todo_");
            if (token.prefixed) {
                this.sb = this.sb.concat("*");
            }
            else {
                this.sb = this.sb.concat(token.fieldValue); // expects "true" or "false" in fieldValue
            }
        }
        else if (token.fieldOperator === FieldOperator_1.QSPFieldOperator.encryption) {
            this.sb = this.sb.concat("_en_crypt_");
        }
        else if (token.fieldValue.length === 0) { // expects that token.prefixed is true
            this.sb = this.sb.concat("_exists_:");
            if (token.fieldOperator && ESQueryStringBuilder.FIELD_OPERATORS_MAPPING.has(token.fieldOperator)) {
                this.sb = this.sb.concat(ESQueryStringBuilder.FIELD_OPERATORS_MAPPING.get(token.fieldOperator));
            }
        }
        else {
            if (token.fieldOperator && ESQueryStringBuilder.FIELD_OPERATORS_MAPPING.has(token.fieldOperator)) {
                this.sb = this.sb.concat(ESQueryStringBuilder.FIELD_OPERATORS_MAPPING.get(token.fieldOperator));
            }
            this.sb = this.sb.concat(":");
            // TODO: if fieldValue is "<2" at this point (contains characters "<" and ">" that elasticsearch will misinterpret)
            // maybe we should replace these two chars at indexing time with something like _en_less_
            if (FieldOperator_1.QSPFieldOperatorContext.isDateOperator(token.fieldOperator)) {
                // Lucene can't interpert asterisk value in range query.
                // https://stackoverflow.com/questions/8548500/lucene-range-query-how-to-query-for-a-string-range-with-no-specific-upper-maxi
                // replaced by the maximum date value, see:
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Description
                this.sb = this.sb.concat(`[${token.fieldValue} TO ${8640000000000000}]`);
            }
            else if (FieldOperator_1.QSPFieldOperatorContext.isCoordinateOperator(token.fieldOperator)) {
                const wasNegated = node.parent !== null && node.parent.token.type === QueryToken_1.QSPTokenType.NOT;
                this.sb = this.sb.concat(wasNegated ? "<" : ">=");
                this.sb = this.sb.concat(token.fieldValue);
            }
            else {
                this.processText(token);
            }
        }
    }
    removeSurroundingPunctuation(text) {
        return text.replace(ESQueryPrinter.PUNCT_REGEX_START, '').replace(ESQueryPrinter.PUNCT_REGEX_END, '');
    }
    removeLeadingWildcards(text) {
        return text.replace(ESQueryPrinter.LEADING_WILDCARD, '');
    }
    processText(token) {
        let text = token.isFieldOperator() ? token.fieldValue : token.token;
        if (!token.quoted && !token.isFieldOperator()) {
            text = this.removeSurroundingPunctuation(text);
        }
        else {
            text = this.removeLeadingWildcards(text);
        }
        if (!token.isFieldOperator()) {
            if (text.length <= 0 && token.prefixed) {
                this.sb = this.sb.concat("_exists_:content");
                return;
            }
            this.sb = this.sb.concat("content:");
        }
        if (token.quoted) {
            this.sb = this.sb.concat("\"");
        }
        this.sb = this.sb.concat(ESQueryStringBuilder.escapeReservedChars(text));
        if (token.quoted) {
            this.sb = this.sb.concat("\"");
        }
        if (token.prefixed && !token.quoted && this.printWildcards && text.length > 0) { // Expects that token is either quoted or prefixed
            this.sb = this.sb.concat("*");
        }
    }
    // We should skip the - sign while traversing the tree
    childIsCoordinateOperator(node) {
        if (node.children === null || node.children.length !== 1) {
            return false;
        }
        const token = node.children[0].token;
        return token.isValidFieldOperator && token.isValidFieldValue
            && FieldOperator_1.QSPFieldOperatorContext.isCoordinateOperator(token.fieldOperator) && !(token.fieldValue.length === 0);
    }
}
ESQueryPrinter.PUNCT_REGEX_START = new RegExp("^[^" + QueryStringParser_1.QueryStringParser.WORD_SYMBOL + "]+", "mu"); // punctuation symbol at word start
ESQueryPrinter.PUNCT_REGEX_END = new RegExp("[^" + QueryStringParser_1.QueryStringParser.WORD_SYMBOL + "]+$", "mu"); // punctuation symbol at word end
ESQueryPrinter.LEADING_WILDCARD = new RegExp("^[*]+", "mu"); // wildcards at word start (deadly for Lucene)
// strings that are actually stored in elasticsearch index as contains field values
var Contains;
(function (Contains) {
    Contains["kEnCrypt"] = "enCrypt";
    Contains["kEnTodo"] = "enTodo";
    Contains["kEnCode"] = "enCodeblock";
    Contains["kAttachment"] = "attachment";
    Contains["kFilePdf"] = "filePdf";
    Contains["kFileArchive"] = "fileArchive";
    Contains["kFileAudio"] = "fileAudio";
    Contains["kFileVideo"] = "fileVideo";
    Contains["kFileDocument"] = "fileDocument";
    Contains["kFileSpreadsheet"] = "fileSpreadsheet";
    Contains["kFilePresentation"] = "filePresentation";
    Contains["kFileOffice"] = "fileOffice";
    Contains["kFileImage"] = "fileImage";
    Contains["kFileImagePendoc"] = "fileImagePendoc";
    Contains["kTable"] = "table";
    Contains["kList"] = "list";
    Contains["kWebclip"] = "webclip";
    Contains["kUrl"] = "url";
    Contains["kUrlGoogleDrive"] = "urlGoogleDrive";
    Contains["kNumberInteger"] = "numberInteger";
    Contains["kNumberReal"] = "numberReal";
    Contains["kNumberPercent"] = "numberPercent";
    Contains["kPhoneNumber"] = "phoneNumber";
    Contains["kEmail"] = "email";
    Contains["kAddress"] = "address";
    Contains["kDate"] = "date";
    Contains["kTime"] = "time";
    Contains["kPerson"] = "person";
    Contains["kLocation"] = "location";
    Contains["kNumberPrice"] = "numberPrice";
    Contains["kFlightNumber"] = "flightNumber";
})(Contains || (Contains = {}));
/**
 * Elasticsearch query string builder.
 */
class ESQueryStringBuilder {
    constructor(queryTree) {
        this.dontPrintAnd = true; // AND is default operator, so don't print it
        this.printWildcards = true;
        this.queryTree = queryTree;
    }
    /**
    * Transforms a tree of query terms to Elasticsearch format. Returns null for empty query.
    * Assumes syntactical correctness of provided tree. All validations should be performed in advance.
    */
    build() {
        if (this.queryTree === null) {
            return null;
        }
        const printer = new ESQueryPrinter(this.dontPrintAnd, this.printWildcards);
        QueryStringParser_1.QueryStringParser.toInfix(this.queryTree, printer);
        return printer.toString();
    }
    setDontPrintAnd(dontPrintAnd) {
        this.dontPrintAnd = dontPrintAnd;
        return this;
    }
    setPrintWildcards(printWildcards) {
        this.printWildcards = printWildcards;
        return this;
    }
    static initializeFieldOperatorsMapping() {
        const result = new Map();
        for (const op of FieldOperator_1.QSPFieldOperatorContext.ALL) {
            if (op !== FieldOperator_1.QSPFieldOperator.noteId) {
                result.set(op, op.toString()); // most operator names are already suitable
            }
        }
        result.set(FieldOperator_1.QSPFieldOperator.noteId, "_id");
        return result;
    }
    /**
    * Escapes reserved characters.
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
    */
    static escapeReservedChars(query) {
        let sb = '';
        for (let i = 0; i < query.length; ++i) {
            const ch = query.charAt(i);
            // Both > and < cannot be reserved according to ES docs, so we just drop them
            // (this can cause troubles if original string consisted of this two chars only).
            if (ch === '>' || ch === '<') {
                continue;
            }
            if (ESQueryStringBuilder.RESERVED_CHARACTERS.has(ch)) {
                const escapedQuote = (i < query.length - 1) && ch == '\\' && query.charAt(i + 1) == '\"';
                if (escapedQuote) // do not escape already escaped quote (P6)
                 {
                    sb = sb.concat("\\\"");
                    i++;
                    continue;
                }
                sb = sb.concat('\\');
            }
            sb = sb.concat(ch);
        }
        return sb;
    }
    static initializeStr2enum() {
        const res = new Map();
        const values = new Array();
        for (const loc of Object.values(Contains)) {
            values.push(loc);
        }
        return res;
    }
    static initializseALLSet() {
        const res = new Set();
        for (const loc of Object.values(Contains)) {
            res.add(loc);
        }
        return res;
    }
    static fromStr(localeStr) {
        return ESQueryStringBuilder.str2enum.get(localeStr);
    }
}
exports.ESQueryStringBuilder = ESQueryStringBuilder;
ESQueryStringBuilder.FIELD_OPERATORS_MAPPING = ESQueryStringBuilder.initializeFieldOperatorsMapping();
ESQueryStringBuilder.RESERVED_CHARACTERS = new Set([
    '+', '-', '=', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '/', '\\'
]);
ESQueryStringBuilder.str2enum = ESQueryStringBuilder.initializeStr2enum();
ESQueryStringBuilder.All = ESQueryStringBuilder.initializseALLSet();
//# sourceMappingURL=ESQueryStringBuilder.js.map