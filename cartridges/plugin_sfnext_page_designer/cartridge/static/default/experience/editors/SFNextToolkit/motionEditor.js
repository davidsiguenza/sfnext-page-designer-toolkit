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

    var motionEditor = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = motionEditor;
    }

    if (root && root.document) {
        motionEditor.init();
    }
})(typeof window !== 'undefined' ? window : null, function (root) {
    'use strict';

    var MOTION_OPTIONS = {
        effect: ['none', 'fade', 'fade_up', 'slide_left', 'slide_right', 'scale'],
        duration: ['fast', 'standard', 'slow'],
        easing: ['standard', 'enter', 'exit', 'emphasized'],
        delay: ['none', 'short', 'medium', 'long'],
        sequence: ['together', 'stagger'],
        stagger: ['tight', 'standard', 'relaxed'],
        trigger: ['load', 'viewport'],
    };

    var DEFAULT_MOTION = {
        version: 1,
        effect: 'fade_up',
        duration: 'standard',
        easing: 'enter',
        delay: 'none',
        sequence: 'stagger',
        stagger: 'standard',
        trigger: 'viewport',
        replay: false,
    };

    var PREVIEW_TOKENS = {
        duration: { fast: '160ms', standard: '280ms', slow: '420ms' },
        easing: {
            standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
            enter: 'cubic-bezier(0, 0, 0.2, 1)',
            exit: 'cubic-bezier(0.4, 0, 1, 1)',
            emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        },
        delay: { none: '0ms', short: '80ms', medium: '160ms', long: '240ms' },
        stagger: { tight: '40ms', standard: '80ms', relaxed: '120ms' },
    };

    var state = {
        rootElement: null,
        previewElement: null,
        replayButton: null,
        messageElement: null,
        summaryElement: null,
        controls: {},
        currentValue: null,
        disabled: false,
        required: false,
        schemaVersion: 1,
    };

    function copyDefault() {
        return {
            version: DEFAULT_MOTION.version,
            effect: DEFAULT_MOTION.effect,
            duration: DEFAULT_MOTION.duration,
            easing: DEFAULT_MOTION.easing,
            delay: DEFAULT_MOTION.delay,
            sequence: DEFAULT_MOTION.sequence,
            stagger: DEFAULT_MOTION.stagger,
            trigger: DEFAULT_MOTION.trigger,
            replay: DEFAULT_MOTION.replay,
        };
    }

    function parseMotionValue(value) {
        var parsed;

        if (!value) {
            return null;
        }

        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (error) {
                return null;
            }
        }

        if (typeof value === 'object' && !value.version && value.value) {
            parsed = parseMotionValue(value.value);
            return parsed || null;
        }

        return typeof value === 'object' ? value : null;
    }

    function allowEnum(value, values, fallback) {
        return values.indexOf(value) > -1 ? value : fallback;
    }

    function normalizeMotion(value) {
        var source = parseMotionValue(value);
        var trigger;

        if (!source || Number(source.version) !== 1) {
            return copyDefault();
        }

        trigger = allowEnum(source.trigger, MOTION_OPTIONS.trigger, DEFAULT_MOTION.trigger);

        return {
            version: 1,
            effect: allowEnum(source.effect, MOTION_OPTIONS.effect, DEFAULT_MOTION.effect),
            duration: allowEnum(source.duration, MOTION_OPTIONS.duration, DEFAULT_MOTION.duration),
            easing: allowEnum(source.easing, MOTION_OPTIONS.easing, DEFAULT_MOTION.easing),
            delay: allowEnum(source.delay, MOTION_OPTIONS.delay, DEFAULT_MOTION.delay),
            sequence: allowEnum(source.sequence, MOTION_OPTIONS.sequence, DEFAULT_MOTION.sequence),
            stagger: allowEnum(source.stagger, MOTION_OPTIONS.stagger, DEFAULT_MOTION.stagger),
            trigger: trigger,
            replay: source.trigger === 'viewport' && source.replay === true,
        };
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
        var event;

        if (!root || typeof root.emit !== 'function') {
            return;
        }

        event = { type: type };
        if (arguments.length > 1) {
            event.payload = payload;
        }
        root.emit(event);
    }

    function validityFor() {
        if (state.schemaVersion !== 1) {
            return {
                valid: false,
                message: 'This motion editor configuration version is not supported.',
            };
        }

        return { valid: true, message: '' };
    }

    function updateValidity(shouldEmit) {
        var validity = validityFor();

        if (state.rootElement) {
            state.rootElement.setAttribute('aria-invalid', validity.valid ? 'false' : 'true');
        }
        if (state.messageElement) {
            state.messageElement.textContent = validity.message;
        }
        if (shouldEmit) {
            emitEvent('sfcc:valid', validity);
        }

        return validity.valid;
    }

    function setControlValue(field, value) {
        var control = state.controls[field];
        if (!control) {
            return;
        }

        if (control.type === 'checkbox') {
            control.checked = value === true;
        } else {
            control.value = value;
        }
    }

    function setDerivedDisabled() {
        var value = state.currentValue || copyDefault();
        var motionDisabled = value.effect === 'none';
        var tokenFields = ['duration', 'easing', 'delay', 'sequence', 'trigger'];

        Object.keys(state.controls).forEach(function (field) {
            state.controls[field].disabled = state.disabled;
        });

        tokenFields.forEach(function (field) {
            if (state.controls[field]) {
                state.controls[field].disabled = state.disabled || motionDisabled;
            }
        });

        if (state.controls.stagger) {
            state.controls.stagger.disabled = state.disabled || motionDisabled || value.sequence !== 'stagger';
        }
        if (state.controls.replay) {
            state.controls.replay.disabled = state.disabled || motionDisabled || value.trigger !== 'viewport';
        }
        state.replayButton.disabled = state.disabled || motionDisabled;
        state.rootElement.classList.toggle('pd-motion-editor--disabled', state.disabled);
    }

    function previewSummary(value) {
        if (value.effect === 'none') {
            return 'No animation';
        }

        var parts = [value.effect.replace(/_/g, ' '), value.duration, value.easing];
        if (value.delay !== 'none') {
            parts.push(value.delay + ' delay');
        }
        if (value.sequence === 'stagger') {
            parts.push(value.stagger + ' stagger');
        }
        return parts.join(' · ');
    }

    function applyPreviewTokens(value) {
        var preview = state.previewElement;

        preview.setAttribute('data-effect', value.effect);
        preview.setAttribute('data-sequence', value.sequence);
        preview.style.setProperty('--motion-editor-duration', PREVIEW_TOKENS.duration[value.duration]);
        preview.style.setProperty('--motion-editor-easing', PREVIEW_TOKENS.easing[value.easing]);
        preview.style.setProperty('--motion-editor-delay', PREVIEW_TOKENS.delay[value.delay]);
        preview.style.setProperty('--motion-editor-stagger', PREVIEW_TOKENS.stagger[value.stagger]);
        state.summaryElement.textContent = previewSummary(value);
    }

    function renderValue(value) {
        var normalized = normalizeMotion(value);

        state.currentValue = normalized;
        Object.keys(MOTION_OPTIONS).forEach(function (field) {
            setControlValue(field, normalized[field]);
        });
        setControlValue('replay', normalized.replay);
        applyPreviewTokens(normalized);
        setDerivedDisabled();
    }

    function readControls() {
        return normalizeMotion({
            version: 1,
            effect: state.controls.effect.value,
            duration: state.controls.duration.value,
            easing: state.controls.easing.value,
            delay: state.controls.delay.value,
            sequence: state.controls.sequence.value,
            stagger: state.controls.stagger.value,
            trigger: state.controls.trigger.value,
            replay: state.controls.replay.checked,
        });
    }

    function replayPreview() {
        var frame;

        if (state.disabled || !state.previewElement) {
            return;
        }

        state.previewElement.classList.remove('pd-motion-editor__preview--playing');
        state.previewElement.offsetWidth;
        frame =
            root.requestAnimationFrame ||
            function (callback) {
                callback();
            };
        frame(function () {
            state.previewElement.classList.add('pd-motion-editor__preview--playing');
        });
    }

    function commitControls() {
        var value = readControls();

        renderValue(value);
        emitEvent('sfcc:interacted');
        if (updateValidity(false)) {
            emitEvent('sfcc:value', value);
        }
        updateValidity(true);
        replayPreview();
    }

    function setDisabled(disabled) {
        state.disabled = Boolean(disabled);
        setDerivedDisabled();
    }

    function createMarkup() {
        var editor = root.document.createElement('div');
        var controls;

        editor.className = 'pd-motion-editor';
        editor.innerHTML = [
            '<div class="pd-motion-editor__intro">',
            '  <div>',
            '    <h2 class="pd-motion-editor__title">Motion settings</h2>',
            '    <p class="pd-motion-editor__description">Choose reusable design-system tokens, then replay the preview.</p>',
            '  </div>',
            '  <button class="pd-motion-editor__replay" type="button">Replay</button>',
            '</div>',
            '<div class="pd-motion-editor__preview" role="img" aria-label="Animation preview">',
            '  <div class="pd-motion-editor__preview-media" data-preview-item data-preview-order="0"><span></span></div>',
            '  <div class="pd-motion-editor__preview-copy">',
            '    <span class="pd-motion-editor__preview-eyebrow" data-preview-item data-preview-order="1"></span>',
            '    <span class="pd-motion-editor__preview-title" data-preview-item data-preview-order="2"></span>',
            '    <span class="pd-motion-editor__preview-line" data-preview-item data-preview-order="3"></span>',
            '    <span class="pd-motion-editor__preview-button" data-preview-item data-preview-order="4"></span>',
            '  </div>',
            '</div>',
            '<p class="pd-motion-editor__summary" aria-live="polite"></p>',
            '<div class="pd-motion-editor__controls">',
            '  <label class="pd-motion-editor__field"><span>Effect</span><select data-motion-field="effect"><option value="none">None</option><option value="fade">Fade</option><option value="fade_up">Fade up</option><option value="slide_left">Slide from left</option><option value="slide_right">Slide from right</option><option value="scale">Scale</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Duration</span><select data-motion-field="duration"><option value="fast">Fast</option><option value="standard">Standard</option><option value="slow">Slow</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Curve</span><select data-motion-field="easing"><option value="standard">Standard</option><option value="enter">Enter · decelerate</option><option value="exit">Exit · accelerate</option><option value="emphasized">Emphasized</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Initial delay</span><select data-motion-field="delay"><option value="none">None</option><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Sequence</span><select data-motion-field="sequence"><option value="together">Together</option><option value="stagger">Staggered</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Stagger interval</span><select data-motion-field="stagger"><option value="tight">Tight</option><option value="standard">Standard</option><option value="relaxed">Relaxed</option></select></label>',
            '  <label class="pd-motion-editor__field"><span>Trigger</span><select data-motion-field="trigger"><option value="load">On page load</option><option value="viewport">When entering viewport</option></select></label>',
            '  <label class="pd-motion-editor__check"><input type="checkbox" data-motion-field="replay"><span>Replay after leaving the viewport</span></label>',
            '</div>',
            '<p class="pd-motion-editor__note">This preview uses the base motion tokens. Brand overrides apply in the storefront. Reduced-motion preferences always show the final state without animation.</p>',
            '<p class="pd-motion-editor__message" role="alert"></p>',
        ].join('');

        root.document.body.appendChild(editor);
        state.rootElement = editor;
        state.previewElement = editor.querySelector('.pd-motion-editor__preview');
        state.replayButton = editor.querySelector('.pd-motion-editor__replay');
        state.messageElement = editor.querySelector('.pd-motion-editor__message');
        state.summaryElement = editor.querySelector('.pd-motion-editor__summary');
        controls = editor.querySelectorAll('[data-motion-field]');

        Array.prototype.forEach.call(controls, function (control) {
            var field = control.getAttribute('data-motion-field');
            state.controls[field] = control;
            control.addEventListener('change', commitControls);
        });
        state.replayButton.addEventListener('click', replayPreview);
    }

    function subscribeToHost() {
        var subscribeTo = getSubscriptionFunction();

        if (!subscribeTo) {
            return;
        }

        subscribeTo('sfcc:ready', function (payload) {
            var ready = payload || {};
            var config = ready.config || {};

            state.schemaVersion = Number(config.schemaVersion || 1);
            state.required = Boolean(ready.isRequired);
            renderValue(ready.value);
            setDisabled(Boolean(ready.isDisabled));
            updateValidity(true);
            replayPreview();
        });

        subscribeTo('sfcc:value', function (value) {
            renderValue(value);
            updateValidity(true);
            replayPreview();
        });

        subscribeTo('sfcc:required', function (required) {
            state.required = Boolean(required);
            updateValidity(true);
        });

        subscribeTo('sfcc:disabled', function (disabled) {
            setDisabled(disabled);
        });
    }

    function init() {
        createMarkup();
        renderValue(DEFAULT_MOTION);
        subscribeToHost();
    }

    return {
        MOTION_OPTIONS: MOTION_OPTIONS,
        DEFAULT_MOTION: DEFAULT_MOTION,
        PREVIEW_TOKENS: PREVIEW_TOKENS,
        parseMotionValue: parseMotionValue,
        normalizeMotion: normalizeMotion,
        previewSummary: previewSummary,
        init: init,
    };
});
