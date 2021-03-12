const assert = require('assert');
const types = require('util').types || {
  // approximate polyfill for Node.js < 10
  isExternal(x: any): boolean {
    return Object.prototype.toString.call(x) === '[object Object]';
  }
};

var path = require('path')
const native = require('en-node-gyp-build')(__dirname + '\\..', path.dirname(process.execPath) + "\\resources\\app.asar.unpacked\\node_modules\\native-reg");

// from winreg.h
export enum HKEY {
  CLASSES_ROOT                   = 0x80000000,
  CURRENT_USER                   = 0x80000001,
  LOCAL_MACHINE                  = 0x80000002,
  USERS                          = 0x80000003,
  PERFORMANCE_DATA               = 0x80000004,
  PERFORMANCE_TEXT               = 0x80000050,
  PERFORMANCE_NLSTEXT            = 0x80000060,
  CURRENT_CONFIG                 = 0x80000005,
  DYN_DATA                       = 0x80000006,
  CURRENT_USER_LOCAL_SETTINGS    = 0x80000007,
}

export enum CreateKeyOptions {
  NON_VOLATILE = 0,
  VOLATILE = 1,
  CREATE_LINK = 2,
  BACKUP_RESTORE = 4,
}

export enum OpenKeyOptions {
  OPEN_LINK = 8,
}

// from https://docs.microsoft.com/en-nz/windows/desktop/SysInfo/registry-key-security-and-access-rights
export enum Access {
  // Specific rights
  QUERY_VALUE         = 0x0001,
  SET_VALUE           = 0x0002,
  CREATE_SUB_KEY      = 0x0004,
  ENUMERATE_SUB_KEYS  = 0x0008,
  NOTIFY              = 0x0010,
  CREATE_LINK         = 0x0020,

  // WOW64. See https://docs.microsoft.com/en-nz/windows/desktop/WinProg64/accessing-an-alternate-registry-view
  WOW64_64KEY         = 0x0100,
  WOW64_32KEY         = 0x0200,

  // Generic rights.
  READ              = 0x2_0019,
  WRITE             = 0x2_0006,
  EXECUTE           = READ,

  ALL_ACCESS        = 0xF_003F,
}

// from winnt.h
export enum ValueType  {
  NONE                       = 0, // No value type
  SZ                         = 1, // Unicode nul terminated string
  EXPAND_SZ                  = 2, // Unicode nul terminated string
                                  // (with environment variable references)
  BINARY                     = 3, // Free form binary
  DWORD                      = 4, // 32-bit number
  DWORD_LITTLE_ENDIAN        = 4, // 32-bit number (same as REG_DWORD)
  DWORD_BIG_ENDIAN           = 5, // 32-bit number
  LINK                       = 6, // Symbolic Link (unicode)
  MULTI_SZ                   = 7, // Multiple Unicode strings
  RESOURCE_LIST              = 8, // Resource list in the resource map
  FULL_RESOURCE_DESCRIPTOR   = 9, // Resource list in the hardware description
  RESOURCE_REQUIREMENTS_LIST = 10,
  QWORD                      = 11, // 64-bit number
  QWORD_LITTLE_ENDIAN        = 11, // 64-bit number (same as REG_QWORD)
}

// From RegGetValue docs
export enum GetValueFlags {
  RT_ANY = 0xffff,
  RT_REG_NONE = 0x0001,
  RT_REG_SZ = 0x0002,
  RT_REG_EXPAND_SZ = 0x0004,
  RT_REG_BINARY = 0x0008,
  RT_REG_DWORD = 0x0010,
  RT_REG_MULTI_SZ = 0x0020,
  RT_REG_QWORD = 0x0040,
  RT_DWORD = RT_REG_DWORD | RT_REG_BINARY,
  RT_QWORD = RT_REG_QWORD | RT_REG_BINARY,

  NO_EXPAND = 0x10000000,
  // ZEROONFAILURE = 0x20000000, // doesn't make sense here
  SUBKEY_WOW6464KEY = 0x00010000,
  SUBKEY_WOW6432KEY = 0x00020000,
}

export const HKCR = HKEY.CLASSES_ROOT;
export const HKCU = HKEY.CURRENT_USER;
export const HKLM = HKEY.LOCAL_MACHINE;
export const HKU = HKEY.USERS;

export type Value = Buffer & { type: ValueType };

export function isHKEY(hkey: any): hkey is HKEY {
  return (
    hkey instanceof native.HKEY ||
    typeof hkey === "number" &&
      hkey !== 0 &&
      hkey === (hkey >>> 0) || // checks value is a positive uint32
    types.isExternal(hkey)
  );
}

// Raw APIs

export function createKey(
  hkey: HKEY,
  subKey: string,
  access: Access,
  options: CreateKeyOptions = 0,
): HKEY {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  assert(typeof options === 'number');
  assert(typeof access === 'number');
  return native.createKey(hkey, subKey, options, access);
}

export function openKey(
  hkey: HKEY,
  subKey: string,
  access: Access,
  options: OpenKeyOptions = 0,
): HKEY | null {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  assert(typeof options === 'number');
  assert(typeof access === 'number');
  return native.openKey(hkey, subKey, options, access);
}

export function openCurrentUser(access: Access = Access.ALL_ACCESS): HKEY {
  assert(typeof access === 'number');
  return native.openCurrentUser(access);
}

