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

(function (root, factory) {
    'use strict';

    var colorPicker = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = colorPicker;
    }

    if (root && root.document) {
        colorPicker.init();
    }
}(typeof window !== 'undefined' ? window : null, function (root) {
    'use strict';

    var DEFAULT_PALETTE = [
        '#00A1E0',
        '#444444',
        '#222222',
        '#FFFFFF',
        '#F9F9F9',
        '#0070D2',
        '#008827',
        '#CC0000'
    ];

    var state = {
        rootElement: null,
        nativeInput: null,
        valueInput: null,
        clearButton: null,
        paletteElement: null,
        messageElement: null,
        disabled: false,
        required: false,
        currentValue: ''
    };

    function extractValue(value) {
        if (typeof value === 'string') {
            return value.trim();
        }

        if (value && typeof value.value === 'string') {
            return value.value.trim();
        }

        if (value && typeof value.color === 'string') {
            return value.color.trim();
        }

        return '';
    }

    function normalizeHex(value) {
        var trimmed = typeof value === 'string' ? value.trim() : '';
        var shortMatch = /^#([0-9a-f]{3})$/i.exec(trimmed);

        if (shortMatch) {
            return ('#' + shortMatch[1].split('').map(function (character) {
                return character + character;
            }).join('')).toUpperCase();
        }

        if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
            return trimmed.toUpperCase();
        }

        return '';
    }

    function normalizeValue(value) {
        var trimmed = typeof value === 'string' ? value.trim() : '';
        var normalizedHex = normalizeHex(trimmed);

        return normalizedHex || trimmed;
    }

    function isValidCssColor(value) {
        var trimmed = typeof value === 'string' ? value.trim() : '';

        if (!trimmed) {
            return true;
        }

        return /^#[0-9a-f]{3,8}$/i.test(trimmed)
            || /^(transparent|currentcolor|inherit)$/i.test(trimmed)
            || /^[a-z]+$/i.test(trimmed)
            || /^(rgb|rgba|hsl|hsla)\(\s*[-+0-9.,%/\s]+\)$/i.test(trimmed)
            || /^var\(\s*--[a-z0-9_-]+\s*(,\s*(#[0-9a-f]{3,8}|[a-z]+))?\s*\)$/i.test(trimmed);
    }

    function getSubscriptionFunction() {
        if (root && typeof root.subscribe === 'function') {
            return root.subscribe;
        }

        if (root && typeof root.listen === 'function') {
            return root.listen;
        }

        return null;
    }

    function emitEvent(type, payload) {
        if (!root || typeof root.emit !== 'function') {
            return;
        }

        var event = { type: type };
        if (arguments.length > 1) {
            event.payload = payload;
        }
        root.emit(event);
    }

    function validityFor(value) {
        if (!value && state.required) {
            return {
                valid: false,
                message: 'Choose a color.'
            };
        }

        if (value && !isValidCssColor(value)) {
            return {
                valid: false,
                message: 'Enter a valid CSS color, for example #0057B8.'
            };
        }

        return { valid: true, message: '' };
    }

    function updateValidity(value, shouldEmit) {
        var validity = validityFor(value);

        state.valueInput.setAttribute('aria-invalid', validity.valid ? 'false' : 'true');
        state.messageElement.textContent = validity.message;

        if (shouldEmit) {
            emitEvent('sfcc:valid', validity);
        }

        return validity.valid;
    }

    function updateSelectedSwatch(value) {
        var normalized = normalizeHex(value);
        var swatches = state.paletteElement.querySelectorAll('.pd-color-picker__swatch');

        Array.prototype.forEach.call(swatches, function (swatch) {
            swatch.setAttribute(
                'aria-pressed',
                normalized && swatch.getAttribute('data-color') === normalized ? 'true' : 'false'
            );
        });
    }

    function updateNativeInput(value) {
        var normalized = normalizeHex(value);
        if (normalized) {
            state.nativeInput.value = normalized.toLowerCase();
        }
    }

    function renderValue(value) {
        var normalized = normalizeValue(value);

        state.currentValue = normalized;
        state.valueInput.value = normalized;
        updateNativeInput(normalized);
        updateSelectedSwatch(normalized);
        updateValidity(normalized, false);
    }

    function commitValue(value) {
        var normalized = normalizeValue(value);
        var valid;

        renderValue(normalized);
        valid = updateValidity(normalized, true);
        emitEvent('sfcc:interacted');

        if (valid) {
            emitEvent('sfcc:value', normalized ? { value: normalized } : null);
        }
    }

    function setDisabled(disabled) {
        state.disabled = Boolean(disabled);
        state.rootElement.classList.toggle('pd-color-picker--disabled', state.disabled);
        state.nativeInput.disabled = state.disabled;
        state.valueInput.disabled = state.disabled;
        state.clearButton.disabled = state.disabled;

        Array.prototype.forEach.call(
            state.paletteElement.querySelectorAll('.pd-color-picker__swatch'),
            function (swatch) {
                swatch.disabled = state.disabled;
            }
        );
    }

    function paletteFromConfig(config) {
        if (!config || !Array.isArray(config.palette)) {
            return DEFAULT_PALETTE.slice();
        }

        var palette = config.palette.map(function (color) {
            return normalizeHex(extractValue(color));
        }).filter(Boolean);

        return palette.length ? palette : DEFAULT_PALETTE.slice();
    }

    function renderPalette(colors) {
        state.paletteElement.innerHTML = '';

        colors.forEach(function (color) {
            var swatch = root.document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'pd-color-picker__swatch';
            swatch.style.backgroundColor = color;
            swatch.setAttribute('data-color', color);
            swatch.setAttribute('aria-label', 'Use color ' + color);
            swatch.setAttribute('aria-pressed', 'false');
            swatch.title = color;
            swatch.addEventListener('click', function () {
                commitValue(color);
            });
            state.paletteElement.appendChild(swatch);
        });

        setDisabled(state.disabled);
        updateSelectedSwatch(state.currentValue);
    }

    function createMarkup() {
        var editor = root.document.createElement('div');

        editor.className = 'pd-color-picker';
        editor.innerHTML = [
            '<div class="pd-color-picker__controls">',
            '  <label class="pd-color-picker__assistive" for="pd-color-picker-native">Visual color picker</label>',
            '  <input class="pd-color-picker__native" id="pd-color-picker-native" type="color" value="#00a1e0" title="Open color picker">',
            '  <label class="pd-color-picker__assistive" for="pd-color-picker-value">CSS color</label>',
            '  <input class="pd-color-picker__value" id="pd-color-picker-value" type="text" autocomplete="off" spellcheck="false" placeholder="#0057B8" aria-describedby="pd-color-picker-message">',
            '  <button class="pd-color-picker__clear" type="button">Clear</button>',
            '</div>',
            '<span class="pd-color-picker__palette-label">SFRA quick palette</span>',
            '<div class="pd-color-picker__palette" role="group" aria-label="Quick palette"></div>',
            '<p class="pd-color-picker__message" id="pd-color-picker-message" role="alert"></p>'
        ].join('');

        root.document.body.appendChild(editor);

        state.rootElement = editor;
        state.nativeInput = editor.querySelector('.pd-color-picker__native');
        state.valueInput = editor.querySelector('.pd-color-picker__value');
        state.clearButton = editor.querySelector('.pd-color-picker__clear');
        state.paletteElement = editor.querySelector('.pd-color-picker__palette');
        state.messageElement = editor.querySelector('.pd-color-picker__message');

        state.nativeInput.addEventListener('input', function (event) {
            commitValue(event.target.value);
        });
        state.valueInput.addEventListener('input', function (event) {
            var value = event.target.value;
            state.currentValue = value;
            updateNativeInput(value);
            updateSelectedSwatch(value);
            updateValidity(value, true);

            if (validityFor(value).valid) {
                emitEvent('sfcc:interacted');
                emitEvent('sfcc:value', value.trim() ? { value: normalizeValue(value) } : null);
            }
        });
        state.valueInput.addEventListener('blur', function () {
            renderValue(state.valueInput.value);
        });
        state.clearButton.addEventListener('click', function () {
            commitValue('');
        });
    }

    function subscribeToHost() {
        var subscribeTo = getSubscriptionFunction();

        if (!subscribeTo) {
            return;
        }

        subscribeTo('sfcc:ready', function (payload) {
            var ready = payload || {};

            state.required = Boolean(ready.isRequired);
            renderPalette(paletteFromConfig(ready.config));
            renderValue(extractValue(ready.value));
            setDisabled(Boolean(ready.isDisabled));
            updateValidity(state.currentValue, true);
        });

        subscribeTo('sfcc:value', function (value) {
            renderValue(extractValue(value));
        });

        subscribeTo('sfcc:required', function (required) {
            state.required = Boolean(required);
            updateValidity(state.currentValue, true);
        });

        subscribeTo('sfcc:disabled', function (disabled) {
            setDisabled(disabled);
        });
    }

    function init() {
        createMarkup();
        renderPalette(DEFAULT_PALETTE);
        subscribeToHost();
    }

    return {
        DEFAULT_PALETTE: DEFAULT_PALETTE,
        extractValue: extractValue,
        normalizeHex: normalizeHex,
        normalizeValue: normalizeValue,
        isValidCssColor: isValidCssColor,
        init: init
    };
}));
