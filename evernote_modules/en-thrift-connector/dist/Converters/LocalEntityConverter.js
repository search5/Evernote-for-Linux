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
exports.LocalEntitiyConverterClass = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
class LocalEntitiyConverterClass {
    constructor(nodeType) {
        this.nodeType = nodeType;
    }
    convertGuidFromService(guid) {
        return guid;
    }
    convertGuidToService(guid) {
        return guid;
    }
    async convertFromService(trc, params, syncContext, serviceEntity) {
        throw new Error('Unable to convert local entitites from service');
    }
    async createOnService() {
        return false;
    }
    async deleteFromService(trc, params) {
        return false;
    }
    async customToService(trc, params, commandRun, syncContext) {
        throw new Error(`Unable to run customToService on local entitites ${this.nodeType} ${commandRun.command}`);
    }
    async updateToService(trc, params, syncContext, nodeID, diff) {
        return false;
    }
    async applyEdgeChangesToService() {
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], LocalEntitiyConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], LocalEntitiyConverterClass.prototype, "customToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Attachment)
], LocalEntitiyConverterClass.prototype, "updateToService", null);
exports.LocalEntitiyConverterClass = LocalEntitiyConverterClass;
//# sourceMappingURL=LocalEntityConverter.js.map