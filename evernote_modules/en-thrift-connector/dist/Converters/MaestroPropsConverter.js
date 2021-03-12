"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaestroPropsConverter = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
class MaestroPropsConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.MaestroProps;
    }
    convertGuidFromService(guid) {
        return ('MaestroProps:' + guid);
    }
    convertGuidToService(guid) {
        return guid.slice('MaestroProps:'.length);
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        const search = {
            id: en_core_entity_types_1.MAESTRO_PROPS_ID,
            type: en_core_entity_types_1.CoreEntityTypes.MaestroProps,
            version: 1,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: '',
            NodeFields: {
                jsonValue: serviceData.jsonResponse || '',
            },
            inputs: {},
            outputs: {},
        };
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, search);
        return !prevNode;
    }
    async createOnService() {
        return true;
    }
    async updateToService() {
        return true;
    }
    async deleteFromService() {
        return false;
    }
    async applyEdgeChangesToService() {
        return false;
    }
}
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.MaestroProps)
], MaestroPropsConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.MaestroProps)
], MaestroPropsConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.MaestroProps)
], MaestroPropsConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.MaestroProps)
], MaestroPropsConverterClass.prototype, "deleteFromService", null);
exports.MaestroPropsConverter = new MaestroPropsConverterClass();
//# sourceMappingURL=MaestroPropsConverter.js.map