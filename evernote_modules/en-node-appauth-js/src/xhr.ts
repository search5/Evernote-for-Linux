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

import {AppAuthError} from './errors';

/**
 * An class that abstracts away the ability to make an XMLHttpRequest.
 */
export abstract class Requestor {
  abstract xhr<T>(settings: RequestorSettings): Promise<T>;
}

export interface RequestorSettings {
  /**
   * Data to be sent to the server. It is converted to a query string, if not already a string. It's
   * appended to the url for GET-requests. See processData option to prevent this automatic
   * processing. Object must be key-value pairs. If value is an Array, jQuery serializes multiple
   * values with same key based on the value of the traditional setting (described below).
   */
  data?: any;
  /**
   * The type of data that you're expecting back from the server. If none is specified, jQuery will
   * try to infer it based on the MIME type of the response (an XML MIME type will yield XML, in 1.4
   * JSON will yield a JavaScript object, in 1.4 script will execute the script, and anything else
   * will be returned as a string).
   */
  dataType?: string;
  /**
   * An object of additional header key/value pairs to send along with requests using the
   * XMLHttpRequest transport. The header X-Requested-With: XMLHttpRequest is always added, but its
   * default XMLHttpRequest value can be changed here. Values in the headers setting can also be
   * overwritten from within the beforeSend function. (version added: 1.5)
   */
  headers?: {[key: string]: any;};
  /**
   * The HTTP method to use for the request (e.g. "POST", "GET", "PUT"). (version added: 1.9.0)
   */
  method?: string;
  /**
   * A string containing the URL to which the request is sent.
   */
  url?: string;
}

/**
 * Uses fetch API to make Ajax requests
 */
export class FetchRequestor extends Requestor {
  xhr<T>(settings: RequestorSettings): Promise<T> {
    if (!settings.url) {
      return Promise.reject(new AppAuthError('A URL must be provided.'));
    }
    let url: URL = new URL(<string>settings.url);
    let requestInit: RequestInit = {};
    requestInit.method = settings.method;
    requestInit.mode = 'cors';

    if (settings.data) {
      if (settings.method && settings.method.toUpperCase() === 'POST') {
        requestInit.body = <string>settings.data;
      } else {
        let searchParams = new URLSearchParams(settings.data);
        searchParams.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }
    }

    // Set the request headers
    requestInit.headers = {};
    if (settings.headers) {
      for (let i in settings.headers) {
        if (settings.headers.hasOwnProperty(i)) {
          requestInit.headers[i] = <string>settings.headers[i];
        }
      }
    }

    const isJsonDataType = settings.dataType && settings.dataType.toLowerCase() === 'json';

    // Set 'Accept' header value for json requests (Taken from
    // https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644
    // )
    if (isJsonDataType) {
      requestInit.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
    }

    return fetch(url.toString(), requestInit).then(response => {
      if (response.status >= 200 && response.status < 300) {
        const contentType = response.headers.get('content-type');
        if (isJsonDataType || (contentType && contentType.indexOf('application/json') !== -1)) {
          return response.json();
        } else {
          return response.text();
        }
      } else {
        return Promise.reject(new AppAuthError(response.status.toString(), response.statusText));
      }
    });
  }
}

/**
 * Should be used only in the context of testing. Just uses the underlying
 * Promise to mock the behavior of the Requestor.
 */
export class TestRequestor extends Requestor {
  constructor(public promise: Promise<any>) {
    super();
  }
  xhr<T>(settings: RequestorSettings): Promise<T> {
    return this.promise;  // unsafe cast
  }
}
