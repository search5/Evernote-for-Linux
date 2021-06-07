"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceLevelV2SummarySchema = exports.ThriftServiceLevelV2Schema = exports.ThriftServiceLevelV2 = exports.ServiceLevelV2Schema = exports.ServiceLevelV2 = exports.DeprecatedServiceLevelSchema = exports.DeprecatedServiceLevel = exports.AdjustedServiceLevelV2Schema = exports.AdjustedServiceLevelV2 = void 0;
const en_ts_utils_1 = require("en-ts-utils");
var AdjustedServiceLevelV2;
(function (AdjustedServiceLevelV2) {
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["FREE"] = 1] = "FREE";
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["PLUS"] = 16] = "PLUS";
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["PREMIUM"] = 256] = "PREMIUM";
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["PERSONAL"] = 4096] = "PERSONAL";
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["PROFESSIONAL"] = 65536] = "PROFESSIONAL";
    AdjustedServiceLevelV2[AdjustedServiceLevelV2["TEAMS"] = 1048576] = "TEAMS";
})(AdjustedServiceLevelV2 = exports.AdjustedServiceLevelV2 || (exports.AdjustedServiceLevelV2 = {}));
exports.AdjustedServiceLevelV2Schema = en_ts_utils_1.EnumWithKeys(AdjustedServiceLevelV2, 'AdjustedServiceLevelV2');
var DeprecatedServiceLevel;
(function (DeprecatedServiceLevel) {
    DeprecatedServiceLevel["BASIC"] = "BASIC";
    DeprecatedServiceLevel["BUSINESS"] = "BUSINESS";
})(DeprecatedServiceLevel = exports.DeprecatedServiceLevel || (exports.DeprecatedServiceLevel = {}));
exports.DeprecatedServiceLevelSchema = en_ts_utils_1.Enum(DeprecatedServiceLevel, 'DeprecatedServiceLevel');
var ServiceLevelV2;
(function (ServiceLevelV2) {
    ServiceLevelV2["FREE"] = "FREE";
    ServiceLevelV2["PLUS"] = "PLUS";
    ServiceLevelV2["PREMIUM"] = "PREMIUM";
    ServiceLevelV2["PERSONAL"] = "PERSONAL";
    ServiceLevelV2["PROFESSIONAL"] = "PROFESSIONAL";
    ServiceLevelV2["TEAMS"] = "TEAMS";
})(ServiceLevelV2 = exports.ServiceLevelV2 || (exports.ServiceLevelV2 = {}));
exports.ServiceLevelV2Schema = en_ts_utils_1.Enum(ServiceLevelV2, 'ServiceLevelV2');
var ThriftServiceLevelV2;
(function (ThriftServiceLevelV2) {
    ThriftServiceLevelV2[ThriftServiceLevelV2["FREE"] = 10] = "FREE";
    ThriftServiceLevelV2[ThriftServiceLevelV2["PLUS"] = 2] = "PLUS";
    ThriftServiceLevelV2[ThriftServiceLevelV2["PREMIUM"] = 3] = "PREMIUM";
    ThriftServiceLevelV2[ThriftServiceLevelV2["PERSONAL"] = 20] = "PERSONAL";
    ThriftServiceLevelV2[ThriftServiceLevelV2["PROFESSIONAL"] = 30] = "PROFESSIONAL";
    ThriftServiceLevelV2[ThriftServiceLevelV2["TEAMS"] = 40] = "TEAMS";
})(ThriftServiceLevelV2 = exports.ThriftServiceLevelV2 || (exports.ThriftServiceLevelV2 = {}));
exports.ThriftServiceLevelV2Schema = en_ts_utils_1.EnumWithKeys(ThriftServiceLevelV2, 'ThriftServiceLevelV2');
exports.ServiceLevelV2SummarySchema = en_ts_utils_1.Struct({
    serviceLevel: exports.ServiceLevelV2Schema,
    adjustedServiceLevel: exports.AdjustedServiceLevelV2Schema,
    thriftServiceLevel: exports.ThriftServiceLevelV2Schema,
});
//# sourceMappingURL=ServiceLevel.js.map