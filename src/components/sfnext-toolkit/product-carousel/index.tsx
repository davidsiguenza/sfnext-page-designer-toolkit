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
import type { ShopperSearch } from '@/scapi';
import type { ComponentType } from '@/components/region';
import ProductCarousel from '@/components/product-carousel/carousel';
import ProductCarouselSkeleton from '@/components/product-carousel/skeleton';
import { normalizeProductListConfig, type ProductListComponentAttributes } from '@/components/product-list/config';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { normalizeSafeLinkUrl } from '../safe-link-url';
import { shouldUseCategoryProducts } from './config';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('productCarousel', {
    name: 'Product Carousel',
    description:
        'A responsive carousel of manually selected products or N catalog-order, daily-random, or request-random products from a category.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'products',
        name: 'Manual products',
        description: 'Add Product Cards or standard Product Tiles in the exact order they should appear.',
        maxComponents: 12,
        componentTypeInclusions: ['Content.productTile', 'SFNextToolkit.productCard'],
    },
])
export class SFNextToolkitProductCarouselMetadata {
    @AttributeDefinition({
        name: 'Heading',
        description: 'Section heading shown above the products.',
        defaultValue: 'Featured products',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Supporting text',
        description: 'Optional short line shown below the heading.',
    })
    subtitle?: string;

    @AttributeDefinition({
        id: 'sourceMode',
        name: 'Product source',
        description: 'Auto uses the selected category when present and otherwise uses manually added product cards.',
        type: 'enum',
        values: ['auto', 'manual', 'category'],
        defaultValue: 'auto',
    })
    sourceMode?: string;

    @AttributeDefinition({
        id: 'categoryId',
        name: 'Category',
        description: 'Automatically populate the carousel with products from this category.',
        type: 'category',
    })
    categoryId?: string;

    @AttributeDefinition({
        id: 'limit',
        name: 'Number of products',
        description: 'Number of category products shown in the carousel (between 1 and 12).',
        type: 'integer',
        defaultValue: 12,
    })
    limit?: number;

