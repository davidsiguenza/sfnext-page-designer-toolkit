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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_MOTION, MOTION_OPTIONS } from './model';

type EditorCallback = (payload: unknown) => void;
type EditorEvent = { type: string; payload?: unknown };
type EditorWindow = Window & {
    subscribe: (eventName: string, callback: EditorCallback) => void;
    emit: (event: EditorEvent) => void;
};

const editorSource = readFileSync(
    resolve(
        process.cwd(),
        'cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/motionEditor.js'
    ),
    'utf8'
);
const storefrontMotionSource = readFileSync(resolve(process.cwd(), 'src/theme/animations.css'), 'utf8');

function storefrontToken(group: string, value: string): string {
    const match = storefrontMotionSource.match(new RegExp(`--ds-motion-default-${group}-${value}:\\s*([^;]+);`));

    if (!match) throw new Error(`Missing storefront motion token: ${group}.${value}`);
    return match[1].trim();
}

describe('SFNext Toolkit motion custom editor', () => {
    const callbacks = new Map<string, EditorCallback>();
    const emit = vi.fn<(event: EditorEvent) => void>();
    const editorWindow = window as unknown as EditorWindow;

    function send(eventName: string, payload?: unknown) {
        const callback = callbacks.get(eventName);
        expect(callback, `${eventName} subscription`).toBeTypeOf('function');
        callback?.(payload);
    }

    function lastEmittedPayload(eventName: string) {
        return emit.mock.calls
            .map(([event]) => event)
            .filter((event) => event.type === eventName)
            .at(-1)?.payload;
    }

    beforeEach(() => {
        document.body.replaceChildren();
        callbacks.clear();
        emit.mockReset();
        editorWindow.subscribe = (eventName, callback) => {
            callbacks.set(eventName, callback);
        };
        editorWindow.emit = emit;

        // The asset is an isolated Page Designer iframe script, not an ES module.
        runInNewContext(editorSource, { document, window: editorWindow });
    });

    afterEach(() => {
        delete (editorWindow as Partial<EditorWindow>).subscribe;
        delete (editorWindow as Partial<EditorWindow>).emit;
    });

    test('implements the sfcc lifecycle and rejects unsupported editor schema versions', () => {
        expect([...callbacks.keys()]).toEqual(['sfcc:ready', 'sfcc:value', 'sfcc:required', 'sfcc:disabled']);

        send('sfcc:ready', {
            value: null,
            config: { schemaVersion: 2 },
            isDisabled: false,
            isRequired: true,
        });

        expect(screen.getByRole('heading', { name: 'Motion settings' })).toBeInTheDocument();
        expect(lastEmittedPayload('sfcc:valid')).toEqual({
            valid: false,
            message: 'This motion editor configuration version is not supported.',
        });

        const validityEmissions = emit.mock.calls.filter(([event]) => event.type === 'sfcc:valid').length;
        send('sfcc:required', false);
        expect(emit.mock.calls.filter(([event]) => event.type === 'sfcc:valid')).toHaveLength(validityEmissions + 1);

        send('sfcc:disabled', true);
        expect(screen.getByLabelText('Effect')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Replay' })).toBeDisabled();
    });

    test('emits one complete versioned value and keeps the editor enums aligned with the model', () => {
        send('sfcc:ready', { value: null, config: { schemaVersion: 1 }, isDisabled: false });

        expect(Array.from(screen.getByLabelText<HTMLSelectElement>('Effect').options, ({ value }) => value)).toEqual([
            ...MOTION_OPTIONS.effect,
        ]);
        expect(Array.from(screen.getByLabelText<HTMLSelectElement>('Duration').options, ({ value }) => value)).toEqual([
            ...MOTION_OPTIONS.duration,
        ]);
        expect(Array.from(screen.getByLabelText<HTMLSelectElement>('Curve').options, ({ value }) => value)).toEqual([
            ...MOTION_OPTIONS.easing,
        ]);

        fireEvent.change(screen.getByLabelText('Effect'), { target: { value: 'slide_right' } });

        expect(lastEmittedPayload('sfcc:value')).toEqual({
            ...DEFAULT_MOTION,
            effect: 'slide_right',
        });
        expect(emit).toHaveBeenCalledWith({ type: 'sfcc:interacted' });
        expect(lastEmittedPayload('sfcc:valid')).toEqual({ valid: true, message: '' });

        send(
            'sfcc:value',
            JSON.stringify({
                version: 1,
                effect: 'scale',
                duration: 'slow',
                easing: 'emphasized',
                delay: 'long',
                sequence: 'together',
                stagger: 'relaxed',
                trigger: 'load',
                replay: true,
            })
        );
        expect(screen.getByLabelText('Effect')).toHaveValue('scale');
        expect(screen.getByLabelText('Duration')).toHaveValue('slow');
        expect(screen.getByLabelText('Replay after leaving the viewport')).not.toBeChecked();
    });

    test('derives disabled controls from effect, sequence, trigger, and host state', () => {
        send('sfcc:ready', {
            value: { ...DEFAULT_MOTION, replay: true },
            config: { schemaVersion: 1 },
            isDisabled: false,
        });

        fireEvent.change(screen.getByLabelText('Sequence'), { target: { value: 'together' } });
        expect(screen.getByLabelText('Stagger interval')).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Trigger'), { target: { value: 'load' } });
        expect(screen.getByLabelText('Replay after leaving the viewport')).toBeDisabled();
        expect(lastEmittedPayload('sfcc:value')).toMatchObject({ trigger: 'load', replay: false });

        fireEvent.change(screen.getByLabelText('Effect'), { target: { value: 'none' } });
        expect(screen.getByLabelText('Effect')).toBeEnabled();
        for (const label of ['Duration', 'Curve', 'Initial delay', 'Sequence', 'Stagger interval', 'Trigger']) {
            expect(screen.getByLabelText(label)).toBeDisabled();
        }
        expect(screen.getByLabelText('Replay after leaving the viewport')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Replay' })).toBeDisabled();

        send('sfcc:disabled', true);
        expect(screen.getByLabelText('Effect')).toBeDisabled();
    });

    test('keeps preview values in sync with the storefront motion-token defaults', () => {
        send('sfcc:ready', { value: null, config: { schemaVersion: 1 }, isDisabled: false });
        const preview = screen.getByRole('img', { name: 'Animation preview' });
        const tokenGroups = [
            {
                label: 'Duration',
                cssGroup: 'duration',
                property: '--motion-editor-duration',
                values: MOTION_OPTIONS.duration,
            },
            {
                label: 'Curve',
                cssGroup: 'ease',
                property: '--motion-editor-easing',
                values: MOTION_OPTIONS.easing,
            },
            {
                label: 'Initial delay',
                cssGroup: 'delay',
                property: '--motion-editor-delay',
                values: MOTION_OPTIONS.delay,
            },
            {
                label: 'Stagger interval',
                cssGroup: 'stagger',
                property: '--motion-editor-stagger',
                values: MOTION_OPTIONS.stagger,
            },
        ] as const;

        for (const { label, cssGroup, property, values } of tokenGroups) {
            const control = screen.getByLabelText(label);
            for (const value of values) {
                fireEvent.change(control, { target: { value } });
                expect(preview.style.getPropertyValue(property), `${cssGroup}.${value}`).toBe(
                    storefrontToken(cssGroup, value)
                );
            }
        }
    });
});
