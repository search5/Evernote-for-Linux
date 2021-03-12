"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockQueryPlugin = void 0;
const conduit_core_1 = require("conduit-core");
const TEST_QUERY = `
query($n: Int!) {
  multiplyByTwo(n: $n) {
    result
  }
}
`;
function getMockQueryPlugin() {
    async function resolveMultiplyByTwo(_, args, context) {
        var _a, _b;
        const resultOrError = await context.makeQueryRequest({ query: TEST_QUERY, args }, context);
        if ((_b = (_a = resultOrError.result) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.multiplyByTwo) {
            return resultOrError.result.data.multiplyByTwo;
        }
        else {
            throw resultOrError.error || 'No Results';
        }
    }
    return {
        name: 'mockQueryPlugin',
        defineQueries: () => ({
            multiplyByTwo: {
                args: conduit_core_1.schemaToGraphQLArgs({
                    n: 'int',
                }),
                type: conduit_core_1.schemaToGraphQLType({ result: 'int' }, 'multiplyByTwoResult', false),
                resolve: resolveMultiplyByTwo,
            },
        }),
    };
}
exports.getMockQueryPlugin = getMockQueryPlugin;
//# sourceMappingURL=MockQueryPlugin.js.map