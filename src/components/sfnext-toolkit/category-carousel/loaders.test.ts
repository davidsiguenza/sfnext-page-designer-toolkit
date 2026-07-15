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
import { fetchCategories } from '@/lib/api/categories.server';
import { loader } from './loaders';

vi.mock('@/lib/api/categories.server', () => ({ fetchCategories: vi.fn() }));

const mockedFetchCategories = vi.mocked(fetchCategories);
const context = {} as LoaderFunctionArgs['context'];

describe('SFNext Toolkit category carousel loader', () => {
    beforeEach(() => vi.clearAllMocks());

    test('loads immediate child categories and caps automatic cards at twelve', async () => {
        const categories: ShopperProducts.schemas['Category'][] = Array.from({ length: 14 }, (_, index) => ({
            id: `category-${index}`,
            name: `Category ${index}`,
        }));
        mockedFetchCategories.mockResolvedValue(categories);

        const result = await loader({ componentData: { data: { parentCategory: 'root' } }, context });

        expect(mockedFetchCategories).toHaveBeenCalledWith(context, 'root', 1);
        expect(result).toHaveLength(12);
        expect(result?.[11]?.id).toBe('category-11');
    });

    test.each([undefined, '', 42])('returns null in manual mode: %s', async (parentCategory) => {
        await expect(loader({ componentData: { data: { parentCategory } }, context })).resolves.toBeNull();
        expect(mockedFetchCategories).not.toHaveBeenCalled();
    });
});
