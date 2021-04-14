"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostResolver = void 0;
const conduit_utils_1 = require("conduit-utils");
const HOSTINFO_KEY = 'conduit-host-info';
class HostResolver {
    constructor(hostDefaults, updateUrl, httpProvider) {
        this.hostDefaults = hostDefaults;
        this.updateUrl = updateUrl;
        this.httpProvider = httpProvider;
        this.lastRetrieved = 0;
        this.inFlight = null;
        this.localSettings = null;
        this.etncHostInformation = {};
        this.cachedHostInfo = this.hostDefaults;
    }
    validateSchema(newSchema) {
        if (typeof newSchema.version !== 'number') {
            return false;
        }
        if (typeof newSchema.hostInformation !== 'object') {
            return false;
        }
        for (const host in newSchema.hostInformation) {
            for (const service in newSchema.hostInformation[host]) {
                if (typeof newSchema.hostInformation[host][service] !== 'string') {
                    return false;
                }
            }
        }
        return true;
    }
    async updateCachedHostInfo(trc, newInfo) {
        if (!this.validateSchema(newInfo)) {
            conduit_utils_1.logger.warn('Invalid host info schema');
            return;
        }
        if (newInfo.version <= this.cachedHostInfo.version) {
            return;
        }
        // For safety, we are going to keep all old fields that might be getting deleted. This is to
        // prevent any problems downloading the new host information causing us to be unable to upload
        for (const host in this.hostDefaults.hostInformation) {
            if (newInfo.hostInformation[host]) {
                newInfo.hostInformation[host] = Object.assign(Object.assign({}, this.hostDefaults.hostInformation[host]), newInfo.hostInformation[host]);
            }
        }
        this.cachedHostInfo = Object.assign(Object.assign({}, this.hostDefaults), newInfo);
        if (this.localSettings) {
            await this.localSettings.setConduitValue(trc, conduit_utils_1.NullUserID, HOSTINFO_KEY, conduit_utils_1.safeStringify(newInfo) || '');
        }
    }
    async attemptToCacheHostInfo(trc) {
        if (this.inFlight) {
            return this.inFlight;
        }
        if (!this.lastRetrieved && this.httpProvider && this.updateUrl) {
            this.inFlight = new Promise(async (resolve) => {
                try {
                    const result = await this.httpProvider().request(trc, {
                        method: 'GET',
                        url: `${this.updateUrl}?cachebust=${Date.now()}`,
                    });
                    if (result.status === 200) {
                        conduit_utils_1.logger.info('Found service hosts file');
                        conduit_utils_1.logger.info(result.result || '');
                        const resultStruct = JSON.parse(result.result || '');
                        await this.updateCachedHostInfo(trc, resultStruct);
                        this.lastRetrieved = Date.now();
                    }
                    else {
                        conduit_utils_1.logger.warn(`Unable to cache service hosts: ${result.status}: ${result.statusText}`);
                    }
                }
                catch (e) {
                    conduit_utils_1.logger.error('Unable to read host file', e);
                }
                finally {
                    this.inFlight = null;
                    resolve();
                }
            });
            await this.inFlight;
        }
    }
    async init(trc, localSettings, etncHostInformation) {
        this.localSettings = localSettings;
        if (etncHostInformation) {
            this.etncHostInformation = etncHostInformation;
        }
        // Try to read in last version saved to disk
        const current = conduit_utils_1.safeParse(await localSettings.getConduitValue(trc, conduit_utils_1.NullUserID, HOSTINFO_KEY));
        if (current && current.version > this.hostDefaults.version) {
            this.cachedHostInfo = current;
        }
        else if (!current || current.version < this.cachedHostInfo.version) {
            await this.updateCachedHostInfo(trc, this.cachedHostInfo);
        }
    }
    async getServiceHost(trc, authHost, service) {
        await this.attemptToCacheHostInfo(trc);
        return this.getServiceHostSkipCache(authHost, service);
    }
    getServiceHostSkipCache(authHost, service) {
        const hostInformation = this.cachedHostInfo.hostInformation[authHost] || this.etncHostInformation[authHost];
        if (!hostInformation) {
            conduit_utils_1.logger.warn(`Invalid auth host: ${authHost}`);
            return null;
        }
        return hostInformation[service];
    }
}
__decorate([
    conduit_utils_1.traceAsync('HostResolver')
], HostResolver.prototype, "init", null);
exports.HostResolver = HostResolver;
//# sourceMappingURL=HostResolver.js.map