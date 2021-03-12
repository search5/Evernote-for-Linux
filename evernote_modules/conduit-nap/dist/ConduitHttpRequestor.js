"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConduitHttpRequestor = void 0;
const conduit_utils_1 = require("conduit-utils");
const conduit_view_types_1 = require("conduit-view-types");
const en_node_appauth_js_1 = require("en-node-appauth-js");
const conduitHttpRequestorTrcPool = new conduit_utils_1.AsyncTracePool('ConduitHttpRequestor');
class ConduitHttpRequestor extends en_node_appauth_js_1.Requestor {
    constructor(httpTransport) {
        super();
        this.httpTransport = httpTransport;
    }
    async xhr(settings) {
        var _a, _b, _c, _d, _e;
        if (!settings.url) {
            throw new en_node_appauth_js_1.AppAuthError('A URL must be provided.');
        }
        const restMethod = (_b = (_a = settings.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== null && _b !== void 0 ? _b : 'GET';
        if (!conduit_view_types_1.isRestMethod(restMethod)) {
            throw new en_node_appauth_js_1.AppAuthError('Unknown REST Method');
        }
        const params = [];
        let body;
        if (settings.data) {
            if (settings.method && settings.method.toUpperCase() === 'POST') {
                body = settings.data;
            }
            else {
                const data = (_c = settings.data) !== null && _c !== void 0 ? _c : {};
                for (const key in data) {
                    params.push(`${key}=${encodeURIComponent(data[key])}`);
                }
            }
        }
        // Set the request headers
        const headers = {};
        if (settings.headers) {
            for (const i in settings.headers) {
                headers[i] = settings.headers[i];
            }
        }
        const isJsonDataType = settings.dataType && settings.dataType.toLowerCase() === 'json';
        // Set 'Accept' header value for json requests (Taken from
        // https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644
        // )
        if (isJsonDataType) {
            headers.Accept = 'application/json, text/javascript, */*; q=0.01';
        }
        const requestParams = {
            method: restMethod,
            headers,
            url: params.length ? settings.url.concat('?').concat(params.join('&')) : settings.url,
            body,
        };
        const trc = conduitHttpRequestorTrcPool.alloc();
        const resp = await conduitHttpRequestorTrcPool.releaseWhenSettled(trc, this.httpTransport.request(trc, requestParams));
        if (resp.status >= 200 && resp.status < 300) {
            return conduit_utils_1.safeParse(resp.result);
        }
        else {
            const errResp = (_d = conduit_utils_1.safeParse(resp.result)) !== null && _d !== void 0 ? _d : {};
            throw new en_node_appauth_js_1.AppAuthError(resp.status.toString(), (_e = errResp.error) !== null && _e !== void 0 ? _e : resp.statusText);
        }
    }
}
exports.ConduitHttpRequestor = ConduitHttpRequestor;
//# sourceMappingURL=ConduitHttpRequestor.js.map