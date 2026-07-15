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
import type { ShopperSearch } from '@/scapi';
import { ProductImageViewType } from '@/components/product-list/config';
import { selectProductImages } from './selection';

const createImage = (viewType: string): ShopperSearch.schemas['Image'] => ({
    link: `https://example.com/images/${viewType}/product.jpg`,
});

const productWithEveryViewType: ShopperSearch.schemas['ProductSearchHit'] = {
    productId: 'product-1',
    productName: 'Product 1',
    imageGroups: Object.values(ProductImageViewType).map((viewType) => ({
        viewType,
        images: [createImage(viewType)],
    })),
};

describe('selectProductImages', () => {
    test.each(Object.values(ProductImageViewType))('selects only the requested %s group', (viewType) => {
        const result = selectProductImages(productWithEveryViewType, viewType, null);

        expect(result.images[0]?.link).toBe(`https://example.com/images/${viewType}/product.jpg`);
        expect(result.group?.viewType).toBe(viewType);
        expect(result.strategy).toBe('unvaried-group');
    });

    test('prioritizes the requested view type and selected color', () => {
        const product: ShopperSearch.schemas['ProductSearchHit'] = {
            ...productWithEveryViewType,
            imageGroups: [
                {
                    viewType: 'large',
                    images: [{ link: 'https://example.com/images/large/default.jpg' }],
                },
                {
                    viewType: 'large',
                    variationAttributes: [{ id: 'color', values: [{ value: 'blue' }] }],
                    images: [{ link: 'https://example.com/images/large/blue.jpg' }],
                },
            ],
        };

        const result = selectProductImages(product, ProductImageViewType.LARGE, 'blue');

        expect(result.images[0]?.link).toContain('/large/blue.jpg');
        expect(result.strategy).toBe('selected-color-group');
    });

    test('does not use another color-specific group when the selected color is missing', () => {
        const product: ShopperSearch.schemas['ProductSearchHit'] = {
            ...productWithEveryViewType,
            imageGroups: [
                {
                    viewType: 'small',
                    variationAttributes: [{ id: 'color', values: [{ value: 'red' }] }],
                    images: [{ link: 'https://example.com/images/small/red.jpg' }],
                },
            ],
        };

        const result = selectProductImages(product, ProductImageViewType.SMALL, 'blue');

        expect(result).toEqual({ images: [], strategy: 'none' });
    });

    test('does not disguise a missing requested type with product.image', () => {
        const product: ShopperSearch.schemas['ProductSearchHit'] = {
            ...productWithEveryViewType,
            image: { link: 'https://example.com/images/medium/fallback.jpg' },
            imageGroups: [{ viewType: 'medium', images: [createImage('medium')] }],
        };

        expect(selectProductImages(product, ProductImageViewType.HI_RES, null)).toEqual({
            images: [],
            strategy: 'none',
        });
    });

    test('preserves product.image as a legacy fallback only when imageGroups are absent', () => {
        const product: ShopperSearch.schemas['ProductSearchHit'] = {
            productId: 'legacy-product',
            image: { link: 'https://example.com/legacy.jpg' },
        };

        expect(selectProductImages(product, ProductImageViewType.LARGE, null)).toMatchObject({
            images: [{ link: 'https://example.com/legacy.jpg' }],
            strategy: 'product-image-fallback',
        });
    });
});
