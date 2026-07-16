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
import {
    assembleProductCarouselWindow,
    getCircularWindowStart,
    hashProductCarouselSeed,
    resolveProductCarouselSeed,
    shuffleProductCarouselHits,
} from './selection.server';

const hit = (productId: string): ShopperSearch.schemas['ProductSearchHit'] => ({ productId });

describe('SFNext Toolkit product carousel random selection', () => {
    test('creates deterministic hashes and non-mutating shuffles', () => {
        const products = [hit('one'), hit('two'), hit('three'), hit('four')];
        const originalOrder = products.map(({ productId }) => productId);
        const seed = hashProductCarouselSeed('carousel|category');

        expect(hashProductCarouselSeed('carousel|category')).toBe(seed);
        expect(shuffleProductCarouselHits(products, seed)).toEqual(shuffleProductCarouselHits(products, seed));
        expect(products.map(({ productId }) => productId)).toEqual(originalOrder);
    });

    test('uses stable design and daily seeds', () => {
        const designSeed = resolveProductCarouselSeed({
            strategy: 'random-per-request',
            componentId: 'carousel-1',
            categoryId: 'girls',
            isDesignMode: true,
            now: new Date('2026-07-16T12:00:00Z'),
        });
        const repeatedDesignSeed = resolveProductCarouselSeed({
            strategy: 'random-per-request',
            componentId: 'carousel-1',
            categoryId: 'girls',
            isDesignMode: true,
            now: new Date('2026-08-16T12:00:00Z'),
        });
        const firstDay = resolveProductCarouselSeed({
            strategy: 'random-daily',
            componentId: 'carousel-1',
            categoryId: 'girls',
            isDesignMode: false,
            now: new Date('2026-07-16T12:00:00Z'),
        });
        const secondDay = resolveProductCarouselSeed({
            strategy: 'random-daily',
            componentId: 'carousel-1',
            categoryId: 'girls',
            isDesignMode: false,
            now: new Date('2026-07-17T12:00:00Z'),
        });

        expect(repeatedDesignSeed).toBe(designSeed);
        expect(secondDay).not.toBe(firstDay);
    });

    test('assembles a circular wrapped window without duplicate products', () => {
        const seed = Array.from({ length: 100 }, (_, value) => value).find(
            (candidate) => getCircularWindowStart(5, candidate) === 4
        );
        expect(seed).toBeDefined();

        const products = assembleProductCarouselWindow({
            windowHits: [hit('five'), hit('five')],
            firstHits: [hit('one'), hit('two'), hit('three')],
            limit: 3,
            seed: seed ?? 0,
        });

        expect(products).toHaveLength(3);
        expect(new Set(products.map(({ productId }) => productId))).toEqual(new Set(['five', 'one', 'two']));
    });
});
