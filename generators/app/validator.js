/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var nameRegex = /^[a-z0-9][a-z0-9\-]*$/i;

/**
 * @param {string} publisher
 */
export function validatePublisher(publisher) {
    if (!publisher) {
        return "Missing publisher name";
    }

    if (!nameRegex.test(publisher)) {
        return "Invalid publisher name";
    }

    return true;
}

/**
 * @param {string} id
 */
export function validateExtensionId(id) {
    if (!id) {
        return "Missing extension identifier";
    }

    if (!nameRegex.test(id)) {
        return "Invalid extension identifier";
    }

    return true;
}

/**
 * @param {string | any[]} name
 */
export function validateNonEmpty(name) {
    return name && name.length > 0;
}

const illegalRe = /[\/\?<>\\:\*\|"]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const windowsTrailingRe = /[\. ]+$/;

/**
 * @param {string} input
 */
export function sanitizeFilename(input) {
    return input
        .replace(illegalRe, '')
        .replace(controlRe, '')
        .replace(reservedRe, '')
        .replace(windowsReservedRe, '')
        .replace(windowsTrailingRe, '');
};