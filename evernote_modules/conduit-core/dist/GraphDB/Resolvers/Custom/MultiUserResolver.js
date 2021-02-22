"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQueries = void 0;
const conduit_utils_1 = require("conduit-utils");
const graphql_1 = require("graphql");
const DataSchemaGQL_1 = require("../../../Types/DataSchemaGQL");
async function getCurrentUserIDResolver(parent, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    const userID = await context.multiUserProvider.getCurrentUserID(context.trc, context.watcher);
    if (!userID) {
        return null;
    }
    return conduit_utils_1.keyStringForUserID(userID);
}
async function userInfoListResolver(parent, args, context) {
    if (!context) {
        throw new Error('Missing graphql context');
    }
    const users = await context.multiUserProvider.getUsers(context.trc, context.watcher);
    const userInfoList = [];
    for (const userID in users) {
        let photoUrl = users[userID].photoUrl;
        if (context.urlEncoder) {
            photoUrl = context.urlEncoder('UPP', null, users[userID].photoUrl, userID);
        }
        userInfoList.push({
            userID,
            username: users[userID].username,
            email: users[userID].email,
            fullName: users[userID].fullName,
            businessName: users[userID].businessName,
            photoUrl,
        });
    }
    return userInfoList;
}
function addQueries(out) {
    const userInfoType = DataSchemaGQL_1.schemaToGraphQLType({
        userID: 'ID',
        username: 'string',
        email: 'string',
        fullName: 'string',
        businessName: 'string',
        photoUrl: 'string',
    }, 'UserInfo', false);
    out.currentUserID = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: DataSchemaGQL_1.schemaToGraphQLType('string?', 'CurrentUserIDSchema', true),
        resolve: getCurrentUserIDResolver,
    };
    out.userInfoList = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(userInfoType)),
        resolve: userInfoListResolver,
    };
}
exports.addQueries = addQueries;
//# sourceMappingURL=MultiUserResolver.js.map