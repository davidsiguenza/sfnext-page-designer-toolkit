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

import type { LoaderFunctionArgs } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperExperience, ShopperSearch } from '@/scapi';
import { fetchSearchProducts } from '@/lib/api/search.server';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { loader } from './loaders';

vi.mock('@/lib/api/search.server', () => ({ fetchSearchProducts: vi.fn() }));
vi.mock('@salesforce/storefront-next-runtime/design/mode', () => ({
    isDesignModeActive: vi.fn(),
    isPreviewModeActive: vi.fn(),
}));

const mockedFetchSearchProducts = vi.mocked(fetchSearchProducts);
const mockedIsDesignModeActive = vi.mocked(isDesignModeActive);
const mockedIsPreviewModeActive = vi.mocked(isPreviewModeActive);
const context = { get: () => ({ currency: 'EUR' }) } as unknown as LoaderFunctionArgs['context'];
const request = new Request('https://example.com/es/es/');

function component(data: Record<string, unknown>, id = 'carousel-1'): ShopperExperience.schemas['Component'] {
    return { id, typeId: 'SFNextToolkit.productCarousel', data } as ShopperExperience.schemas['Component'];
}

function result(ids: string[], total = ids.length): ShopperSearch.schemas['ProductSearchResult'] {
    return {
        hits: ids.map((productId) => ({ productId })),
        total,
        limit: ids.length || 1,
        offset: 0,
    } as ShopperSearch.schemas['ProductSearchResult'];
}

describe('SFNext Toolkit product carousel loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedIsDesignModeActive.mockReturnValue(false);
        mockedIsPreviewModeActive.mockReturnValue(false);
    });

    test.each([
        [{ sourceMode: 'manual', categoryId: 'girls' }, 'manual mode'],
        [{ sourceMode: 'auto' }, 'auto mode without category'],
        [{ sourceMode: 'category' }, 'category mode without a category'],
    ])('does not search in %s (%s)', async (data, _description) => {
        await expect(loader({ componentData: component(data), context, request })).resolves.toBeNull();
        expect(mockedFetchSearchProducts).not.toHaveBeenCalled();
    });

    test('loads ordered category products with clamped limits and presentation search parameters', async () => {
        mockedFetchSearchProducts.mockResolvedValue(
            result(
                Array.from({ length: 14 }, (_, index) => `p-${index}`),
                14
            )
        );

        const loaded = await loader({
            componentData: component({
                sourceMode: 'auto',
                categoryId: ' girls ',
                limit: 99,
                imageViewType: 'large',
                showSwatches: false,
                additionalAttributes: 'material|Material',
            }),
            context,
            request,
        });

        expect(mockedFetchSearchProducts).toHaveBeenCalledWith(
            context,
            expect.objectContaining({
                refine: ['cgid=girls'],
                limit: 12,
                offset: 0,
                currency: 'EUR',
                imgTypes: 'large',
                includedCustomVariationProperties: ['c_material'],
            })
        );
        expect(loaded?.hits).toHaveLength(12);
    });

    test('keeps random-per-request stable in design mode and uses at most two searches per load', async () => {
        const allProducts = Array.from({ length: 8 }, (_, index) => `p-${index}`);
        mockedIsDesignModeActive.mockReturnValue(true);
        mockedFetchSearchProducts.mockImplementation((_context, parameters) => {
            const offset = parameters.offset ?? 0;
            const limit = parameters.limit ?? 3;
            return Promise.resolve(result(allProducts.slice(offset, offset + limit), allProducts.length));
        });

        const args = {
            componentData: component({
                sourceMode: 'category',
                categoryId: 'girls',
                limit: 3,
                selectionStrategy: 'random-per-request',
            }),
            context,
            request,
        };
        const first = await loader(args);
        const firstCallCount = mockedFetchSearchProducts.mock.calls.length;
        const second = await loader(args);
        const secondCallCount = mockedFetchSearchProducts.mock.calls.length - firstCallCount;

        expect(first?.hits?.map(({ productId }) => productId)).toEqual(second?.hits?.map(({ productId }) => productId));
        expect(first?.hits).toHaveLength(3);
        expect(firstCallCount).toBeLessThanOrEqual(2);
        expect(secondCallCount).toBeLessThanOrEqual(2);
    });

    test('propagates category search failures to the Page Designer component boundary', async () => {
        const failure = new Error('search unavailable');
        mockedFetchSearchProducts.mockRejectedValue(failure);

        await expect(
            loader({
                componentData: component({ sourceMode: 'category', categoryId: 'girls' }),
                context,
                request,
            })
        ).rejects.toBe(failure);
    });
});
