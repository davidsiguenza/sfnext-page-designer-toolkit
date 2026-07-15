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
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { SFNextToolkitProductListMetadata } from './index';

describe('SFNext Toolkit product list metadata', () => {
    test('uses the isolated reusable component type ID', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitProductListMetadata)).toBe('SFNextToolkit.productList');
    });

    test('keeps the configurable PLP contract', () => {
        const { fields } = getAttributeDefinitions(SFNextToolkitProductListMetadata.prototype);

        expect(Object.keys(fields)).toEqual([
            'imageViewType',
            'showBadges',
            'showWishlist',
            'showQuickAdd',
            'showSwatches',
            'showBrand',
            'showCategory',
            'showProductName',
            'showSku',
            'showRating',
            'showPrice',
            'showPromotions',
            'maxSwatches',
            'additionalAttributes',
        ]);
        expect(fields.imageViewType).toMatchObject({
            type: 'enum',
            values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
            defaultValue: 'medium',
        });
    });
});
