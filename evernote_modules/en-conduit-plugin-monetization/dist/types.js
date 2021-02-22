"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientType = exports.PaywallState = void 0;
const graphql_1 = require("graphql");
exports.PaywallState = new graphql_1.GraphQLObjectType({
    name: 'PaywallState',
    fields: () => ({
        state: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    }),
});
exports.ClientType = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
    name: 'MonetizationClientType',
    values: {
        ION: { value: 1 },
        NEUTRON_IOS: { value: 2 },
        NEUTRON_ANDROID: { value: 3 },
        BORON_MAC: { value: 4 },
        BORON_WIN: { value: 5 },
    },
}));
//# sourceMappingURL=types.js.map