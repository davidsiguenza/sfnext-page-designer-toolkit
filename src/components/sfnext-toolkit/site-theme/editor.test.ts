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
import { SITE_THEME_TOKEN_GROUPS } from './model';

type EditorCallback = (payload: unknown) => void;
type EditorEvent = { type: string; payload?: unknown };
type EditorWindow = Window & {
    subscribe: (eventName: string, callback: EditorCallback) => void;
    emit: (event: EditorEvent) => void;
};

const editorSource = readFileSync(
    resolve(
        process.cwd(),
        'cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/themeEditor.js'
    ),
    'utf8'
);

describe('SFNext Toolkit theme custom editor', () => {
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

    test('subscribes to the editor lifecycle and normalizes untrusted incoming values', () => {
        expect([...callbacks.keys()]).toEqual(['sfcc:ready', 'sfcc:value', 'sfcc:disabled', 'sfcc:required']);

        send('sfcc:ready', {
            value: {
                version: 1,
                preset: 'custom',
                autoContrast: true,
                tokens: {
                    primary: '#8a1538',
                    foreground: 'red',
                    '--color-primary': '#123456',
                },
            },
            isDisabled: false,
            isRequired: false,
        });

        expect(screen.getByRole('heading', { name: 'Theme Studio' })).toBeInTheDocument();
        expect(screen.getByLabelText('Primary action hexadecimal color')).toHaveValue('#8A1538');
        expect(screen.getByLabelText('Page text hexadecimal color')).toHaveValue('#17171B');
        expect(screen.queryByLabelText('Brand primary hexadecimal color')).not.toBeInTheDocument();
        expect([...editorSource.matchAll(/token\(\s*'([^']+)'/g)].map((match) => match[1])).toEqual(
            Object.values(SITE_THEME_TOKEN_GROUPS).flat()
        );
        expect(document.querySelectorAll('[data-token]')).toHaveLength(
            SITE_THEME_TOKEN_GROUPS.core.length + SITE_THEME_TOKEN_GROUPS.actions.length
        );
        expect(lastEmittedPayload('sfcc:valid')).toEqual({ valid: true, message: '' });
    });

    test('mounts closed token groups only when an author opens them', () => {
        send('sfcc:ready', { value: null, isDisabled: false });
        expect(screen.queryByLabelText('Agent primary hexadecimal color')).not.toBeInTheDocument();

        const agenticGroup = screen.getByText('Agentic experience').closest('details');
        if (!agenticGroup) throw new Error('Agentic token group was not rendered.');
        agenticGroup.open = true;
        fireEvent(agenticGroup, new Event('toggle'));

        expect(screen.getByLabelText('Agent primary hexadecimal color')).toHaveValue('#131315');
        expect(document.querySelectorAll('[data-token]')).toHaveLength(
            SITE_THEME_TOKEN_GROUPS.core.length +
                SITE_THEME_TOKEN_GROUPS.actions.length +
                SITE_THEME_TOKEN_GROUPS.agentic.length
        );
    });

    test('emits one versioned object, applies presets, and auto-pairs contrast colors', () => {
        send('sfcc:ready', { value: null, isDisabled: false });

        fireEvent.change(screen.getByLabelText('Preset'), { target: { value: 'warmEditorial' } });
        expect(lastEmittedPayload('sfcc:value')).toMatchObject({
            version: 1,
            preset: 'warmEditorial',
            autoContrast: true,
            tokens: {
                primary: '#8A1538',
                'primary-foreground': '#FFFFFF',
            },
        });

        fireEvent.change(screen.getByLabelText('Primary action hexadecimal color'), {
            target: { value: '#FFFFFF' },
        });
        expect(lastEmittedPayload('sfcc:value')).toMatchObject({
            version: 1,
            preset: 'custom',
            tokens: {
                primary: '#FFFFFF',
                'primary-foreground': '#000000',
            },
        });
        expect(emit).toHaveBeenCalledWith({ type: 'sfcc:interacted' });
    });

    test('reports invalid hex drafts and honors the disabled lifecycle state', () => {
        send('sfcc:ready', { value: null, isDisabled: false });
        const primaryInput = screen.getByLabelText('Primary action hexadecimal color');

        fireEvent.input(primaryInput, { target: { value: '#123' } });
        expect(primaryInput).toHaveAttribute('aria-invalid', 'true');
        expect(lastEmittedPayload('sfcc:valid')).toEqual({
            valid: false,
            message: 'Use a six-digit hexadecimal color such as #1A2B3C.',
        });

        send('sfcc:disabled', true);
        expect(screen.getByText(/currently disabled/)).toHaveAttribute('role', 'status');
        expect(screen.getByLabelText('Preset')).toBeDisabled();
        expect(screen.getByLabelText('Primary action hexadecimal color')).toBeDisabled();
    });
});
