"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// QSP stands for QueryStringParser
var QSPFieldOperator;
(function (QSPFieldOperator) {
    // Scope modifiers
    QSPFieldOperator["notebook"] = "notebook";
    QSPFieldOperator["nbGuid"] = "nbGuid";
    QSPFieldOperator["space"] = "space";
    QSPFieldOperator["spaceGuid"] = "spaceGuid";
    QSPFieldOperator["stack"] = "stack";
    // Core note properties as listed in main doc (https://dev.evernote.com/doc/articles/search_grammar.php)
    QSPFieldOperator["tag"] = "tag";
    QSPFieldOperator["title"] = "title";
    QSPFieldOperator["created"] = "created";
    QSPFieldOperator["updated"] = "updated";
    QSPFieldOperator["resourceMime"] = "resourceMime";
    QSPFieldOperator["subjectDate"] = "subjectDate";
    QSPFieldOperator["altitude"] = "altitude";
    QSPFieldOperator["longitude"] = "longitude";
    QSPFieldOperator["latitude"] = "latitude";
    QSPFieldOperator["author"] = "author";
    QSPFieldOperator["source"] = "source";
    QSPFieldOperator["sourceApplication"] = "sourceApplication";
    QSPFieldOperator["contentClass"] = "contentClass";
    QSPFieldOperator["placeName"] = "placeName";
    QSPFieldOperator["applicationData"] = "applicationData";
    QSPFieldOperator["reminderOrder"] = "reminderOrder";
    QSPFieldOperator["reminderTime"] = "reminderTime";
    QSPFieldOperator["reminderDoneTime"] = "reminderDoneTime";
    QSPFieldOperator["todo"] = "todo";
    QSPFieldOperator["encryption"] = "encryption";
    // more NoteAttributes (https://dev.evernote.com/doc/reference/Types.html#Struct_NoteAttributes)
    QSPFieldOperator["sourceURL"] = "sourceURL";
    QSPFieldOperator["shareDate"] = "shareDate";
    // lastEditedBy -- missing in our index
    QSPFieldOperator["creatorId"] = "creatorId";
    QSPFieldOperator["lastEditorId"] = "lastEditorId";
    // more ResourceAttributes (https://dev.evernote.com/doc/reference/Types.html#Struct_ResourceAttributes)
    QSPFieldOperator["resourceFileName"] = "resourceFileName";
    // not mentioned in official docs
    QSPFieldOperator["resourceText"] = "resourceText";
    QSPFieldOperator["resourceRecoTopText"] = "resourceRecoTopText";
    QSPFieldOperator["resourceRecoOtherText"] = "resourceRecoOtherText";
    // Not mentioned in official docs
    QSPFieldOperator["userId"] = "userId";
    QSPFieldOperator["deleted"] = "deleted";
    QSPFieldOperator["active"] = "active";
    QSPFieldOperator["usn"] = "usn";
    QSPFieldOperator["tagGuid"] = "tagGuid";
    QSPFieldOperator["noteText"] = "noteText";
    QSPFieldOperator["contains"] = "contains";
    QSPFieldOperator["categories"] = "categories";
    QSPFieldOperator["noteId"] = "noteId";
    QSPFieldOperator["geodistance"] = "geodistance";
})(QSPFieldOperator = exports.QSPFieldOperator || (exports.QSPFieldOperator = {}));
class QSPFieldOperatorContext {
    static initializeAllSet() {
        const all = new Set();
        for (const elem of Object.values(QSPFieldOperator)) {
            all.add(elem);
        }
        return all;
    }
    static initializeStrlwr2enum() {
        const strlwr2enum = new Map();
        for (const elem of Object.values(QSPFieldOperator)) {
            strlwr2enum.set(elem.toString().toLowerCase(), elem);
        }
        // additional aliases for field names
        strlwr2enum.set('filename', QSPFieldOperator.resourceFileName);
        strlwr2enum.set('resource', QSPFieldOperator.resourceMime);
        strlwr2enum.set("intitle", QSPFieldOperator.title);
        strlwr2enum.set("_id", QSPFieldOperator.noteId);
        return strlwr2enum;
    }
    /*
    * Compares given string to operators ignoring case. Takes into account field name aliases.
    */
    static fromStrIgnoreCase(str) {
        return QSPFieldOperatorContext.strlwr2enum.get(str.toLowerCase());
    }
    static isDateOperator(operator) {
        return operator ? QSPFieldOperatorContext.DATE_OPERATORS.has(operator) : false;
    }
    static isCoordinateOperator(operator) {
        return operator ? QSPFieldOperatorContext.COORDINATE_OPERATORS.has(operator) : false;
    }
    static isMetadataOperator(operator) {
        return operator ? QSPFieldOperatorContext.METADATA_OPERATORS.has(operator) : false;
    }
}
exports.QSPFieldOperatorContext = QSPFieldOperatorContext;
QSPFieldOperatorContext.DATE_OPERATORS = new Set([QSPFieldOperator.created, QSPFieldOperator.updated, QSPFieldOperator.deleted,
    QSPFieldOperator.subjectDate, QSPFieldOperator.shareDate,
    QSPFieldOperator.reminderTime, QSPFieldOperator.reminderDoneTime]);
QSPFieldOperatorContext.COORDINATE_OPERATORS = new Set([QSPFieldOperator.latitude, QSPFieldOperator.longitude, QSPFieldOperator.altitude]);
// Operators that correspond to index fields that perform text tokenization.
// All other fields are considered keyword fields. Values in such fields are stored as is.
QSPFieldOperatorContext.TOKENIZATION_REQUIRED_OPERATORS = new Set([QSPFieldOperator.title, QSPFieldOperator.noteText, QSPFieldOperator.resourceText,
    QSPFieldOperator.resourceRecoTopText, QSPFieldOperator.resourceRecoOtherText, QSPFieldOperator.resourceFileName]);
// private str: string;
// constructor(str: string) {
//     this.str = str;
// }
// public toString(): string {
//     return this.str;
// }
QSPFieldOperatorContext.strlwr2enum = QSPFieldOperatorContext.initializeStrlwr2enum();
QSPFieldOperatorContext.ALL = QSPFieldOperatorContext.initializeAllSet();
// List of note fields that are synced in Conduit by default.
// TODO replace keyword analyzer for the (notebook, stack, tag, space) fields and restore the fields 
QSPFieldOperatorContext.METADATA_OPERATORS = new Set([
    // QSPFieldOperator.notebook, 
    QSPFieldOperator.nbGuid,
    // QSPFieldOperator.stack, 
    // QSPFieldOperator.tag,
    QSPFieldOperator.tagGuid,
    // QSPFieldOperator.space,
    QSPFieldOperator.spaceGuid,
    QSPFieldOperator.resourceMime,
    QSPFieldOperator.resourceFileName,
    QSPFieldOperator.created,
    QSPFieldOperator.updated,
    QSPFieldOperator.title,
    QSPFieldOperator.author,
    QSPFieldOperator.creatorId,
    QSPFieldOperator.lastEditorId,
]);
//# sourceMappingURL=FieldOperator.js.map