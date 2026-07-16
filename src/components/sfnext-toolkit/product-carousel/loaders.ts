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
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { siteContext, type SiteContext } from '@salesforce/storefront-next-runtime/site-context';
import type { ShopperExperience, ShopperSearch } from '@/scapi';
import {
    getProductListSearchParameters,
    normalizeProductListConfig,
    type ProductListComponentAttributes,
} from '@/components/product-list/config';
import { fetchSearchProducts } from '@/lib/api/search.server';
import {
    normalizeProductCarouselLimit,
    normalizeProductCarouselSelectionStrategy,
    shouldUseCategoryProducts,
} from './config';
import {
    assembleProductCarouselWindow,
    getCircularWindowStart,
    resolveProductCarouselSeed,
    shuffleProductCarouselHits,
} from './selection.server';

type ProductSearchResult = ShopperSearch.schemas['ProductSearchResult'];

export type ProductCarouselComponentData = ProductListComponentAttributes & {
    sourceMode?: unknown;
    selectionStrategy?: unknown;
    categoryId?: unknown;
    limit?: unknown;
};

type ProductCarouselLoaderArgs = {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
    request: Request;
};

async function searchCategory(
    context: LoaderFunctionArgs['context'],
    {
        categoryId,
        limit,
        offset,
        currency,
        presentation,
    }: {
        categoryId: string;
        limit: number;
        offset: number;
        currency?: string;
        presentation: ReturnType<typeof normalizeProductListConfig>;
    }
): Promise<ProductSearchResult> {
    return fetchSearchProducts(context, {
        refine: [`cgid=${categoryId}`],
        limit,
        offset,
        currency,
        ...getProductListSearchParameters(presentation),
    });
}

/**
 * Loads category-backed products for the toolkit carousel. Ordered selection
 * needs one search request. Random selection uses a circular window and at most
 * one additional request, regardless of category size.
 */
export async function loader({ componentData, context, request }: ProductCarouselLoaderArgs) {
    const component = componentData as ShopperExperience.schemas['Component'];
    const attributes = (component.data ?? {}) as ProductCarouselComponentData;
    const rawCategoryId = attributes.categoryId;

    if (!shouldUseCategoryProducts(attributes.sourceMode, rawCategoryId)) return null;

    const categoryId = typeof rawCategoryId === 'string' ? rawCategoryId.trim() : '';
    if (!categoryId) return null;

    const limit = normalizeProductCarouselLimit(attributes.limit);
    const selectionStrategy = normalizeProductCarouselSelectionStrategy(attributes.selectionStrategy);
    const presentation = normalizeProductListConfig(attributes);
    const { currency } = context.get(siteContext) as SiteContext;
    const query = { categoryId, limit, offset: 0, currency: currency ?? undefined, presentation };
    const firstResult = await searchCategory(context, query);
    const firstHits = firstResult.hits ?? [];

    if (selectionStrategy === 'catalog-order' || firstHits.length === 0) {
        return { ...firstResult, hits: firstHits.slice(0, limit) };
    }

    const total = Math.max(0, Math.trunc(firstResult.total ?? firstHits.length));
    const isDesignMode = isDesignModeActive(request) || isPreviewModeActive(request);
    const seed = resolveProductCarouselSeed({
        strategy: selectionStrategy,
        componentId: component.id,
        categoryId,
        isDesignMode,
    });

    if (total <= limit) {
        return { ...firstResult, hits: shuffleProductCarouselHits(firstHits, seed).slice(0, limit) };
    }

    const windowStart = getCircularWindowStart(total, seed);
    if (windowStart === 0) {
        return { ...firstResult, hits: shuffleProductCarouselHits(firstHits, seed).slice(0, limit) };
    }

    const windowLength = Math.min(limit, total - windowStart);
    const windowResult = await searchCategory(context, { ...query, limit: windowLength, offset: windowStart });
    const hits = assembleProductCarouselWindow({
        windowHits: windowResult.hits ?? [],
        firstHits,
        limit,
        seed,
    });

    return { ...firstResult, hits };
}
