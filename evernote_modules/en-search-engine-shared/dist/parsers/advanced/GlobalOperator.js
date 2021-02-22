"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var QSPGeoType;
(function (QSPGeoType) {
    QSPGeoType[QSPGeoType["GeoDistance"] = 0] = "GeoDistance";
    QSPGeoType[QSPGeoType["GeoBoundingBox"] = 1] = "GeoBoundingBox";
})(QSPGeoType = exports.QSPGeoType || (exports.QSPGeoType = {}));
/**
 * Search operator (or a group of operators) that apply to query as a whole and cannot be part of query string.
 * See FieldOperator for a list of normal query operators.
 */
class QSPGlobalOperator {
    constructor(type) {
        this.type = type;
    }
}
exports.QSPGlobalOperator = QSPGlobalOperator;
class QSPGeoBoundingBox extends QSPGlobalOperator {
    constructor() {
        super(QSPGeoType.GeoBoundingBox);
        this.shouldExist = true; // queries like "-latitude:*" are interpreted as "note should not have altitude field at all"
        this.top = 90.00;
        this.left = -180.00;
        this.bottom = -90.00;
        this.right = 180.00;
    }
    static fromPoints(top, left, bottom, right) {
        const box = new QSPGeoBoundingBox();
        box.top = top;
        box.left = left;
        box.bottom = bottom;
        box.right = right;
        return box;
    }
}
exports.QSPGeoBoundingBox = QSPGeoBoundingBox;
class QSPGeoDistance extends QSPGlobalOperator {
    constructor(latitude, longitude, distance) {
        super(QSPGeoType.GeoDistance);
        this.latitude = latitude;
        this.longitude = longitude;
        this.distance = distance;
    }
}
exports.QSPGeoDistance = QSPGeoDistance;
//# sourceMappingURL=GlobalOperator.js.map