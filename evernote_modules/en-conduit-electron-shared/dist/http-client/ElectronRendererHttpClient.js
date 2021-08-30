"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 *
 * FIXME This duplicates en-conduit-web-shared's http-client. In order for this code to be
 * successfully shared it would have to be moved somewhere into `workspaces/shared`,
 * probably to a new package.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronRendererHttpClient = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
class ElectronRendererHttpClient extends conduit_view_types_1.HttpTransport {
    constructor(customHeaders = {}) {
        super();
        this.customHeaders = customHeaders;
    }
    async requestImpl(trc, params) {
        const resp = await fetch(this.buildUrl(params), this.transformParams(params));
        const result = await resp.text();
        const headers = {};
        resp.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return {
            result,
            headers,
            status: resp.status,
            statusText: resp.statusText,
        };
    }
    transformParams(params) {
        return {
            method: params.method,
            headers: Object.assign(Object.assign({}, this.customHeaders), params.headers),
            body: params.body,
        };
    }
    buildUrl({ url, path }) {
        return `${url}${path ? path : ''}`;
    }
}
__decorate([
    conduit_utils_1.traceAsync('HttpClient')
], ElectronRendererHttpClient.prototype, "requestImpl", null);
exports.ElectronRendererHttpClient = ElectronRendererHttpClient;
//# sourceMappingURL=ElectronRendererHttpClient.js.map