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

import type { ShopperSearch } from '@/scapi';
import type { ProductCarouselSelectionStrategy } from './config';

type ProductSearchHit = ShopperSearch.schemas['ProductSearchHit'];

/** Small deterministic hash suitable for deriving a repeatable PRNG seed. */
export function hashProductCarouselSeed(value: string): number {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

/** Mulberry32 produces a deterministic sequence while keeping selection code testable. */
export function createProductCarouselRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function createEntropySeed(): number {
    const entropy = new Uint32Array(1);
    globalThis.crypto.getRandomValues(entropy);
    return entropy[0] ?? 0;
}

export function resolveProductCarouselSeed({
    strategy,
    componentId,
    categoryId,
    isDesignMode,
    now = new Date(),
}: {
    strategy: ProductCarouselSelectionStrategy;
    componentId: string;
    categoryId: string;
    isDesignMode: boolean;
    now?: Date;
}): number {
    const identity = `${componentId}|${categoryId}`;

    // A stable authoring canvas is more useful than a carousel that jumps every time
    // Page Designer refreshes a component preview.
    if (isDesignMode) return hashProductCarouselSeed(`${identity}|design`);

    if (strategy === 'random-daily') {
        return hashProductCarouselSeed(`${identity}|${now.toISOString().slice(0, 10)}`);
    }

    return createEntropySeed();
}

export function shuffleProductCarouselHits(hits: ProductSearchHit[], seed: number): ProductSearchHit[] {
    const shuffled = [...hits];
    const random = createProductCarouselRandom(seed ^ 0x9e3779b9);

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
}

export function getCircularWindowStart(total: number, seed: number): number {
    if (!Number.isFinite(total) || total <= 1) return 0;
    return Math.floor(createProductCarouselRandom(seed)() * Math.trunc(total));
}

/**
 * Combines a random search window with the already-fetched first page when the
 * circular window wraps. Duplicate IDs are removed defensively in case the
 * search index changes between the two requests.
 */
export function assembleProductCarouselWindow({
    windowHits,
    firstHits,
    limit,
    seed,
}: {
    windowHits: ProductSearchHit[];
    firstHits: ProductSearchHit[];
    limit: number;
    seed: number;
}): ProductSearchHit[] {
    const selected: ProductSearchHit[] = [];
    const seen = new Set<string>();

    for (const hit of [...windowHits, ...firstHits]) {
        if (!hit.productId || seen.has(hit.productId)) continue;
        seen.add(hit.productId);
        selected.push(hit);
        if (selected.length === limit) break;
    }

    return shuffleProductCarouselHits(selected, seed).slice(0, limit);
}
