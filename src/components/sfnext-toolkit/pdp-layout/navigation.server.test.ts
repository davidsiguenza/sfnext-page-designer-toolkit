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
import type { ShopperSearch } from '@/scapi';
import { fetchSearchProducts } from '@/lib/api/search.server';
import { fetchPdpProductNavigation, PDP_NAVIGATION_SEARCH_LIMIT } from './navigation.server';

vi.mock('@/lib/api/search.server', () => ({
    fetchSearchProducts: vi.fn(),
}));

const context = {} as LoaderFunctionArgs['context'];
const searchResult = (hits: Array<{ productId: string; productName: string }>) =>
    ({ hits }) as unknown as ShopperSearch.schemas['ProductSearchResult'];

describe('PDP adjacent-product navigation', () => {
    beforeEach(() => vi.clearAllMocks());

    test('returns the products on either side of the current category hit', async () => {
        vi.mocked(fetchSearchProducts).mockResolvedValue(
            searchResult([
                { productId: 'one', productName: 'One' },
                { productId: 'master', productName: 'Current' },
                { productId: 'three', productName: 'Three' },
            ])
        );

        await expect(
            fetchPdpProductNavigation(context, {
                categoryId: 'girls',
                currentProductIds: ['variant', 'master'],
                currency: 'EUR',
            })
        ).resolves.toEqual({
            previous: { productId: 'one', productName: 'One' },
            next: { productId: 'three', productName: 'Three' },
        });
        expect(fetchSearchProducts).toHaveBeenCalledWith(context, {
            limit: PDP_NAVIGATION_SEARCH_LIMIT,
            offset: 0,
            sort: undefined,
            refine: ['cgid=girls'],
            expand: undefined,
            allImages: false,
            allVariationProperties: false,
            perPricebook: false,
            imgTypes: undefined,
            currency: 'EUR',
        });
    });

    test('stops at fetched window edges and returns no links when the current product is absent', async () => {
        vi.mocked(fetchSearchProducts).mockResolvedValue(
            searchResult([
                { productId: 'one', productName: 'One' },
                { productId: 'two', productName: 'Two' },
            ])
        );

        await expect(
            fetchPdpProductNavigation(context, { categoryId: 'girls', currentProductIds: ['one'] })
        ).resolves.toEqual({ next: { productId: 'two', productName: 'Two' } });
        await expect(
            fetchPdpProductNavigation(context, { categoryId: 'girls', currentProductIds: ['missing'] })
        ).resolves.toEqual({});
    });

    test('does not call search without a usable category or product ID', async () => {
        await expect(
            fetchPdpProductNavigation(context, { categoryId: '', currentProductIds: ['current'] })
        ).resolves.toEqual({});
        await expect(
            fetchPdpProductNavigation(context, { categoryId: 'girls', currentProductIds: ['  '] })
        ).resolves.toEqual({});
        expect(fetchSearchProducts).not.toHaveBeenCalled();
    });
});
