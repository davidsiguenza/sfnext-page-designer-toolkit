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
import type { ComponentPropsWithoutRef } from 'react';
import { PackageSearch } from 'lucide-react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import type { ShopperSearch } from '@/scapi';
import type { ComponentType } from '@/components/region';
import { normalizeProductListConfig, type ProductListComponentAttributes } from '@/components/product-list/config';
import { ProductTile, ProductTileProvider, type ProductTileProps } from '@/components/product-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import DynamicImageProvider from '@/providers/dynamic-image';
import type { ProductCardLoaderData } from './loaders';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const PRODUCT_CARD_LAYOUTS = ['auto', 'vertical', 'horizontal'] as const;
const PRODUCT_CARD_RATIOS = ['auto', 'square', 'portrait', 'landscape'] as const;
const PRODUCT_CARD_OBJECT_FITS = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;
const PRODUCT_CARD_BORDER_RADII = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const PRODUCT_CARD_SHADOWS = ['none', 'sm', 'md', 'lg', 'xl'] as const;
const PRODUCT_CARD_HOVER_EFFECTS = ['default', 'scale', 'shadow', 'lift'] as const;

type ProductCardLayout = (typeof PRODUCT_CARD_LAYOUTS)[number];
type ProductCardRatio = (typeof PRODUCT_CARD_RATIOS)[number];

const PRODUCT_CARD_IMAGE_CONTEXT = {
    // A standalone card can live in any Page Designer column. These conservative
    // viewport hints keep DIS responsive without assuming a particular page grid.
    widths: ['100vw', '100vw', '50vw', '50vw', '40vw', '33vw'],
};

const PRODUCT_CARD_RATIO_VALUE: Record<ProductCardRatio, number | undefined> = {
    auto: undefined,
    square: 1,
    portrait: 4 / 5,
    landscape: 4 / 3,
};

const PRODUCT_CARD_RATIO_CLASS: Record<ProductCardRatio, string> = {
    auto: 'aspect-[4/5]',
    square: 'aspect-square',
    portrait: 'aspect-[4/5]',
    landscape: 'aspect-[4/3]',
};

const HORIZONTAL_TILE_CLASS =
    '!grid grid-cols-[minmax(10rem,42%)_minmax(0,1fr)] items-start [&>.product-image]:min-w-0';
const AUTO_TILE_CLASS =
    '@min-[40rem]/product-card:!grid @min-[40rem]/product-card:grid-cols-[minmax(14rem,42%)_minmax(0,1fr)] @min-[40rem]/product-card:items-start @min-[40rem]/product-card:[&>.product-image]:min-w-0';

function normalizeOption<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && values.includes(value as T) ? (value as T) : fallback;
}

function getTileLayoutClass(layout: ProductCardLayout): string | undefined {
    if (layout === 'horizontal') return HORIZONTAL_TILE_CLASS;
    if (layout === 'auto') return AUTO_TILE_CLASS;
    return undefined;
}

