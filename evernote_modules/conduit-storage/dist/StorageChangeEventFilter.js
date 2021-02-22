"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageChangeEventFilter = void 0;
const GraphStorageDB_1 = require("./GraphStorageDB");
const StorageEventEmitter_1 = require("./StorageEventEmitter");
/**
 * Helper class to abstract away the boilerplate for filtering storage change events based on
 * NodeType & StorageChangeType.  Parameters include:
 *   - supportedEventTypes
 *   - supportedNodeTypes
 *   - isValidCustomCheck, where the event, NodeType, EventType are supplied parameters
 */
class StorageChangeEventFilter {
    constructor(supportedEventTypes, supportedNodeTypes, isValidCustomCheck = () => true) {
        this.isValidCustomCheck = isValidCustomCheck;
        this.nodeTables = new Map();
        this.supportedStorageChangeTypeMask = supportedEventTypes.reduce((mask, eventType) => 
        // tslint:disable-next-line:no-bitwise
        mask | eventType, 0);
        this.supportedStreamingEventTypes = new Set(supportedNodeTypes);
        supportedNodeTypes.forEach(supportedType => this.nodeTables.set(GraphStorageDB_1.tableForNodeType(supportedType), supportedType));
    }
    isSupportedChangeType(eventType) {
        // tslint:disable-next-line:no-bitwise
        return (this.supportedStorageChangeTypeMask & eventType) !== 0;
    }
    /**
     * Returns whether or not the given event is supported.
     * @param event StorageChangeEvent
     */
    isSupportedNodeEvent(event) {
        const nodeType = this.nodeTypeFromEvent(event);
        if (nodeType &&
            this.supportedStreamingEventTypes.has(nodeType) &&
            this.isSupportedChangeType(event.type) &&
            this.isValidCustomCheck(event, event.type, nodeType)) {
            return true;
        }
        return false;
    }
    nodeTypeFromEvent(event) {
        const tableName = event.path[StorageEventEmitter_1.StorageChangePath.TableName];
        if (tableName && this.nodeTables.has(tableName)) {
            return this.nodeTables.get(tableName) || null;
        }
        else {
            return null;
        }
    }
}
exports.StorageChangeEventFilter = StorageChangeEventFilter;
//# sourceMappingURL=StorageChangeEventFilter.js.map