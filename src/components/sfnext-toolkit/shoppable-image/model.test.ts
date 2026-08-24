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
import {
    clampHotspotCoordinate,
    createAutomaticHotspots,
    normalizeShoppableImageConfig,
    SHOPPABLE_IMAGE_MAX_HOTSPOTS,
} from './model';

describe('shoppable image model', () => {
    test('normalizes strings, legacy wrappers, coordinates and unsafe preview URLs', () => {
        expect(
            normalizeShoppableImageConfig({
                value: JSON.stringify({
                    version: 1,
                    sourceMode: 'productSet',
                    productSetId: ' look-1 ',
                    desktopPreviewUrl: 'javascript:alert(1)',
                    mobilePreviewUrl: '/images/look-mobile.jpg',
                    hotspots: [
                        {
                            id: ' hat ',
                            productId: ' sku-hat ',
                            productName: ' Knitted hat ',
                            label: ' Hat ',
                            x: -20,
                            y: '125',
                            mobileX: '12.34',
                        },
                        { productId: '' },
                    ],
                }),
            })
        ).toEqual({
            version: 1,
            sourceMode: 'productSet',
            productSetId: 'look-1',
            mobilePreviewUrl: '/images/look-mobile.jpg',
            hotspots: [
                {
                    id: 'hat',
                    productId: 'sku-hat',
                    productName: 'Knitted hat',
                    label: 'Hat',
                    x: 0,
                    y: 100,
                    mobileX: 12.3,
                },
            ],
        });
    });

    test('fails closed for malformed values and caps the public contract', () => {
        expect(normalizeShoppableImageConfig('{broken')).toEqual({
            version: 1,
            sourceMode: 'manual',
            hotspots: [],
        });

        const normalized = normalizeShoppableImageConfig({
            hotspots: Array.from({ length: SHOPPABLE_IMAGE_MAX_HOTSPOTS + 5 }, (_, index) => ({
                productId: `sku-${index}`,
                x: index,
                y: index,
            })),
        });
        expect(normalized.hotspots).toHaveLength(SHOPPABLE_IMAGE_MAX_HOTSPOTS);
    });

    test('creates deterministic starter positions for unique Product Set children', () => {
        const hotspots = createAutomaticHotspots(['sku-1', 'sku-2', 'sku-1', 'sku-3']);
        expect(hotspots.map(({ productId }) => productId)).toEqual(['sku-1', 'sku-2', 'sku-3']);
        expect(hotspots.every(({ x, y }) => x > 0 && x < 100 && y > 0 && y < 100)).toBe(true);
        expect(clampHotspotCoordinate('42.26')).toBe(42.3);
    });
});
