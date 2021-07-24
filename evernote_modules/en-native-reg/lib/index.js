"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require('assert');
var types = require('util').types || {
    // approximate polyfill for Node.js < 10
    isExternal: function (x) {
        return Object.prototype.toString.call(x) === '[object Object]';
    }
};
var path = require('path');
var native = require('en-node-gyp-build')(__dirname + '\\..', path.dirname(process.execPath) + "\\resources\\app.asar.unpacked\\node_modules\\native-reg");
// from winreg.h
var HKEY;
(function (HKEY) {
    HKEY[HKEY["CLASSES_ROOT"] = 2147483648] = "CLASSES_ROOT";
    HKEY[HKEY["CURRENT_USER"] = 2147483649] = "CURRENT_USER";
    HKEY[HKEY["LOCAL_MACHINE"] = 2147483650] = "LOCAL_MACHINE";
    HKEY[HKEY["USERS"] = 2147483651] = "USERS";
    HKEY[HKEY["PERFORMANCE_DATA"] = 2147483652] = "PERFORMANCE_DATA";
    HKEY[HKEY["PERFORMANCE_TEXT"] = 2147483728] = "PERFORMANCE_TEXT";
    HKEY[HKEY["PERFORMANCE_NLSTEXT"] = 2147483744] = "PERFORMANCE_NLSTEXT";
    HKEY[HKEY["CURRENT_CONFIG"] = 2147483653] = "CURRENT_CONFIG";
    HKEY[HKEY["DYN_DATA"] = 2147483654] = "DYN_DATA";
    HKEY[HKEY["CURRENT_USER_LOCAL_SETTINGS"] = 2147483655] = "CURRENT_USER_LOCAL_SETTINGS";
})(HKEY = exports.HKEY || (exports.HKEY = {}));
var CreateKeyOptions;
(function (CreateKeyOptions) {
    CreateKeyOptions[CreateKeyOptions["NON_VOLATILE"] = 0] = "NON_VOLATILE";
    CreateKeyOptions[CreateKeyOptions["VOLATILE"] = 1] = "VOLATILE";
    CreateKeyOptions[CreateKeyOptions["CREATE_LINK"] = 2] = "CREATE_LINK";
    CreateKeyOptions[CreateKeyOptions["BACKUP_RESTORE"] = 4] = "BACKUP_RESTORE";
})(CreateKeyOptions = exports.CreateKeyOptions || (exports.CreateKeyOptions = {}));
var OpenKeyOptions;
(function (OpenKeyOptions) {
    OpenKeyOptions[OpenKeyOptions["OPEN_LINK"] = 8] = "OPEN_LINK";
})(OpenKeyOptions = exports.OpenKeyOptions || (exports.OpenKeyOptions = {}));
// from https://docs.microsoft.com/en-nz/windows/desktop/SysInfo/registry-key-security-and-access-rights
var Access;
(function (Access) {
    // Specific rights
    Access[Access["QUERY_VALUE"] = 1] = "QUERY_VALUE";
    Access[Access["SET_VALUE"] = 2] = "SET_VALUE";
    Access[Access["CREATE_SUB_KEY"] = 4] = "CREATE_SUB_KEY";
    Access[Access["ENUMERATE_SUB_KEYS"] = 8] = "ENUMERATE_SUB_KEYS";
    Access[Access["NOTIFY"] = 16] = "NOTIFY";
    Access[Access["CREATE_LINK"] = 32] = "CREATE_LINK";
    // WOW64. See https://docs.microsoft.com/en-nz/windows/desktop/WinProg64/accessing-an-alternate-registry-view
    Access[Access["WOW64_64KEY"] = 256] = "WOW64_64KEY";
    Access[Access["WOW64_32KEY"] = 512] = "WOW64_32KEY";
    // Generic rights.
    Access[Access["READ"] = 131097] = "READ";
    Access[Access["WRITE"] = 131078] = "WRITE";
    Access[Access["EXECUTE"] = 131097] = "EXECUTE";
    Access[Access["ALL_ACCESS"] = 983103] = "ALL_ACCESS";
})(Access = exports.Access || (exports.Access = {}));
// from winnt.h
var ValueType;
(function (ValueType) {
    ValueType[ValueType["NONE"] = 0] = "NONE";
    ValueType[ValueType["SZ"] = 1] = "SZ";
    ValueType[ValueType["EXPAND_SZ"] = 2] = "EXPAND_SZ";
    // (with environment variable references)
    ValueType[ValueType["BINARY"] = 3] = "BINARY";
    ValueType[ValueType["DWORD"] = 4] = "DWORD";
    ValueType[ValueType["DWORD_LITTLE_ENDIAN"] = 4] = "DWORD_LITTLE_ENDIAN";
    ValueType[ValueType["DWORD_BIG_ENDIAN"] = 5] = "DWORD_BIG_ENDIAN";
    ValueType[ValueType["LINK"] = 6] = "LINK";
    ValueType[ValueType["MULTI_SZ"] = 7] = "MULTI_SZ";
    ValueType[ValueType["RESOURCE_LIST"] = 8] = "RESOURCE_LIST";
    ValueType[ValueType["FULL_RESOURCE_DESCRIPTOR"] = 9] = "FULL_RESOURCE_DESCRIPTOR";
    ValueType[ValueType["RESOURCE_REQUIREMENTS_LIST"] = 10] = "RESOURCE_REQUIREMENTS_LIST";
    ValueType[ValueType["QWORD"] = 11] = "QWORD";
    ValueType[ValueType["QWORD_LITTLE_ENDIAN"] = 11] = "QWORD_LITTLE_ENDIAN";
})(ValueType = exports.ValueType || (exports.ValueType = {}));
// From RegGetValue docs
var GetValueFlags;
(function (GetValueFlags) {
    GetValueFlags[GetValueFlags["RT_ANY"] = 65535] = "RT_ANY";
    GetValueFlags[GetValueFlags["RT_REG_NONE"] = 1] = "RT_REG_NONE";
    GetValueFlags[GetValueFlags["RT_REG_SZ"] = 2] = "RT_REG_SZ";
    GetValueFlags[GetValueFlags["RT_REG_EXPAND_SZ"] = 4] = "RT_REG_EXPAND_SZ";
    GetValueFlags[GetValueFlags["RT_REG_BINARY"] = 8] = "RT_REG_BINARY";
    GetValueFlags[GetValueFlags["RT_REG_DWORD"] = 16] = "RT_REG_DWORD";
    GetValueFlags[GetValueFlags["RT_REG_MULTI_SZ"] = 32] = "RT_REG_MULTI_SZ";
    GetValueFlags[GetValueFlags["RT_REG_QWORD"] = 64] = "RT_REG_QWORD";
    GetValueFlags[GetValueFlags["RT_DWORD"] = 24] = "RT_DWORD";
    GetValueFlags[GetValueFlags["RT_QWORD"] = 72] = "RT_QWORD";
    GetValueFlags[GetValueFlags["NO_EXPAND"] = 268435456] = "NO_EXPAND";
    // ZEROONFAILURE = 0x20000000, // doesn't make sense here
    GetValueFlags[GetValueFlags["SUBKEY_WOW6464KEY"] = 65536] = "SUBKEY_WOW6464KEY";
    GetValueFlags[GetValueFlags["SUBKEY_WOW6432KEY"] = 131072] = "SUBKEY_WOW6432KEY";
})(GetValueFlags = exports.GetValueFlags || (exports.GetValueFlags = {}));
exports.HKCR = HKEY.CLASSES_ROOT;
exports.HKCU = HKEY.CURRENT_USER;
exports.HKLM = HKEY.LOCAL_MACHINE;
exports.HKU = HKEY.USERS;
function isHKEY(hkey) {
    return (hkey instanceof native.HKEY ||
        typeof hkey === "number" &&
            hkey !== 0 &&
            hkey === (hkey >>> 0) || // checks value is a positive uint32
        types.isExternal(hkey));
}
exports.isHKEY = isHKEY;
// Raw APIs
function createKey(hkey, subKey, access, options) {
    if (options === void 0) { options = 0; }
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    assert(typeof options === 'number');
    assert(typeof access === 'number');
    return native.createKey(hkey, subKey, options, access);
}
exports.createKey = createKey;
function openKey(hkey, subKey, access, options) {
    if (options === void 0) { options = 0; }
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    assert(typeof options === 'number');
    assert(typeof access === 'number');
    return native.openKey(hkey, subKey, options, access);
}
exports.openKey = openKey;
function openCurrentUser(access) {
    if (access === void 0) { access = Access.ALL_ACCESS; }
    assert(typeof access === 'number');
    return native.openCurrentUser(access);
}
exports.openCurrentUser = openCurrentUser;
function loadAppKey(file, access) {
    assert(typeof file === 'string');
    assert(typeof access === 'number');
    return native.loadAppKey(file, access);
}
exports.loadAppKey = loadAppKey;
function enumKeyNames(hkey) {
    assert(isHKEY(hkey));
    return native.enumKeyNames(hkey);
}
exports.enumKeyNames = enumKeyNames;
function enumValueNames(hkey) {
    assert(isHKEY(hkey));
    return native.enumValueNames(hkey);
}
exports.enumValueNames = enumValueNames;
function queryValueRaw(hkey, valueName) {
    assert(isHKEY(hkey));
    assert(typeof valueName === 'string');
    return native.queryValue(hkey, valueName);
}
exports.queryValueRaw = queryValueRaw;
function getValueRaw(hkey, subKey, valueName, flags) {
    if (flags === void 0) { flags = 0; }
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    assert(typeof valueName === 'string');
    assert(typeof flags === 'number');
    if ((flags & GetValueFlags.RT_ANY) === 0) {
        flags |= GetValueFlags.RT_ANY;
    }
    return native.getValue(hkey, subKey, valueName, flags);
}
exports.getValueRaw = getValueRaw;
function setValueRaw(hkey, valueName, valueType, data) {
    assert(isHKEY(hkey));
    assert(typeof valueName === 'string');
    assert(typeof valueType === 'number');
    assert(Buffer.isBuffer(data));
    native.setValue(hkey, valueName, valueType, data);
}
exports.setValueRaw = setValueRaw;
function deleteKey(hkey, subKey) {
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    return native.deleteKey(hkey, subKey);
}
exports.deleteKey = deleteKey;
function deleteTree(hkey, subKey) {
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    return native.deleteTree(hkey, subKey);
}
exports.deleteTree = deleteTree;
function deleteKeyValue(hkey, subKey, valueName) {
    assert(isHKEY(hkey));
    assert(typeof subKey === 'string');
    assert(typeof valueName === 'string');
    return native.deleteKeyValue(hkey, subKey, valueName);
}
exports.deleteKeyValue = deleteKeyValue;
function deleteValue(hkey, valueName) {
    assert(isHKEY(hkey));
    assert(typeof valueName === 'string');
    return native.deleteValue(hkey, valueName);
}
exports.deleteValue = deleteValue;
function closeKey(hkey) {
    if (hkey == null)
        return; // nicely handle uninitialized
    assert(isHKEY(hkey));
    native.closeKey(hkey);
}
exports.closeKey = closeKey;
function parseValue(value) {
    if (value === null) {
        return null;
    }
    switch (value.type) {
        default:
            throw new Error("Unhandled reg value type: " + value.type);
        case ValueType.SZ:
        case ValueType.EXPAND_SZ:
            return parseString(value);
        case ValueType.BINARY:
            return value;
        case ValueType.DWORD_LITTLE_ENDIAN:
            return value.readUInt32LE(0);
        case ValueType.DWORD_BIG_ENDIAN:
            return value.readUInt32BE(0);
        case ValueType.MULTI_SZ:
            return parseMultiString(value);
    }
}
exports.parseValue = parseValue;
function parseString(value) {
    // https://docs.microsoft.com/en-us/windows/desktop/api/Winreg/nf-winreg-regqueryvalueexw
    // Remarks: "The string may not have been stored with the proper terminating null characters"
    if (value.length >= 2 && !value[value.length - 2] && !value[value.length - 1]) {
        value = value.slice(0, -2);
    }
    return value.toString('ucs-2');
}
exports.parseString = parseString;
function parseMultiString(value) {
    return value.slice(0, -4).toString('ucs-2').split('\0');
}
exports.parseMultiString = parseMultiString;
function formatString(value) {
    return Buffer.from(value + '\0', 'ucs-2');
}
exports.formatString = formatString;
function formatMultiString(values) {
    return Buffer.from(values.join('\0') + '\0', 'ucs-2');
}
exports.formatMultiString = formatMultiString;
function formatDWORD(value) {
    var data = Buffer.alloc(4);
    data.writeUInt32LE(value, 0);
    return data;
}
exports.formatDWORD = formatDWORD;
function formatQWORD(value) {
    var data = Buffer.alloc(8);
    data.writeUInt32LE(value & 0xFFFFFFFF, 0);
    data.writeUInt32LE(value >>> 32, 4);
    return data;
}
exports.formatQWORD = formatQWORD;
// Formatted APIs
function setValueSZ(hkey, valueName, value) {
    setValueRaw(hkey, valueName, ValueType.SZ, formatString(value));
}
exports.setValueSZ = setValueSZ;
function setValueEXPAND_SZ(hkey, valueName, value) {
    setValueRaw(hkey, valueName, ValueType.EXPAND_SZ, formatString(value));
}
exports.setValueEXPAND_SZ = setValueEXPAND_SZ;
function setValueMULTI_SZ(hkey, valueName, value) {
    setValueRaw(hkey, valueName, ValueType.MULTI_SZ, formatMultiString(value));
}
exports.setValueMULTI_SZ = setValueMULTI_SZ;
function setValueDWORD(hkey, valueName, value) {
    setValueRaw(hkey, valueName, ValueType.DWORD, formatDWORD(value));
}
exports.setValueDWORD = setValueDWORD;
function setValueQWORD(hkey, valueName, value) {
    setValueRaw(hkey, valueName, ValueType.QWORD, formatQWORD(value));
}
exports.setValueQWORD = setValueQWORD;
function getValue(hkey, subKey, valueName, flags) {
    if (flags === void 0) { flags = 0; }
    return parseValue(getValueRaw(hkey, subKey, valueName, flags));
}
exports.getValue = getValue;
function queryValue(hkey, valueName) {
    return parseValue(queryValueRaw(hkey, valueName));
}
exports.queryValue = queryValue;
//# sourceMappingURL=index.js.map