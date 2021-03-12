"use strict";
/*
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionConverter = void 0;
const conduit_utils_1 = require("conduit-utils");
const en_core_entity_types_1 = require("en-core-entity-types");
const Converters_1 = require("./Converters");
const Helpers_1 = require("./Helpers");
class PromotionConverterClass {
    constructor() {
        this.nodeType = en_core_entity_types_1.CoreEntityTypes.Promotion;
    }
    convertGuidFromService(guid) {
        return ('Promotion:' + guid);
    }
    convertGuidToService(guid) {
        return guid.slice('Promotion:'.length);
    }
    async convertFromService(trc, params, syncContext, serviceData) {
        const search = {
            id: Converters_1.convertGuidFromService(serviceData.promotionId, en_core_entity_types_1.CoreEntityTypes.Promotion),
            type: en_core_entity_types_1.CoreEntityTypes.Promotion,
            version: 1,
            syncContexts: [],
            localChangeTimestamp: 0,
            label: serviceData.promotionId || '',
            NodeFields: {
                optedOut: serviceData.optedOut || false,
                shownCount: serviceData.shownCount || 0,
                timeLastShown: serviceData.timeLastShown || 0,
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
    async updateToService(trc, params, syncContext, promotionID, diff) {
        const auth = await Helpers_1.getAuthForSyncContext(trc, params.graphTransaction, params.authCache, syncContext);
        const promotionId = Converters_1.convertGuidToService(promotionID, en_core_entity_types_1.CoreEntityTypes.Promotion);
        const utilityStore = params.thriftComm.getUtilityStore(auth.urls.utilityUrl);
        const currPromotion = await params.graphTransaction.getNode(trc, null, { id: promotionID, type: en_core_entity_types_1.CoreEntityTypes.Promotion });
        let changed = false;
        if (diff.NodeFields && diff.NodeFields.optedOut && (!currPromotion || !currPromotion.NodeFields.optedOut)) {
            await utilityStore.promotionOptedOut(trc, auth.token, promotionId);
            changed = true;
        }
        if (diff.NodeFields && diff.NodeFields.timeLastShown && (!currPromotion || currPromotion.NodeFields.timeLastShown !== diff.NodeFields.timeLastShown)) {
            await utilityStore.promotionsShown(trc, auth.token, [promotionId]);
            changed = true;
        }
        if (changed) {
            // sync cycle is very infrequent for promotions, so go fetch the authoritative data immediately
            const promotions = await utilityStore.getPromotionStatus(trc, auth.token, [Converters_1.convertGuidToService(promotionID, en_core_entity_types_1.CoreEntityTypes.Promotion)]);
            await this.convertFromService(trc, params, syncContext, promotions[0]);
        }
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
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Promotion)
], PromotionConverterClass.prototype, "convertFromService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Promotion)
], PromotionConverterClass.prototype, "createOnService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Promotion)
], PromotionConverterClass.prototype, "updateToService", null);
__decorate([
    conduit_utils_1.traceAsync(en_core_entity_types_1.CoreEntityTypes.Promotion)
], PromotionConverterClass.prototype, "deleteFromService", null);
exports.PromotionConverter = new PromotionConverterClass();
//# sourceMappingURL=PromotionConverter.js.map