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
    normalizeProductCarouselLimit,
    normalizeProductCarouselSelectionStrategy,
    normalizeProductCarouselSourceMode,
    shouldUseCategoryProducts,
} from './config';

describe('SFNext Toolkit product carousel configuration', () => {
    test.each([
        [undefined, 12],
        ['', 12],
        [0, 1],
        [1, 1],
        [7.8, 7],
        [99, 12],
        ['4', 4],
    ])('normalizes limit %s to %s', (value, expected) => {
        expect(normalizeProductCarouselLimit(value)).toBe(expected);
    });

    test('normalizes source and selection enums defensively', () => {
        expect(normalizeProductCarouselSourceMode('manual')).toBe('manual');
        expect(normalizeProductCarouselSourceMode('invalid')).toBe('auto');
        expect(normalizeProductCarouselSelectionStrategy('random-daily')).toBe('random-daily');
        expect(normalizeProductCarouselSelectionStrategy('invalid')).toBe('catalog-order');
    });

    test('resolves auto, manual and category source precedence', () => {
        expect(shouldUseCategoryProducts('auto', 'girls')).toBe(true);
        expect(shouldUseCategoryProducts('auto', '')).toBe(false);
        expect(shouldUseCategoryProducts('manual', 'girls')).toBe(false);
        expect(shouldUseCategoryProducts('category', '')).toBe(true);
    });
});
