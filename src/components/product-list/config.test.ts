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
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import {
    DEFAULT_PRODUCT_LIST_CONFIG,
    getProductListConfigFromPage,
    getProductListConfigKey,
    getProductListSearchParameters,
    normalizeBoolean,
    normalizeInteger,
    normalizeProductImageViewType,
    normalizeProductListConfig,
    parseAdditionalAttributes,
    ProductImageViewType,
} from './config';

describe('parseAdditionalAttributes', () => {
    test('accepts line/comma separators, both label syntaxes and optional c_ prefixes', () => {
        expect(parseAdditionalAttributes('material|Material\nc_season=Temporada,careInstructions')).toEqual([
            { id: 'c_material', label: 'Material' },
            { id: 'c_season', label: 'Temporada' },
            { id: 'c_careInstructions', label: 'Care Instructions' },
        ]);
    });

    test('deduplicates identifiers, rejects invalid ids and keeps at most five valid attributes', () => {
        expect(
            parseAdditionalAttributes(
                'material|Primero,material|Duplicado,bad-id,two words,9invalid,one,two,three,four,five,six'
            )
        ).toEqual([
            { id: 'c_material', label: 'Primero' },
            { id: 'c_one', label: 'One' },
            { id: 'c_two', label: 'Two' },
            { id: 'c_three', label: 'Three' },
            { id: 'c_four', label: 'Four' },
        ]);
    });

    test('normalizes already structured attributes without trusting invalid objects', () => {
        expect(
            parseAdditionalAttributes([
                { id: 'c_fabricType', label: 'Tejido' },
                { id: 'invalid id', label: 'No válido' },
                null,
            ])
        ).toEqual([{ id: 'c_fabricType', label: 'Tejido' }]);
    });
});

describe('product-list normalization', () => {
    test('uses defaults that preserve the existing product-list presentation', () => {
        expect(normalizeProductListConfig(undefined)).toEqual(DEFAULT_PRODUCT_LIST_CONFIG);
    });

    test('normalizes boolean, integer and view-type values received as Page Designer data', () => {
        expect(normalizeBoolean('false', true)).toBe(false);
        expect(normalizeBoolean('ON', false)).toBe(true);
        expect(normalizeBoolean('unexpected', true)).toBe(true);
        expect(normalizeInteger('7.9', 3, 1, 12)).toBe(7);
        expect(normalizeInteger(50, 3, 1, 12)).toBe(12);
        expect(normalizeInteger('  ', 3, 1, 12)).toBe(3);
        expect(normalizeInteger('not-a-number', 3, 1, 12)).toBe(3);
        expect(normalizeProductImageViewType('hi-res')).toBe(ProductImageViewType.HI_RES);
        expect(normalizeProductImageViewType(' large ')).toBe(ProductImageViewType.LARGE);
        expect(normalizeProductImageViewType('thumbnail')).toBe(ProductImageViewType.MEDIUM);
    });

    test('normalizes the complete component configuration', () => {
        expect(
            normalizeProductListConfig({
                imageViewType: 'large',
                showWishlist: '0',
                showRating: 'false',
                maxSwatches: '5',
                additionalAttributes: 'material|Material',
            })
        ).toEqual({
            ...DEFAULT_PRODUCT_LIST_CONFIG,
            imageViewType: ProductImageViewType.LARGE,
            showWishlist: false,
            showRating: false,
            maxSwatches: 5,
            additionalAttributes: [{ id: 'c_material', label: 'Material' }],
        });
    });
});

describe('Page Designer and SCAPI helpers', () => {
    test('extracts the component whose type ends in .productList from the requested region', () => {
        const page = {
            id: 'category-page',
            typeId: 'plp',
            regions: [
                {
                    id: 'plpProductList',
                    components: [
                        { id: 'ignored', typeId: 'Content.banner', data: {} },
                        {
                            id: 'list',
                            typeId: 'Layout.productList',
                            data: { imageViewType: 'small', showSku: false, additionalAttributes: 'material' },
                        },
                    ],
                },
            ],
        } as unknown as PageWithComponentData;

        expect(getProductListConfigFromPage(page)).toEqual({
            ...DEFAULT_PRODUCT_LIST_CONFIG,
            imageViewType: ProductImageViewType.SMALL,
            showSku: false,
            additionalAttributes: [{ id: 'c_material', label: 'Material' }],
        });
    });

    test('falls back safely for missing pages, regions and non-qualified component type ids', () => {
        const page = {
            id: 'category-page',
            typeId: 'plp',
            regions: [
                {
                    id: 'plpProductList',
                    components: [{ id: 'list', typeId: 'productList', data: { imageViewType: 'large' } }],
                },
            ],
        } as unknown as PageWithComponentData;

        expect(getProductListConfigFromPage(null)).toEqual(DEFAULT_PRODUCT_LIST_CONFIG);
        expect(getProductListConfigFromPage(page)).toEqual(DEFAULT_PRODUCT_LIST_CONFIG);
    });

    test('deduplicates selected and swatch image types and includes custom variation properties', () => {
        expect(
            getProductListSearchParameters({
                ...DEFAULT_PRODUCT_LIST_CONFIG,
                imageViewType: ProductImageViewType.LARGE,
                additionalAttributes: [
                    { id: 'c_material', label: 'Material' },
                    { id: 'c_material', label: 'Material duplicado' },
                    { id: 'c_season', label: 'Temporada' },
                ],
            })
        ).toEqual({
            imgTypes: 'large,swatch',
            includedCustomVariationProperties: ['c_material', 'c_season'],
        });

        expect(
            getProductListSearchParameters({
                ...DEFAULT_PRODUCT_LIST_CONFIG,
                imageViewType: ProductImageViewType.SWATCH,
            })
        ).toEqual({ imgTypes: 'swatch' });
    });

    test('builds a stable key and changes it when presentation data changes', () => {
        const initial = normalizeProductListConfig({ additionalAttributes: 'material|Material' });
        expect(getProductListConfigKey(initial)).toBe(getProductListConfigKey({ ...initial }));
        expect(getProductListConfigKey(initial)).not.toBe(
            getProductListConfigKey({ ...initial, imageViewType: ProductImageViewType.LARGE })
        );
    });
});
