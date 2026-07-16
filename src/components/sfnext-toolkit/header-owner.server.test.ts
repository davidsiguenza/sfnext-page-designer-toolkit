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
import { RouterContextProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { withMegaMenuFeatureData } from './mega-menu-feature/loaders';
import {
    fetchHeaderOwnerOnce,
    fetchHeaderOwnerWithMegaMenuDataOnce,
    fetchPublishedSiteThemeHeader,
    resetPublishedSiteThemeCache,
} from './header-owner.server';

vi.mock('@/lib/page-designer/component-loader.server', () => ({
    fetchComponentWithComponentData: vi.fn(),
}));

vi.mock('./mega-menu-feature/loaders', () => ({
    MEGA_MENU_FEATURE_TYPE_ID: 'SFNextToolkit.megaMenuFeature',
    withMegaMenuFeatureData: vi.fn((_context, component) =>
        component ? { ...component, componentData: { feature: Promise.resolve({ status: 'ready' }) } } : null
    ),
}));

vi.mock('@salesforce/storefront-next-runtime/design/mode', () => ({
    isDesignModeActive: vi.fn(() => false),
    isPreviewModeActive: vi.fn(() => false),
}));

const mockedFetchComponent = vi.mocked(fetchComponentWithComponentData);
const mockedWithMegaMenuData = vi.mocked(withMegaMenuFeatureData);
const mockedIsDesignMode = vi.mocked(isDesignModeActive);
const mockedIsPreviewMode = vi.mocked(isPreviewModeActive);

const scope = { siteId: 'RefArchGlobal', localeId: 'es-ES' };

function makeHeader(primary = '#8A1538') {
    return {
        id: 'header',
        typeId: 'Layout.header',
        embedded: true,
        regions: [
            {
                id: 'siteTheme',
                components: [
                    {
                        id: `theme-${primary}`,
                        typeId: 'SFNextToolkit.siteTheme',
                        data: { enabled: true, theme: { version: 1, tokens: { primary } } },
                    },
                ],
            },
            { id: 'megaMenuEnhancements', components: [{ id: 'menu-private-data' }] },
        ],
        componentData: { requestSpecific: Promise.resolve({ customer: 'must-not-be-cached' }) },
    };
}

function args(context = new RouterContextProvider()) {
    return {
        context,
        request: new Request('https://example.test/es/es/'),
        params: {},
    } as never;
}

describe('request-scoped Header Page Designer owner', () => {
    beforeEach(() => {
        mockedFetchComponent.mockReset();
        mockedWithMegaMenuData.mockReset().mockImplementation((_context, component) =>
            component
                ? ({
                      ...component,
                      componentData: { feature: Promise.resolve({ status: 'ready' }) },
                  } as never)
                : null
        );
        mockedIsDesignMode.mockReset().mockReturnValue(false);
        mockedIsPreviewMode.mockReset().mockReturnValue(false);
        resetPublishedSiteThemeCache();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test('deduplicates the raw owner fetch and enriches only the app consumer', async () => {
        const header = {
            id: 'header',
            typeId: 'Layout.header',
            embedded: true,
            regions: [{ id: 'megaMenuEnhancements', components: [] }],
        };
        mockedFetchComponent.mockResolvedValue(header as never);
        const loaderArgs = args();

        const first = fetchHeaderOwnerOnce(loaderArgs);
        const second = fetchHeaderOwnerOnce(loaderArgs);

        expect(first).toBe(second);
        await expect(first).resolves.toBe(header);
        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);
        expect(mockedFetchComponent).toHaveBeenCalledWith(
            loaderArgs,
            { componentId: 'header' },
            {
                preserveRequestedComponentId: true,
                excludeDescendantLoaderTypeIds: ['SFNextToolkit.megaMenuFeature'],
            }
        );
        expect(mockedWithMegaMenuData).not.toHaveBeenCalled();

        const enriched = await fetchHeaderOwnerWithMegaMenuDataOnce(loaderArgs);
        expect(enriched).toMatchObject({ id: 'header', componentData: { feature: expect.any(Promise) } });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);
        expect(mockedWithMegaMenuData).toHaveBeenCalledTimes(1);
    });

    test('keeps separate requests isolated', async () => {
        mockedFetchComponent.mockResolvedValue(null);

        await Promise.all([fetchHeaderOwnerOnce(args()), fetchHeaderOwnerOnce(args())]);

        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);
    });

    test('caches only the published theme projection by site and locale', async () => {
        mockedFetchComponent.mockResolvedValue(makeHeader() as never);

        const first = await fetchPublishedSiteThemeHeader(args(), scope);
        const second = await fetchPublishedSiteThemeHeader(args(), scope);

        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
        expect(first).toMatchObject({
            id: 'header',
            regions: [{ id: 'siteTheme', components: [{ id: 'theme-#8A1538' }] }],
        });
        expect(first?.regions).toHaveLength(1);
        expect(first).not.toHaveProperty('componentData');
    });

    test('does not share published themes across locales', async () => {
        mockedFetchComponent.mockResolvedValue(makeHeader() as never);

        await fetchPublishedSiteThemeHeader(args(), scope);
        await fetchPublishedSiteThemeHeader(args(), { ...scope, localeId: 'en-GB' });

        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);
    });

    test('refreshes an expired value before returning it', async () => {
        const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
        mockedFetchComponent.mockResolvedValueOnce(makeHeader('#111111') as never);
        await fetchPublishedSiteThemeHeader(args(), scope);

        now.mockReturnValue(31_001);
        mockedFetchComponent.mockResolvedValueOnce(makeHeader('#222222') as never);
        const refreshed = await fetchPublishedSiteThemeHeader(args(), scope);

        expect(refreshed?.regions?.[0]?.components?.[0]?.data).toMatchObject({
            theme: { tokens: { primary: '#222222' } },
        });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);
    });

    test('skips the published lookup entirely in Page Designer Edit and Preview', async () => {
        mockedIsDesignMode.mockReturnValueOnce(true);
        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toBeNull();

        mockedIsPreviewMode.mockReturnValueOnce(true);
        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toBeNull();

        expect(mockedFetchComponent).not.toHaveBeenCalled();
    });

    test('bounds a cold Shopper Experience lookup to one second', async () => {
        vi.useFakeTimers();
        mockedFetchComponent.mockReturnValue(new Promise(() => undefined));

        const pending = fetchPublishedSiteThemeHeader(args(), scope);
        await vi.advanceTimersByTimeAsync(1_000);

        await expect(pending).resolves.toBeNull();
        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);
    });

    test('lets a valid response that finishes after the caller timeout warm the cache', async () => {
        vi.useFakeTimers();
        let resolveRefresh: ((value: ReturnType<typeof makeHeader>) => void) | undefined;
        mockedFetchComponent.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveRefresh = resolve as (value: ReturnType<typeof makeHeader>) => void;
            })
        );

        const timedOut = fetchPublishedSiteThemeHeader(args(), scope);
        await vi.advanceTimersByTimeAsync(1_000);
        await expect(timedOut).resolves.toBeNull();

        resolveRefresh?.(makeHeader('#555555'));
        await vi.advanceTimersByTimeAsync(0);

        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toMatchObject({
            regions: [{ components: [{ data: { theme: { tokens: { primary: '#555555' } } } }] }],
        });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);
    });

    test('fails closed instead of serving an expired theme when refresh times out', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(1_000));
        mockedFetchComponent.mockResolvedValueOnce(makeHeader('#111111') as never);
        await fetchPublishedSiteThemeHeader(args(), scope);

        vi.setSystemTime(new Date(31_001));
        mockedFetchComponent.mockReturnValueOnce(new Promise(() => undefined));
        const pending = fetchPublishedSiteThemeHeader(args(), scope);
        await vi.advanceTimersByTimeAsync(1_000);

        await expect(pending).resolves.toBeNull();
    });

    test('retries a hung refresh after the hard timeout and ignores its late result', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(0));
        let resolveHungRefresh: ((value: ReturnType<typeof makeHeader>) => void) | undefined;
        mockedFetchComponent.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveHungRefresh = resolve as (value: ReturnType<typeof makeHeader>) => void;
            })
        );

        const timedOut = fetchPublishedSiteThemeHeader(args(), scope);
        await vi.advanceTimersByTimeAsync(1_000);
        await expect(timedOut).resolves.toBeNull();

        // Before the five-second hard timeout, callers share the existing
        // generation instead of starting a request storm.
        const sharedRefresh = fetchPublishedSiteThemeHeader(args(), scope);
        await vi.advanceTimersByTimeAsync(1_000);
        await expect(sharedRefresh).resolves.toBeNull();
        expect(mockedFetchComponent).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(3_000);
        mockedFetchComponent.mockResolvedValueOnce(makeHeader('#444444') as never);
        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toMatchObject({
            regions: [{ components: [{ data: { theme: { tokens: { primary: '#444444' } } } }] }],
        });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);

        // The original request can still settle, but its older generation must
        // never overwrite the successful replacement.
        resolveHungRefresh?.(makeHeader('#111111'));
        await vi.advanceTimersByTimeAsync(0);
        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toMatchObject({
            regions: [{ components: [{ data: { theme: { tokens: { primary: '#444444' } } } }] }],
        });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);
    });

    test('clears a failed cold refresh so the next request can retry', async () => {
        mockedFetchComponent.mockRejectedValueOnce(new Error('temporary network failure'));

        await expect(fetchPublishedSiteThemeHeader(args(), scope)).rejects.toThrow('temporary network failure');

        mockedFetchComponent.mockResolvedValueOnce(makeHeader('#333333') as never);
        await expect(fetchPublishedSiteThemeHeader(args(), scope)).resolves.toMatchObject({
            regions: [{ components: [{ data: { theme: { tokens: { primary: '#333333' } } } }] }],
        });
        expect(mockedFetchComponent).toHaveBeenCalledTimes(2);
    });
});
