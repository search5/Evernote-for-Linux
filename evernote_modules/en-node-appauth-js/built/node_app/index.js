"use strict";
/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Represents a Node application, that uses the AppAuthJS library.
var authorization_request_1 = require("../authorization_request");
var authorization_request_handler_1 = require("../authorization_request_handler");
var authorization_service_configuration_1 = require("../authorization_service_configuration");
var logger_1 = require("../logger");
var node_support_1 = require("../node_support");
var node_requestor_1 = require("../node_support/node_requestor");
var node_request_handler_1 = require("../node_support/node_request_handler");
var revoke_token_request_1 = require("../revoke_token_request");
var token_request_1 = require("../token_request");
var token_request_handler_1 = require("../token_request_handler");
var PORT = 32111;
/* the Node.js based HTTP client. */
var requestor = new node_requestor_1.NodeRequestor();
/* an example open id connect provider */
var openIdConnectUrl = 'https://accounts.google.com';
/* example client configuration */
var clientId = '511828570984-7nmej36h9j2tebiqmpqh835naet4vci4.apps.googleusercontent.com';
var redirectUri = "http://127.0.0.1:" + PORT;
var scope = 'openid';
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        this.notifier = new authorization_request_handler_1.AuthorizationNotifier();
        this.authorizationHandler = new node_request_handler_1.NodeBasedHandler(PORT);
        this.tokenHandler = new token_request_handler_1.BaseTokenRequestHandler(requestor);
        // set notifier to deliver responses
        this.authorizationHandler.setAuthorizationNotifier(this.notifier);
        // set a listener to listen for authorization responses
        // make refresh and access token requests.
        this.notifier.setAuthorizationListener(function (request, response, error) {
            logger_1.log('Authorization request complete ', request, response, error);
            if (response) {
                _this.makeRefreshTokenRequest(_this.configuration, request, response)
                    .then(function (result) { return _this.makeAccessTokenRequest(_this.configuration, result.refreshToken); })
                    .then(function () { return logger_1.log('All done.'); });
            }
        });
    }
    App.prototype.fetchServiceConfiguration = function () {
        return authorization_service_configuration_1.AuthorizationServiceConfiguration.fetchFromIssuer(openIdConnectUrl, requestor)
            .then(function (response) {
            logger_1.log('Fetched service configuration', response);
            return response;
        });
    };
    App.prototype.makeAuthorizationRequest = function (configuration) {
        // create a request
        var request = new authorization_request_1.AuthorizationRequest({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope,
            response_type: authorization_request_1.AuthorizationRequest.RESPONSE_TYPE_CODE,
            state: undefined,
            extras: { 'prompt': 'consent', 'access_type': 'offline' }
        }, new node_support_1.NodeCrypto());
        logger_1.log('Making authorization request ', configuration, request);
        this.authorizationHandler.performAuthorizationRequest(configuration, request);
    };
    App.prototype.makeRefreshTokenRequest = function (configuration, request, response) {
        var extras = undefined;
        if (request && request.internal) {
            extras = {};
            extras['code_verifier'] = request.internal['code_verifier'];
        }
        var tokenRequest = new token_request_1.TokenRequest({
            client_id: clientId,
            redirect_uri: redirectUri,
            grant_type: token_request_1.GRANT_TYPE_AUTHORIZATION_CODE,
            code: response.code,
            refresh_token: undefined,
            extras: extras
        });
        return this.tokenHandler.performTokenRequest(configuration, tokenRequest).then(function (response) {
            logger_1.log("Refresh Token is " + response.refreshToken);
            return response;
        });
    };
    App.prototype.makeAccessTokenRequest = function (configuration, refreshToken) {
        var request = new token_request_1.TokenRequest({
            client_id: clientId,
            redirect_uri: redirectUri,
            grant_type: token_request_1.GRANT_TYPE_REFRESH_TOKEN,
            code: undefined,
            refresh_token: refreshToken,
            extras: undefined
        });
        return this.tokenHandler.performTokenRequest(configuration, request).then(function (response) {
            logger_1.log("Access Token is " + response.accessToken + ", Id Token is " + response.idToken);
            return response;
        });
    };
    App.prototype.makeRevokeTokenRequest = function (configuration, refreshToken) {
        var request = new revoke_token_request_1.RevokeTokenRequest({ token: refreshToken });
        return this.tokenHandler.performRevokeTokenRequest(configuration, request).then(function (response) {
            logger_1.log('revoked refreshToken');
            return response;
        });
    };
    return App;
}());
exports.App = App;
logger_1.log('Application is ready.');
var app = new App();
app.fetchServiceConfiguration()
    .then(function (configuration) {
    app.configuration = configuration;
    app.makeAuthorizationRequest(configuration);
    // notifier makes token requests.
})
    .catch(function (error) {
    logger_1.log('Something bad happened ', error);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbm9kZV9hcHAvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7R0FZRzs7QUFFSCxrRUFBa0U7QUFFbEUsa0VBQWdFO0FBQ2hFLGtGQUFzRztBQUV0Ryw4RkFBMkY7QUFDM0Ysb0NBQWdDO0FBQ2hDLGdEQUE2QztBQUM3QyxpRUFBK0Q7QUFDL0QsNkVBQXdFO0FBQ3hFLGdFQUE2RDtBQUM3RCxrREFBeUc7QUFDekcsa0VBQXdGO0FBR3hGLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQztBQUVuQixvQ0FBb0M7QUFDcEMsSUFBTSxTQUFTLEdBQUcsSUFBSSw4QkFBYSxFQUFFLENBQUM7QUFFdEMseUNBQXlDO0FBQ3pDLElBQU0sZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUM7QUFFdkQsa0NBQWtDO0FBQ2xDLElBQU0sUUFBUSxHQUFHLDBFQUEwRSxDQUFDO0FBQzVGLElBQU0sV0FBVyxHQUFHLHNCQUFvQixJQUFNLENBQUM7QUFDL0MsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDO0FBRXZCO0lBUUU7UUFBQSxpQkFnQkM7UUFmQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUkscURBQXFCLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSx1Q0FBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksK0NBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0Qsb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEUsdURBQXVEO1FBQ3ZELDBDQUEwQztRQUMxQyxJQUFJLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLFVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLO1lBQzlELFlBQUcsQ0FB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MDE3IEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHRcbiAqIGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGVcbiAqIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyXG4gKiBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIFJlcHJlc2VudHMgYSBOb2RlIGFwcGxpY2F0aW9uLCB0aGF0IHVzZXMgdGhlIEFwcEF1dGhKUyBsaWJyYXJ5LlxuXG5pbXBvcnQgeyBBdXRob3JpemF0aW9uUmVxdWVzdCB9IGZyb20gJy4uL2F1dGhvcml6YXRpb25fcmVxdWVzdCc7XG5pbXBvcnQgeyBBdXRob3JpemF0aW9uTm90aWZpZXIsIEF1dGhvcml6YXRpb25SZXF1ZXN0SGFuZGxlciB9IGZyb20gJy4uL2F1dGhvcml6YXRpb25fcmVxdWVzdF9oYW5kbGVyJztcbmltcG9ydCB7IEF1dGhvcml6YXRpb25SZXNwb25zZSB9IGZyb20gJy4uL2F1dGhvcml6YXRpb25fcmVzcG9uc2UnO1xuaW1wb3J0IHsgQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vYXV0aG9yaXphdGlvbl9zZXJ2aWNlX2NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSAnLi4vbG9nZ2VyJztcbmltcG9ydCB7IE5vZGVDcnlwdG8gfSBmcm9tICcuLi9ub2RlX3N1cHBvcnQnO1xuaW1wb3J0IHsgTm9kZVJlcXVlc3RvciB9IGZyb20gJy4uL25vZGVfc3VwcG9ydC9ub2RlX3JlcXVlc3Rvcic7XG5pbXBvcnQgeyBOb2RlQmFzZWRIYW5kbGVyIH0gZnJvbSAnLi4vbm9kZV9zdXBwb3J0L25vZGVfcmVxdWVzdF9oYW5kbGVyJztcbmltcG9ydCB7IFJldm9rZVRva2VuUmVxdWVzdCB9IGZyb20gJy4uL3Jldm9rZV90b2tlbl9yZXF1ZXN0JztcbmltcG9ydCB7IEdSQU5UX1RZUEVfQVVUSE9SSVpBVElPTl9DT0RFLCBHUkFOVF9UWVBFX1JFRlJFU0hfVE9LRU4sIFRva2VuUmVxdWVzdCB9IGZyb20gJy4uL3Rva2VuX3JlcXVlc3QnO1xuaW1wb3J0IHsgQmFzZVRva2VuUmVxdWVzdEhhbmRsZXIsIFRva2VuUmVxdWVzdEhhbmRsZXIgfSBmcm9tICcuLi90b2tlbl9yZXF1ZXN0X2hhbmRsZXInO1xuaW1wb3J0IHsgU3RyaW5nTWFwIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jb25zdCBQT1JUID0gMzIxMTE7XG5cbi8qIHRoZSBOb2RlLmpzIGJhc2VkIEhUVFAgY2xpZW50LiAqL1xuY29uc3QgcmVxdWVzdG9yID0gbmV3IE5vZGVSZXF1ZXN0b3IoKTtcblxuLyogYW4gZXhhbXBsZSBvcGVuIGlkIGNvbm5lY3QgcHJvdmlkZXIgKi9cbmNvbnN0IG9wZW5JZENvbm5lY3RVcmwgPSAnaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tJztcblxuLyogZXhhbXBsZSBjbGllbnQgY29uZmlndXJhdGlvbiAqL1xuY29uc3QgY2xpZW50SWQgPSAnNTExODI4NTcwOTg0LTdubWVqMzZoOWoydGViaXFtcHFoODM1bmFldDR2Y2k0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tJztcbmNvbnN0IHJlZGlyZWN0VXJpID0gYGh0dHA6Ly8xMjcuMC4wLjE6JHtQT1JUfWA7XG5jb25zdCBzY29wZSA9ICdvcGVuaWQnO1xuXG5leHBvcnQgY2xhc3MgQXBwIHtcbiAgcHJpdmF0ZSBub3RpZmllcjogQXV0aG9yaXphdGlvbk5vdGlmaWVyO1xuICBwcml2YXRlIGF1dGhvcml6YXRpb25IYW5kbGVyOiBBdXRob3JpemF0aW9uUmVxdWVzdEhhbmRsZXI7XG4gIHByaXZhdGUgdG9rZW5IYW5kbGVyOiBUb2tlblJlcXVlc3RIYW5kbGVyO1xuXG4gIC8vIHN0YXRlXG4gIGNvbmZpZ3VyYXRpb246IEF1dGhvcml6YXRpb25TZXJ2aWNlQ29uZmlndXJhdGlvbnx1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5ub3RpZmllciA9IG5ldyBBdXRob3JpemF0aW9uTm90aWZpZXIoKTtcbiAgICB0aGlzLmF1dGhvcml6YXRpb25IYW5kbGVyID0gbmV3IE5vZGVCYXNlZEhhbmRsZXIoUE9SVCk7XG4gICAgdGhpcy50b2tlbkhhbmRsZXIgPSBuZXcgQmFzZVRva2VuUmVxdWVzdEhhbmRsZXIocmVxdWVzdG9yKTtcbiAgICAvLyBzZXQgbm90aWZpZXIgdG8gZGVsaXZlciByZXNwb25zZXNcbiAgICB0aGlzLmF1dGhvcml6YXRpb25IYW5kbGVyLnNldEF1dGhvcml6YXRpb25Ob3RpZmllcih0aGlzLm5vdGlmaWVyKTtcbiAgICAvLyBzZXQgYSBsaXN0ZW5lciB0byBsaXN0ZW4gZm9yIGF1dGhvcml6YXRpb24gcmVzcG9uc2VzXG4gICAgLy8gbWFrZSByZWZyZXNoIGFuZCBhY2Nlc3MgdG9rZW4gcmVxdWVzdHMuXG4gICAgdGhpcy5ub3RpZmllci5zZXRBdXRob3JpemF0aW9uTGlzdGVuZXIoKHJlcXVlc3QsIHJlc3BvbnNlLCBlcnJvcikgPT4ge1xuICAgICAgbG9nKCdBdXRob3JpemF0aW9uIHJlcXVlc3QgY29tcGxldGUgJywgcmVxdWVzdCwgcmVzcG9uc2UsIGVycm9yKTtcbiAgICAgIGlmIChyZXNwb25zZSkge1xuICAgICAgICB0aGlzLm1ha2VSZWZyZXNoVG9rZW5SZXF1ZXN0KHRoaXMuY29uZmlndXJhdGlvbiEsIHJlcXVlc3QsIHJlc3BvbnNlKVxuICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHRoaXMubWFrZUFjY2Vzc1Rva2VuUmVxdWVzdCh0aGlzLmNvbmZpZ3VyYXRpb24hLCByZXN1bHQucmVmcmVzaFRva2VuISkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBsb2coJ0FsbCBkb25lLicpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZldGNoU2VydmljZUNvbmZpZ3VyYXRpb24oKTogUHJvbWlzZTxBdXRob3JpemF0aW9uU2VydmljZUNvbmZpZ3VyYXRpb24+IHtcbiAgICByZXR1cm4gQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9uLmZldGNoRnJvbUlzc3VlcihvcGVuSWRDb25uZWN0VXJsLCByZXF1ZXN0b3IpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBsb2coJ0ZldGNoZWQgc2VydmljZSBjb25maWd1cmF0aW9uJywgcmVzcG9uc2UpO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBtYWtlQXV0aG9yaXphdGlvblJlcXVlc3QoY29uZmlndXJhdGlvbjogQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9uKSB7XG4gICAgLy8gY3JlYXRlIGEgcmVxdWVzdFxuICAgIGxldCByZXF1ZXN0ID0gbmV3IEF1dGhvcml6YXRpb25SZXF1ZXN0KHtcbiAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXG4gICAgICByZWRpcmVjdF91cmk6IHJlZGlyZWN0VXJpLFxuICAgICAgc2NvcGU6IHNjb3BlLFxuICAgICAgcmVzcG9uc2VfdHlwZTogQXV0aG9yaXphdGlvblJlcXVlc3QuUkVTUE9OU0VfVFlQRV9DT0RFLFxuICAgICAgc3RhdGU6IHVuZGVmaW5lZCxcbiAgICAgIGV4dHJhczogeydwcm9tcHQnOiAnY29uc2VudCcsICdhY2Nlc3NfdHlwZSc6ICdvZmZsaW5lJ31cbiAgICB9LCBuZXcgTm9kZUNyeXB0bygpKTtcblxuICAgIGxvZygnTWFraW5nIGF1dGhvcml6YXRpb24gcmVxdWVzdCAnLCBjb25maWd1cmF0aW9uLCByZXF1ZXN0KTtcbiAgICB0aGlzLmF1dGhvcml6YXRpb25IYW5kbGVyLnBlcmZvcm1BdXRob3JpemF0aW9uUmVxdWVzdChjb25maWd1cmF0aW9uLCByZXF1ZXN0KTtcbiAgfVxuXG4gIG1ha2VSZWZyZXNoVG9rZW5SZXF1ZXN0KFxuICAgICAgY29uZmlndXJhdGlvbjogQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9uLFxuICAgICAgcmVxdWVzdDogQXV0aG9yaXphdGlvblJlcXVlc3QsXG4gICAgICByZXNwb25zZTogQXV0aG9yaXphdGlvblJlc3BvbnNlKSB7XG4gICAgXG4gICAgbGV0IGV4dHJhczogU3RyaW5nTWFwfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAocmVxdWVzdCAmJiByZXF1ZXN0LmludGVybmFsKSB7XG4gICAgICBleHRyYXMgPSB7fTtcbiAgICAgIGV4dHJhc1snY29kZV92ZXJpZmllciddID0gcmVxdWVzdC5pbnRlcm5hbFsnY29kZV92ZXJpZmllciddO1xuICAgIH1cblxuICAgIGxldCB0b2tlblJlcXVlc3QgPSBuZXcgVG9rZW5SZXF1ZXN0KHtcbiAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXG4gICAgICByZWRpcmVjdF91cmk6IHJlZGlyZWN0VXJpLFxuICAgICAgZ3JhbnRfdHlwZTogR1JBTlRfVFlQRV9BVVRIT1JJWkFUSU9OX0NPREUsXG4gICAgICBjb2RlOiByZXNwb25zZS5jb2RlLFxuICAgICAgcmVmcmVzaF90b2tlbjogdW5kZWZpbmVkLFxuICAgICAgZXh0cmFzOiBleHRyYXNcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnRva2VuSGFuZGxlci5wZXJmb3JtVG9rZW5SZXF1ZXN0KGNvbmZpZ3VyYXRpb24sIHRva2VuUmVxdWVzdCkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICBsb2coYFJlZnJlc2ggVG9rZW4gaXMgJHtyZXNwb25zZS5yZWZyZXNoVG9rZW59YCk7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSk7XG4gIH1cblxuICBtYWtlQWNjZXNzVG9rZW5SZXF1ZXN0KGNvbmZpZ3VyYXRpb246IEF1dGhvcml6YXRpb25TZXJ2aWNlQ29uZmlndXJhdGlvbiwgcmVmcmVzaFRva2VuOiBzdHJpbmcpIHtcbiAgICBsZXQgcmVxdWVzdCA9IG5ldyBUb2tlblJlcXVlc3Qoe1xuICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcbiAgICAgIHJlZGlyZWN0X3VyaTogcmVkaXJlY3RVcmksXG4gICAgICBncmFudF90eXBlOiBHUkFOVF9UWVBFX1JFRlJFU0hfVE9LRU4sXG4gICAgICBjb2RlOiB1bmRlZmluZWQsXG4gICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoVG9rZW4sXG4gICAgICBleHRyYXM6IHVuZGVmaW5lZFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMudG9rZW5IYW5kbGVyLnBlcmZvcm1Ub2tlblJlcXVlc3QoY29uZmlndXJhdGlvbiwgcmVxdWVzdCkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICBsb2coYEFjY2VzcyBUb2tlbiBpcyAke3Jlc3BvbnNlLmFjY2Vzc1Rva2VufSwgSWQgVG9rZW4gaXMgJHtyZXNwb25zZS5pZFRva2VufWApO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0pO1xuICB9XG5cbiAgbWFrZVJldm9rZVRva2VuUmVxdWVzdChjb25maWd1cmF0aW9uOiBBdXRob3JpemF0aW9uU2VydmljZUNvbmZpZ3VyYXRpb24sIHJlZnJlc2hUb2tlbjogc3RyaW5nKSB7XG4gICAgbGV0IHJlcXVlc3QgPSBuZXcgUmV2b2tlVG9rZW5SZXF1ZXN0KHt0b2tlbjogcmVmcmVzaFRva2VufSk7XG5cbiAgICByZXR1cm4gdGhpcy50b2tlbkhhbmRsZXIucGVyZm9ybVJldm9rZVRva2VuUmVxdWVzdChjb25maWd1cmF0aW9uLCByZXF1ZXN0KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgIGxvZygncmV2b2tlZCByZWZyZXNoVG9rZW4nKTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9KTtcbiAgfVxufVxuXG5sb2coJ0FwcGxpY2F0aW9uIGlzIHJlYWR5LicpO1xuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG5hcHAuZmV0Y2hTZXJ2aWNlQ29uZmlndXJhdGlvbigpXG4gICAgLnRoZW4oY29uZmlndXJhdGlvbiA9PiB7XG4gICAgICBhcHAuY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gICAgICBhcHAubWFrZUF1dGhvcml6YXRpb25SZXF1ZXN0KGNvbmZpZ3VyYXRpb24pO1xuICAgICAgLy8gbm90aWZpZXIgbWFrZXMgdG9rZW4gcmVxdWVzdHMuXG4gICAgfSlcbiAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgbG9nKCdTb21ldGhpbmcgYmFkIGhhcHBlbmVkICcsIGVycm9yKTtcbiAgICB9KTtcbiJdfQ==