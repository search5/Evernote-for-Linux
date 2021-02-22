"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphMutators = void 0;
const conduit_utils_1 = require("conduit-utils");
const DataSchemaGQL_1 = require("../../Types/DataSchemaGQL");
const ResolverHelpers_1 = require("../Resolvers/ResolverHelpers");
async function clearGraphResolver(_, args, context) {
    const res = { success: true };
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return res;
    }
    const currentUserID = await context.multiUserProvider.getCurrentUserID(context.trc, null);
    if (!currentUserID) {
        conduit_utils_1.logger.warn('Attempt to clear graph while there is no user graph');
        return res;
    }
    if (args.clearAuth) {
        await context.db.flushRemoteMutations();
    }
    await context.db.clear(context.trc, !args.clearAuth);
    if (args.clearAuth) {
        await context.multiUserProvider.clearAuth(context.trc, currentUserID);
        await context.multiUserProvider.setCurrentUser(context.trc, null, true);
    }
    return res;
}
async function forceDownsyncResolver(_, args, context) {
    const defaultResult = { success: true, mutationCount: 0 };
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return defaultResult;
    }
    if (!args.wait) {
        const p = context.db.forceDownsync(context.trc, Boolean(args.flushMutations));
        p.catch(err => {
            conduit_utils_1.logger.warn('forceDownsync mutation encountered an error', err);
        });
        return defaultResult;
    }
    let mutationCount = 0;
    let pending = 0;
    let optimisticCount = 0;
    let optimisticNames = [];
    let retryCount = 0;
    const retry = args.retry ? args.retry : 5;
    while (retryCount++ < retry) {
        try {
            const res = await context.db.forceDownsync(context.trc, Boolean(args.flushMutations));
            mutationCount += res.completed;
            pending = res.pending;
            optimisticCount = res.optimistic;
            optimisticNames = res.optimisticNames;
            if (!pending && (!args.waitForRoundtrip || !optimisticCount)) {
                break;
            }
        }
        catch (err) {
            if (!(err instanceof conduit_utils_1.RetryError)) {
                throw err;
            }
            pending = 1;
        }
        await conduit_utils_1.sleep(200);
    }
    if (pending) {
        throw new Error('Failed to flush remote mutations');
    }
    if (args.waitForRoundtrip && optimisticCount) {
        throw new Error(`Failed to wait for mutations to roundtrip: [${optimisticNames.join(', ')}]`);
    }
    if (mutationCount) {
        // if we ran remote mutations, run downsync again
        await context.db.forceDownsync(context.trc, false);
    }
    return { success: true, mutationCount, optimisticCount };
}
async function pauseDownsyncResolver(_, args, context) {
    const res = { success: true };
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return res;
    }
    await context.db.forceStopDownsync(context.trc);
    await context.db.forceStopUpsync();
    return res;
}
async function resumeDownsyncResolver(_, args, context) {
    const res = { success: true };
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return res;
    }
    await context.db.forceResumeDownsync(context.trc);
    await context.db.forceResumeUpsync();
    return res;
}
async function notesDownsyncResolver(_, args, context) {
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return { success: true, needsSync: false };
    }
    let needsSync = await context.db.needImmediateNotesDownsync(context.trc, args);
    if (needsSync) {
        const wait = args.wait || false;
        const p = context.db.immediateNotesDownsync(context.trc, args);
        if (wait) {
            needsSync = await p;
        }
        else {
            p.catch(err => conduit_utils_1.logger.error('ImmediateNotesDownsync error ', err));
        }
    }
    return { success: true, needsSync };
}
async function cancelNotesDownsyncResolver(_, args, context) {
    const res = { success: true };
    if (!context || !context.db) {
        conduit_utils_1.logger.debug('Missing graphql context or db');
        return res;
    }
    await context.db.cancelImmediateNotesDownsync(context.trc);
    return res;
}
function getGraphMutators() {
    const out = {};
    out.ClearGraph = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ clearAuth: 'boolean?' }),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: clearGraphResolver,
    };
    out.ForceDownsync = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({
            wait: 'boolean',
            flushMutations: 'boolean?',
            waitForRoundtrip: 'boolean?',
            retry: 'number?',
        }),
        type: DataSchemaGQL_1.schemaToGraphQLType({ success: 'boolean', mutationCount: 'number' }, 'ForceDownsyncResult', false),
        resolve: forceDownsyncResolver,
    };
    out.PauseSync = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: pauseDownsyncResolver,
    };
    out.StartSync = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: resumeDownsyncResolver,
    };
    out.ImmediateNotesDownsync = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({ wait: 'boolean?', maxNotes: 'int?', notesPerFetch: 'int?', maxTime: 'int?' }),
        type: DataSchemaGQL_1.schemaToGraphQLType({ success: 'boolean', needsSync: 'boolean' }, 'ImmediateNotesDownsyncResult', false),
        resolve: notesDownsyncResolver,
    };
    out.CancelImmediateNotesDownsync = {
        args: DataSchemaGQL_1.schemaToGraphQLArgs({}),
        type: ResolverHelpers_1.GenericMutationResult,
        resolve: cancelNotesDownsyncResolver,
    };
    return out;
}
exports.getGraphMutators = getGraphMutators;
//# sourceMappingURL=GraphMutations.js.map