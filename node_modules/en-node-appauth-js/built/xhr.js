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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
/**
 * An class that abstracts away the ability to make an XMLHttpRequest.
 */
var Requestor = /** @class */ (function () {
    function Requestor() {
    }
    return Requestor;
}());
exports.Requestor = Requestor;
/**
 * Uses fetch API to make Ajax requests
 */
var FetchRequestor = /** @class */ (function (_super) {
    __extends(FetchRequestor, _super);
    function FetchRequestor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FetchRequestor.prototype.xhr = function (settings) {
        if (!settings.url) {
            return Promise.reject(new errors_1.AppAuthError('A URL must be provided.'));
        }
        var url = new URL(settings.url);
        var requestInit = {};
        requestInit.method = settings.method;
        requestInit.mode = 'cors';
        if (settings.data) {
            if (settings.method && settings.method.toUpperCase() === 'POST') {
                requestInit.body = settings.data;
            }
            else {
                var searchParams = new URLSearchParams(settings.data);
                searchParams.forEach(function (value, key) {
                    url.searchParams.append(key, value);
                });
            }
        }
        // Set the request headers
        requestInit.headers = {};
        if (settings.headers) {
            for (var i in settings.headers) {
                if (settings.headers.hasOwnProperty(i)) {
                    requestInit.headers[i] = settings.headers[i];
                }
            }
        }
        var isJsonDataType = settings.dataType && settings.dataType.toLowerCase() === 'json';
        // Set 'Accept' header value for json requests (Taken from
        // https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644
        // )
        if (isJsonDataType) {
            requestInit.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
        }
        return fetch(url.toString(), requestInit).then(function (response) {
            if (response.status >= 200 && response.status < 300) {
                var contentType = response.headers.get('content-type');
                if (isJsonDataType || (contentType && contentType.indexOf('application/json') !== -1)) {
                    return response.json();
                }
                else {
                    return response.text();
                }
            }
            else {
                return Promise.reject(new errors_1.AppAuthError(response.status.toString(), response.statusText));
            }
        });
    };
    return FetchRequestor;
}(Requestor));
exports.FetchRequestor = FetchRequestor;
/**
 * Should be used only in the context of testing. Just uses the underlying
 * Promise to mock the behavior of the Requestor.
 */
