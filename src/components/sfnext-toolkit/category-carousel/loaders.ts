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
import type { ShopperExperience, ShopperProducts } from '@/scapi';
import { fetchCategories } from '@/lib/api/categories.server';

/** Loads up to twelve immediate children of the selected parent category. */
export function loader({
    componentData,
    context,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
}): Promise<ShopperProducts.schemas['Category'][] | null> {
    const component = componentData as ShopperExperience.schemas['Component'];
    const parentCategory = (component.data as { parentCategory?: unknown } | undefined)?.parentCategory;

    if (typeof parentCategory !== 'string' || !parentCategory.trim()) {
        return Promise.resolve(null);
    }

    return fetchCategories(context, parentCategory, 1).then((categories) => categories.slice(0, 12));
}
