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
import { describe, expect, test } from 'vitest';
import { ProductImageViewType } from '@/components/product-list/config';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import {
    DEFAULT_PLP_MERCHANDISING_GRID_CONFIG,
    getPLPProductListConfigForView,
    getPLPMerchandisingGridConfigFromPage,
    getPLPMerchandisingGridConfigKey,
    normalizePLPMerchandisingGridConfig,
    resolvePLPCardView,
} from './config';

describe('PLP merchandising-grid configuration', () => {
    test('uses compatibility-safe defaults', () => {
        expect(normalizePLPMerchandisingGridConfig(undefined)).toEqual(DEFAULT_PLP_MERCHANDISING_GRID_CONFIG);
    });

    test('normalizes layout, view and product-card settings from Page Designer', () => {
        const config = normalizePLPMerchandisingGridConfig({
            stickyControls: 'true',
            stickyFilters: 1,
            defaultCardView: 'editorial',
            allowedCardViews: 'all',
            cardSurface: 'muted',
            gridDensity: 'comfortable',
            desktopColumns: '5',
            imageViewType: 'large',
            showSku: false,
            additionalAttributes: 'material|Material',
        });

        expect(config).toMatchObject({
            stickyControls: true,
            stickyFilters: true,
            defaultCardView: 'editorial',
            allowedCardViews: ['standard', 'editorial', 'compact'],
            cardSurface: 'muted',
            gridDensity: 'comfortable',
            desktopColumns: '5',
        });
        expect(config.productList).toMatchObject({
            imageViewType: ProductImageViewType.LARGE,
            showSku: false,
            additionalAttributes: [{ id: 'c_material', label: 'Material' }],
        });
    });

    test('falls back to the first allowed view when the authored default is not permitted', () => {
        const config = normalizePLPMerchandisingGridConfig({
            defaultCardView: 'compact',
            allowedCardViews: 'standard-editorial',
        });

        expect(config.defaultCardView).toBe('standard');
        expect(resolvePLPCardView(config, 'compact')).toBe('standard');
        expect(resolvePLPCardView(config, 'editorial')).toBe('editorial');
    });

    test('uses real content-density presets for editorial and compact card views', () => {
        const config = normalizePLPMerchandisingGridConfig({
            showBrand: true,
            showCategory: true,
            showSku: true,
            showRating: true,
            showSwatches: true,
            showPromotions: true,
            additionalAttributes: 'material|Material',
        });

        expect(getPLPProductListConfigForView(config, 'editorial')).toMatchObject({
            showBrand: true,
            showCategory: false,
            showSku: false,
            showSwatches: true,
            additionalAttributes: [],
        });
        expect(getPLPProductListConfigForView(config, 'compact')).toMatchObject({
            showBrand: false,
            showCategory: false,
            showSku: false,
            showRating: false,
            showSwatches: false,
            showPromotions: false,
            additionalAttributes: [],
        });
    });

    test('extracts only the qualified merchandising component from its dedicated page region', () => {
        const page = {
            id: 'merchandising-plp',
            typeId: 'sfnextToolkitMerchandisingProductListingPage',
            regions: [
                {
                    id: 'plpMerchandisingGrid',
                    components: [
                        { id: 'ignored', typeId: 'SFNextToolkit.productList', data: {} },
                        {
                            id: 'grid',
                            typeId: 'SFNextToolkit.plpMerchandisingGrid',
                            data: { desktopColumns: '3', showWishlist: false },
                        },
                    ],
                },
            ],
        } as unknown as PageWithComponentData;

        const config = getPLPMerchandisingGridConfigFromPage(page);
        expect(config).toMatchObject({ desktopColumns: '3' });
        expect(config?.productList.showWishlist).toBe(false);
        if (!config) throw new Error('Expected the merchandising-grid component to be extracted');
        expect(getPLPMerchandisingGridConfigKey(config)).not.toBe(
            getPLPMerchandisingGridConfigKey({ ...config, desktopColumns: '4' })
        );
    });

    test('returns null so legacy PLPs keep their existing product-list fallback', () => {
        expect(getPLPMerchandisingGridConfigFromPage(null)).toBeNull();
        expect(
            getPLPMerchandisingGridConfigFromPage({
                id: 'legacy',
                typeId: 'plp',
                regions: [],
            } as unknown as PageWithComponentData)
        ).toBeNull();
    });
});
