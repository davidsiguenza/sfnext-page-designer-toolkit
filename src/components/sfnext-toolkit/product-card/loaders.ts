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
import { siteContext, type SiteContext } from '@salesforce/storefront-next-runtime/site-context';
import type { ShopperExperience, ShopperSearch } from '@/scapi';
import {
    getProductListSearchParameters,
    normalizeProductListConfig,
    type ProductListComponentAttributes,
} from '@/components/product-list/config';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { fetchProductById } from '@/lib/api/products.server';
import { convertProductToProductSearchHit } from '@/lib/product/product-conversion';

export type ProductCardLoaderStatus = 'ready' | 'unconfigured' | 'not-found';

export interface ProductCardLoaderData {
    status: ProductCardLoaderStatus;
    product: ShopperSearch.schemas['ProductSearchHit'] | null;
    categoryName?: string;
}

const emptyResult = (status: Exclude<ProductCardLoaderStatus, 'ready'>): ProductCardLoaderData => ({
    status,
    product: null,
});

/** Loads the product selected on a standalone SFNext Toolkit Product Card. */
export async function loader({
    componentData,
    context,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
}): Promise<ProductCardLoaderData> {
    const component = componentData as ShopperExperience.schemas['Component'];
    const attributes = (component.data ?? {}) as ProductListComponentAttributes & { productId?: unknown };
    const productId = typeof attributes.productId === 'string' ? attributes.productId.trim() : '';

    if (!productId) return emptyResult('unconfigured');

    const presentation = normalizeProductListConfig(attributes);
    const { imgTypes } = getProductListSearchParameters(presentation);
    const { currency } = context.get(siteContext) as SiteContext;

    try {
        const product = await fetchProductById(context, productId, {
            expand: ['images', 'prices', 'promotions', 'variations', 'primary_category'],
            allImages: true,
            imgTypes,
            perPricebook: true,
            ...(currency ? { currency } : {}),
        });

        if (!product) return emptyResult('not-found');

        const topCategory = product.primaryCategory?.parentCategoryTree?.[0] ?? product.primaryCategory;
        return {
            status: 'ready',
            product: convertProductToProductSearchHit(product),
            ...(topCategory?.name?.trim() ? { categoryName: topCategory.name.trim() } : {}),
        };
    } catch (error) {
        if (error instanceof NormalizedApiError && error.status === 404) {
            return emptyResult('not-found');
        }
        throw error;
    }
}
