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
import { ApiError, type ShopperProducts, type ShopperSearch } from '@/scapi';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { fetchProductById } from '@/lib/api/products.server';
import { convertProductToProductSearchHit } from '@/lib/product/product-conversion';
import { loader } from './loaders';

vi.mock('@/lib/api/products.server', () => ({ fetchProductById: vi.fn() }));
vi.mock('@/lib/product/product-conversion', () => ({ convertProductToProductSearchHit: vi.fn() }));

const mockedFetchProductById = vi.mocked(fetchProductById);
const mockedConvertProduct = vi.mocked(convertProductToProductSearchHit);
const context = { get: vi.fn() } as unknown as LoaderFunctionArgs['context'];

const product = {
    id: 'sku-1',
    name: 'Selected product',
    primaryCategory: {
        id: 'dresses',
        name: 'Dresses',
        parentCategoryTree: [
            { id: 'women', name: 'Women' },
            { id: 'dresses', name: 'Dresses' },
        ],
    },
} as ShopperProducts.schemas['Product'];

const hit = { productId: 'sku-1', productName: 'Selected product' } as ShopperSearch.schemas['ProductSearchHit'];

describe('SFNext Toolkit product card loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(context.get).mockReturnValue({ currency: 'EUR' });
        mockedFetchProductById.mockResolvedValue(product);
        mockedConvertProduct.mockReturnValue(hit);
    });

    test.each([undefined, '', '   ', 42])(
        'returns an authoring-safe empty result for productId %s',
        async (productId) => {
            await expect(loader({ componentData: { data: { productId } }, context })).resolves.toEqual({
                status: 'unconfigured',
                product: null,
            });
            expect(mockedFetchProductById).not.toHaveBeenCalled();
        }
    );

    test('loads the selected product with configured image types, pricing, promotions and category', async () => {
        await expect(
            loader({
                componentData: {
                    data: { productId: ' sku-1 ', imageViewType: 'large', showSwatches: true },
                },
                context,
            })
        ).resolves.toEqual({ status: 'ready', product: hit, categoryName: 'Women' });

        expect(mockedFetchProductById).toHaveBeenCalledWith(context, 'sku-1', {
            expand: ['images', 'prices', 'promotions', 'variations', 'primary_category'],
            allImages: true,
            imgTypes: 'large,swatch',
            perPricebook: true,
            currency: 'EUR',
        });
        expect(mockedConvertProduct).toHaveBeenCalledWith(product);
    });

    test('does not request swatch images when the swatch field is disabled', async () => {
        await loader({
            componentData: { data: { productId: 'sku-1', imageViewType: 'hi-res', showSwatches: false } },
            context,
        });

        expect(mockedFetchProductById).toHaveBeenCalledWith(
            context,
            'sku-1',
            expect.objectContaining({ imgTypes: 'hi-res' })
        );
    });

    test('deduplicates the explicit swatch image type', async () => {
        await loader({
            componentData: { data: { productId: 'sku-1', imageViewType: 'swatch', showSwatches: true } },
            context,
        });

        expect(mockedFetchProductById).toHaveBeenCalledWith(
            context,
            'sku-1',
            expect.objectContaining({ imgTypes: 'swatch' })
        );
    });

    test('omits currency when the site context has no active currency', async () => {
        vi.mocked(context.get).mockReturnValue({ currency: undefined });

        await loader({ componentData: { data: { productId: 'sku-1' } }, context });

        expect(mockedFetchProductById).toHaveBeenCalledWith(
            context,
            'sku-1',
            expect.not.objectContaining({ currency: expect.anything() })
        );
    });

    test('returns not-found for an empty SCAPI response or a normalized 404', async () => {
        mockedFetchProductById.mockResolvedValueOnce(null);
        await expect(loader({ componentData: { data: { productId: 'missing' } }, context })).resolves.toEqual({
            status: 'not-found',
            product: null,
        });

        const error = new ApiError({
            status: 404,
            statusText: 'Not Found',
            headers: new Headers(),
            body: { type: 'not-found', title: 'Not Found', detail: 'Missing product' },
            rawBody: '{}',
            url: 'https://api.example.test/products/missing',
            method: 'GET',
        });
        mockedFetchProductById.mockRejectedValueOnce(new NormalizedApiError(error));

        await expect(loader({ componentData: { data: { productId: 'missing' } }, context })).resolves.toEqual({
            status: 'not-found',
            product: null,
        });
    });

    test('propagates authentication, network and server failures', async () => {
        const error = new NormalizedApiError(new Error('SCAPI unavailable'));
        mockedFetchProductById.mockRejectedValue(error);

        await expect(loader({ componentData: { data: { productId: 'sku-1' } }, context })).rejects.toBe(error);
    });
});
