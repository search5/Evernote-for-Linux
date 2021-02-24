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
exports.BetaFeatureConverter = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_data_model_1 = require("en-data-model");
const Converters_1 = require("./Converters");
class BetaFeatureConverterClass {
    constructor() {
        this.nodeType = en_data_model_1.CoreEntityTypes.BetaFeature;
    }
    convertGuidFromService(guid) {
        return ('BetaFeature:' + guid);
    }
    convertGuidToService(guid) {
        return guid.slice('BetaFeature:'.length);
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        const betaFeatureKey = (typeof serviceData.featureKey === 'number' ? serviceData.featureKey : -1);
        const betaFeature = {
            id: Converters_1.convertGuidFromService(betaFeatureKey.toString(), en_data_model_1.CoreEntityTypes.BetaFeature),
            type: en_data_model_1.CoreEntityTypes.BetaFeature,
            version: 1,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: '',
            NodeFields: {
                betaFeatureKey,
                isAvailable: serviceData.isAvailable || false,
            },
            inputs: {},
            outputs: {},
        };
        const prevNode = await params.graphTransaction.replaceNodeAndEdges(trc, syncContext, betaFeature);
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
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.BetaFeature)
], BetaFeatureConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.BetaFeature)
], BetaFeatureConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.BetaFeature)
], BetaFeatureConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_data_model_1.CoreEntityTypes.BetaFeature)
], BetaFeatureConverterClass.prototype, "deleteFromService", null);
exports.BetaFeatureConverter = new BetaFeatureConverterClass();
//# sourceMappingURL=BetaFeatureConverter.js.map