export function loadAppKey(file: string, access: Access): HKEY | null {
  assert(typeof file === 'string');
  assert(typeof access === 'number');
  return native.loadAppKey(file, access);
}

export function enumKeyNames(hkey: HKEY): string[] {
  assert(isHKEY(hkey));
  return native.enumKeyNames(hkey);
}

export function enumValueNames(hkey: HKEY): string[] {
  assert(isHKEY(hkey));
  return native.enumValueNames(hkey);
}

export function queryValueRaw(hkey: HKEY, valueName: string): Value | null {
  assert(isHKEY(hkey));
  assert(typeof valueName === 'string');
  return native.queryValue(hkey, valueName);
}

export function getValueRaw(
  hkey: HKEY,
  subKey: string,
  valueName: string,
  flags: GetValueFlags = 0,
): Value | null {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  assert(typeof valueName === 'string');
  assert(typeof flags === 'number');
  if ((flags & GetValueFlags.RT_ANY) === 0) {
    flags |= GetValueFlags.RT_ANY;
  }
  return native.getValue(hkey, subKey, valueName, flags);
}

export function setValueRaw(
  hkey: HKEY,
  valueName: string,
  valueType: ValueType,
  data: Buffer,
): void {
  assert(isHKEY(hkey));
  assert(typeof valueName === 'string');
  assert(typeof valueType === 'number');
  assert(Buffer.isBuffer(data));
  native.setValue(hkey, valueName, valueType, data);
}

export function deleteKey(hkey: HKEY, subKey: string): boolean {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  return native.deleteKey(hkey, subKey);
}

export function deleteTree(hkey: HKEY, subKey: string): boolean {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  return native.deleteTree(hkey, subKey);
}

export function deleteKeyValue(
  hkey: HKEY,
  subKey: string,
  valueName: string,
): boolean {
  assert(isHKEY(hkey));
  assert(typeof subKey === 'string');
  assert(typeof valueName === 'string');
  return native.deleteKeyValue(hkey, subKey, valueName);
}

export function deleteValue(hkey: HKEY, valueName: string): boolean {
  assert(isHKEY(hkey));
  assert(typeof valueName === 'string');
  return native.deleteValue(hkey, valueName);
}

export function closeKey(hkey: HKEY | null | undefined): void {
  if (hkey == null) return; // nicely handle uninitialized
  assert(isHKEY(hkey));
  native.closeKey(hkey);
}

// Format helpers

export type ParsedValue = number | string | string[] | Buffer;

export function parseValue(value: Value | null): ParsedValue | null {
  if (value === null) {
    return null;
  }
  switch (value.type) {
    default:
      throw new Error(`Unhandled reg value type: ${value.type}`);
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

export function parseString(value: Buffer): string {
  // https://docs.microsoft.com/en-us/windows/desktop/api/Winreg/nf-winreg-regqueryvalueexw
  // Remarks: "The string may not have been stored with the proper terminating null characters"
  if (value.length >= 2 && !value[value.length - 2] && !value[value.length - 1]) {
    value = value.slice(0, -2);
  }
  return value.toString('ucs-2');
}

export function parseMultiString(value: Buffer) {
  return value.slice(0, -4).toString('ucs-2').split('\0');
}

export function formatString(value: string): Buffer {
  return Buffer.from(value + '\0', 'ucs-2')
}

export function formatMultiString(values: string[]): Buffer {
  return Buffer.from(values.join('\0') + '\0', 'ucs-2')
}

export function formatDWORD(value: number): Buffer {
  const data = Buffer.alloc(4);
  data.writeUInt32LE(value, 0);
  return data;
}

export function formatQWORD(value: number): Buffer {
  const data = Buffer.alloc(8);
  data.writeUInt32LE(value & 0xFFFFFFFF, 0);
  data.writeUInt32LE(value >>> 32, 4);
  return data;
}

// Formatted APIs

export function setValueSZ(
  hkey: HKEY,
  valueName: string,
  value: string,
): void {
  setValueRaw(hkey, valueName, ValueType.SZ, formatString(value));
}

export function setValueEXPAND_SZ(
  hkey: HKEY,
  valueName: string,
  value: string,
): void {
  setValueRaw(hkey, valueName, ValueType.EXPAND_SZ, formatString(value));
}

export function setValueMULTI_SZ(
  hkey: HKEY,
  valueName: string,
  value: string[],
): void {
  setValueRaw(hkey, valueName, ValueType.MULTI_SZ, formatMultiString(value));
}

export function setValueDWORD(
  hkey: HKEY,
  valueName: string,
  value: number,
): void {
  setValueRaw(hkey, valueName, ValueType.DWORD, formatDWORD(value));
}

export function setValueQWORD(
  hkey: HKEY,
  valueName: string,
  value: number,
): void {
  setValueRaw(hkey, valueName, ValueType.QWORD, formatQWORD(value));
}

export function getValue(
  hkey: HKEY,
  subKey: string,
  valueName: string,
  flags: GetValueFlags = 0,
): ParsedValue | null {
  return parseValue(getValueRaw(hkey, subKey, valueName, flags));
}

export function queryValue(hkey: HKEY, valueName: string): ParsedValue | null {
  return parseValue(queryValueRaw(hkey, valueName));
}
