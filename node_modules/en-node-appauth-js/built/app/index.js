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
// Represents the test web app that uses the AppAuthJS library.
var authorization_request_1 = require("../authorization_request");
var authorization_request_handler_1 = require("../authorization_request_handler");
var authorization_service_configuration_1 = require("../authorization_service_configuration");
var logger_1 = require("../logger");
var redirect_based_handler_1 = require("../redirect_based_handler");
var token_request_1 = require("../token_request");
var token_request_handler_1 = require("../token_request_handler");
/* an example open id connect provider */
var openIdConnectUrl = 'https://accounts.google.com';
/* example client configuration */
var clientId = '511828570984-7nmej36h9j2tebiqmpqh835naet4vci4.apps.googleusercontent.com';
var redirectUri = 'http://localhost:8000/app/redirect.html';
var scope = 'openid';
/**
 * The Test application.
 */
var App = /** @class */ (function () {
    function App(snackbar) {
        var _this = this;
        this.snackbar = snackbar;
        this.notifier = new authorization_request_handler_1.AuthorizationNotifier();
        this.authorizationHandler = new redirect_based_handler_1.RedirectRequestHandler();
        this.tokenHandler = new token_request_handler_1.BaseTokenRequestHandler();
        // set notifier to deliver responses
        this.authorizationHandler.setAuthorizationNotifier(this.notifier);
        // set a listener to listen for authorization responses
        this.notifier.setAuthorizationListener(function (request, response, error) {
            logger_1.log('Authorization request complete ', request, response, error);
            if (response) {
                _this.request = request;
                _this.response = response;
                _this.code = response.code;
                _this.showMessage("Authorization Code " + response.code);
            }
        });
    }
    App.prototype.showMessage = function (message) {
        var snackbar = this.snackbar['MaterialSnackbar'];
        snackbar.showSnackbar({ message: message });
    };
    App.prototype.fetchServiceConfiguration = function () {
        var _this = this;
        authorization_service_configuration_1.AuthorizationServiceConfiguration.fetchFromIssuer(openIdConnectUrl)
            .then(function (response) {
            logger_1.log('Fetched service configuration', response);
            _this.configuration = response;
            _this.showMessage('Completed fetching configuration');
        })
            .catch(function (error) {
            logger_1.log('Something bad happened', error);
            _this.showMessage("Something bad happened " + error);
        });
    };
    App.prototype.makeAuthorizationRequest = function () {
        // create a request
        var request = new authorization_request_1.AuthorizationRequest({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope,
            response_type: authorization_request_1.AuthorizationRequest.RESPONSE_TYPE_CODE,
            state: undefined,
            extras: { 'prompt': 'consent', 'access_type': 'offline' }
        });
        if (this.configuration) {
            this.authorizationHandler.performAuthorizationRequest(this.configuration, request);
        }
        else {
            this.showMessage('Fetch Authorization Service configuration, before you make the authorization request.');
        }
    };
    App.prototype.makeTokenRequest = function () {
        var _this = this;
        if (!this.configuration) {
            this.showMessage('Please fetch service configuration.');
            return;
        }
        var request = null;
        if (this.code) {
            var extras = undefined;
            if (this.request && this.request.internal) {
                extras = {};
                extras['code_verifier'] = this.request.internal['code_verifier'];
            }
            // use the code to make the token request.
            request = new token_request_1.TokenRequest({
                client_id: clientId,
                redirect_uri: redirectUri,
                grant_type: token_request_1.GRANT_TYPE_AUTHORIZATION_CODE,
                code: this.code,
                refresh_token: undefined,
                extras: extras
            });
        }
        else if (this.tokenResponse) {
            // use the token response to make a request for an access token
            request = new token_request_1.TokenRequest({
                client_id: clientId,
                redirect_uri: redirectUri,
                grant_type: token_request_1.GRANT_TYPE_REFRESH_TOKEN,
                code: undefined,
                refresh_token: this.tokenResponse.refreshToken,
                extras: undefined
            });
        }
        if (request) {
            this.tokenHandler.performTokenRequest(this.configuration, request)
                .then(function (response) {
                var isFirstRequest = false;
                if (_this.tokenResponse) {
                    // copy over new fields
                    _this.tokenResponse.accessToken = response.accessToken;
                    _this.tokenResponse.issuedAt = response.issuedAt;
                    _this.tokenResponse.expiresIn = response.expiresIn;
                    _this.tokenResponse.tokenType = response.tokenType;
                    _this.tokenResponse.scope = response.scope;
                }
                else {
                    isFirstRequest = true;
                    _this.tokenResponse = response;
                }
                // unset code, so we can do refresh token exchanges subsequently
                _this.code = undefined;
                if (isFirstRequest) {
                    _this.showMessage("Obtained a refresh token " + response.refreshToken);
                }
                else {
                    _this.showMessage("Obtained an access token " + response.accessToken + ".");
                }
            })
                .catch(function (error) {
                logger_1.log('Something bad happened', error);
                _this.showMessage("Something bad happened " + error);
            });
        }
    };
    App.prototype.checkForAuthorizationResponse = function () {
        this.authorizationHandler.completeAuthorizationRequestIfPossible();
    };
    return App;
}());
exports.App = App;
// export App
window['App'] = App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXBwL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7O0FBRUgsK0RBQStEO0FBRS9ELGtFQUE4RDtBQUM5RCxrRkFBb0c7QUFDcEcsOEZBQXlGO0FBQ3pGLG9DQUE4QjtBQUM5QixvRUFBaUU7QUFDakUsa0RBQXVHO0FBQ3ZHLGtFQUFzRjtBQXNCdEYseUNBQXlDO0FBQ3pDLElBQU0sZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUM7QUFFdkQsa0NBQWtDO0FBQ2xDLElBQU0sUUFBUSxHQUFHLDBFQUEwRSxDQUFDO0FBQzVGLElBQU0sV0FBVyxHQUFHLHlDQUF5QyxDQUFDO0FBQzlELElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQztBQUV2Qjs7R0FFRztBQUNIO0lBWUUsYUFBbUIsUUFBaUI7UUFBcEMsaUJBZ0JDO1FBaEJrQixhQUFRLEdBQVIsUUFBUSxDQUFTO1FBQ2xDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxxREFBcUIsRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLCtDQUFzQixFQUFFLENBQUM7UUFDekQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLCtDQUF1QixFQUFFLENBQUM7UUFDbEQsb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEUsdURBQXVEO1FBQ3ZELElBQUksQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUMsVUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUs7WUFDOUQsWUFBRyxDQUFDLGlDQUFpQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakUsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7Z0JBQ3ZCLEtB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Q0FBQyxXQUFXLENBQUMsOEJBQTRCLFFBQVEsQ0FBQyxXQUFXLE1BQUcsQ0FBQyxDQUFDO2lCQUN2RTtZQUNILENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsVUFBQSxLQUFLO2dCQUNWLFlBQUcsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckMsS0FBSSxDQUFDLFdBQVcsQ0FBQyw0QkFBMEIsS0FBTyxDQUFDLENBQUE7WUFDckQsQ0FBQyxDQUFDLENBQUM7U0FDUjtJQUNILENBQUM7SUFFRCwyQ0FBNkIsR0FBN0I7UUFDRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsc0NBQXNDLEVBQUUsQ0FBQztJQUNyRSxDQUFDO0lBQ0gsVUFBQztBQUFELENBQUMsQUF2SUQsSUF1SUM7QUF2SVksa0JBQUc7QUF5SWhCLGFBQWE7QUFDWixNQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHRcbiAqIGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGVcbiAqIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyXG4gKiBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIFJlcHJlc2VudHMgdGhlIHRlc3Qgd2ViIGFwcCB0aGF0IHVzZXMgdGhlIEFwcEF1dGhKUyBsaWJyYXJ5LlxuXG5pbXBvcnQge0F1dGhvcml6YXRpb25SZXF1ZXN0fSBmcm9tICcuLi9hdXRob3JpemF0aW9uX3JlcXVlc3QnO1xuaW1wb3J0IHtBdXRob3JpemF0aW9uTm90aWZpZXIsIEF1dGhvcml6YXRpb25SZXF1ZXN0SGFuZGxlcn0gZnJvbSAnLi4vYXV0aG9yaXphdGlvbl9yZXF1ZXN0X2hhbmRsZXInO1xuaW1wb3J0IHtBdXRob3JpemF0aW9uU2VydmljZUNvbmZpZ3VyYXRpb259IGZyb20gJy4uL2F1dGhvcml6YXRpb25fc2VydmljZV9jb25maWd1cmF0aW9uJztcbmltcG9ydCB7bG9nfSBmcm9tICcuLi9sb2dnZXInO1xuaW1wb3J0IHtSZWRpcmVjdFJlcXVlc3RIYW5kbGVyfSBmcm9tICcuLi9yZWRpcmVjdF9iYXNlZF9oYW5kbGVyJztcbmltcG9ydCB7R1JBTlRfVFlQRV9BVVRIT1JJWkFUSU9OX0NPREUsIEdSQU5UX1RZUEVfUkVGUkVTSF9UT0tFTiwgVG9rZW5SZXF1ZXN0fSBmcm9tICcuLi90b2tlbl9yZXF1ZXN0JztcbmltcG9ydCB7QmFzZVRva2VuUmVxdWVzdEhhbmRsZXIsIFRva2VuUmVxdWVzdEhhbmRsZXJ9IGZyb20gJy4uL3Rva2VuX3JlcXVlc3RfaGFuZGxlcic7XG5pbXBvcnQge1Rva2VuUmVzcG9uc2V9IGZyb20gJy4uL3Rva2VuX3Jlc3BvbnNlJztcbmltcG9ydCB7IEF1dGhvcml6YXRpb25SZXNwb25zZSB9IGZyb20gJy4uL2F1dGhvcml6YXRpb25fcmVzcG9uc2UnO1xuaW1wb3J0IHsgU3RyaW5nTWFwIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKiBTb21lIGludGVyZmFjZSBkZWNsYXJhdGlvbnMgZm9yIE1hdGVyaWFsIGRlc2lnbiBsaXRlLiAqL1xuXG4vKipcbiAqIFNuYWNrYmFyIG9wdGlvbnMuXG4gKi9cbmRlY2xhcmUgaW50ZXJmYWNlIFNuYWNrQmFyT3B0aW9ucyB7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgdGltZW91dD86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgdGhhdCBkZWZpbmVzIHRoZSBNREwgTWF0ZXJpYWwgU25hY2sgQmFyIEFQSS5cbiAqL1xuZGVjbGFyZSBpbnRlcmZhY2UgTWF0ZXJpYWxTbmFja0JhciB7XG4gIHNob3dTbmFja2JhcjogKG9wdGlvbnM6IFNuYWNrQmFyT3B0aW9ucykgPT4gdm9pZDtcbn1cblxuLyogYW4gZXhhbXBsZSBvcGVuIGlkIGNvbm5lY3QgcHJvdmlkZXIgKi9cbmNvbnN0IG9wZW5JZENvbm5lY3RVcmwgPSAnaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tJztcblxuLyogZXhhbXBsZSBjbGllbnQgY29uZmlndXJhdGlvbiAqL1xuY29uc3QgY2xpZW50SWQgPSAnNTExODI4NTcwOTg0LTdubWVqMzZoOWoydGViaXFtcHFoODM1bmFldDR2Y2k0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tJztcbmNvbnN0IHJlZGlyZWN0VXJpID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcHAvcmVkaXJlY3QuaHRtbCc7XG5jb25zdCBzY29wZSA9ICdvcGVuaWQnO1xuXG4vKipcbiAqIFRoZSBUZXN0IGFwcGxpY2F0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQXBwIHtcbiAgcHJpdmF0ZSBub3RpZmllcjogQXV0aG9yaXphdGlvbk5vdGlmaWVyO1xuICBwcml2YXRlIGF1dGhvcml6YXRpb25IYW5kbGVyOiBBdXRob3JpemF0aW9uUmVxdWVzdEhhbmRsZXI7XG4gIHByaXZhdGUgdG9rZW5IYW5kbGVyOiBUb2tlblJlcXVlc3RIYW5kbGVyO1xuXG4gIC8vIHN0YXRlXG4gIHByaXZhdGUgY29uZmlndXJhdGlvbjogQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9ufHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSByZXF1ZXN0OiBBdXRob3JpemF0aW9uUmVxdWVzdHx1bmRlZmluZWQ7XG4gIHByaXZhdGUgcmVzcG9uc2U6IEF1dGhvcml6YXRpb25SZXNwb25zZXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgY29kZTogc3RyaW5nfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSB0b2tlblJlc3BvbnNlOiBUb2tlblJlc3BvbnNlfHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgc25hY2tiYXI6IEVsZW1lbnQpIHtcbiAgICB0aGlzLm5vdGlmaWVyID0gbmV3IEF1dGhvcml6YXRpb25Ob3RpZmllcigpO1xuICAgIHRoaXMuYXV0aG9yaXphdGlvbkhhbmRsZXIgPSBuZXcgUmVkaXJlY3RSZXF1ZXN0SGFuZGxlcigpO1xuICAgIHRoaXMudG9rZW5IYW5kbGVyID0gbmV3IEJhc2VUb2tlblJlcXVlc3RIYW5kbGVyKCk7XG4gICAgLy8gc2V0IG5vdGlmaWVyIHRvIGRlbGl2ZXIgcmVzcG9uc2VzXG4gICAgdGhpcy5hdXRob3JpemF0aW9uSGFuZGxlci5zZXRBdXRob3JpemF0aW9uTm90aWZpZXIodGhpcy5ub3RpZmllcik7XG4gICAgLy8gc2V0IGEgbGlzdGVuZXIgdG8gbGlzdGVuIGZvciBhdXRob3JpemF0aW9uIHJlc3BvbnNlc1xuICAgIHRoaXMubm90aWZpZXIuc2V0QXV0aG9yaXphdGlvbkxpc3RlbmVyKChyZXF1ZXN0LCByZXNwb25zZSwgZXJyb3IpID0+IHtcbiAgICAgIGxvZygnQXV0aG9yaXphdGlvbiByZXF1ZXN0IGNvbXBsZXRlICcsIHJlcXVlc3QsIHJlc3BvbnNlLCBlcnJvcik7XG4gICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICAgICAgdGhpcy5yZXNwb25zZSA9IHJlc3BvbnNlO1xuICAgICAgICB0aGlzLmNvZGUgPSByZXNwb25zZS5jb2RlO1xuICAgICAgICB0aGlzLnNob3dNZXNzYWdlKGBBdXRob3JpemF0aW9uIENvZGUgJHtyZXNwb25zZS5jb2RlfWApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2hvd01lc3NhZ2UobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc25hY2tiYXIgPSAodGhpcy5zbmFja2JhciBhcyBhbnkpWydNYXRlcmlhbFNuYWNrYmFyJ10gYXMgTWF0ZXJpYWxTbmFja0JhcjtcbiAgICBzbmFja2Jhci5zaG93U25hY2tiYXIoe21lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgfVxuXG4gIGZldGNoU2VydmljZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgQXV0aG9yaXphdGlvblNlcnZpY2VDb25maWd1cmF0aW9uLmZldGNoRnJvbUlzc3VlcihvcGVuSWRDb25uZWN0VXJsKVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgbG9nKCdGZXRjaGVkIHNlcnZpY2UgY29uZmlndXJhdGlvbicsIHJlc3BvbnNlKTtcbiAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSByZXNwb25zZTtcbiAgICAgICAgICB0aGlzLnNob3dNZXNzYWdlKCdDb21wbGV0ZWQgZmV0Y2hpbmcgY29uZmlndXJhdGlvbicpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgIGxvZygnU29tZXRoaW5nIGJhZCBoYXBwZW5lZCcsIGVycm9yKTtcbiAgICAgICAgICB0aGlzLnNob3dNZXNzYWdlKGBTb21ldGhpbmcgYmFkIGhhcHBlbmVkICR7ZXJyb3J9YClcbiAgICAgICAgfSk7XG4gIH1cblxuICBtYWtlQXV0aG9yaXphdGlvblJlcXVlc3QoKSB7XG4gICAgLy8gY3JlYXRlIGEgcmVxdWVzdFxuICAgIGxldCByZXF1ZXN0ID0gbmV3IEF1dGhvcml6YXRpb25SZXF1ZXN0KHtcbiAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXG4gICAgICByZWRpcmVjdF91cmk6IHJlZGlyZWN0VXJpLFxuICAgICAgc2NvcGU6IHNjb3BlLFxuICAgICAgcmVzcG9uc2VfdHlwZTogQXV0aG9yaXphdGlvblJlcXVlc3QuUkVTUE9OU0VfVFlQRV9DT0RFLFxuICAgICAgc3RhdGU6IHVuZGVmaW5lZCxcbiAgICAgIGV4dHJhczogeydwcm9tcHQnOiAnY29uc2VudCcsICdhY2Nlc3NfdHlwZSc6ICdvZmZsaW5lJ31cbiAgICB9KTtcblxuICAgIGlmICh0aGlzLmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHRoaXMuYXV0aG9yaXphdGlvbkhhbmRsZXIucGVyZm9ybUF1dGhvcml6YXRpb25SZXF1ZXN0KHRoaXMuY29uZmlndXJhdGlvbiwgcmVxdWVzdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd01lc3NhZ2UoXG4gICAgICAgICAgJ0ZldGNoIEF1dGhvcml6YXRpb24gU2VydmljZSBjb25maWd1cmF0aW9uLCBiZWZvcmUgeW91IG1ha2UgdGhlIGF1dGhvcml6YXRpb24gcmVxdWVzdC4nKTtcbiAgICB9XG4gIH1cblxuICBtYWtlVG9rZW5SZXF1ZXN0KCkge1xuICAgIGlmICghdGhpcy5jb25maWd1cmF0aW9uKSB7XG4gICAgICB0aGlzLnNob3dNZXNzYWdlKCdQbGVhc2UgZmV0Y2ggc2VydmljZSBjb25maWd1cmF0aW9uLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByZXF1ZXN0OiBUb2tlblJlcXVlc3R8bnVsbCA9IG51bGw7XG4gICAgaWYgKHRoaXMuY29kZSkge1xuICAgICAgbGV0IGV4dHJhczogU3RyaW5nTWFwfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGlmICh0aGlzLnJlcXVlc3QgJiYgdGhpcy5yZXF1ZXN0LmludGVybmFsKSB7XG4gICAgICAgIGV4dHJhcyA9IHt9O1xuICAgICAgICBleHRyYXNbJ2NvZGVfdmVyaWZpZXInXSA9IHRoaXMucmVxdWVzdC5pbnRlcm5hbFsnY29kZV92ZXJpZmllciddO1xuICAgICAgfVxuICAgICAgLy8gdXNlIHRoZSBjb2RlIHRvIG1ha2UgdGhlIHRva2VuIHJlcXVlc3QuXG4gICAgICByZXF1ZXN0ID0gbmV3IFRva2VuUmVxdWVzdCh7XG4gICAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXG4gICAgICAgIHJlZGlyZWN0X3VyaTogcmVkaXJlY3RVcmksXG4gICAgICAgIGdyYW50X3R5cGU6IEdSQU5UX1RZUEVfQVVUSE9SSVpBVElPTl9DT0RFLFxuICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgIHJlZnJlc2hfdG9rZW46IHVuZGVmaW5lZCxcbiAgICAgICAgZXh0cmFzOiBleHRyYXNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy50b2tlblJlc3BvbnNlKSB7XG4gICAgICAvLyB1c2UgdGhlIHRva2VuIHJlc3BvbnNlIHRvIG1ha2UgYSByZXF1ZXN0IGZvciBhbiBhY2Nlc3MgdG9rZW5cbiAgICAgIHJlcXVlc3QgPSBuZXcgVG9rZW5SZXF1ZXN0KHtcbiAgICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcbiAgICAgICAgcmVkaXJlY3RfdXJpOiByZWRpcmVjdFVyaSxcbiAgICAgICAgZ3JhbnRfdHlwZTogR1JBTlRfVFlQRV9SRUZSRVNIX1RPS0VOLFxuICAgICAgICBjb2RlOiB1bmRlZmluZWQsXG4gICAgICAgIHJlZnJlc2hfdG9rZW46IHRoaXMudG9rZW5SZXNwb25zZS5yZWZyZXNoVG9rZW4sXG4gICAgICAgIGV4dHJhczogdW5kZWZpbmVkXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgdGhpcy50b2tlbkhhbmRsZXIucGVyZm9ybVRva2VuUmVxdWVzdCh0aGlzLmNvbmZpZ3VyYXRpb24sIHJlcXVlc3QpXG4gICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgbGV0IGlzRmlyc3RSZXF1ZXN0ID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy50b2tlblJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIC8vIGNvcHkgb3ZlciBuZXcgZmllbGRzXG4gICAgICAgICAgICAgIHRoaXMudG9rZW5SZXNwb25zZS5hY2Nlc3NUb2tlbiA9IHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xuICAgICAgICAgICAgICB0aGlzLnRva2VuUmVzcG9uc2UuaXNzdWVkQXQgPSByZXNwb25zZS5pc3N1ZWRBdDtcbiAgICAgICAgICAgICAgdGhpcy50b2tlblJlc3BvbnNlLmV4cGlyZXNJbiA9IHJlc3BvbnNlLmV4cGlyZXNJbjtcbiAgICAgICAgICAgICAgdGhpcy50b2tlblJlc3BvbnNlLnRva2VuVHlwZSA9IHJlc3BvbnNlLnRva2VuVHlwZTtcbiAgICAgICAgICAgICAgdGhpcy50b2tlblJlc3BvbnNlLnNjb3BlID0gcmVzcG9uc2Uuc2NvcGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpc0ZpcnN0UmVxdWVzdCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMudG9rZW5SZXNwb25zZSA9IHJlc3BvbnNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1bnNldCBjb2RlLCBzbyB3ZSBjYW4gZG8gcmVmcmVzaCB0b2tlbiBleGNoYW5nZXMgc3Vic2VxdWVudGx5XG4gICAgICAgICAgICB0aGlzLmNvZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoaXNGaXJzdFJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93TWVzc2FnZShgT2J0YWluZWQgYSByZWZyZXNoIHRva2VuICR7cmVzcG9uc2UucmVmcmVzaFRva2VufWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93TWVzc2FnZShgT2J0YWluZWQgYW4gYWNjZXNzIHRva2VuICR7cmVzcG9uc2UuYWNjZXNzVG9rZW59LmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGxvZygnU29tZXRoaW5nIGJhZCBoYXBwZW5lZCcsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd01lc3NhZ2UoYFNvbWV0aGluZyBiYWQgaGFwcGVuZWQgJHtlcnJvcn1gKVxuICAgICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNoZWNrRm9yQXV0aG9yaXphdGlvblJlc3BvbnNlKCkge1xuICAgIHRoaXMuYXV0aG9yaXphdGlvbkhhbmRsZXIuY29tcGxldGVBdXRob3JpemF0aW9uUmVxdWVzdElmUG9zc2libGUoKTtcbiAgfVxufVxuXG4vLyBleHBvcnQgQXBwXG4od2luZG93IGFzIGFueSlbJ0FwcCddID0gQXBwO1xuIl19