"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAvailability = void 0;
const conduit_utils_1 = require("conduit-utils");
const DEFAULT_POLLING_TIME = 5 * conduit_utils_1.MILLIS_IN_ONE_MINUTE;
const JITTER_RATIO = 0.2;
const AVAILABILITY_URL = 'https://update.evernote.com/enclients/northstarServiceAvailability.json';
class ServiceAvailability {
    constructor(config) {
        this.currentTimeout = null;
        this.inFlight = null;
        this.isPolling = false;
        this.isAvailable = true; // default to true;
        this.currentPoll = null;
        this.httpProvider = config.httpProvider;
        this.onChange = config.onChange;
        this.serviceHost = config.host;
        this.pollingTime = config.time || DEFAULT_POLLING_TIME;
        this.updateUrl = config.url || AVAILABILITY_URL;
        this.saveLastAvailability = config.saveLastAvailability;
        this.getLastAvailability = config.getLastAvailability;
    }
    destructor() {
        this.stopPolling();
        this.inFlight = null;
        this.currentPoll = null;
    }
    async getAvailabilityData(trc) {
        if (this.inFlight) {
            return this.inFlight;
        }
        if (!this.httpProvider) {
            conduit_utils_1.logger.warn('Missing HTTP Provider in ServiceAvailability');
            return null;
        }
        this.inFlight = new Promise(async (resolve, reject) => {
            const result = await this.httpProvider().request(trc, {
                method: 'GET',
                url: this.updateUrl,
            });
            this.inFlight = null;
            if (result.status === 200) {
                conduit_utils_1.logger.debug('Found service availability file');
                conduit_utils_1.logger.debug(result.result || '');
            }
            else {
                conduit_utils_1.logger.warn(`Unable to find service availability file: ${result.status}: ${result.statusText}`);
            }
            resolve(result);
        });
        return this.inFlight;
    }
    async runOnChange(trc, isNowAvailable) {
        if (isNowAvailable !== this.isAvailable) {
            if (!isNowAvailable) {
                conduit_utils_1.logger.warn('Northstar Service is not available!');
            }
            this.isAvailable = isNowAvailable;
            await this.saveLastAvailability(trc, this.isAvailable);
            this.onChange && await this.onChange(trc, isNowAvailable);
        }
    }
    async update(trc) {
        let data;
        let isNowAvailable = true;
        try {
            data = await this.getAvailabilityData(trc);
        }
        catch (err) {
            conduit_utils_1.logger.error(err);
            data = null;
        }
        if (!data) {
            conduit_utils_1.logger.warn('Could not fetch service availability file');
            const lastAvailability = await this.getLastAvailability(trc);
            if (lastAvailability !== undefined) {
                isNowAvailable = lastAvailability;
            }
            await this.runOnChange(trc, isNowAvailable);
            return;
        }
        const hostAvailability = conduit_utils_1.safeParse(data.result);
        if (!hostAvailability || typeof (hostAvailability) !== 'object') {
            conduit_utils_1.logger.warn('Unexpected error parsing Service Availability File: ', hostAvailability);
            await this.runOnChange(trc, isNowAvailable);
            return;
        }
        if (!hostAvailability.hasOwnProperty('serviceHosts')) {
            conduit_utils_1.logger.warn('serviceHosts section missing from service availability');
            await this.runOnChange(trc, isNowAvailable);
            return;
        }
        const serviceHosts = hostAvailability.serviceHosts;
        if (!serviceHosts.hasOwnProperty(this.serviceHost)) {
            conduit_utils_1.logger.info('Host missing from service availability');
            await this.runOnChange(trc, isNowAvailable);
            return;
        }
        if (!serviceHosts[this.serviceHost].hasOwnProperty('available')) {
            conduit_utils_1.logger.warn('File has wrong service availability format');
            await this.runOnChange(trc, isNowAvailable);
            return;
        }
        isNowAvailable = Boolean(serviceHosts[this.serviceHost].available);
        await this.runOnChange(trc, isNowAvailable);
    }
    startPolling(trc) {
        if (this.currentTimeout) {
            return;
        }
        this.isPolling = true;
        // save this value on start (onChange won't save it)
        this.saveLastAvailability(trc, this.isAvailable).catch(err => {
            conduit_utils_1.logger.error('Error saving last service availability: ', err);
        });
        this.poll(trc);
    }
    stopPolling() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        this.isPolling = false;
    }
    poll(trc) {
        this.currentPoll = new Promise(async (resolve, reject) => {
            try {
                await this.update(trc);
            }
            catch (err) {
                conduit_utils_1.logger.error(err);
                this.currentPoll = null;
                reject(err);
            }
            if (this.isPolling) {
                this.currentTimeout = setTimeout(() => {
                    this.poll(trc);
                }, this.pollingTime * (1 + JITTER_RATIO * 2 * (Math.random() - 0.5)));
            }
            this.currentPoll = null;
            resolve(this.isAvailable);
        });
    }
    isServiceAvailable() {
        return this.isAvailable;
    }
    async isServiceAvailableWaitForCurrentPoll() {
        if (this.currentPoll) {
            return await this.currentPoll;
        }
        return this.isServiceAvailable();
    }
}
exports.ServiceAvailability = ServiceAvailability;
//# sourceMappingURL=ServiceAvailability.js.map