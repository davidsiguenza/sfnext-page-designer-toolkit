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
import type { ShopperExperience, ShopperProducts, ShopperSearch } from '@/scapi';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { fetchProductById, fetchProductsByIds } from '@/lib/api/products.server';
import { convertProductToProductSearchHit } from '@/lib/product/product-conversion';
import {
    createAutomaticHotspots,
    normalizeShoppableImageConfig,
    type ShoppableHotspot,
    type ShoppableImageConfig,
} from './model';

export type ShoppableImageLoaderStatus =
    | 'ready'
    | 'unconfigured'
    | 'product-set-not-found'
    | 'product-set-invalid'
    | 'catalog-error';

export interface LoadedShoppableHotspot extends ShoppableHotspot {
    product: ShopperSearch.schemas['ProductSearchHit'] | null;
}

export interface ShoppableImageLoaderData {
    status: ShoppableImageLoaderStatus;
    config: ShoppableImageConfig;
    currency?: string;
    productSetId?: string;
    productSetName?: string;
    hotspots: LoadedShoppableHotspot[];
    products: ShopperSearch.schemas['ProductSearchHit'][];
    invalidProductIds: string[];
}

type Product = ShopperProducts.schemas['Product'];

const productIdOf = (product: Product): string | undefined => {
    const id = typeof product.id === 'string' ? product.id.trim() : '';
    const productId = typeof product.productId === 'string' ? product.productId.trim() : '';
    return id || productId || undefined;
};

const emptyResult = (
    status: Exclude<ShoppableImageLoaderStatus, 'ready'>,
    config: ShoppableImageConfig,
    currency?: string
): ShoppableImageLoaderData => ({
    status,
    config,
    ...(currency ? { currency } : {}),
    ...(config.productSetId ? { productSetId: config.productSetId } : {}),
    hotspots: [],
    products: [],
    invalidProductIds: [],
});

/** Loads current catalog, price and market inventory data for every configured point. */
export async function loader({
    componentData,
    context,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
}): Promise<ShoppableImageLoaderData> {
    const component = componentData as ShopperExperience.schemas['Component'];
    const attributes = (component.data ?? {}) as { hotspotConfig?: unknown };
    const config = normalizeShoppableImageConfig(attributes.hotspotConfig);
    const { currency } = context.get(siteContext) as SiteContext;
    let hotspots = config.hotspots;
    let productSet: Product | null = null;
    let setProductIds: string[] = [];

    if (config.sourceMode === 'productSet') {
        if (!config.productSetId) return emptyResult('unconfigured', config, currency ?? undefined);

        try {
            productSet = await fetchProductById(context, config.productSetId, {
                expand: ['availability', 'images', 'prices', 'promotions', 'set_products', 'variations'],
                allImages: true,
                perPricebook: true,
                ...(currency ? { currency } : {}),
            });
        } catch (error) {
            if (error instanceof NormalizedApiError && error.status === 404) {
                return emptyResult('product-set-not-found', config, currency ?? undefined);
            }
            return emptyResult('catalog-error', config, currency ?? undefined);
        }

        if (!productSet) return emptyResult('product-set-not-found', config, currency ?? undefined);
        if (!productSet.type?.set) return emptyResult('product-set-invalid', config, currency ?? undefined);

        setProductIds = (productSet.setProducts ?? []).map(productIdOf).filter((id): id is string => Boolean(id));
        if (!hotspots.length) hotspots = createAutomaticHotspots(setProductIds);
    }

    if (!hotspots.length) return emptyResult('unconfigured', config, currency ?? undefined);

    const configuredProductIds = hotspots.map(({ productId }) => productId);
    const requestedProductIds =
        config.sourceMode === 'productSet'
            ? Array.from(
                  new Set([...setProductIds, ...configuredProductIds.filter((id) => setProductIds.includes(id))])
              )
            : configuredProductIds;

    let products: Product[];
    try {
        products = await fetchProductsByIds(context, requestedProductIds, {
            expand: ['availability', 'images', 'prices', 'promotions', 'variations'],
            allImages: true,
            perPricebook: true,
            ...(currency ? { currency } : {}),
        });
    } catch {
        return emptyResult('catalog-error', config, currency ?? undefined);
    }

    const hits = products.map(convertProductToProductSearchHit);
    const productById = new Map(hits.map((product) => [product.productId, product]));
    const allowedSetIds = new Set(setProductIds);
    const loadedHotspots: LoadedShoppableHotspot[] = hotspots.map((hotspot) => ({
        ...hotspot,
        product:
            config.sourceMode === 'productSet' && !allowedSetIds.has(hotspot.productId)
                ? null
                : (productById.get(hotspot.productId) ?? null),
    }));
    const invalidProductIds = Array.from(
        new Set(loadedHotspots.filter(({ product }) => !product).map(({ productId }) => productId))
    );

    return {
        status: 'ready',
        config,
        ...(currency ? { currency } : {}),
        ...(config.productSetId ? { productSetId: config.productSetId } : {}),
        ...(productSet?.name ? { productSetName: productSet.name } : {}),
        hotspots: loadedHotspots,
        products: hits,
        invalidProductIds,
    };
}
