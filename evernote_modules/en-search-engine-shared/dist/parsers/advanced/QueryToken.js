"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const QueryStringParser_1 = require("./QueryStringParser");
const FieldOperator_1 = require("./FieldOperator");
const date_fns_1 = require("date-fns");
/*
 * Represents single search word, quoted phrase (e.g. "a b c") or field search term (e.g. notebook:ABC).
 * Note that you may get valid field operator but invalid field value. You should use field operator only
 * if both isValidFieldOperator and isValidFieldValue are true.
 */
// Note that order in this enum is used to compare operators (see compareOps())
var QSPTokenType;
(function (QSPTokenType) {
    QSPTokenType[QSPTokenType["NOT"] = 0] = "NOT";
    QSPTokenType[QSPTokenType["AND"] = 1] = "AND";
    QSPTokenType[QSPTokenType["OR"] = 2] = "OR";
    QSPTokenType[QSPTokenType["OPENPAREN"] = 3] = "OPENPAREN";
    QSPTokenType[QSPTokenType["CLOSEPAREN"] = 4] = "CLOSEPAREN";
    QSPTokenType[QSPTokenType["ARGUMENT"] = 5] = "ARGUMENT";
})(QSPTokenType = exports.QSPTokenType || (exports.QSPTokenType = {}));
class QSPConstructorParam {
    constructor() {
        this.timeZone = null;
        this.extractBooleanOperators = true; // whether to interpret AND, OR, NOT and parentheses as boolean operators
    }
}
exports.QSPConstructorParam = QSPConstructorParam;
const gDefaultParam = new QSPConstructorParam();
class QSPQueryToken {
    constructor() {
        this.quoted = false; // Whole token or fieldValueArgument is surrounded by quotes. Means that provided words must match in order.
        this.isValidFieldOperator = false;
        this.isValidFieldValue = false; // We may want to send warnings when valid operator has invalid value, so these two are separated
        this.containsCJK = false; // Contains CJK symbols in token itself or in fieldValue (for valid operator)
    }
    static fromDefault(tokenStr, param) {
        const queryToken = new QSPQueryToken();
        queryToken.token = tokenStr;
        queryToken.type = param.extractBooleanOperators ? QSPQueryToken.getTokenType(queryToken.token) : QSPTokenType.ARGUMENT;
        if (queryToken.type === QSPTokenType.ARGUMENT) {
            queryToken.analyseStructure(param);
        }
        return queryToken;
    }
    static fromTokenStr(tokenStr) {
        return QSPQueryToken.fromDefault(tokenStr, gDefaultParam);
    }
    static fromQueryToken(tok) {
        const queryToken = new QSPQueryToken();
        queryToken.type = tok.type;
        queryToken.token = tok.token;
        queryToken.prefixed = tok.prefixed;
        queryToken.quoted = tok.quoted;
        queryToken.fieldOperator = tok.fieldOperator;
        queryToken.fieldValue = tok.fieldValue;
        queryToken.isValidFieldOperator = tok.isValidFieldOperator;
        queryToken.isValidFieldValue = tok.isValidFieldValue;
        queryToken.containsCJK = tok.containsCJK;
        return queryToken;
    }
    // If both field operator part and value part are valid this is as field operator
    isFieldOperator() {
        return this.isValidFieldOperator && this.isValidFieldValue;
    }
    // For debug purposes only
    toString() {
        if (this.type === QSPTokenType.ARGUMENT) {
            const text = this.prefixed ? this.token + "*" : this.token;
            if (this.quoted && !(this.isValidFieldOperator && this.isValidFieldValue)) {
                return "\"" + text + "\"";
            }
            else {
                return text;
            }
        }
        return QueryStringParser_1.QueryStringParser.OPERATORS.has(this.type) ? this.token.toUpperCase() : this.token;
    }
    static getTokenType(token) {
        if (token === 'AND') {
            return QSPTokenType.AND;
        }
        if (token === 'OR') {
            return QSPTokenType.OR;
        }
        if (token === 'NOT') {
            return QSPTokenType.NOT;
        }
        if (token === '(') {
            return QSPTokenType.OPENPAREN;
        }
        if (token === ')') {
            return QSPTokenType.CLOSEPAREN;
        }
        return QSPTokenType.ARGUMENT;
    }
    /*
 * Modifies token and fills advanced properties, such as prefixed, quoted and field operator
 */
    analyseStructure(param) {
        if (this.token.endsWith("*")) { // && token.length() > 1) {
            this.prefixed = true;
            this.token = this.token.substring(0, this.token.length - 1);
        }
        if (QSPQueryToken.isQuoted(this.token) && !this.prefixed) {
            this.quoted = true;
            this.token = QSPQueryToken.stripQuotes(this.token);
        }
        const colonIdx = this.token.indexOf(':');
        if (colonIdx > 0 && !this.quoted) {
            const fieldNameCandidate = this.token.substring(0, colonIdx);
            this.fieldOperator = FieldOperator_1.QSPFieldOperatorContext.fromStrIgnoreCase(fieldNameCandidate);
            if (this.fieldOperator !== undefined) {
                this.isValidFieldOperator = true;
                const value = this.token.substring(colonIdx + 1, this.token.length);
                this.isValidFieldValue = this.validateAndSetFieldValue(value, param);
            }
        }
        this.containsCJK = QSPQueryToken.checkCJK(this.isFieldOperator() ? this.fieldValue : this.token);
    }
    /*
    * Given a string, validates it according to Evernote grammar and sets transformed value to fieldValue.
    * Returns false if validation failed.
    */
    validateAndSetFieldValue(value, param) {
        if (FieldOperator_1.QSPFieldOperatorContext.isDateOperator(this.fieldOperator)) {
            if (value.length === 0 && this.prefixed) {
                this.fieldValue = '';
                return true;
            }
            const date = QSPQueryToken.convertDateString(value, param.timeZone);
            if (date == null) {
                return false;
            }
            this.fieldValue = date.toString();
            // // Transform date/time to standard form
            // DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
            // dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            // this.fieldValue = dateFormat.format(date);
            return true;
        }
        if (FieldOperator_1.QSPFieldOperatorContext.isCoordinateOperator(this.fieldOperator)) {
            if (value.length === 0 && this.prefixed) {
                this.fieldValue = '';
                return true;
            }
            const d = Number(value);
            if (isNaN(d)) {
                return false;
            }
            if (this.fieldOperator === FieldOperator_1.QSPFieldOperator.latitude) {
                if (d < -90 || d > 90) {
                    return false;
                }
            }
            if (this.fieldOperator === FieldOperator_1.QSPFieldOperator.longitude) {
                if (d < -180 || d > 180) {
                    return false;
                }
            }
            this.fieldValue = d.toFixed(QSPQueryToken.coordinateFormat).toString();
            return true;
        }
        if (this.fieldOperator === FieldOperator_1.QSPFieldOperator.todo) {
            if ((value.length === 0 && this.prefixed) || QSPQueryToken.VALID_BOOLEAN_ARGUMENTS.has(value)) {
                this.fieldValue = value;
                return true;
            }
            return false;
        }
        if (this.fieldOperator === FieldOperator_1.QSPFieldOperator.encryption) {
            if (value.length !== 0 || this.prefixed) {
                return false;
            }
            this.fieldValue = '';
            return true;
        }
        if (this.fieldOperator === FieldOperator_1.QSPFieldOperator.geodistance) {
            if (value.length === 0 || this.prefixed) {
                return false;
            }
            const parts = value.split(',');
            if (parts.length != 3) {
                return false;
            }
            const d1 = Number(parts[0]);
            const d2 = Number(parts[1]);
            if (isNaN(d1) || isNaN(d2)) {
                return false;
            }
            const p3 = parts[2];
            let d3 = 0;
            if (p3.endsWith("km")) {
                d3 = Number(p3.substring(0, p3.length - 2));
            }
            else if (p3.endsWith("m")) {
                d3 = Number(p3.substring(0, p3.length - 1));
            }
            else {
                return false;
            }
            if (isNaN(d3)) {
                return false;
            }
            this.fieldValue = value;
            return true;
        }
        // something like reminderOrder:*
        if (value.length === 0 && this.prefixed) {
            this.fieldValue = value;
            return true;
        }
        // general case, e.g. notebook:ABC
        if (value.length > 0) {
            if (QSPQueryToken.isQuoted(value) && !this.prefixed) {
                this.quoted = true;
                this.fieldValue = QSPQueryToken.stripQuotes(value);
            }
            else {
                this.fieldValue = value;
            }
            return true;
        }
        return false;
    }
    /**
    * Returns true if the parameter is a quoted phrase, beginning and ending with
    * double-quotes, and at least one character in between quotes.
    */
    static isQuoted(term) {
        return term.length > 2 && term.startsWith("\"") && term.endsWith("\"");
    }
    /**
    * Strips quotation marks off the beginning and end of the phrase
    */
    static stripQuotes(phrase) {
        return phrase.substring(1, phrase.length - 1);
    }
    /**
    * Takes a date search string and tries to convert it to a specific date for comparison
    * purposes.
    *
    * @param dateString the date string to try to interpret
    * @param timeZone if provided, this is the client's timezone to use for date conversion
    * @return the Date object represented by the query string, or null if the query string
    *         doesn't contain a valid datetime pattern.
    */
    static convertDateString(dateString, timeZone) {
        // date is in the local timezone format
        let date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        if (dateString.startsWith("day")) {
            date.setDate(date.getDate() + this.getDateTimeDelta(dateString));
        }
        else if (dateString.startsWith("week")) {
            date = date_fns_1.startOfWeek(date);
            date.setDate(date.getDate() + 7 * this.getDateTimeDelta(dateString));
        }
        else if (dateString.startsWith("month")) {
            date = date_fns_1.startOfMonth(date);
            date.setMonth(date.getMonth() + this.getDateTimeDelta(dateString));
        }
        else if (dateString.startsWith("year")) {
            date = date_fns_1.startOfYear(date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            date = new Date(year + this.getDateTimeDelta(dateString), month, day);
        }
        else {
            const results = this.ISO8601_DATETIME_PATTERN.exec(dateString);
            if (!results) {
                // Bad date/time specification
                return null;
            }
            let isLocalTime = true;
            if ('Z' === results[8]) {
                isLocalTime = false;
            }
            const year = parseInt(results[1]);
            const month = parseInt(results[2]) - 1;
            const day = parseInt(results[3]);
            let hour = 0;
            let minute = 0;
            let second = 0;
            if (results[5] !== undefined) {
                hour = parseInt(results[5]);
                minute = parseInt(results[6]);
                second = parseInt(results[7]);
            }
            if (isLocalTime) {
                date = new Date(year, month, day, hour, minute, second);
            }
            else {
                date = new Date(Date.UTC(year, month, day, hour, minute, second));
            }
        }
        // System.err.println("== [" + dateString + "] -> " + cal.getTime());
        // returns time in UTC format
        return date.getTime();
    }
    /**
    * Looks through the provided date specification string for a delta in the form of
    * "-###" where ### is some number. Returns the numeric value, or 0 if no matching
    * number is found.
    */
    static getDateTimeDelta(dateString) {
        const results = QSPQueryToken.DATETIME_DELTA_PATTERN.exec(dateString);
        if (results) {
            let offset = results[0];
            if (offset.charAt(0) === '+') {
                offset = offset.substring(1);
            }
            return Number(offset);
        }
        return 0;
    }
    /**
    * Checks if there are CJK characters AT THE END of the string
    */
    static checkCJK(text) {
        return QSPQueryToken.ENDS_WITH_CJK_PATTERN.test(text);
    }
}
exports.QSPQueryToken = QSPQueryToken;
// String format for coordinates.
// 6 decimal places should guarantee us precision of 0.1m
// (https://en.wikipedia.org/wiki/Decimal_degrees#Precision)
QSPQueryToken.coordinateFormat = 6;
QSPQueryToken.ISO8601_DATETIME_PATTERN = new RegExp("^([0-9]{4})([01][0-9])([0-3][0-9])(T([0-2][0-9])([0-5][0-9])([0-5][0-9]))?(Z?)$");
QSPQueryToken.DATETIME_DELTA_PATTERN = new RegExp('[+-][0-9]+');
QSPQueryToken.VALID_BOOLEAN_ARGUMENTS = new Set(["true", "false"]); // or '*', which is handled by 'prefixed' parameter
QSPQueryToken.CJK_RANGE = '['
    + '\uac00-\ud7af\u1100-\u11ff\u3130-\u318F\ua960-\ua97f\ud7b0-\ud7ff\uffa0-\uffdc' // Korean
    + '\u2F00-\u2FDF\u2E80-\u2EFF\u3040-\u30ff\u3190-\u319F\u31F0-\u31FF\u3300-\u33FF\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff65-\uff9f' // Chinese, Japanese
    + ']';
QSPQueryToken.CONTAINS_CJK_PATTERN = new RegExp(QSPQueryToken.CJK_RANGE);
QSPQueryToken.ENDS_WITH_CJK_PATTERN = new RegExp(QSPQueryToken.CJK_RANGE + '$');
//# sourceMappingURL=QueryToken.js.map