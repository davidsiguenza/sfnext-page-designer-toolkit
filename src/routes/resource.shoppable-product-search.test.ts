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
import { RouterContextProvider } from 'react-router';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchSearchProducts } from '@/lib/api/search.server';
import { loader } from './resource.shoppable-product-search';

vi.mock('@/lib/api/search.server', () => ({ fetchSearchProducts: vi.fn() }));

const mockedSearch = vi.mocked(fetchSearchProducts);
const endpoint = 'https://store.example.com/resource/shoppable-product-search';
const authoringOrigin = 'https://sandbox-001.dx.commercecloud.salesforce.com';

function context() {
    const value = new RouterContextProvider();
    value.set(siteContext, { currency: 'EUR' } as never);
    return value;
}

function request(query: string, origin = authoringOrigin) {
    return new Request(`${endpoint}?q=${encodeURIComponent(query)}`, {
        headers: { Origin: origin },
    });
}

describe('Page Designer shoppable product search resource', () => {
    beforeEach(() => vi.clearAllMocks());

    test('searches localized catalog data by name or ID and returns a small authoring payload', async () => {
        mockedSearch.mockResolvedValue({
            hits: [
                {
                    productId: '26-00512-068',
                    productName: 'Kids slim chino trousers',
                    image: { link: 'https://images.example.test/trouser.jpg' },
                },
            ],
        } as never);

        const response = await loader({ request: request('chino'), context: context() } as never);

        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(authoringOrigin);
        await expect(response.json()).resolves.toEqual({
            products: [
                {
                    productId: '26-00512-068',
                    productName: 'Kids slim chino trousers',
                    image: 'https://images.example.test/trouser.jpg',
                },
            ],
        });
        expect(mockedSearch).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ q: 'chino', currency: 'EUR', limit: 8, offset: 0 })
        );
    });

    test('rejects too-short searches without calling SCAPI', async () => {
        const response = await loader({ request: request('p'), context: context() } as never);
        expect(response.status).toBe(400);
        expect(mockedSearch).not.toHaveBeenCalled();
    });

    test('rejects unrelated cross-origin callers', async () => {
        const response = await loader({
            request: request('chino', 'https://attacker.example'),
            context: context(),
        } as never);
        expect(response.status).toBe(403);
        expect(mockedSearch).not.toHaveBeenCalled();
    });

    test('fails safely and tells the editor to use the standard picker', async () => {
        mockedSearch.mockRejectedValue(new Error('SCAPI unavailable'));
        const response = await loader({ request: request('26-00512'), context: context() } as never);
        expect(response.status).toBe(502);
        await expect(response.json()).resolves.toMatchObject({
            error: expect.stringContaining('standard product picker'),
        });
    });
});
