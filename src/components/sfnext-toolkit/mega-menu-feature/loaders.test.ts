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
import type { ShopperExperience, ShopperProducts } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { fetchCategoriesByIds } from '@/lib/api/categories.server';
import { fetchProductsByIds } from '@/lib/api/products.server';
import { fetchComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import {
    fetchComponentWithMegaMenuFeatureData,
    loadMegaMenuFeatureData,
    loader,
    type FeatureReference,
} from './loaders';

const loggerMocks = vi.hoisted(() => {
    const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    return { logger, getLogger: vi.fn(() => logger) };
});

vi.mock('@/lib/api-clients.server', () => ({ createApiClients: vi.fn() }));
vi.mock('@/lib/api/categories.server', () => ({ fetchCategoriesByIds: vi.fn() }));
vi.mock('@/lib/api/products.server', () => ({ fetchProductsByIds: vi.fn() }));
vi.mock('@/lib/logger.server', () => ({ getLogger: loggerMocks.getLogger }));
vi.mock('@/lib/page-designer/component-loader.server', () => ({ fetchComponentWithComponentData: vi.fn() }));

const getMultipleContent = vi.fn();
const mockedFetchCategories = vi.mocked(fetchCategoriesByIds);
const mockedFetchProducts = vi.mocked(fetchProductsByIds);
const mockedFetchComponent = vi.mocked(fetchComponentWithComponentData);
const context = { get: vi.fn(() => ({ currency: 'EUR' })) } as unknown as LoaderFunctionArgs['context'];

function reference(id: string, config: FeatureReference['config']): FeatureReference {
    return { id, config };
}

describe('SFNext Toolkit mega menu feature shared loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(context.get).mockReturnValue({ currency: 'EUR' });
        vi.mocked(createApiClients).mockReturnValue({
            shopperExperience: { getMultipleContent },
        } as never);
        mockedFetchCategories.mockResolvedValue([]);
        mockedFetchProducts.mockResolvedValue([]);
        getMultipleContent.mockResolvedValue({ data: { data: [] } });
    });

    test('resolves all five source types while batching and de-duplicating every remote family', async () => {
        const category = {
            id: 'girls',
            name: 'Girls',
            image: '/categories/girls.jpg',
        } as ShopperProducts.schemas['Category'];
        const product = {
            id: 'sku-1',
            name: 'Floral dress',
            imageGroups: [{ viewType: 'hi-res', images: [{ link: '/products/sku-1.jpg' }] }],
        } as ShopperProducts.schemas['Product'];
        mockedFetchCategories.mockResolvedValue([category]);
        mockedFetchProducts.mockResolvedValue([product]);
        getMultipleContent.mockResolvedValue({
            data: {
                data: [
                    {
                        id: 'story-1',
                        c_cardTitle: 'Summer story',
                        c_cardImage: '/content/story.jpg',
                        c_cardLink: '/stories/summer',
                    },
                ],
            },
        });

        const result = await loadMegaMenuFeatureData(context, [
            reference('category-a', { sourceType: 'category', category: 'girls' }),
            reference('category-b', { sourceType: 'category', category: { id: 'girls' } }),
            reference('product-a', { sourceType: 'product', product: 'sku-1', imageViewType: 'hi-res' }),
            reference('product-b', { sourceType: 'product', product: 'sku-1', imageViewType: 'medium' }),
            reference('content', {
                sourceType: 'content',
                contentId: 'story-1',
                titleAttribute: 'cardTitle',
                imageAttribute: 'cardImage',
                linkAttribute: 'cardLink',
            }),
            reference('cms', {
                sourceType: 'cms',
                cmsRecord: {
                    id: 'cms-1',
                    attributes: { title: 'CMS feature', image: '/cms/feature.jpg', link: '/cms/feature' },
                },
            }),
            reference('custom', { sourceType: 'custom', title: 'Authored feature', ctaUrl: '/campaign' }),
        ]);

        expect(mockedFetchCategories).toHaveBeenCalledTimes(1);
        expect(mockedFetchCategories).toHaveBeenCalledWith(context, ['girls'], 0);
        expect(mockedFetchProducts).toHaveBeenCalledTimes(1);
        expect(mockedFetchProducts).toHaveBeenCalledWith(context, ['sku-1'], {
            expand: ['images', 'prices', 'promotions'],
            allImages: true,
            imgTypes: 'hi-res,large,medium,small,swatch',
            perPricebook: true,
            currency: 'EUR',
        });
        expect(getMultipleContent).toHaveBeenCalledTimes(1);
        expect(getMultipleContent).toHaveBeenCalledWith({ params: { query: { ids: ['story-1'] } } });

        expect(result['category-a']).toMatchObject({
            status: 'ready',
            item: { sourceType: 'category', sourceId: 'girls', title: 'Girls' },
        });
        expect(result['category-b']).toEqual(result['category-a']);
        expect(result['product-a']).toMatchObject({
            status: 'ready',
            item: {
                sourceType: 'product',
                sourceId: 'sku-1',
                image: { requestedViewType: 'hi-res', resolvedViewType: 'hi-res' },
            },
        });
        expect(result['product-b']).toMatchObject({
            status: 'ready',
            item: {
                image: { requestedViewType: 'medium', resolvedViewType: 'hi-res' },
            },
        });
        expect(result.content).toMatchObject({
            status: 'ready',
            item: { sourceType: 'content', sourceId: 'story-1', title: 'Summer story' },
        });
        expect(result.cms).toMatchObject({
            status: 'ready',
            item: { sourceType: 'cms', sourceId: 'cms-1', title: 'CMS feature' },
        });
        expect(result.custom).toEqual({ status: 'ready', item: { sourceType: 'custom' } });
    });

    test('marks incomplete selectors as unconfigured and clean misses as not-found without making empty calls', async () => {
        const result = await loadMegaMenuFeatureData(context, [
            reference('category-empty', { sourceType: 'category', category: '  ' }),
            reference('product-empty', { sourceType: 'product' }),
            reference('content-empty', { sourceType: 'content', contentId: 'contains,comma' }),
            reference('cms-empty', { sourceType: 'cms', cmsRecord: { id: 'empty', attributes: {} } }),
            reference('custom-empty', { sourceType: 'custom' }),
            reference('custom-cta-only', {
                sourceType: 'custom',
                eyebrow: 'Campaign',
                badge: 'New',
                ctaLabel: 'Discover',
                ctaUrl: '/campaign',
            }),
            reference('category-missing', { sourceType: 'category', category: 'missing-category' }),
            reference('product-missing', { sourceType: 'product', product: 'missing-product' }),
            reference('content-missing', { sourceType: 'content', contentId: 'missing-content' }),
        ]);

        expect(result).toMatchObject({
            'category-empty': { status: 'unconfigured' },
            'product-empty': { status: 'unconfigured' },
            'content-empty': { status: 'unconfigured' },
            'cms-empty': { status: 'unconfigured' },
            'custom-empty': { status: 'unconfigured' },
            'custom-cta-only': { status: 'unconfigured' },
            'category-missing': { status: 'not-found' },
            'product-missing': { status: 'not-found' },
            'content-missing': { status: 'not-found' },
        });
        expect(mockedFetchCategories).toHaveBeenCalledWith(context, ['missing-category'], 0);
        expect(mockedFetchProducts).toHaveBeenCalledWith(context, ['missing-product'], expect.any(Object));
        expect(getMultipleContent).toHaveBeenCalledWith({ params: { query: { ids: ['missing-content'] } } });
    });

    test('isolates a failed request family and logs only aggregate diagnostics without source IDs or messages', async () => {
        mockedFetchCategories.mockResolvedValue([
            { id: 'girls', name: 'Girls' } as ShopperProducts.schemas['Category'],
        ]);
        mockedFetchProducts.mockRejectedValue(new TypeError('secret response for sensitive-sku'));
        getMultipleContent.mockResolvedValue({ data: { data: [{ id: 'story-1', name: 'Story' }] } });

        const result = await loadMegaMenuFeatureData(context, [
            reference('category', { sourceType: 'category', category: 'girls' }),
            reference('product', { sourceType: 'product', product: 'sensitive-sku' }),
            reference('content', { sourceType: 'content', contentId: 'story-1' }),
        ]);

        expect(result.category.status).toBe('ready');
        expect(result.product).toEqual({ status: 'error' });
        expect(result.content.status).toBe('ready');
        expect(loggerMocks.logger.warn).toHaveBeenCalledTimes(1);
        expect(loggerMocks.logger.warn).toHaveBeenCalledWith('SFNext Toolkit mega menu feature source failed', {
            source: 'product',
            count: 1,
            error: 'TypeError',
        });
        const serializedLog = JSON.stringify(loggerMocks.logger.warn.mock.calls);
        expect(serializedLog).not.toContain('sensitive-sku');
        expect(serializedLog).not.toContain('secret response');
    });

    test('omits pricing currency when the active site has none', async () => {
        vi.mocked(context.get).mockReturnValue({ currency: undefined });

        await loadMegaMenuFeatureData(context, [
            reference('product', { sourceType: 'product', product: 'sku-1', imageViewType: 'large' }),
        ]);

        expect(mockedFetchProducts).toHaveBeenCalledWith(
            context,
            ['sku-1'],
            expect.not.objectContaining({ currency: expect.anything() })
        );
    });

    test('returns an empty map without initializing clients for an empty menu', async () => {
        await expect(loadMegaMenuFeatureData(context, [])).resolves.toEqual({});
        expect(createApiClients).not.toHaveBeenCalled();
        expect(mockedFetchCategories).not.toHaveBeenCalled();
        expect(mockedFetchProducts).not.toHaveBeenCalled();
    });
});

