"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
/*
 * Copyright 2021 Evernote Corporation. All rights reserved.
 *  The purpose of this file is to provide calculations and mappings that can be reused through the organization
 *  for going from raw Monolith service levels, to Product Tiers (both before and after repackaging), and then adjust
 *  to new Product Tiers where available.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceLevelV2Summary = exports.ServiceLevelV2Summaries = void 0;
const en_ts_utils_1 = require("en-ts-utils");
const schema_types_1 = require("./schema-types");
exports.ServiceLevelV2Summaries = {
    free: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.FREE,
        serviceLevel: schema_types_1.ServiceLevelV2.FREE,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.FREE,
    },
    // Dead SKU, but we can't force users off of it.
    plus: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.PLUS,
        serviceLevel: schema_types_1.ServiceLevelV2.PLUS,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.PLUS,
    },
    // Dead SKU, but we can't force users off of it..  Only the highest paying SKUs get auto-migrated to PERSONAL
    premium: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.PREMIUM,
        serviceLevel: schema_types_1.ServiceLevelV2.PREMIUM,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.PREMIUM,
    },
    personal: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.PERSONAL,
        serviceLevel: schema_types_1.ServiceLevelV2.PERSONAL,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.PERSONAL,
    },
    professional: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.PROFESSIONAL,
        serviceLevel: schema_types_1.ServiceLevelV2.PROFESSIONAL,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.PROFESSIONAL,
    },
    teams: {
        thriftServiceLevel: schema_types_1.ThriftServiceLevelV2.TEAMS,
        serviceLevel: schema_types_1.ServiceLevelV2.TEAMS,
        adjustedServiceLevel: schema_types_1.AdjustedServiceLevelV2.TEAMS,
    }
};
const serviceLevelV2SummaryMap = (() => {
    const result = new Map();
    for (const summary of Object.values(exports.ServiceLevelV2Summaries)) {
        result.set(summary.adjustedServiceLevel, summary);
        result.set(summary.serviceLevel, summary);
        result.set(summary.thriftServiceLevel, summary);
    }
    // Deprecated String ServiceLevel Lookup Support
    result.set(schema_types_1.DeprecatedServiceLevel.BASIC, exports.ServiceLevelV2Summaries.free);
    result.set(schema_types_1.DeprecatedServiceLevel.BUSINESS, exports.ServiceLevelV2Summaries.teams);
    return result;
})();
/*
 *  A utility method for getting mapped information related to a ServiceLevelV2.
 *
 *  input: A ThriftServiceLevelV2, ServiceLevelV2, or AdjustedServiceLevelV2
 *      (can use Deprecated Conduit V1 ServiceLevel string values to get ServiceLevelV2 values for backwards compatibility where required)
 *
 *  returns:
 *      A ServiceLevelV2Summary for consumption by Conduit, Clients, and Microservices
 */
const getServiceLevelV2Summary = (input) => {
    const result = serviceLevelV2SummaryMap.get(input);
    if (!result) {
        throw new en_ts_utils_1.InvalidParameterError(`Cannot get a ServiceLevelV2Summary from: '${en_ts_utils_1.safeStringify(input)}'`);
    }
    return result;
};
exports.getServiceLevelV2Summary = getServiceLevelV2Summary;
//# sourceMappingURL=serviceLevelV2Schema.js.map