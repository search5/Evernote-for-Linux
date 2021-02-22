"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTelemetryMutators = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
async function dimensionsResolver(_, args) {
    const { name, value } = args;
    await conduit_utils_1.setDimension(name, value);
    return { success: true };
}
async function eventsResolver(_, args) {
    const event = JSON.parse(args.propertiesJsonStr);
    const destinations = args.selectiveDestinations ? JSON.parse(args.selectiveDestinations) : null;
    conduit_utils_1.recordEvent(event, destinations);
    return { success: true };
}
async function metricsResolver(_, args) {
    const metric = JSON.parse(args.propertiesJsonStr);
    const destinations = args.selectiveDestinations ? JSON.parse(args.selectiveDestinations) : null;
    conduit_utils_1.recordMetric(metric, destinations);
    return { success: true };
}
async function exceptionsResolver(_, args) {
    const { message, fatal, callstack } = args;
    const exception = { message, fatal, callstack };
    await conduit_utils_1.recordException(exception);
    return { success: true };
}
async function flushResolver(_, args) {
    await conduit_utils_1.flushEvents();
    return { success: true };
}
function getTelemetryMutators() {
    const out = {};
    out.DimensionSet = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ name: 'string', value: 'string' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: dimensionsResolver,
    };
    out.EventsFlush = {
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: flushResolver,
    };
    out.EventsRecord = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ propertiesJsonStr: 'string', selectiveDestinations: 'string?' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: eventsResolver,
    };
    out.MetricsRecord = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ propertiesJsonStr: 'string', selectiveDestinations: 'string?' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: metricsResolver,
    };
    out.ExceptionRecord = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({
            message: 'string',
            fatal: 'boolean?',
            callstack: 'string?',
        }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: exceptionsResolver,
    };
    return out;
}
exports.getTelemetryMutators = getTelemetryMutators;
//# sourceMappingURL=TelemetryMutations.js.map