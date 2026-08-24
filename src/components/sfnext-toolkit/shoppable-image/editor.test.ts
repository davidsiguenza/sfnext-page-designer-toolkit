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

type EditorCallback = (payload: unknown) => void;
type BreakoutCallback = (payload: { type: string; value?: unknown }) => void;
type EditorEvent = { type: string; payload?: unknown };
type EditorWindow = Window & {
    subscribe: (eventName: string, callback: EditorCallback) => void;
    emit: (event: EditorEvent, callback?: BreakoutCallback) => void;
    fetch: typeof fetch;
};

const editorSource = readFileSync(
    resolve(
        process.cwd(),
        'cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/shoppableHotspots.js'
    ),
    'utf8'
);

describe('SFNext Toolkit shoppable hotspots custom editor', () => {
    const callbacks = new Map<string, EditorCallback>();
    const emit = vi.fn<(event: EditorEvent, callback?: BreakoutCallback) => void>();
    const fetchMock = vi.fn<typeof fetch>();
    const editorWindow = window as unknown as EditorWindow;

    function send(eventName: string, payload?: unknown) {
        const callback = callbacks.get(eventName);
        expect(callback, `${eventName} subscription`).toBeTypeOf('function');
        callback?.(payload);
    }

    function emittedEvents(eventName: string) {
        return emit.mock.calls.map(([event]) => event).filter(({ type }) => type === eventName);
    }

    function lastValue() {
        return emittedEvents('sfcc:value').at(-1)?.payload as Record<string, unknown>;
    }

    function applyLastProductPicker(productId: string) {
        const breakout = emit.mock.calls.filter(([event]) => event.type === 'sfcc:breakout').at(-1);
        expect(breakout?.[0]).toMatchObject({
            type: 'sfcc:breakout',
            payload: { id: 'sfcc:productPicker' },
        });
        breakout?.[1]?.({
            type: 'sfcc:breakoutApply',
            value: { type: 'sfcc:productPicker', value: productId },
        });
    }

    beforeEach(() => {
        document.body.replaceChildren();
        callbacks.clear();
        emit.mockReset();
        fetchMock.mockReset();
        editorWindow.subscribe = (eventName, callback) => callbacks.set(eventName, callback);
        editorWindow.emit = emit;
        editorWindow.fetch = fetchMock;
        runInNewContext(editorSource, { window: editorWindow });
    });

    afterEach(() => {
        delete (editorWindow as Partial<EditorWindow>).subscribe;
        delete (editorWindow as Partial<EditorWindow>).emit;
        delete (editorWindow as Partial<EditorWindow>).fetch;
    });

    test('subscribes to the complete lifecycle and validates required authoring data', () => {
        expect([...callbacks.keys()]).toEqual(['sfcc:ready', 'sfcc:value', 'sfcc:disabled', 'sfcc:required']);
        send('sfcc:ready', {
            value: null,
            config: { schemaVersion: 1, maxHotspots: 8 },
            isRequired: true,
            isDisabled: false,
        });

        expect(screen.getByRole('heading', { name: 'Shop the Look Studio' })).toBeInTheDocument();
        expect(screen.getByText('0 / 8 hotspots')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Incomplete configuration');
        expect(emittedEvents('sfcc:valid').at(-1)?.payload).toEqual({
            valid: false,
            message: 'Add at least one hotspot with a product.',
        });
    });

    test('places a point visually and keeps the native picker as a fallback', () => {
        send('sfcc:ready', { value: null, config: { maxHotspots: 12 }, isRequired: true });
        fireEvent.click(screen.getByRole('button', { name: '+ Add hotspot on image' }));

        const canvas = screen.getByLabelText('Hotspot canvas for desktop');
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 400,
            bottom: 200,
            width: 400,
            height: 200,
            toJSON: () => ({}),
        });
        fireEvent.click(canvas, { clientX: 100, clientY: 80 });
        expect(screen.getByRole('heading', { name: 'Product for the new hotspot' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Use standard picker' }));
        applyLastProductPicker('sku-hat');

        expect(lastValue()).toMatchObject({
            version: 1,
            sourceMode: 'manual',
            hotspots: [{ productId: 'sku-hat', x: 25, y: 40 }],
        });
        expect(screen.getByRole('button', { name: /Hotspot 1, product sku-hat/ })).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Valid configuration');
    });

    test('searches by product name or ID and stores the selected name as an authoring hint', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    products: [
                        {
                            productId: '26-00512-068',
                            productName: 'Kids slim chino trousers',
                            image: 'https://images.example.test/trouser.jpg',
                        },
                    ],
                }),
        } as Response);
        send('sfcc:ready', {
            value: null,
            config: {
                maxHotspots: 12,
                productSearchEndpoint: 'https://store.example.test/resource/shoppable-product-search',
            },
            isRequired: true,
        });
        fireEvent.click(screen.getByRole('button', { name: '+ Add hotspot on image' }));
        const canvas = screen.getByLabelText('Hotspot canvas for desktop');
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 400,
            bottom: 200,
            width: 400,
            height: 200,
            toJSON: () => ({}),
        });
        fireEvent.click(canvas, { clientX: 200, clientY: 100 });
        fireEvent.change(screen.getByRole('searchbox', { name: 'Product name or ID' }), {
            target: { value: 'chino' },
        });
        const searchForm = screen.getByRole('searchbox', { name: 'Product name or ID' }).closest('form');
        if (!searchForm) throw new Error('Missing product search form');
        fireEvent.submit(searchForm);

        const result = await screen.findByRole('button', {
            name: /Kids slim chino trousers/,
        });
        fireEvent.click(result);

        expect(fetchMock).toHaveBeenCalledWith('https://store.example.test/resource/shoppable-product-search?q=chino', {
            credentials: 'omit',
        });
        expect(lastValue()).toMatchObject({
            hotspots: [
                {
                    productId: '26-00512-068',
                    productName: 'Kids slim chino trousers',
                    x: 50,
                    y: 50,
                },
            ],
        });
        expect(screen.getByText('Kids slim chino trousers')).toBeInTheDocument();
    });

    test('supports independent mobile coordinates and keyboard movement', () => {
        send('sfcc:ready', {
            value: {
                version: 1,
                sourceMode: 'manual',
                hotspots: [{ id: 'hat', productId: 'sku-hat', x: 20, y: 30 }],
            },
            isRequired: true,
        });
        fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
        const point = screen.getByRole('button', { name: /Hotspot 1, product sku-hat/ });
        fireEvent.keyDown(point, { key: 'ArrowRight', shiftKey: true });

        expect(lastValue()).toMatchObject({
            hotspots: [{ id: 'hat', productId: 'sku-hat', x: 20, y: 30, mobileX: 25, mobileY: 30 }],
        });
        expect(screen.getByLabelText('Coordinate view').querySelector('[aria-pressed="true"]')).toHaveTextContent(
            'Mobile'
        );
    });

    test('sizes a populated canvas to the preview image so percentage coordinates do not drift', () => {
        send('sfcc:ready', {
            value: {
                version: 1,
                sourceMode: 'manual',
                desktopPreviewUrl: 'https://images.example.test/campaign-wide.jpg',
                hotspots: [{ id: 'hat', productId: 'sku-hat', x: 20, y: 30 }],
            },
            isRequired: true,
        });

        const canvas = screen.getByLabelText('Hotspot canvas for desktop');
        expect(canvas).toHaveClass('hotspot-editor__canvas--has-preview');
        expect(canvas.querySelector('img')).toHaveAttribute('src', 'https://images.example.test/campaign-wide.jpg');
    });

    test('selects a Product Set separately and preserves point products', () => {
        send('sfcc:ready', {
            value: { sourceMode: 'manual', hotspots: [{ id: 'one', productId: 'sku-1', x: 50, y: 50 }] },
            isRequired: true,
        });
        fireEvent.click(screen.getByRole('radio', { name: 'Product Set' }));
        fireEvent.click(screen.getByRole('button', { name: 'Select Product Set' }));
        fireEvent.click(screen.getByRole('button', { name: 'Use standard picker' }));
        applyLastProductPicker('look-set');

        expect(lastValue()).toMatchObject({
            sourceMode: 'productSet',
            productSetId: 'look-set',
            hotspots: [{ productId: 'sku-1' }],
        });
    });

    test('sanitizes external values and honors disabled updates', () => {
        send('sfcc:ready', {
            value: {
                sourceMode: 'manual',
                desktopPreviewUrl: 'javascript:alert(1)',
                hotspots: [{ id: 'x', productId: ' sku-1 ', x: -10, y: 120 }],
            },
            isRequired: true,
        });
        expect(screen.getByLabelText(/Preview URL for desktop/)).toHaveValue('');
        expect(screen.getByText('This is not a second published image')).toBeInTheDocument();
        expect(screen.getByLabelText('X desktop (%)')).toHaveValue(0);
        expect(screen.getByLabelText('Y desktop (%)')).toHaveValue(100);

        send('sfcc:disabled', true);
        expect(screen.getByText('This field is disabled in the current context.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Desktop' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Change product' })).toBeDisabled();
    });
});