/* v8 ignore start - decorators are covered through metadata assertions. */
@Component('productCard', {
    name: 'Product Card',
    description:
        'A responsive, catalog-backed card for one selected product with configurable imagery, fields, actions and layout.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitProductCardMetadata {
    @AttributeDefinition({
        id: 'productId',
        name: 'Product',
        description: 'Search for and select the catalog product displayed by this card.',
        type: 'product',
        required: true,
    })
    productId?: string;

    @AttributeDefinition({
        id: 'layout',
        name: 'Layout',
        description: 'Auto switches from vertical to horizontal based on the card container width.',
        type: 'enum',
        values: ['auto', 'vertical', 'horizontal'],
        defaultValue: 'auto',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Catalog image type',
        description: 'Catalog view type used as the card image.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({
        id: 'imageRatio',
        name: 'Image ratio',
        description: 'Image frame ratio. Auto uses the storefront product-tile configuration.',
        type: 'enum',
        values: ['auto', 'square', 'portrait', 'landscape'],
        defaultValue: 'auto',
    })
    imageRatio?: string;

    @AttributeDefinition({
        id: 'objectFit',
        name: 'Image fit',
        description: 'How the product image fits inside its responsive frame.',
        type: 'enum',
        values: ['cover', 'contain', 'fill', 'none', 'scale-down'],
        defaultValue: 'cover',
    })
    objectFit?: string;

    @AttributeDefinition({
        id: 'showBadges',
        name: 'Show badges',
        description: 'Shows product badges such as new or sale.',
        type: 'boolean',
        defaultValue: true,
    })
    showBadges?: boolean;

    @AttributeDefinition({
        id: 'showWishlist',
        name: 'Show wishlist action',
        description: 'Shows the action used to add the product to a wishlist.',
        type: 'boolean',
        defaultValue: true,
    })
    showWishlist?: boolean;

    @AttributeDefinition({
        id: 'showQuickAdd',
        name: 'Show quick add',
        description: 'Shows the quick-add action when the shopper interacts with the card.',
        type: 'boolean',
        defaultValue: true,
    })
    showQuickAdd?: boolean;

    @AttributeDefinition({
        id: 'showSwatches',
        name: 'Show color swatches',
        description: 'Shows color variations using swatch images when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showSwatches?: boolean;

    @AttributeDefinition({
        id: 'showBrand',
        name: 'Show brand',
        description: 'Shows the configured product or storefront brand.',
        type: 'boolean',
        defaultValue: true,
    })
    showBrand?: boolean;

    @AttributeDefinition({
        id: 'showCategory',
        name: 'Show category',
        description: 'Shows the product primary category when it is available.',
        type: 'boolean',
        defaultValue: true,
    })
    showCategory?: boolean;

    @AttributeDefinition({
        id: 'showProductName',
        name: 'Show product name',
        description: 'Shows the product name and PDP link.',
        type: 'boolean',
        defaultValue: true,
    })
    showProductName?: boolean;

    @AttributeDefinition({
        id: 'showSku',
        name: 'Show SKU',
        description: 'Shows the product identifier.',
        type: 'boolean',
        defaultValue: true,
    })
    showSku?: boolean;

    @AttributeDefinition({
        id: 'showRating',
        name: 'Show rating',
        description: 'Shows the rating surface supplied by the host storefront.',
        type: 'boolean',
        defaultValue: true,
    })
    showRating?: boolean;

    @AttributeDefinition({
        id: 'showPrice',
        name: 'Show price',
        description: 'Shows current and previous prices when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showPrice?: boolean;

    @AttributeDefinition({
        id: 'showPromotions',
        name: 'Show promotions',
        description: 'Shows promotional messages associated with the price.',
        type: 'boolean',
        defaultValue: true,
    })
    showPromotions?: boolean;

    @AttributeDefinition({
        id: 'maxSwatches',
        name: 'Maximum swatches',
        description: 'Maximum number of visible color swatches (between 1 and 12).',
        type: 'integer',
        defaultValue: 3,
    })
    maxSwatches?: number;

    @AttributeDefinition({
        id: 'additionalAttributes',
        name: 'Additional attributes',
        description:
            'Up to 5 custom attributes separated by lines or commas. Use material|Material or season=Season. The c_ prefix is optional.',
        type: 'text',
        defaultValue: '',
    })
    additionalAttributes?: string;

    @AttributeDefinition({
        id: 'borderRadius',
        name: 'Border radius',
        description: 'Corner roundness of the product card.',
        type: 'enum',
        values: ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
        defaultValue: 'xl',
    })
    borderRadius?: string;

    @AttributeDefinition({
        id: 'boxShadow',
        name: 'Box shadow',
        description: 'Token-based elevation applied to the product card.',
        type: 'enum',
        values: ['none', 'sm', 'md', 'lg', 'xl'],
        defaultValue: 'sm',
    })
    boxShadow?: string;

    @AttributeDefinition({
        id: 'hoverEffect',
        name: 'Hover effect',
        description: 'Optional motion-safe interaction applied by the shared product tile.',
        type: 'enum',
        values: ['default', 'scale', 'shadow', 'lift'],
        defaultValue: 'default',
    })
    hoverEffect?: string;
}
/* v8 ignore stop */

export interface ProductCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    productId?: string;
    product?: ShopperSearch.schemas['ProductSearchHit'];
    layout?: string;
    imageViewType?: string;
    imageRatio?: string;
    objectFit?: string;
    showBadges?: boolean;
    showWishlist?: boolean;
    showQuickAdd?: boolean;
    showSwatches?: boolean;
    showBrand?: boolean;
    showCategory?: boolean;
    showProductName?: boolean;
    showSku?: boolean;
    showRating?: boolean;
    showPrice?: boolean;
    showPromotions?: boolean;
    maxSwatches?: number;
    additionalAttributes?: string;
    borderRadius?: string;
    boxShadow?: string;
    hoverEffect?: string;

    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: ProductCardLoaderData | null;
}

/** Standalone Page Designer adapter around the storefront's production ProductTile. */
export default function ProductCard({
    productId: _productId,
    product: productProp,
    layout,
    imageViewType,
    imageRatio,
    objectFit,
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
    borderRadius,
    boxShadow,
    hoverEffect,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
    ...props
}: ProductCardProps) {
    const { isDesignMode } = usePageDesignerMode();
    const product = data?.product ?? productProp;
    const resolvedLayout = normalizeOption(layout, PRODUCT_CARD_LAYOUTS, 'auto');
    const resolvedRatio = normalizeOption(imageRatio, PRODUCT_CARD_RATIOS, 'auto');

    if (!product) {
        if (!isDesignMode) return null;

        const isNotFound = data?.status === 'not-found';
        return (
            <div
                {...props}
                data-slot="sfnext-toolkit-product-card-empty"
                data-status={isNotFound ? 'not-found' : 'unconfigured'}
                role="status"
                className={cn(
                    'flex min-h-64 w-full min-w-0 flex-col items-center justify-center gap-4 rounded-ui border border-dashed border-border bg-muted/40 p-8 text-center text-foreground',
                    className
                )}>
                <span
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                    <PackageSearch className="size-6" />
                </span>
                <div className="max-w-sm space-y-1.5">
                    <h3 className="text-lg font-semibold">{isNotFound ? 'Product unavailable' : 'Select a product'}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {isNotFound
                            ? 'The selected product is not available for this site, catalog or locale.'
                            : 'Use the Product field to search the site catalog and configure this card.'}
                    </p>
                </div>
            </div>
        );
    }

    const presentationSource: ProductListComponentAttributes = {
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
    };
    const tilePresentation = normalizeProductListConfig(presentationSource);
    const resolvedObjectFit = normalizeOption(objectFit, PRODUCT_CARD_OBJECT_FITS, 'cover');
    const resolvedBorderRadius = normalizeOption(borderRadius, PRODUCT_CARD_BORDER_RADII, 'xl');
    const resolvedBoxShadow = normalizeOption(boxShadow, PRODUCT_CARD_SHADOWS, 'sm');
    const resolvedHoverEffect = normalizeOption(hoverEffect, PRODUCT_CARD_HOVER_EFFECTS, 'default');

    return (
        <div
            {...props}
            data-slot="sfnext-toolkit-product-card"
            data-layout={resolvedLayout}
            className={cn('@container/product-card w-full min-w-0 max-w-full', className)}>
            <ProductTileProvider>
                <DynamicImageProvider value={PRODUCT_CARD_IMAGE_CONTEXT}>
                    <ProductTile
                        product={product}
                        topCategoryName={data?.categoryName}
                        tilePresentation={tilePresentation}
                        imgAspectRatio={PRODUCT_CARD_RATIO_VALUE[resolvedRatio]}
                        objectFit={resolvedObjectFit as ProductTileProps['objectFit']}
                        borderRadius={resolvedBorderRadius as ProductTileProps['borderRadius']}
                        boxShadow={resolvedBoxShadow as ProductTileProps['boxShadow']}
                        hoverEffect={resolvedHoverEffect as ProductTileProps['hoverEffect']}
                        className={getTileLayoutClass(resolvedLayout)}
                    />
                </DynamicImageProvider>
            </ProductTileProvider>
        </div>
    );
}

export function ProductCardFallback({ layout, imageRatio }: Pick<ProductCardProps, 'layout' | 'imageRatio'>) {
    const resolvedLayout = normalizeOption(layout, PRODUCT_CARD_LAYOUTS, 'auto');
    const resolvedRatio = normalizeOption(imageRatio, PRODUCT_CARD_RATIOS, 'auto');

    return (
        <div className="@container/product-card w-full min-w-0 max-w-full" aria-hidden="true">
            <article
                data-slot="sfnext-toolkit-product-card-fallback"
                data-layout={resolvedLayout}
                className={cn(
                    'overflow-hidden rounded-ui border border-border bg-card shadow-sm',
                    getTileLayoutClass(resolvedLayout)
                )}>
                <Skeleton className={cn('w-full rounded-none', PRODUCT_CARD_RATIO_CLASS[resolvedRatio])} />
                <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </article>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { ProductCardFallback as fallback };
