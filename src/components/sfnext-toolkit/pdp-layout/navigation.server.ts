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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */
import type { LoaderFunctionArgs } from 'react-router';
import { fetchSearchProducts } from '@/lib/api/search.server';

export const PDP_NAVIGATION_SEARCH_LIMIT = 48;

export interface PdpProductNavigationItem {
    productId: string;
    productName: string;
}

export interface PdpProductNavigationData {
    previous?: PdpProductNavigationItem;
    next?: PdpProductNavigationItem;
}

interface FetchPdpProductNavigationOptions {
    categoryId: string;
    currentProductIds: string[];
    currency?: string;
}

function toNavigationItem(hit: { productId?: string; productName?: string } | undefined) {
    const productId = hit?.productId?.trim();
    if (!productId) return undefined;

    return {
        productId,
        productName: hit?.productName?.trim() || productId,
    };
}

/**
 * Resolves adjacent products from one bounded primary-category search. Navigation
 * deliberately stops at the fetched window edges instead of implying that every
 * category product was loaded.
 */
export async function fetchPdpProductNavigation(
    context: LoaderFunctionArgs['context'],
    { categoryId, currentProductIds, currency }: FetchPdpProductNavigationOptions
): Promise<PdpProductNavigationData> {
    const currentIds = new Set(currentProductIds.map((id) => id.trim()).filter(Boolean));
    if (!categoryId.trim() || currentIds.size === 0) return {};

    const result = await fetchSearchProducts(context, {
        limit: PDP_NAVIGATION_SEARCH_LIMIT,
        offset: 0,
        // Preserve the category's merchandising order instead of inheriting
        // fetchSearchProducts' generic best-matches default.
        sort: undefined,
        refine: [`cgid=${categoryId}`],
        // Adjacent navigation only needs the base hit identity. Avoid the default
        // promotion, variation, price, image, meta-tag, and custom-property payload.
        expand: undefined,
        allImages: false,
        allVariationProperties: false,
        perPricebook: false,
        imgTypes: undefined,
        ...(currency ? { currency } : {}),
    });
    const hits = result.hits ?? [];
    const currentIndex = hits.findIndex((hit) => Boolean(hit?.productId && currentIds.has(hit.productId)));
    if (currentIndex < 0) return {};

    return {
        previous: toNavigationItem(hits[currentIndex - 1]),
        next: toNavigationItem(hits[currentIndex + 1]),
    };
}
