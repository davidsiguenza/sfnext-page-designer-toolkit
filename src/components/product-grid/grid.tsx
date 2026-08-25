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
import { type ReactElement, type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// @sfdc-extension-line SFDC_EXT_BOPIS
import { useShowPickupAvailable } from './use-pickup-filter';
import type { ShopperSearch } from '@/scapi';
import DynamicImageProvider from '@/providers/dynamic-image';
import { ProductTile, ProductTileProvider } from '@/components/product-tile';
import { ProductTileSkeleton } from '@/components/category-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductListConfig } from '@/components/product-list/config';

type ProductSearchHit = ShopperSearch.schemas['ProductSearchHit'];

export interface ProductGridPresentation {
    desktopColumns?: '3' | '4' | '5';
    density?: 'compact' | 'regular' | 'comfortable';
    cardSurface?: 'card' | 'muted' | 'transparent';
    cardView?: 'standard' | 'editorial' | 'compact';
}

export interface ProductGridEditorialItem {
    key: string;
    position: number;
    element: ReactNode;
}

const GRID_COLUMN_CLASSES = {
    '3': 'grid-cols-2 sm:grid-cols-3',
    '4': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    '5': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
} as const;

const GRID_DENSITY_CLASSES = {
    compact: 'gap-x-3 gap-y-5',
    regular: 'gap-x-4 gap-y-8',
    comfortable: 'gap-x-5 gap-y-10 md:gap-x-6',
} as const;

const CARD_SURFACE_CLASSES = {
    card: '',
    muted: 'bg-muted [--ui-border-width:0px]',
    transparent: 'bg-transparent [--ui-border-width:0px] [--ui-shadow:none]',
} as const;

const CARD_VIEW_CLASSES = {
    standard: '',
    editorial: '[--ui-radius:var(--radius-xl)]',
    compact: 'text-sm',
} as const;

// eslint-disable-next-line react-refresh/only-export-components
export function getResolvedDesktopColumns(presentation?: ProductGridPresentation): '3' | '4' | '5' {
    const cardView = presentation?.cardView ?? 'standard';
    const desktopColumns = presentation?.desktopColumns ?? '4';

    if (cardView === 'editorial') {
        return desktopColumns === '5' ? '4' : '3';
    }
    if (cardView === 'compact') {
        return desktopColumns === '3' ? '4' : '5';
    }
    return desktopColumns;
}

function getGridClassName(presentation?: ProductGridPresentation): string {
    const cardView = presentation?.cardView ?? 'standard';
    const desktopColumns = getResolvedDesktopColumns(presentation);
    const density = cardView === 'compact' ? 'compact' : (presentation?.density ?? 'regular');

    return `grid ${GRID_COLUMN_CLASSES[desktopColumns]} ${GRID_DENSITY_CLASSES[density]}`;
}

function getProductClassName(presentation?: ProductGridPresentation): string | undefined {
    if (!presentation) return undefined;
    return `${CARD_SURFACE_CLASSES[presentation.cardSurface ?? 'card']} ${CARD_VIEW_CLASSES[presentation.cardView ?? 'standard']}`.trim();
}

/**
 * Inserts editorial nodes into the DOM after the authored number of products.
 * Keeping DOM and visual order identical preserves reading and keyboard focus order.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function interleaveProductGridItems(
    productItems: ReactNode[],
    editorialItems: ProductGridEditorialItem[],
    productOffset = 0,
    { appendOverflow = true }: { appendOverflow?: boolean } = {}
): ReactNode[] {
    const sortedEditorials = editorialItems
        .map((item, authoredIndex) => ({ ...item, authoredIndex }))
        .sort((left, right) => left.position - right.position || left.authoredIndex - right.authoredIndex);
    const result: ReactNode[] = [];

    for (let localIndex = 0; localIndex <= productItems.length; localIndex += 1) {
        const globalPosition = productOffset + localIndex;
        for (const editorial of sortedEditorials) {
            if (editorial.position === globalPosition) result.push(editorial.element);
        }

        if (localIndex < productItems.length) result.push(productItems[localIndex]);
    }

    if (appendOverflow) {
        for (const editorial of sortedEditorials) {
            if (editorial.position > productOffset + productItems.length) result.push(editorial.element);
        }
    }

    return result;
}

// Responsive size of the product images in the product grid when the refinement panel is visible.
// Values are based on the grid column configuration and refinement panel width
// (w-64 + gap-8 --> 256px + 32px = 288px).
const responsiveImageWidthsWithRefinements: Record<'3' | '4' | '5', string[]> = {
    '3': ['40vw', '25vw', '25vw', '22vw', '22vw', '22vw'],
    '4': ['40vw', '25vw', '18vw', '14vw', '16vw', '16vw'],
    '5': ['40vw', '25vw', '18vw', '14vw', '13vw', '13vw'],
};

// Responsive size of product images when refinements panel is collapsed.
const responsiveImageWidthsWithoutRefinements: Record<'3' | '4' | '5', string[]> = {
    '3': ['40vw', '25vw', '25vw', '25vw', '25vw', '25vw'],
    '4': ['40vw', '25vw', '18vw', '18vw', '20vw', '20vw'],
    '5': ['40vw', '25vw', '18vw', '18vw', '16vw', '16vw'],
};

function NoProductsMessage({ criticalSize, nonCriticalSize }: { criticalSize: number; nonCriticalSize: number }) {
    const { t } = useTranslation('common');

    if (criticalSize > 0 || nonCriticalSize > 0) {
        return null;
    }
    return (
        <div className="col-span-full text-center py-12">
            <p className="text-sm text-muted-foreground">{t('noProductsFound')}</p>
        </div>
    );
}

function ProductGridSkeleton({
    count = 8,
    gridPresentation,
    editorialItems = [],
}: {
    count?: number;
    gridPresentation?: ProductGridPresentation;
    editorialItems?: ProductGridEditorialItem[];
}) {
    const skeletons = Array.from({ length: count }, (_, index) => (
        <div key={`grid-skeleton-${index}`} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-20" />
            </div>
        </div>
    ));

    return (
        <div className={getGridClassName(gridPresentation)}>
            {interleaveProductGridItems(skeletons, editorialItems, 0, { appendOverflow: false })}
        </div>
    );
}

/**
 * ProductGrid renders product tiles in a responsive grid layout, wrapping all tiles in a shared
 * context provider to reduce hydration overhead. Instead of each tile initializing its own hooks
 * (navigate, config, translation, currency), the provider initializes them once and shares them
 * via context.
 *
 * The grid accepts synchronous data for both critical (above-the-fold) and non-critical
 * (below-the-fold) products. Critical product images are loaded with high priority and eagerly.
 * For deferred loading of non-critical products, use DeferredProductGrid.
 */
export default function ProductGrid({
    critical,
    nonCritical,
    hasRefinementsPanel = true,
    handleProductClick,
    topCategoryName,
    tilePresentation,
    gridPresentation,
    editorialItems = [],
    isLoading = false,
    skeletonCount,
    // @sfdc-extension-line SFDC_EXT_BOPIS
    showPickupAvailable: showPickupAvailableProp,
}: {
    critical?: ProductSearchHit[];
    nonCritical?: ProductSearchHit[];
    hasRefinementsPanel?: boolean;
    handleProductClick?: (product: ProductSearchHit) => void;
    topCategoryName?: string;
    tilePresentation?: ProductListConfig;
    gridPresentation?: ProductGridPresentation;
    editorialItems?: ProductGridEditorialItem[];
    isLoading?: boolean;
    skeletonCount?: number;
    // @sfdc-extension-line SFDC_EXT_BOPIS
    showPickupAvailable?: boolean;
}): ReactElement {
    const criticalData = critical ?? [];
    const l = criticalData.length;
    const resolvedDesktopColumns = getResolvedDesktopColumns(gridPresentation);
    const responsiveImageWidths = hasRefinementsPanel
        ? responsiveImageWidthsWithRefinements[resolvedDesktopColumns]
        : responsiveImageWidthsWithoutRefinements[resolvedDesktopColumns];

    // Initialize the `<DynamicImageProvider/>` behavior for the scope of this grid.
    // Out-of-the-box we make sure that the product images of all products considered critical (displayed inside a
    // `<DynamicImage/>` component) should be loaded eagerly with high priority.
    const hasSource = useCallback(() => true, []);

    // @sfdc-extension-block-start SFDC_EXT_BOPIS
    const pickupFromUrl = useShowPickupAvailable();
    const showPickupAvailable = showPickupAvailableProp ?? pickupFromUrl;
    // @sfdc-extension-block-end SFDC_EXT_BOPIS
    const loadingSkeletonCount = Math.max(criticalData.length + (nonCritical?.length ?? 0), 4);

    if (isLoading) {
        return (
            <ProductTileProvider>
                <div data-testid="product-grid-loading-state" aria-busy>
                    <ProductGridSkeleton
                        count={loadingSkeletonCount}
                        gridPresentation={gridPresentation}
                        editorialItems={editorialItems}
                    />
                </div>
            </ProductTileProvider>
        );
    }

    const nonCriticalData = nonCritical ?? [];
    const criticalTiles = criticalData.map((product) => (
        <DynamicImageProvider key={product.productId} value={{ hasSource, widths: responsiveImageWidths }}>
            <ProductTile
                product={product}
                handleProductClick={handleProductClick}
                showNavigationArrows
                topCategoryName={topCategoryName}
                tilePresentation={tilePresentation}
                className={getProductClassName(gridPresentation)}
                // @sfdc-extension-line SFDC_EXT_BOPIS
                showPickupAvailable={showPickupAvailable}
            />
        </DynamicImageProvider>
    ));
    const secondaryTiles: ReactNode[] = [
        ...nonCriticalData.map((product) => (
            <ProductTile
                key={product.productId}
                product={product}
                handleProductClick={handleProductClick}
                showNavigationArrows
                topCategoryName={topCategoryName}
                tilePresentation={tilePresentation}
                className={getProductClassName(gridPresentation)}
                // @sfdc-extension-line SFDC_EXT_BOPIS
                showPickupAvailable={showPickupAvailable}
            />
        )),
        ...Array.from({ length: skeletonCount ?? 0 }, (_, index) => (
            <div key={`skeleton-${index}`} className="min-w-0">
                <ProductTileSkeleton />
            </div>
        )),
    ];
    const hasSecondaryItems = secondaryTiles.length > 0;
    const criticalEditorials = hasSecondaryItems ? editorialItems.filter((item) => item.position < l) : editorialItems;
    const secondaryEditorials = hasSecondaryItems ? editorialItems.filter((item) => item.position >= l) : [];

    return (
        <ProductTileProvider>
            <div
                className={getGridClassName(gridPresentation)}
                data-card-view={gridPresentation?.cardView}
                data-card-surface={gridPresentation?.cardSurface}>
                {(criticalTiles.length > 0 || criticalEditorials.length > 0) && (
                    <>{interleaveProductGridItems(criticalTiles, criticalEditorials)}</>
                )}
                {(secondaryTiles.length > 0 || secondaryEditorials.length > 0) && (
                    <DynamicImageProvider value={{ widths: responsiveImageWidths }}>
                        {interleaveProductGridItems(secondaryTiles, secondaryEditorials, l, {
                            appendOverflow: !skeletonCount,
                        })}
                    </DynamicImageProvider>
                )}
                {!skeletonCount && <NoProductsMessage criticalSize={l} nonCriticalSize={nonCritical?.length ?? 0} />}
            </div>
        </ProductTileProvider>
    );
}
