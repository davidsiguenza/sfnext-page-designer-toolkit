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
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { fetchProductById, fetchProductsByIds } from '@/lib/api/products.server';
import { convertProductToProductSearchHit } from '@/lib/product/product-conversion';
import { loader } from './loaders';

vi.mock('@/lib/api/products.server', () => ({ fetchProductById: vi.fn(), fetchProductsByIds: vi.fn() }));
vi.mock('@/lib/product/product-conversion', () => ({ convertProductToProductSearchHit: vi.fn() }));

const mockedFetchProduct = vi.mocked(fetchProductById);
const mockedFetchProducts = vi.mocked(fetchProductsByIds);
const mockedConvert = vi.mocked(convertProductToProductSearchHit);
const context = { get: vi.fn() } as unknown as LoaderFunctionArgs['context'];

const products = [
    { id: 'sku-hat', name: 'Hat' },
    { id: 'sku-dress', name: 'Dress' },
] as ShopperProducts.schemas['Product'][];

const hits = [
    { productId: 'sku-hat', productName: 'Hat', currency: 'EUR' },
    { productId: 'sku-dress', productName: 'Dress', currency: 'EUR' },
] as ShopperSearch.schemas['ProductSearchHit'][];

describe('shoppable image loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(context.get).mockReturnValue({ currency: 'EUR' });
        mockedFetchProducts.mockResolvedValue(products);
        mockedConvert.mockImplementation((product) => {
            const hit = hits.find((candidate) => candidate.productId === product.id);
            if (!hit) throw new Error(`Missing mocked search hit for ${product.id}`);
            return hit;
        });
    });

    test('loads free selections in one site- and currency-aware catalog request', async () => {
        const result = await loader({
            componentData: {
                data: {
                    hotspotConfig: {
                        version: 1,
                        sourceMode: 'manual',
                        hotspots: [
                            { id: 'hat', productId: 'sku-hat', x: 20, y: 15 },
                            { id: 'dress', productId: 'sku-dress', x: 48, y: 55, mobileX: 52, mobileY: 44 },
                        ],
                    },
                },
            },
            context,
        });

        expect(result).toMatchObject({
            status: 'ready',
            currency: 'EUR',
            invalidProductIds: [],
            hotspots: [
                { id: 'hat', product: hits[0] },
                { id: 'dress', product: hits[1], mobileX: 52, mobileY: 44 },
            ],
        });
        expect(mockedFetchProducts).toHaveBeenCalledWith(
            context,
            ['sku-hat', 'sku-dress'],
            expect.objectContaining({ currency: 'EUR', perPricebook: true })
        );
        expect(mockedFetchProducts.mock.calls[0]?.[2]).not.toHaveProperty('inventoryIds');
    });

    test('validates Product Set membership and loads every child for the global view', async () => {
        mockedFetchProduct.mockResolvedValue({
            id: 'look-1',
            name: 'Campaign look',
            type: { set: true },
            setProducts: products,
        } as ShopperProducts.schemas['Product']);

        const result = await loader({
            componentData: {
                data: {
                    hotspotConfig: {
                        sourceMode: 'productSet',
                        productSetId: 'look-1',
                        hotspots: [
                            { id: 'valid', productId: 'sku-hat', x: 10, y: 20 },
                            { id: 'foreign', productId: 'sku-foreign', x: 80, y: 20 },
                        ],
                    },
                },
            },
            context,
        });

        expect(result).toMatchObject({
            status: 'ready',
            productSetId: 'look-1',
            productSetName: 'Campaign look',
            invalidProductIds: ['sku-foreign'],
        });
        expect(result.hotspots[0].product).toBe(hits[0]);
        expect(result.hotspots[1].product).toBeNull();
        expect(mockedFetchProducts).toHaveBeenCalledWith(context, ['sku-hat', 'sku-dress'], expect.any(Object));
    });

    test('auto-places Product Set children and rejects ordinary products', async () => {
        mockedFetchProduct.mockResolvedValueOnce({
            id: 'look-1',
            name: 'Campaign look',
            type: { set: true },
            setProducts: products,
        } as ShopperProducts.schemas['Product']);
        const automatic = await loader({
            componentData: { data: { hotspotConfig: { sourceMode: 'productSet', productSetId: 'look-1' } } },
            context,
        });
        expect(automatic.hotspots).toHaveLength(2);

        mockedFetchProduct.mockResolvedValueOnce({
            id: 'ordinary',
            type: { item: true },
        } as ShopperProducts.schemas['Product']);
        await expect(
            loader({
                componentData: {
                    data: { hotspotConfig: { sourceMode: 'productSet', productSetId: 'ordinary', hotspots: [] } },
                },
                context,
            })
        ).resolves.toMatchObject({ status: 'product-set-invalid' });
    });

    test('returns authoring-safe states for incomplete and failed catalog configurations', async () => {
        await expect(loader({ componentData: { data: { hotspotConfig: null } }, context })).resolves.toMatchObject({
            status: 'unconfigured',
        });

        mockedFetchProducts.mockRejectedValueOnce(new Error('SCAPI down'));
        await expect(
            loader({
                componentData: {
                    data: { hotspotConfig: { hotspots: [{ productId: 'sku-hat', x: 50, y: 50 }] } },
                },
                context,
            })
        ).resolves.toMatchObject({ status: 'catalog-error' });
    });
});
