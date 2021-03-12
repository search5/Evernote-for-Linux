"use strict";
/*!
 * Copyright 2019 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = exports.safeParseMultipartMixed = void 0;
const conduit_utils_1 = require("conduit-utils");
const GoogleServicesTypes_1 = require("./GoogleServicesTypes");
const batchSize = 100;
const cache = new GoogleServicesTypes_1.TtlCacheManagerWrapper();
const googleDriveUrl = 'https://www.googleapis.com';
const GoogleDriveBatchPath = '/batch/drive/v3';
const googleDrivePath = '/drive/v3/files/';
const googleDriveFields = 'fields=id,name,description,modifiedTime,mimeType,webContentLink,webViewLink,size,thumbnailLink,fullFileExtension,exportLinks';
const logger = conduit_utils_1.createLogger('conduit:GoogleServices:GoogleDrive');
var GoogleDriveErrorCodes;
(function (GoogleDriveErrorCodes) {
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["Success"] = 200] = "Success";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["BadRequest"] = 400] = "BadRequest";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["InvalidCredentials"] = 401] = "InvalidCredentials";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["LimitExceeded"] = 403] = "LimitExceeded";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["FileNotFound"] = 404] = "FileNotFound";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["TooManyRequests"] = 429] = "TooManyRequests";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["BackendError"] = 500] = "BackendError";
    GoogleDriveErrorCodes[GoogleDriveErrorCodes["ParseError"] = 503] = "ParseError";
})(GoogleDriveErrorCodes || (GoogleDriveErrorCodes = {}));
function handleErrors(fileId, googleError) {
    const driveResponse = {
        fileId,
        message: '',
        reason: '',
        data: undefined,
    };
    switch (googleError.code) {
        case GoogleDriveErrorCodes.BadRequest: {
            // Sharing request failed, should not happen yet
            // MF: May *also* be used for a failed attempt to share via email but that will not be an issue for this iteration ...
            driveResponse.reason = 'invalidSharingRequest';
            driveResponse.message = 'Not permitted to share that file';
            break;
        }
        case GoogleDriveErrorCodes.InvalidCredentials: {
            // Invalid Credentials, this NEEDS to go back to consumer
            driveResponse.reason = 'authError';
            driveResponse.message = 'Invalid credentials';
            break;
        }
        case GoogleDriveErrorCodes.LimitExceeded: {
            // This will get more complicated as Sharing notes becomes more complicated ...
            driveResponse.reason = googleError.errors[0].message;
            driveResponse.message = googleError.errors[0].reason;
            break;
        }
        case GoogleDriveErrorCodes.FileNotFound: {
            driveResponse.reason = 'notFound';
            driveResponse.message = 'Drive file not found';
            break;
        }
        case GoogleDriveErrorCodes.TooManyRequests: {
            // Consider https://developers.google.com/drive/api/v3/handle-errors#exponential-backoff
            driveResponse.reason = 'rateLimitExceeded';
            driveResponse.message = 'Rate limit exceeded';
            break;
        }
        case GoogleDriveErrorCodes.BackendError:
        default: {
            // Non-descript backend error from Google ...
            driveResponse.reason = 'backendError';
            driveResponse.message = 'Backend error';
            break;
        }
    }
    return driveResponse;
}
// Shamelessly stolen from: https://github.com/tylerlong/multipart-mixed-parser/blob/master/index.js
// Original NPM package doesn't account for Headers in the individual parts.
function safeParseMultipartMixed(str) {
    if (str === 'null' || str === null) {
        return null;
    }
    if (str === 'undefined' || str === undefined) {
        return null;
    }
    // PESO-4241: Some transport clients return differing responses to the same request.
    if (str[str.length - 1] === '"') {
        str = str.substr(0, str.length - 2);
    }
    if (str[0] === '"') {
        str = str.substr(1);
    }
    if (str.indexOf('\\r\\n') > 0) {
        str = str.replace(/\\r\\n/g, '\r\n');
    }
    if (str.indexOf('\\n') > 0) {
        str = str.replace(/\\n/g, '\n');
    }
    if (str.indexOf('\\"') >= 0) {
        str = str.replace(/\\"/g, '\"');
    }
    try {
        const boundary = str.trim().split(/\r\n/g)[0].trim();
        const mixedParts = str.split(boundary).map(part => part.trim()).filter(part => part !== '' && part !== '--');
        const resultSet = [];
        mixedParts.forEach(part => {
            if (part === '' || part === '"' || part.length < 2 || part.startsWith('--')) {
                return;
            }
            const contentIdHeader = part.split(/\r\n/g)[1];
            const fileId = contentIdHeader.split(': ')[1].split('response-')[1];
            const jsonStr = part.substr(part.indexOf('{')).split(boundary)[0];
            const reifiedJson = conduit_utils_1.safeParse(jsonStr);
            if (!reifiedJson) {
                const driveResponse = {
                    reason: 'jsonParseError',
                    message: 'Could not parse metadata',
                    fileId,
                    data: undefined,
                };
                resultSet.push(driveResponse);
            }
            else if ('error' in reifiedJson) { // GAPI types are missing a discriminator ...
                const driveError = reifiedJson.error;
                const driveResponse = handleErrors(fileId, driveError);
                resultSet.push(driveResponse);
            }
            else if ('id' in reifiedJson) {
                const driveFile = {
                    id: fileId,
                    label: reifiedJson.name || undefined,
                    modifiedTime: reifiedJson.modifiedTime || undefined,
                    mimeType: reifiedJson.mimeType || undefined,
                    thumbnailLink: reifiedJson.thumbnailLink || undefined,
                    description: reifiedJson.description || undefined,
                    binaryUri: reifiedJson.webContentLink || undefined,
                    viewerUri: reifiedJson.webViewLink || undefined,
                    fileSize: reifiedJson.size || undefined,
                    fullFileExtension: reifiedJson.fullFileExtension || undefined,
                };
                const driveResponse = {
                    fileId,
                    reason: 'success',
                    message: 'Success',
                    data: driveFile,
                };
                resultSet.push(driveResponse);
            }
        });
        return resultSet;
    }
    catch (err) {
        logger.warn('safeParseMultipartMixed: Failed to parse the multipart/mixed response', err);
        return;
    }
}
exports.safeParseMultipartMixed = safeParseMultipartMixed;
async function batchGetFiles(trc, httpClient, accessToken, resourceIds) {
    const batchGetFilePromises = [];
    const batchedResourceIds = conduit_utils_1.chunkArray(resourceIds, batchSize);
    batchedResourceIds.forEach(fileIdChunk => {
        const boundary = `batch_${conduit_utils_1.uuid()}`;
        let batchBody = `--${boundary}\r\n`;
        fileIdChunk.forEach(fileId => {
            batchBody += 'Content-Type: application/http\r\n';
            batchBody += `Content-Id: ${fileId}\r\n`;
            batchBody += '\r\n';
            batchBody += `GET ${googleDrivePath}${fileId}?${googleDriveFields}\r\n`;
            batchBody += '\r\n';
            batchBody += `--${boundary}\r\n`;
        });
        batchBody = `${batchBody.substr(0, batchBody.length - 2)}--`;
        // Each batch request here needs to be its own '.../batch/drive/v3' HTTP POST
        const batchHttpRequest = {
            method: 'POST',
            url: `${googleDriveUrl}`,
            path: `${GoogleDriveBatchPath}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/mixed; boundary=${boundary}`,
            },
            body: batchBody,
        };
        const batchGetFile = new Promise(async (resolve) => {
            const response = await httpClient.request(trc, batchHttpRequest);
            const parsedResponse = safeParseMultipartMixed(response.result);
            resolve(parsedResponse);
        });
        batchGetFilePromises.push(batchGetFile);
    });
    const aggResults = await conduit_utils_1.allSettled(batchGetFilePromises);
    return conduit_utils_1.deepFlattenArray(aggResults);
}
async function getFiles(trc, httpClient, accessToken, resourceIds) {
    const freshResourceIds = [];
    const driveResponses = [];
    resourceIds.forEach(fileId => {
        const cachedResponse = cache.get(fileId);
        if (cachedResponse) {
            driveResponses.push(cachedResponse);
        }
        else {
            freshResourceIds.push(fileId);
        }
    });
    const batchedResponses = await batchGetFiles(trc, httpClient, accessToken, freshResourceIds);
    batchedResponses.forEach(response => {
        cache.put(response.fileId, response);
    });
    return driveResponses.concat(batchedResponses);
}
exports.getFiles = getFiles;
//# sourceMappingURL=GoogleDrive.js.map