describe('SFNext Toolkit owner-level mega menu batch attachment', () => {
    const args = {
        context,
        request: new Request('https://storefront.example.test/'),
        params: {},
    } as LoaderFunctionArgs;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(context.get).mockReturnValue({ currency: 'EUR' });
        vi.mocked(createApiClients).mockReturnValue({ shopperExperience: { getMultipleContent } } as never);
        mockedFetchCategories.mockResolvedValue([
            { id: 'girls', name: 'Girls' } as ShopperProducts.schemas['Category'],
        ]);
        getMultipleContent.mockResolvedValue({ data: { data: [] } });
    });

    test('fetches an arbitrary owner ID and attaches one shared batch to recursively nested feature children', async () => {
        const existingData = Promise.resolve({ existing: true });
        const component = {
            id: 'header',
            typeId: 'Layout.header',
            componentData: { existing: existingData },
            regions: [
                {
                    id: 'megaMenuEnhancements',
                    components: [
                        {
                            id: 'authored-mega-menu-42',
                            typeId: 'SFNextToolkit.megaMenu',
                            regions: [
                                {
                                    id: 'panels',
                                    components: [
                                        {
                                            id: 'panel-girls-a',
                                            typeId: 'SFNextToolkit.megaMenuPanel',
                                            regions: [
                                                {
                                                    id: 'feature',
                                                    components: [
                                                        {
                                                            id: 'feature-a',
                                                            typeId: 'SFNextToolkit.megaMenuFeature',
                                                            data: { sourceType: 'category', category: 'girls' },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: 'panel-girls-b',
                                            typeId: 'SFNextToolkit.megaMenuPanel',
                                            regions: [
                                                {
                                                    id: 'feature',
                                                    components: [
                                                        {
                                                            id: 'feature-b',
                                                            typeId: 'SFNextToolkit.megaMenuFeature',
                                                            data: { sourceType: 'category', category: 'girls' },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        } as unknown as ShopperExperience.schemas['Component'] & {
            componentData: Record<string, Promise<unknown>>;
        };
        mockedFetchComponent.mockResolvedValue(component);

        const resolved = await fetchComponentWithMegaMenuFeatureData(args, 'header');

        expect(mockedFetchComponent).toHaveBeenCalledWith(
            args,
            { componentId: 'header' },
            {
                preserveRequestedComponentId: true,
                excludeDescendantLoaderTypeIds: ['SFNextToolkit.megaMenuFeature'],
            }
        );
        expect(resolved?.componentData?.existing).toBe(existingData);
        await expect(resolved?.componentData?.['feature-a']).resolves.toMatchObject({ status: 'ready' });
        await expect(resolved?.componentData?.['feature-b']).resolves.toMatchObject({ status: 'ready' });
        expect(mockedFetchCategories).toHaveBeenCalledTimes(1);
        expect(mockedFetchCategories).toHaveBeenCalledWith(context, ['girls'], 0);
    });

    test('passes through null and owners without feature descendants', async () => {
        mockedFetchComponent.mockResolvedValueOnce(null);
        await expect(fetchComponentWithMegaMenuFeatureData(args, 'missing-owner')).resolves.toBeNull();

        const owner = {
            id: 'header',
            typeId: 'Layout.header',
            regions: [{ id: 'megaMenuEnhancements', components: [] }],
        } as ShopperExperience.schemas['Component'];
        mockedFetchComponent.mockResolvedValueOnce(owner);
        await expect(fetchComponentWithMegaMenuFeatureData(args, 'header')).resolves.toBe(owner);
        expect(mockedFetchCategories).not.toHaveBeenCalled();
    });

    test('resolves a focused feature root without requiring the embedded owner', async () => {
        await expect(
            loader({
                componentData: {
                    id: 'focused-feature',
                    typeId: 'SFNextToolkit.megaMenuFeature',
                    data: { sourceType: 'custom', title: 'Editorial feature' },
                },
                context,
            })
        ).resolves.toMatchObject({
            status: 'ready',
            item: { sourceType: 'custom' },
        });
        expect(mockedFetchCategories).not.toHaveBeenCalled();
        expect(mockedFetchProducts).not.toHaveBeenCalled();
        expect(getMultipleContent).not.toHaveBeenCalled();
    });
});
