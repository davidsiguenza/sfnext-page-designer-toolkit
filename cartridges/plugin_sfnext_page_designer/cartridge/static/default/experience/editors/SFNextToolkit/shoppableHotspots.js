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
/* global window */
(function initializeShoppableHotspotsEditor(root) {
    'use strict';

    if (!root || typeof root.subscribe !== 'function' || typeof root.emit !== 'function') return;

    var VERSION = 1;
    var DEFAULT_MAX_HOTSPOTS = 12;
    var PRODUCT_PICKER_ID = 'sfcc:productPicker';
    var document = root.document;
    var nextId = 1;
    var dragState = null;

    var state = {
        value: createDefaultValue(),
        disabled: false,
        required: true,
        maxHotspots: DEFAULT_MAX_HOTSPOTS,
        viewport: 'desktop',
        placing: false,
        localPreview: { desktop: '', mobile: '' },
    };

    function createDefaultValue() {
        return { version: VERSION, sourceMode: 'manual', hotspots: [] };
    }

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function parseIncomingValue(value) {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    function cleanString(value) {
        return typeof value === 'string' && value.trim() ? value.trim() : '';
    }

    function clamp(value, fallback) {
        var number = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(number)) return fallback === undefined ? 50 : fallback;
        return Math.round(Math.min(100, Math.max(0, number)) * 10) / 10;
    }

    function optionalCoordinate(value) {
        return value === undefined || value === null || value === '' ? undefined : clamp(value, 50);
    }

    function safePreviewUrl(value) {
        var url = cleanString(value);
        if (!url) return '';
        if (/^(https?:)?\/\//i.test(url) || url.charAt(0) === '/') return url;
        return '';
    }

    function normalizeValue(rawValue) {
        var source = parseIncomingValue(rawValue);
        if (isPlainObject(source) && !('hotspots' in source) && !('sourceMode' in source) && 'value' in source) {
            source = parseIncomingValue(source.value);
        }
        if (!isPlainObject(source)) return createDefaultValue();

        var hotspots = [];
        (Array.isArray(source.hotspots) ? source.hotspots : [])
            .slice(0, state.maxHotspots)
            .forEach(function (item, index) {
                if (!isPlainObject(item)) return;
                var productId = cleanString(item.productId);
                if (!productId) return;
                var mobileX = optionalCoordinate(item.mobileX);
                var mobileY = optionalCoordinate(item.mobileY);
                var hotspot = {
                    id: cleanString(item.id) || 'hotspot-' + (index + 1),
                    productId: productId,
                    x: clamp(item.x, 50),
                    y: clamp(item.y, 50),
                };
                if (cleanString(item.productName)) hotspot.productName = cleanString(item.productName);
                if (cleanString(item.label)) hotspot.label = cleanString(item.label);
                if (mobileX !== undefined) hotspot.mobileX = mobileX;
                if (mobileY !== undefined) hotspot.mobileY = mobileY;
                hotspots.push(hotspot);
            });

        var normalized = {
            version: VERSION,
            sourceMode: source.sourceMode === 'productSet' ? 'productSet' : 'manual',
            hotspots: hotspots,
        };
        if (cleanString(source.productSetId)) normalized.productSetId = cleanString(source.productSetId);
        if (safePreviewUrl(source.desktopPreviewUrl)) {
            normalized.desktopPreviewUrl = safePreviewUrl(source.desktopPreviewUrl);
        }
        if (safePreviewUrl(source.mobilePreviewUrl)) {
            normalized.mobilePreviewUrl = safePreviewUrl(source.mobilePreviewUrl);
        }
        return normalized;
    }

    function validation() {
        if (state.value.sourceMode === 'productSet' && !state.value.productSetId) {
            return { valid: false, message: 'Select a Product Set or switch to free selection.' };
        }
        if (state.required && state.value.hotspots.length === 0) {
            return { valid: false, message: 'Add at least one hotspot with a product.' };
        }
        if (state.value.hotspots.length > state.maxHotspots) {
            return { valid: false, message: 'A maximum of ' + state.maxHotspots + ' hotspots is allowed.' };
        }
        return { valid: true, message: '' };
    }

    function emitValidity() {
        root.emit({ type: 'sfcc:valid', payload: validation() });
    }

    function commit(renderAfter) {
        state.value = normalizeValue(state.value);
        root.emit({ type: 'sfcc:interacted' });
        root.emit({ type: 'sfcc:value', payload: state.value });
        emitValidity();
        if (renderAfter !== false) render();
    }

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function disabledAttribute() {
        return state.disabled ? ' disabled' : '';
    }

    function activeCoordinates(hotspot) {
        if (state.viewport === 'mobile') {
            return {
                x: hotspot.mobileX === undefined ? hotspot.x : hotspot.mobileX,
                y: hotspot.mobileY === undefined ? hotspot.y : hotspot.mobileY,
            };
        }
        return { x: hotspot.x, y: hotspot.y };
    }

    function previewUrl() {
        var local = state.localPreview[state.viewport];
        if (local) return local;
        if (state.viewport === 'mobile') {
            return state.value.mobilePreviewUrl || state.value.desktopPreviewUrl || '';
        }
        return state.value.desktopPreviewUrl || '';
    }

    function hotspotMarkup(hotspot, index) {
        var coordinates = activeCoordinates(hotspot);
        return [
            '<button type="button" class="hotspot-editor__point" data-hotspot-id="',
            escapeHtml(hotspot.id),
            '" style="left:',
            coordinates.x,
            '%;top:',
            coordinates.y,
            '%" aria-label="Hotspot ',
            index + 1,
            ', product ',
            escapeHtml(hotspot.productId),
            '"',
            disabledAttribute(),
            '><span>',
            index + 1,
            '</span></button>',
        ].join('');
    }

    function hotspotCardMarkup(hotspot, index) {
        var coordinates = activeCoordinates(hotspot);
        var coordinatePrefix = state.viewport === 'mobile' ? 'mobile' : 'desktop';
        return [
            '<article class="hotspot-editor__card" id="hotspot-card-',
            escapeHtml(hotspot.id),
            '">',
            '<div class="hotspot-editor__card-heading"><span class="hotspot-editor__number">',
            index + 1,
            '</span><div><strong>',
            escapeHtml(hotspot.productName || hotspot.label || hotspot.productId),
            '</strong><small>Product ',
            escapeHtml(hotspot.productId),
            '</small></div><button type="button" class="hotspot-editor__danger" data-action="remove" data-id="',
            escapeHtml(hotspot.id),
            '"',
            disabledAttribute(),
            '>Remove</button></div>',
            '<label class="hotspot-editor__field"><span>Optional accessible label</span><input type="text" maxlength="80" value="',
            escapeHtml(hotspot.label || ''),
            '" data-action="label" data-id="',
            escapeHtml(hotspot.id),
            '"',
            disabledAttribute(),
            '></label>',
            '<div class="hotspot-editor__product-row"><input type="text" value="',
            escapeHtml(hotspot.productId),
            '" aria-label="Product ID for hotspot ',
            index + 1,
            '" disabled><button type="button" data-action="product" data-id="',
            escapeHtml(hotspot.id),
            '"',
            disabledAttribute(),
            '>Change product</button></div>',
            '<div class="hotspot-editor__coordinates"><label><span>X ',
            coordinatePrefix,
            ' (%)</span><input type="number" min="0" max="100" step="0.1" value="',
            coordinates.x,
            '" data-action="coordinate" data-axis="x" data-id="',
            escapeHtml(hotspot.id),
            '"',
            disabledAttribute(),
            '></label><label><span>Y ',
            coordinatePrefix,
            ' (%)</span><input type="number" min="0" max="100" step="0.1" value="',
            coordinates.y,
            '" data-action="coordinate" data-axis="y" data-id="',
            escapeHtml(hotspot.id),
            '"',
            disabledAttribute(),
            '></label></div>',
            state.viewport === 'mobile'
                ? '<button type="button" class="hotspot-editor__text-button" data-action="reset-mobile" data-id="' +
                  escapeHtml(hotspot.id) +
                  '"' +
                  disabledAttribute() +
                  '>Use desktop position</button>'
                : '',
            '</article>',
        ].join('');
    }

    function render() {
        var value = state.value;
        var isProductSet = value.sourceMode === 'productSet';
        var validity = validation();
        var currentPreview = previewUrl();
        var viewportLabel = state.viewport === 'mobile' ? 'mobile' : 'desktop';
        var persistedPreview =
            state.viewport === 'mobile' ? value.mobilePreviewUrl || '' : value.desktopPreviewUrl || '';
        var points = value.hotspots.map(hotspotMarkup).join('');
        var cards = value.hotspots.map(hotspotCardMarkup).join('');

        document.body.innerHTML = [
            '<main class="hotspot-editor">',
            '<header class="hotspot-editor__intro"><p class="hotspot-editor__kicker">Storefront Next · Page Designer Toolkit</p>',
            '<h1>Shop the Look Studio</h1><p>Select products and place hotspots with independent desktop and mobile coordinates.</p></header>',
            state.disabled
                ? '<p class="hotspot-editor__disabled" role="status">This field is disabled in the current context.</p>'
                : '',
            '<section class="hotspot-editor__section" aria-labelledby="source-heading"><div class="hotspot-editor__section-heading"><div><h2 id="source-heading">1. Product source</h2><p>Free selection offers maximum flexibility. Product Set validates hotspots in the storefront.</p></div><strong>',
            value.hotspots.length,
            ' / ',
            state.maxHotspots,
            ' hotspots</strong></div>',
            '<div class="hotspot-editor__segmented" role="radiogroup" aria-label="Product source">',
            '<label><input type="radio" name="sourceMode" value="manual"',
            !isProductSet ? ' checked' : '',
            disabledAttribute(),
            '><span>Free selection</span></label>',
            '<label><input type="radio" name="sourceMode" value="productSet"',
            isProductSet ? ' checked' : '',
            disabledAttribute(),
            '><span>Product Set</span></label></div>',
            isProductSet
                ? '<div class="hotspot-editor__product-row hotspot-editor__set-row"><input type="text" aria-label="Selected Product Set" placeholder="Select a Product Set" value="' +
                  escapeHtml(value.productSetId || '') +
                  '" disabled><button type="button" data-action="product-set"' +
                  disabledAttribute() +
                  '>Select Product Set</button></div><p class="hotspot-editor__hint">At publish time, hotspots outside the set are omitted and flagged in edit mode.</p>'
                : '<p class="hotspot-editor__hint">Each hotspot can link any product assigned to the site catalog.</p>',
            '</section>',
            '<section class="hotspot-editor__section" aria-labelledby="canvas-heading"><div class="hotspot-editor__section-heading"><div><h2 id="canvas-heading">2. Place hotspots</h2><p>Positions are stored as image percentages, not pixels.</p></div></div>',
            '<div class="hotspot-editor__segmented hotspot-editor__viewport" role="group" aria-label="Coordinate view">',
            '<button type="button" data-action="viewport" data-viewport="desktop" aria-pressed="',
            state.viewport === 'desktop',
            '"',
            disabledAttribute(),
            '>Desktop</button><button type="button" data-action="viewport" data-viewport="mobile" aria-pressed="',
            state.viewport === 'mobile',
            '"',
            disabledAttribute(),
            '>Mobile</button></div>',
            '<div class="hotspot-editor__preview-note"><strong>This is not a second published image</strong><span>The storefront uses the image selected in the component\'s Desktop/Mobile image fields. Page Designer isolates this editor, so it cannot read those sibling fields automatically.</span></div>',
            '<label class="hotspot-editor__file hotspot-editor__file--primary"><span>Choose the same image for positioning · temporary only (',
            viewportLabel,
            ')</span><input type="file" accept="image/*" data-action="preview-file"',
            disabledAttribute(),
            '></label>',
            '<p class="hotspot-editor__hint">The temporary file is shown only in this browser. It is not saved or uploaded again and does not replace the component image.</p>',
            '<details class="hotspot-editor__advanced"><summary>Advanced: use a B2C library or CDN image URL</summary><label class="hotspot-editor__field"><span>Preview URL for ',
            viewportLabel,
            ' (optional)</span><input type="url" value="',
            escapeHtml(persistedPreview),
            '" data-action="preview-url" placeholder="https://..."',
            disabledAttribute(),
            '></label></details>',
            '<div class="hotspot-editor__canvas ',
            currentPreview ? 'hotspot-editor__canvas--has-preview ' : '',
            state.viewport === 'mobile' ? 'hotspot-editor__canvas--mobile ' : '',
            state.placing ? 'hotspot-editor__canvas--placing' : '',
            '" data-action="canvas" aria-label="Hotspot canvas for ',
            viewportLabel,
            '">',
            currentPreview
                ? '<img class="hotspot-editor__preview-image" alt="Campaign preview">'
                : '<div class="hotspot-editor__empty-preview"><strong>Preview not loaded</strong><span>You can place hotspots on this grid and adjust X/Y manually.</span></div>',
            points,
            '</div>',
            '<div class="hotspot-editor__canvas-actions"><button type="button" class="hotspot-editor__primary" data-action="place"',
            state.disabled || value.hotspots.length >= state.maxHotspots ? ' disabled' : '',
            '>',
            state.placing ? 'Cancel placement' : '+ Add hotspot on image',
            '</button><span aria-live="polite">',
            state.placing ? 'Select a position on the image, then choose the product.' : '',
            '</span></div></section>',
            '<section class="hotspot-editor__section" aria-labelledby="points-heading"><div class="hotspot-editor__section-heading"><div><h2 id="points-heading">3. Hotspot details</h2><p>Drag a hotspot, use the arrow keys, or enter exact coordinates.</p></div></div>',
            cards || '<p class="hotspot-editor__empty-list">No hotspots have been configured yet.</p>',
            '</section>',
            '<footer class="hotspot-editor__validation ',
            validity.valid ? 'hotspot-editor__validation--valid' : 'hotspot-editor__validation--invalid',
            '" role="status"><strong>',
            validity.valid ? 'Valid configuration' : 'Incomplete configuration',
            '</strong><span>',
            escapeHtml(validity.message || 'Changes will be saved with the component.'),
            '</span></footer></main>',
        ].join('');

        var image = document.querySelector('.hotspot-editor__preview-image');
        if (image && currentPreview) image.src = currentPreview;
        bindEvents();
        emitValidity();
    }

    function findHotspot(id) {
        return state.value.hotspots.find(function (hotspot) {
            return hotspot.id === id;
        });
    }

    function extractProductId(value) {
        if (typeof value === 'string') return cleanString(value);
        if (!isPlainObject(value)) return '';
        if (typeof value.value === 'string') return cleanString(value.value);
        if (isPlainObject(value.value) && typeof value.value.value === 'string') {
            return cleanString(value.value.value);
        }
        return '';
    }

    function openProductPicker(title, onApply) {
        root.emit({ type: 'sfcc:breakout', payload: { id: PRODUCT_PICKER_ID, title: title } }, function (result) {
            if (!result || result.type !== 'sfcc:breakoutApply') return;
            var productId = extractProductId(result.value);
            if (productId) onApply(productId);
        });
    }

    function coordinatesFromEvent(event, canvas) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100, 50),
            y: clamp(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100, 50),
        };
    }

    function setCoordinates(hotspot, coordinates) {
        if (state.viewport === 'mobile') {
            hotspot.mobileX = coordinates.x;
            hotspot.mobileY = coordinates.y;
        } else {
            hotspot.x = coordinates.x;
            hotspot.y = coordinates.y;
        }
    }

    function addOrMoveProduct(productId, coordinates, productName) {
        var existing = state.value.hotspots.find(function (hotspot) {
            return hotspot.productId === productId;
        });
        if (existing) {
            setCoordinates(existing, coordinates);
            if (productName) existing.productName = productName;
        } else if (state.value.hotspots.length < state.maxHotspots) {
            var hotspot = {
                id: 'hotspot-' + Date.now() + '-' + nextId++,
                productId: productId,
                x: coordinates.x,
                y: coordinates.y,
            };
            if (productName) hotspot.productName = productName;
            if (state.viewport === 'mobile') {
                hotspot.x = 50;
                hotspot.y = 50;
                hotspot.mobileX = coordinates.x;
                hotspot.mobileY = coordinates.y;
            }
            state.value.hotspots.push(hotspot);
        }
        state.placing = false;
        commit();
    }

    function bindEvents() {
        Array.prototype.forEach.call(document.querySelectorAll('input[name="sourceMode"]'), function (input) {
            input.addEventListener('change', function () {
                state.value.sourceMode = input.value === 'productSet' ? 'productSet' : 'manual';
                commit();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="viewport"]'), function (button) {
            button.addEventListener('click', function () {
                state.viewport = button.getAttribute('data-viewport') === 'mobile' ? 'mobile' : 'desktop';
                state.placing = false;
                render();
            });
        });

        var productSetButton = document.querySelector('[data-action="product-set"]');
        if (productSetButton) {
            productSetButton.addEventListener('click', function () {
                openProductPicker('Select the Product Set', function (productId) {
                    state.value.productSetId = productId;
                    commit();
                });
            });
        }

        var previewUrlInput = document.querySelector('[data-action="preview-url"]');
        if (previewUrlInput) {
            previewUrlInput.addEventListener('change', function () {
                var url = safePreviewUrl(previewUrlInput.value);
                if (state.viewport === 'mobile') state.value.mobilePreviewUrl = url || undefined;
                else state.value.desktopPreviewUrl = url || undefined;
                commit();
            });
        }

        var previewFileInput = document.querySelector('[data-action="preview-file"]');
        if (previewFileInput) {
            previewFileInput.addEventListener('change', function () {
                var file = previewFileInput.files && previewFileInput.files[0];
                if (!file) return;
                var targetViewport = state.viewport;
                if (root.URL && typeof root.URL.createObjectURL === 'function') {
                    state.localPreview[targetViewport] = root.URL.createObjectURL(file);
                    render();
                    return;
                }
                if (typeof root.FileReader === 'function') {
                    var reader = new root.FileReader();
                    reader.addEventListener('load', function () {
                        state.localPreview[targetViewport] = typeof reader.result === 'string' ? reader.result : '';
                        render();
                    });
                    reader.readAsDataURL(file);
                }
            });
        }

        var placeButton = document.querySelector('[data-action="place"]');
        if (placeButton) {
            placeButton.addEventListener('click', function () {
                state.placing = !state.placing;
                render();
            });
        }

        var canvas = document.querySelector('[data-action="canvas"]');
        if (canvas) {
            canvas.addEventListener('click', function (event) {
                if (!state.placing || event.target.closest('[data-hotspot-id]')) return;
                var coordinates = coordinatesFromEvent(event, canvas);
                openProductPicker('Product for the new hotspot', function (productId) {
                    addOrMoveProduct(productId, coordinates);
                });
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="product"]'), function (button) {
            button.addEventListener('click', function () {
                var hotspot = findHotspot(button.getAttribute('data-id'));
                if (!hotspot) return;
                openProductPicker('Change the hotspot product', function (productId) {
                    hotspot.productId = productId;
                    delete hotspot.productName;
                    commit();
                });
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="remove"]'), function (button) {
            button.addEventListener('click', function () {
                var id = button.getAttribute('data-id');
                state.value.hotspots = state.value.hotspots.filter(function (hotspot) {
                    return hotspot.id !== id;
                });
                commit();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="label"]'), function (input) {
            input.addEventListener('change', function () {
                var hotspot = findHotspot(input.getAttribute('data-id'));
                if (!hotspot) return;
                hotspot.label = cleanString(input.value) || undefined;
                commit();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="coordinate"]'), function (input) {
            input.addEventListener('change', function () {
                var hotspot = findHotspot(input.getAttribute('data-id'));
                if (!hotspot) return;
                var value = clamp(input.value, 50);
                var axis = input.getAttribute('data-axis');
                if (state.viewport === 'mobile') {
                    if (axis === 'x') hotspot.mobileX = value;
                    else hotspot.mobileY = value;
                } else if (axis === 'x') hotspot.x = value;
                else hotspot.y = value;
                commit();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-action="reset-mobile"]'), function (button) {
            button.addEventListener('click', function () {
                var hotspot = findHotspot(button.getAttribute('data-id'));
                if (!hotspot) return;
                delete hotspot.mobileX;
                delete hotspot.mobileY;
                commit();
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-hotspot-id]'), function (button) {
            button.addEventListener('click', function () {
                var card = document.getElementById('hotspot-card-' + button.getAttribute('data-hotspot-id'));
                if (card && typeof card.scrollIntoView === 'function') card.scrollIntoView({ block: 'nearest' });
            });
            button.addEventListener('keydown', function (event) {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault();
                var hotspot = findHotspot(button.getAttribute('data-hotspot-id'));
                if (!hotspot) return;
                var coordinates = activeCoordinates(hotspot);
                var step = event.shiftKey ? 5 : 1;
                if (event.key === 'ArrowLeft') coordinates.x -= step;
                if (event.key === 'ArrowRight') coordinates.x += step;
                if (event.key === 'ArrowUp') coordinates.y -= step;
                if (event.key === 'ArrowDown') coordinates.y += step;
                coordinates.x = clamp(coordinates.x, 50);
                coordinates.y = clamp(coordinates.y, 50);
                var id = hotspot.id;
                setCoordinates(hotspot, coordinates);
                commit();
                root.setTimeout(function () {
                    var nextButton = Array.prototype.find.call(
                        document.querySelectorAll('[data-hotspot-id]'),
                        function (candidate) {
                            return candidate.getAttribute('data-hotspot-id') === id;
                        }
                    );
                    if (nextButton) nextButton.focus();
                }, 0);
            });
            button.addEventListener('pointerdown', function (event) {
                if (state.disabled || event.button !== 0) return;
                var parentCanvas = button.closest('[data-action="canvas"]');
                var hotspot = findHotspot(button.getAttribute('data-hotspot-id'));
                if (!parentCanvas || !hotspot) return;
                event.preventDefault();
                dragState = { hotspot: hotspot, canvas: parentCanvas, button: button };
                if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
            });
        });
    }

    root.addEventListener('pointermove', function (event) {
        if (!dragState) return;
        var coordinates = coordinatesFromEvent(event, dragState.canvas);
        dragState.button.style.left = coordinates.x + '%';
        dragState.button.style.top = coordinates.y + '%';
        dragState.coordinates = coordinates;
    });

    root.addEventListener('pointerup', function () {
        if (!dragState) return;
        if (dragState.coordinates) {
            setCoordinates(dragState.hotspot, dragState.coordinates);
            dragState = null;
            commit();
            return;
        }
        dragState = null;
    });

    root.subscribe('sfcc:ready', function (payload) {
        var ready = payload || {};
        var configuredMax = ready.config && Number(ready.config.maxHotspots);
        state.maxHotspots = Number.isFinite(configuredMax)
            ? Math.max(1, Math.min(24, configuredMax))
            : DEFAULT_MAX_HOTSPOTS;
        state.disabled = Boolean(ready.isDisabled);
        state.required = ready.isRequired !== false;
        state.value = normalizeValue(ready.value);
        state.viewport = 'desktop';
        state.placing = false;
        state.localPreview = { desktop: '', mobile: '' };
        render();
    });

    root.subscribe('sfcc:value', function (value) {
        state.value = normalizeValue(value);
        state.placing = false;
        state.localPreview = { desktop: '', mobile: '' };
        render();
    });

    root.subscribe('sfcc:disabled', function (disabled) {
        state.disabled = Boolean(disabled);
        render();
    });

    root.subscribe('sfcc:required', function (required) {
        state.required = Boolean(required);
        render();
    });
})(typeof window !== 'undefined' ? window : null);
