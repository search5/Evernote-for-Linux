"use strict";
/*
 * Copyright 2021-present Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslator = exports.Translated = void 0;
const const_1 = require("./const");
var Translated;
(function (Translated) {
    Translated[Translated["OPEN_NOTE_TITLE"] = 0] = "OPEN_NOTE_TITLE";
    Translated[Translated["OPEN_NOTE_UNTITLED"] = 1] = "OPEN_NOTE_UNTITLED";
    Translated[Translated["CREATE_NOTE_TITLE"] = 2] = "CREATE_NOTE_TITLE";
    Translated[Translated["CREATE_NOTE_UNTITLED"] = 3] = "CREATE_NOTE_UNTITLED";
    Translated[Translated["STARTS_AT"] = 4] = "STARTS_AT";
    Translated[Translated["ENDED_AT"] = 5] = "ENDED_AT";
    Translated[Translated["TIME_RANGE"] = 6] = "TIME_RANGE";
    Translated[Translated["ALL_DAY"] = 7] = "ALL_DAY";
})(Translated = exports.Translated || (exports.Translated = {}));
const Locales = {
    EN: 'en',
    DE: 'de',
    ES: 'es',
    FR: 'fr',
    PT_BR: 'pt_br',
    JA: 'ja',
    KO: 'ko',
};
const data = {
    [Locales.EN]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Create note for \"${t}\"`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Open note for \"${t}\"`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `Create note for untitled event`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `Open note for untitled event`,
        [Translated.STARTS_AT]: (t) => `Starts at ${t}`,
        [Translated.ENDED_AT]: (t) => `Ended at ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `All day`,
    },
    [Locales.DE]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Notiz erstellen für „${t}“`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Notiz öffnen für „${t}“`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `Notiz für unbenannten Termin erstellen`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `Notiz für unbenannten Termin öffnen`,
        [Translated.STARTS_AT]: (t) => `Beginn um ${t}`,
        [Translated.ENDED_AT]: (t) => `Ende um ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s}–${e}`,
        [Translated.ALL_DAY]: () => `Ganztägig`,
    },
    [Locales.ES]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Crear nota para \"${t}\"`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Abrir nota para \"${t}\"`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `Crear nota para un evento sin título`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `Abrir nota para evento sin título`,
        [Translated.STARTS_AT]: (t) => `Empieza a las ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminó a las ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} – ${e}`,
        [Translated.ALL_DAY]: () => `Todo el día`,
    },
    [Locales.FR]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Créer une note pour « ${t} »`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Ouvrir une note pour ${t}`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `Créer une note pour un événement sans titre`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `Ouvrir une note pour un événement sans titre`,
        [Translated.STARTS_AT]: (t) => `Commence à ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminé à ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `Toute la journée`,
    },
    [Locales.PT_BR]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Criar nota para \"${t}\"`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Abrir nota para \"${t}\"`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `Criar nota para evento sem título`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `Abrir nota para evento sem título`,
        [Translated.STARTS_AT]: (t) => `Começa às ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminou às ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `Dia todo`,
    },
    [Locales.JA]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `「${t}」のノートを作成`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `「${t}」のノートを開く`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `無題のイベントのノートを作成`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `無題のイベントのノートを開く`,
        [Translated.STARTS_AT]: (t) => `${t} から`,
        [Translated.ENDED_AT]: (t) => `${t} に終了`,
        [Translated.TIME_RANGE]: (s, e) => `${s} ～ ${e}`,
        [Translated.ALL_DAY]: () => `終日`,
    },
    [Locales.KO]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `\"${t}\"의 노트 만들기`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `\"${t}\"의 노트 열기`,
        [Translated.CREATE_NOTE_UNTITLED]: () => `제목 없는 이벤트를 위한 노트 만들기`,
        [Translated.OPEN_NOTE_UNTITLED]: () => `제목 없는 이벤트를 위한 노트 열기`,
        [Translated.STARTS_AT]: (t) => `${t}에 시작`,
        [Translated.ENDED_AT]: (t) => `${t}에 종료`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `하루 종일`,
    },
};
function getTranslator(key, locale, logger) {
    const d = data[locale] ? data[locale] : data[const_1.DEFAULT_LOCALE];
    if (!d[key]) {
        if (logger) {
            logger.warn(`No translation found for key ${key} for locale ${locale}`);
        }
        return () => '';
    }
    else {
        return d[key];
    }
}
exports.getTranslator = getTranslator;
//# sourceMappingURL=data.js.map