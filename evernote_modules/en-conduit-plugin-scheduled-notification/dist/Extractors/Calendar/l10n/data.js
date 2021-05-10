"use strict";
/*!
 * Copyright 2021 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslator = exports.Translated = void 0;
/**
 * This is a temporary, stop gap solution to support Beta of Calendar Integration
 * longer term solution to follow shortly after.
 * See: https://evernote.jira.com/browse/GRIN-981
 */
const conduit_utils_1 = require("conduit-utils");
const const_1 = require("../../shared/const");
var Translated;
(function (Translated) {
    Translated[Translated["OPEN_NOTE_TITLE"] = 0] = "OPEN_NOTE_TITLE";
    Translated[Translated["CREATE_NOTE_TITLE"] = 1] = "CREATE_NOTE_TITLE";
    Translated[Translated["STARTS_AT"] = 2] = "STARTS_AT";
    Translated[Translated["ENDED_AT"] = 3] = "ENDED_AT";
    Translated[Translated["TIME_RANGE"] = 4] = "TIME_RANGE";
    Translated[Translated["ALL_DAY"] = 5] = "ALL_DAY";
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
        [Translated.STARTS_AT]: (t) => `Starts at ${t}`,
        [Translated.ENDED_AT]: (t) => `Ended at ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `All day`,
    },
    [Locales.DE]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Notiz erstellen für „${t}“`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Notiz öffnen für „${t}“`,
        [Translated.STARTS_AT]: (t) => `Beginn um ${t}`,
        [Translated.ENDED_AT]: (t) => `Ende um ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s}–${e}`,
        [Translated.ALL_DAY]: () => `Ganztägig`,
    },
    [Locales.ES]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Crear nota para \"${t}\"`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Abrir nota para \"${t}\"`,
        [Translated.STARTS_AT]: (t) => `Empieza a las ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminó a las ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} – ${e}`,
        [Translated.ALL_DAY]: () => `Todo el día`,
    },
    [Locales.FR]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Créer une note pour « ${t} »`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Ouvrir une note pour ${t}`,
        [Translated.STARTS_AT]: (t) => `Commence à ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminé à ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `Toute la journée`,
    },
    [Locales.PT_BR]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `Criar nota para \"${t}\"`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `Abrir nota para \"${t}\"`,
        [Translated.STARTS_AT]: (t) => `Começa às ${t}`,
        [Translated.ENDED_AT]: (t) => `Terminou às ${t}`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `Dia todo`,
    },
    [Locales.JA]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `「${t}」のノートを作成`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `「${t}」のノートを開く`,
        [Translated.STARTS_AT]: (t) => `${t} から`,
        [Translated.ENDED_AT]: (t) => `${t} に終了`,
        [Translated.TIME_RANGE]: (s, e) => `${s} ～ ${e}`,
        [Translated.ALL_DAY]: () => `終日`,
    },
    [Locales.KO]: {
        [Translated.CREATE_NOTE_TITLE]: (t) => `\"${t}\"의 노트 만들기`,
        [Translated.OPEN_NOTE_TITLE]: (t) => `\"${t}\"의 노트 열기`,
        [Translated.STARTS_AT]: (t) => `${t}에 시작`,
        [Translated.ENDED_AT]: (t) => `${t}에 종료`,
        [Translated.TIME_RANGE]: (s, e) => `${s} - ${e}`,
        [Translated.ALL_DAY]: () => `하루 종일`,
    },
};
function getTranslator(key, locale) {
    const d = data[locale] ? data[locale] : data[const_1.DEFAULT_LOCALE];
    if (!d[key]) {
        conduit_utils_1.logger.warn(`No translation found for key ${key} for locale ${locale}`);
        return () => '';
    }
    else {
        return d[key];
    }
}
exports.getTranslator = getTranslator;
//# sourceMappingURL=data.js.map