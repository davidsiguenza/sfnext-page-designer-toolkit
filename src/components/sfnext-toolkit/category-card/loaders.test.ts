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
import type { ShopperProducts } from '@/scapi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchCategory } from '@/lib/api/categories.server';
import { loader } from './loaders';

vi.mock('@/lib/api/categories.server', () => ({ fetchCategory: vi.fn() }));

const mockedFetchCategory = vi.mocked(fetchCategory);
const context = {} as LoaderFunctionArgs['context'];

describe('SFNext Toolkit category card loader', () => {
    beforeEach(() => vi.clearAllMocks());

    test('loads the selected category without unnecessary child levels', async () => {
        const category: ShopperProducts.schemas['Category'] = { id: 'girls', name: 'Girls' };
        mockedFetchCategory.mockResolvedValue(category);

        await expect(loader({ componentData: { data: { category: 'girls' } }, context })).resolves.toEqual(category);
        expect(mockedFetchCategory).toHaveBeenCalledWith(context, 'girls', 0);
    });

    test.each([undefined, '', 42])('returns null when the category selector is not usable: %s', async (category) => {
        await expect(loader({ componentData: { data: { category } }, context })).resolves.toBeNull();
        expect(mockedFetchCategory).not.toHaveBeenCalled();
    });
});
