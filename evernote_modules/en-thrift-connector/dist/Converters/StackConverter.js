"use strict";
/*
 * Copyright 2018 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackConverter = void 0;
const conduit_core_1 = require("conduit-core");
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
class StackConverterClass {
    constructor() {
        this.nodeType = en_data_model_1.CoreEntityTypes.Stack;
    }
    convertGuidFromService(stackName) {
        return ('Stack:' + stackName);
    }
    convertGuidToService(stackID) {
        return stackID.slice('Stack:'.length);
    }
    async convertFromService(trc, params, serviceData) {
        // nothing to do. Edge from stack to notebook is added in notebook converter.
        return false;
    }
    async createOnService(trc, params, syncContext, data) {
        // noop for Thrift but need to add node to database
        const stack = {
            id: data.id,
            type: en_data_model_1.CoreEntityTypes.Stack,
            version: 0,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: data.label,
            NodeFields: {},
            inputs: {},
            outputs: {
                notebooks: {},
                shortcut: {},
            },
        };
        await params.graphTransaction.replaceNodeAndEdges(trc, conduit_core_1.PERSONAL_USER_CONTEXT, stack);
        return true;
    }
    async deleteFromService() {
        // handled by NotebookConverter for upsync
        return true;
    }
    async updateToService() {
        throw new Error('Stacks are immutable');
    }
    async applyEdgeChangesToService() {
        // handled by NotebookConverter
        return true;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Stack)
], StackConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Stack)
], StackConverterClass.prototype, "deleteFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.Stack)
], StackConverterClass.prototype, "updateToService", null);
exports.StackConverter = new StackConverterClass();
//# sourceMappingURL=StackConverter.js.map