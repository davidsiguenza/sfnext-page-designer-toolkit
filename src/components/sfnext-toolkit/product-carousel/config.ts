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

import { normalizeInteger } from '@/components/product-list/config';

export const DEFAULT_PRODUCT_CAROUSEL_LIMIT = 12;
export const MIN_PRODUCT_CAROUSEL_LIMIT = 1;
export const MAX_PRODUCT_CAROUSEL_LIMIT = 12;

export const PRODUCT_CAROUSEL_SOURCE_MODES = ['auto', 'manual', 'category'] as const;
export type ProductCarouselSourceMode = (typeof PRODUCT_CAROUSEL_SOURCE_MODES)[number];

export const PRODUCT_CAROUSEL_SELECTION_STRATEGIES = ['catalog-order', 'random-per-request', 'random-daily'] as const;
export type ProductCarouselSelectionStrategy = (typeof PRODUCT_CAROUSEL_SELECTION_STRATEGIES)[number];

const SOURCE_MODES = new Set<string>(PRODUCT_CAROUSEL_SOURCE_MODES);
const SELECTION_STRATEGIES = new Set<string>(PRODUCT_CAROUSEL_SELECTION_STRATEGIES);

export function normalizeProductCarouselLimit(value: unknown): number {
    return normalizeInteger(
        value,
        DEFAULT_PRODUCT_CAROUSEL_LIMIT,
        MIN_PRODUCT_CAROUSEL_LIMIT,
        MAX_PRODUCT_CAROUSEL_LIMIT
    );
}

export function normalizeProductCarouselSourceMode(value: unknown): ProductCarouselSourceMode {
    return typeof value === 'string' && SOURCE_MODES.has(value) ? (value as ProductCarouselSourceMode) : 'auto';
}

export function normalizeProductCarouselSelectionStrategy(value: unknown): ProductCarouselSelectionStrategy {
    return typeof value === 'string' && SELECTION_STRATEGIES.has(value)
        ? (value as ProductCarouselSelectionStrategy)
        : 'catalog-order';
}

export function shouldUseCategoryProducts(sourceMode: unknown, categoryId: unknown): boolean {
    const normalizedMode = normalizeProductCarouselSourceMode(sourceMode);
    if (normalizedMode === 'manual') return false;
    if (normalizedMode === 'category') return true;
    return typeof categoryId === 'string' && Boolean(categoryId.trim());
}