    @AttributeDefinition({
        id: 'selectionStrategy',
        name: 'Category selection',
        description:
            'Keep catalog order, randomize on every server load, or use a stable selection that changes daily.',
        type: 'enum',
        values: ['catalog-order', 'random-per-request', 'random-daily'],
        defaultValue: 'catalog-order',
    })
    selectionStrategy?: string;

    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Catalog image type',
        description: 'Catalog view type used by category-loaded product cards.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({
        id: 'showBadges',
        name: 'Show badges',
        description: 'Show product badges such as new or sale on category-loaded cards.',
        type: 'boolean',
        defaultValue: true,
    })
    showBadges?: boolean;

    @AttributeDefinition({
        id: 'showWishlist',
        name: 'Show wishlist action',
        description: 'Show the wishlist action on category-loaded cards.',
        type: 'boolean',
        defaultValue: true,
    })
    showWishlist?: boolean;

    @AttributeDefinition({
        id: 'showQuickAdd',
        name: 'Show quick add',
        description: 'Show the quick-add action on category-loaded cards.',
        type: 'boolean',
        defaultValue: true,
    })
    showQuickAdd?: boolean;

    @AttributeDefinition({
        id: 'showSwatches',
        name: 'Show color swatches',
        description: 'Show color swatches and request swatch imagery for category-loaded products.',
        type: 'boolean',
        defaultValue: true,
    })
    showSwatches?: boolean;

    @AttributeDefinition({
        id: 'showBrand',
        name: 'Show brand',
        description: 'Show the product brand on category-loaded cards.',
        type: 'boolean',
        defaultValue: true,
    })
    showBrand?: boolean;

    @AttributeDefinition({
        id: 'showCategory',
        name: 'Show category',
        description: 'Show the product category when returned by Product Search.',
        type: 'boolean',
        defaultValue: true,
    })
    showCategory?: boolean;

    @AttributeDefinition({
        id: 'showProductName',
        name: 'Show product name',
        description: 'Show the product name and PDP link.',
        type: 'boolean',
        defaultValue: true,
    })
    showProductName?: boolean;

    @AttributeDefinition({
        id: 'showSku',
        name: 'Show SKU',
        description: 'Show the product identifier.',
        type: 'boolean',
        defaultValue: true,
    })
    showSku?: boolean;

    @AttributeDefinition({
        id: 'showRating',
        name: 'Show rating',
        description: 'Show the rating surface supplied by the host storefront.',
        type: 'boolean',
        defaultValue: true,
    })
    showRating?: boolean;

    @AttributeDefinition({
        id: 'showPrice',
        name: 'Show price',
        description: 'Show current and previous prices when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showPrice?: boolean;

    @AttributeDefinition({
        id: 'showPromotions',
        name: 'Show promotions',
        description: 'Show promotional messages associated with the product price.',
        type: 'boolean',
        defaultValue: true,
    })
    showPromotions?: boolean;

    @AttributeDefinition({
        id: 'maxSwatches',
        name: 'Maximum swatches',
        description: 'Maximum visible color swatches per category-loaded product (between 1 and 12).',
        type: 'integer',
        defaultValue: 3,
    })
    maxSwatches?: number;

    @AttributeDefinition({
        id: 'additionalAttributes',
        name: 'Additional attributes',
        description: 'Up to 5 custom attributes separated by lines or commas. Use material|Material or season=Season.',
        type: 'text',
        defaultValue: '',
    })
    additionalAttributes?: string;

    @AttributeDefinition({
        name: 'View-all label',
        description: 'Optional label displayed at the end of the heading row.',
        defaultValue: 'View all',
    })
    shopAllText?: string;

    @AttributeDefinition({
        name: 'View-all destination',
        description: 'Internal or external destination for the view-all link.',
        type: 'url',
    })
    shopAllUrl?: string;
}
/* v8 ignore stop */

export type SFNextToolkitProductCarouselProps = ProductListComponentAttributes & {
    title?: string;
    subtitle?: string;
    sourceMode?: string;
    categoryId?: string;
    limit?: number;
    selectionStrategy?: string;
    shopAllText?: string;
    shopAllUrl?: string;
    data?: { hits?: ShopperSearch.schemas['ProductSearchHit'][] } | ShopperSearch.schemas['ProductSearchHit'][] | null;
    component?: ComponentType;
    className?: string;
};

/**
 * Namespaced Page Designer adapter around the storefront's production product carousel.
 * Keeping the product tile implementation shared preserves pricing, badges, analytics,
 * responsive imagery and accessibility behaviour from the host Storefront Next app.
 */
export default function SFNextToolkitProductCarousel({
    title = 'Featured products',
    subtitle,
    sourceMode,
    categoryId,
    shopAllText = 'View all',
    shopAllUrl,
    data,
    component,
    className,
    imageViewType,
    showBadges,
    showWishlist,
    showQuickAdd,
    showSwatches,
    showBrand,
    showCategory,
    showProductName,
    showSku,
    showRating,
    showPrice,
    showPromotions,
    maxSwatches,
    additionalAttributes,
}: SFNextToolkitProductCarouselProps) {
    const products = Array.isArray(data) ? data : (data?.hits ?? []);
    const preferLoadedProducts = shouldUseCategoryProducts(sourceMode, categoryId);
    const tilePresentation = normalizeProductListConfig({
        imageViewType,
        showBadges,
        showWishlist,
        showQuickAdd,
        showSwatches,
        showBrand,
        showCategory,
        showProductName,
        showSku,
        showRating,
        showPrice,
        showPromotions,
        maxSwatches,
        additionalAttributes,
    });

    return (
        <ProductCarousel
            products={products}
            title={title}
            subtitle={subtitle}
            shopAllText={shopAllText}
            shopAllUrl={normalizeSafeLinkUrl(shopAllUrl)}
            component={component}
            className={className}
            preferLoadedProducts={preferLoadedProducts}
            tilePresentation={tilePresentation}
        />
    );
}

export function SFNextToolkitProductCarouselFallback({ title = 'Featured products' }: { title?: string }) {
    return <ProductCarouselSkeleton title={title} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { SFNextToolkitProductCarouselFallback as fallback };