var TestRequestor = /** @class */ (function (_super) {
    __extends(TestRequestor, _super);
    function TestRequestor(promise) {
        var _this = _super.call(this) || this;
        _this.promise = promise;
        return _this;
    }
    TestRequestor.prototype.xhr = function (settings) {
        return this.promise; // unsafe cast
    };
    return TestRequestor;
}(Requestor));
exports.TestRequestor = TestRequestor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGhyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3hoci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7OztHQVlHOzs7Ozs7Ozs7Ozs7Ozs7QUFFSCxtQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSDtJQUFBO0lBRUEsQ0FBQztJQUFELGdCQUFDO0FBQUQsQ0FBQyxBQUZELElBRUM7QUFGcUIsOEJBQVM7QUFvQy9COztHQUVHO0FBQ0g7SUFBb0Msa0NBQVM7SUFBN0M7O0lBcURBLENBQUM7SUFwREMsNEJBQUcsR0FBSCxVQUFPLFFBQTJCO1FBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2pCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLHFCQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDO1NBQ3BFO1FBQ0QsSUFBSSxHQUFHLEdBQVEsSUFBSSxHQUFHLENBQVMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLElBQUksV0FBVyxHQUFnQixFQUFFLENBQUM7UUFDbEMsV0FBVyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3JDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBRTFCLElBQUksUUFBUSxDQUFDLElBQUksRUFBRTtZQUNqQixJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLEVBQUU7Z0JBQy9ELFdBQVcsQ0FBQyxJQUFJLEdBQVcsUUFBUSxDQUFDLElBQUksQ0FBQzthQUMxQztpQkFBTTtnQkFDTCxJQUFJLFlBQVksR0FBRyxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLLEVBQUUsR0FBRztvQkFDOUIsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN0QyxDQUFDLENBQUMsQ0FBQzthQUNKO1NBQ0Y7UUFFRCwwQkFBMEI7UUFDMUIsV0FBVyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDekIsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3BCLEtBQUssSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRTtnQkFDOUIsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdEMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBVyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0RDthQUNGO1NBQ0Y7UUFFRCxJQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssTUFBTSxDQUFDO1FBRXZGLDBEQUEwRDtRQUMxRCxrR0FBa0c7UUFDbEcsSUFBSTtRQUNKLElBQUksY0FBYyxFQUFFO1lBQ2xCLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsZ0RBQWdELENBQUM7U0FDbEY7UUFFRCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsUUFBUTtZQUNyRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO2dCQUNuRCxJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDekQsSUFBSSxjQUFjLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3JGLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUN4QjtxQkFBTTtvQkFDTCxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztpQkFDeEI7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxxQkFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7YUFDMUY7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUFyREQsQ0FBb0MsU0FBUyxHQXFENUM7QUFyRFksd0NBQWM7QUF1RDNCOzs7R0FHRztBQUNIO0lBQW1DLGlDQUFTO0lBQzFDLHVCQUFtQixPQUFxQjtRQUF4QyxZQUNFLGlCQUFPLFNBQ1I7UUFGa0IsYUFBTyxHQUFQLE9BQU8sQ0FBYzs7SUFFeEMsQ0FBQztJQUNELDJCQUFHLEdBQUgsVUFBTyxRQUEyQjtRQUNoQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBRSxjQUFjO0lBQ3RDLENBQUM7SUFDSCxvQkFBQztBQUFELENBQUMsQUFQRCxDQUFtQyxTQUFTLEdBTzNDO0FBUFksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdFxuICogaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZVxuICogTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXJcbiAqIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtBcHBBdXRoRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcblxuLyoqXG4gKiBBbiBjbGFzcyB0aGF0IGFic3RyYWN0cyBhd2F5IHRoZSBhYmlsaXR5IHRvIG1ha2UgYW4gWE1MSHR0cFJlcXVlc3QuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZXF1ZXN0b3Ige1xuICBhYnN0cmFjdCB4aHI8VD4oc2V0dGluZ3M6IFJlcXVlc3RvclNldHRpbmdzKTogUHJvbWlzZTxUPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0b3JTZXR0aW5ncyB7XG4gIC8qKlxuICAgKiBEYXRhIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlci4gSXQgaXMgY29udmVydGVkIHRvIGEgcXVlcnkgc3RyaW5nLCBpZiBub3QgYWxyZWFkeSBhIHN0cmluZy4gSXQnc1xuICAgKiBhcHBlbmRlZCB0byB0aGUgdXJsIGZvciBHRVQtcmVxdWVzdHMuIFNlZSBwcm9jZXNzRGF0YSBvcHRpb24gdG8gcHJldmVudCB0aGlzIGF1dG9tYXRpY1xuICAgKiBwcm9jZXNzaW5nLiBPYmplY3QgbXVzdCBiZSBrZXktdmFsdWUgcGFpcnMuIElmIHZhbHVlIGlzIGFuIEFycmF5LCBqUXVlcnkgc2VyaWFsaXplcyBtdWx0aXBsZVxuICAgKiB2YWx1ZXMgd2l0aCBzYW1lIGtleSBiYXNlZCBvbiB0aGUgdmFsdWUgb2YgdGhlIHRyYWRpdGlvbmFsIHNldHRpbmcgKGRlc2NyaWJlZCBiZWxvdykuXG4gICAqL1xuICBkYXRhPzogYW55O1xuICAvKipcbiAgICogVGhlIHR5cGUgb2YgZGF0YSB0aGF0IHlvdSdyZSBleHBlY3RpbmcgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuIElmIG5vbmUgaXMgc3BlY2lmaWVkLCBqUXVlcnkgd2lsbFxuICAgKiB0cnkgdG8gaW5mZXIgaXQgYmFzZWQgb24gdGhlIE1JTUUgdHlwZSBvZiB0aGUgcmVzcG9uc2UgKGFuIFhNTCBNSU1FIHR5cGUgd2lsbCB5aWVsZCBYTUwsIGluIDEuNFxuICAgKiBKU09OIHdpbGwgeWllbGQgYSBKYXZhU2NyaXB0IG9iamVjdCwgaW4gMS40IHNjcmlwdCB3aWxsIGV4ZWN1dGUgdGhlIHNjcmlwdCwgYW5kIGFueXRoaW5nIGVsc2VcbiAgICogd2lsbCBiZSByZXR1cm5lZCBhcyBhIHN0cmluZykuXG4gICAqL1xuICBkYXRhVHlwZT86IHN0cmluZztcbiAgLyoqXG4gICAqIEFuIG9iamVjdCBvZiBhZGRpdGlvbmFsIGhlYWRlciBrZXkvdmFsdWUgcGFpcnMgdG8gc2VuZCBhbG9uZyB3aXRoIHJlcXVlc3RzIHVzaW5nIHRoZVxuICAgKiBYTUxIdHRwUmVxdWVzdCB0cmFuc3BvcnQuIFRoZSBoZWFkZXIgWC1SZXF1ZXN0ZWQtV2l0aDogWE1MSHR0cFJlcXVlc3QgaXMgYWx3YXlzIGFkZGVkLCBidXQgaXRzXG4gICAqIGRlZmF1bHQgWE1MSHR0cFJlcXVlc3QgdmFsdWUgY2FuIGJlIGNoYW5nZWQgaGVyZS4gVmFsdWVzIGluIHRoZSBoZWFkZXJzIHNldHRpbmcgY2FuIGFsc28gYmVcbiAgICogb3ZlcndyaXR0ZW4gZnJvbSB3aXRoaW4gdGhlIGJlZm9yZVNlbmQgZnVuY3Rpb24uICh2ZXJzaW9uIGFkZGVkOiAxLjUpXG4gICAqL1xuICBoZWFkZXJzPzoge1trZXk6IHN0cmluZ106IGFueTt9O1xuICAvKipcbiAgICogVGhlIEhUVFAgbWV0aG9kIHRvIHVzZSBmb3IgdGhlIHJlcXVlc3QgKGUuZy4gXCJQT1NUXCIsIFwiR0VUXCIsIFwiUFVUXCIpLiAodmVyc2lvbiBhZGRlZDogMS45LjApXG4gICAqL1xuICBtZXRob2Q/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBBIHN0cmluZyBjb250YWluaW5nIHRoZSBVUkwgdG8gd2hpY2ggdGhlIHJlcXVlc3QgaXMgc2VudC5cbiAgICovXG4gIHVybD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBVc2VzIGZldGNoIEFQSSB0byBtYWtlIEFqYXggcmVxdWVzdHNcbiAqL1xuZXhwb3J0IGNsYXNzIEZldGNoUmVxdWVzdG9yIGV4dGVuZHMgUmVxdWVzdG9yIHtcbiAgeGhyPFQ+KHNldHRpbmdzOiBSZXF1ZXN0b3JTZXR0aW5ncyk6IFByb21pc2U8VD4ge1xuICAgIGlmICghc2V0dGluZ3MudXJsKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEFwcEF1dGhFcnJvcignQSBVUkwgbXVzdCBiZSBwcm92aWRlZC4nKSk7XG4gICAgfVxuICAgIGxldCB1cmw6IFVSTCA9IG5ldyBVUkwoPHN0cmluZz5zZXR0aW5ncy51cmwpO1xuICAgIGxldCByZXF1ZXN0SW5pdDogUmVxdWVzdEluaXQgPSB7fTtcbiAgICByZXF1ZXN0SW5pdC5tZXRob2QgPSBzZXR0aW5ncy5tZXRob2Q7XG4gICAgcmVxdWVzdEluaXQubW9kZSA9ICdjb3JzJztcblxuICAgIGlmIChzZXR0aW5ncy5kYXRhKSB7XG4gICAgICBpZiAoc2V0dGluZ3MubWV0aG9kICYmIHNldHRpbmdzLm1ldGhvZC50b1VwcGVyQ2FzZSgpID09PSAnUE9TVCcpIHtcbiAgICAgICAgcmVxdWVzdEluaXQuYm9keSA9IDxzdHJpbmc+c2V0dGluZ3MuZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHNldHRpbmdzLmRhdGEpO1xuICAgICAgICBzZWFyY2hQYXJhbXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT7CoHtcbiAgICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSByZXF1ZXN0IGhlYWRlcnNcbiAgICByZXF1ZXN0SW5pdC5oZWFkZXJzID0ge307XG4gICAgaWYgKHNldHRpbmdzLmhlYWRlcnMpIHtcbiAgICAgIGZvciAobGV0IGkgaW4gc2V0dGluZ3MuaGVhZGVycykge1xuICAgICAgICBpZiAoc2V0dGluZ3MuaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgIHJlcXVlc3RJbml0LmhlYWRlcnNbaV0gPSA8c3RyaW5nPnNldHRpbmdzLmhlYWRlcnNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpc0pzb25EYXRhVHlwZSA9IHNldHRpbmdzLmRhdGFUeXBlICYmIHNldHRpbmdzLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09ICdqc29uJztcblxuICAgIC8vIFNldCAnQWNjZXB0JyBoZWFkZXIgdmFsdWUgZm9yIGpzb24gcmVxdWVzdHMgKFRha2VuIGZyb21cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS9ibG9iL2UwZDk0MTE1NjkwMGE2YmZmN2MwOThjOGVhNzI5MDUyOGU0NjhjZjgvc3JjL2FqYXguanMjTDY0NFxuICAgIC8vIClcbiAgICBpZiAoaXNKc29uRGF0YVR5cGUpIHtcbiAgICAgIHJlcXVlc3RJbml0LmhlYWRlcnNbJ0FjY2VwdCddID0gJ2FwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdCwgKi8qOyBxPTAuMDEnO1xuICAgIH1cblxuICAgIHJldHVybiBmZXRjaCh1cmwudG9TdHJpbmcoKSwgcmVxdWVzdEluaXQpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpO1xuICAgICAgICBpZiAoaXNKc29uRGF0YVR5cGUgfHwgKGNvbnRlbnRUeXBlICYmIGNvbnRlbnRUeXBlLmluZGV4T2YoJ2FwcGxpY2F0aW9uL2pzb24nKSAhPT0gLTEpKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEFwcEF1dGhFcnJvcihyZXNwb25zZS5zdGF0dXMudG9TdHJpbmcoKSwgcmVzcG9uc2Uuc3RhdHVzVGV4dCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogU2hvdWxkIGJlIHVzZWQgb25seSBpbiB0aGUgY29udGV4dCBvZiB0ZXN0aW5nLiBKdXN0IHVzZXMgdGhlIHVuZGVybHlpbmdcbiAqIFByb21pc2UgdG8gbW9jayB0aGUgYmVoYXZpb3Igb2YgdGhlIFJlcXVlc3Rvci5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RSZXF1ZXN0b3IgZXh0ZW5kcyBSZXF1ZXN0b3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJvbWlzZTogUHJvbWlzZTxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICB4aHI8VD4oc2V0dGluZ3M6IFJlcXVlc3RvclNldHRpbmdzKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMucHJvbWlzZTsgIC8vIHVuc2FmZSBjYXN0XG4gIH1cbn1cbiJdfQ==