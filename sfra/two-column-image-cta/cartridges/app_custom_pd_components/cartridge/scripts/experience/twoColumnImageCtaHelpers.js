/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var THEME_COLORS = {
    theme_primary: 'var(--skin-primary-color-1, #0070d2)',
    theme_primary_inverse: 'var(--skin-primary-color-invert-1, #ffffff)',
    theme_heading: 'var(--skin-heading-color-1, var(--skin-primary-color-1, #0070d2))',
    theme_heading_inverse: 'var(--skin-heading-color-1-invert, #ffffff)',
    theme_banner: 'var(--skin-banner-background-color-1, var(--skin-primary-color-1, #0070d2))',
    theme_banner_text: 'var(--skin-banner-text-color-1, #ffffff)',
    theme_background: 'var(--skin-background-color-1, #ffffff)',
    theme_text: 'var(--skin-main-text-color-1, #222222)',
    theme_link: 'var(--skin-link-color-1, var(--skin-primary-color-1, #0070d2))',
    transparent: 'transparent'
};

/**
 * Reads merchant-defined color strings and legacy color-picker values.
 * @param {Object|string|null} colorAttribute Page Designer color attribute
 * @returns {string} raw color value or an empty string
 */
function getColorValue(colorAttribute) {
    if (!colorAttribute) {
        return '';
    }

    if (typeof colorAttribute === 'string') {
        return colorAttribute.trim();
    }

    if (typeof colorAttribute.value === 'string') {
        return colorAttribute.value.trim();
    }

    if (typeof colorAttribute.color === 'string') {
        return colorAttribute.color.trim();
    }

    return '';
}

/**
 * Allows color values without allowing arbitrary CSS declarations.
 * @param {string} value CSS color candidate
 * @returns {boolean} whether the value can be printed in a CSS custom property
 */
function isSafeCssColor(value) {
    if (!value || typeof value !== 'string') {
        return false;
    }

    var color = value.trim();

    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
        return color.length === 4 || color.length === 5 || color.length === 7 || color.length === 9;
    }

    if (/^(transparent|currentcolor|inherit)$/i.test(color)) {
        return true;
    }

    if (/^[a-z]+$/i.test(color)) {
        return true;
    }

    if (/^(rgb|rgba|hsl|hsla)\(\s*[-+0-9.,%/\s]+\)$/i.test(color)) {
        return true;
    }

    return /^var\(\s*--[a-z0-9_-]+\s*(,\s*(#[0-9a-f]{3,8}|[a-z]+))?\s*\)$/i.test(color);
}

/**
 * Resolves a semantic theme preset, with a safe merchant-defined override.
 * @param {string} preset selected preset
 * @param {Object|string|null} customColor merchant-defined color value
 * @param {string} fallbackPreset semantic fallback
 * @returns {string} safe CSS color
 */
function resolveColor(preset, customColor, fallbackPreset) {
    var fallback = THEME_COLORS[fallbackPreset] || THEME_COLORS.theme_text;
    var selectedPreset = preset || fallbackPreset;

    if (selectedPreset === 'custom') {
        var colorValue = getColorValue(customColor);
        return isSafeCssColor(colorValue) ? colorValue : fallback;
    }

    return THEME_COLORS[selectedPreset] || fallback;
}

/**
 * Converts a Page Designer focal point coordinate to a CSS percentage.
 * Official values are fractions (0..1); 0..100 is accepted for older content.
 * @param {number} value focal point coordinate
 * @returns {number} percentage between 0 and 100
 */
function toPercent(value) {
    if (value === null || typeof value === 'undefined') {
        return 50;
    }

    var numberValue = Number(value);
    if (numberValue !== numberValue) {
        return 50;
    }

    var percentage = numberValue <= 1 ? numberValue * 100 : numberValue;
    var clamped = Math.max(0, Math.min(100, percentage));

    return Math.round(clamped * 100) / 100;
}

/**
 * @param {Object|null} image dw.experience.image.Image
 * @returns {Object} focal point percentages
 */
function getFocalPoint(image) {
    var focalPoint = image && image.focalPoint;

    return {
        x: toPercent(focalPoint && focalPoint.x),
        y: toPercent(focalPoint && focalPoint.y)
    };
}

/**
 * Keeps merchant-controlled enum values out of CSS class names.
 * @param {string} value selected value
 * @param {Array} allowedValues allowlist
 * @param {string} fallback fallback value
 * @returns {string} safe value
 */
function allowEnum(value, allowedValues, fallback) {
    return allowedValues.indexOf(value) > -1 ? value : fallback;
}

/**
 * @param {string} value component ID
 * @returns {string} safe HTML ID
 */
function toHtmlId(value) {
    return String(value || 'component').replace(/[^a-z0-9_-]/gi, '-');
}

module.exports = {
    THEME_COLORS: THEME_COLORS,
    getColorValue: getColorValue,
    isSafeCssColor: isSafeCssColor,
    resolveColor: resolveColor,
    toPercent: toPercent,
    getFocalPoint: getFocalPoint,
    allowEnum: allowEnum,
    toHtmlId: toHtmlId
};
