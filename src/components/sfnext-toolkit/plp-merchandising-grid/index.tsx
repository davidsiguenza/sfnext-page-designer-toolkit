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
import { Children, isValidElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import DeferredProductGrid, { type ProductGridEditorialItem } from '@/components/product-grid';
import { useProductListRuntime } from '@/components/product-list/runtime-context';
import { Region, type ComponentType } from '@/components/region';
import { Component as RegionComponent } from '@/components/region/component';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@/hooks/use-navigate';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeEditorialCardPosition } from '@/components/sfnext-toolkit/editorial-card';
import {
    getPLPProductListConfigForView,
    normalizePLPMerchandisingGridConfig,
    PLP_VIEW_QUERY_PARAM,
    resolvePLPCardView,
    type PLPCardView,
    type PLPMerchandisingGridAttributes,
} from './config';

/* v8 ignore start - decorators are covered by metadata assertions. */
@Component('plpMerchandisingGrid', {
    name: 'PLP Merchandising Grid',
    description:
        'Configures PLP controls, product-card views and a product grid with deterministic editorial interlinks.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'editorialCards',
        name: 'Editorial interlinks',
        description: 'Cards are placed among products according to their authored position and span.',
        maxComponents: 12,
        componentTypeInclusions: ['SFNextToolkit.editorialCard'],
    },
])
export class PLPMerchandisingGridMetadata {
    @AttributeDefinition({
        id: 'stickyControls',
        name: 'Sticky listing heading',
        description: 'Keeps the category title and sorting control visible while browsing.',
        type: 'boolean',
        defaultValue: false,
    })
    stickyControls?: boolean;

    @AttributeDefinition({
        id: 'stickyFilters',
        name: 'Sticky filters',
        description: 'Keeps the desktop refinement panel visible while browsing products.',
        type: 'boolean',
        defaultValue: false,
    })
    stickyFilters?: boolean;

    @AttributeDefinition({
        id: 'defaultCardView',
        name: 'Default card view',
        description: 'Initial product-card view when the shopper has not selected another allowed view.',
        type: 'enum',
        values: ['standard', 'editorial', 'compact'],
        defaultValue: 'standard',
    })
    defaultCardView?: string;

    @AttributeDefinition({
        id: 'allowedCardViews',
        name: 'Allowed card views',
        description: 'Controls which alternative product-card views shoppers may select.',
        type: 'enum',
        values: ['standard-only', 'standard-editorial', 'standard-compact', 'all'],
        defaultValue: 'standard-only',
    })
    allowedCardViews?: string;

    @AttributeDefinition({
        id: 'cardSurface',
        name: 'Card surface',
        description: 'Semantic theme applied to every product card.',
        type: 'enum',
        values: ['card', 'muted', 'transparent'],
        defaultValue: 'card',
    })
    cardSurface?: string;

    @AttributeDefinition({
        id: 'gridDensity',
        name: 'Grid density',
        description: 'Spacing between product and editorial cards.',
        type: 'enum',
        values: ['compact', 'regular', 'comfortable'],
        defaultValue: 'regular',
    })
    gridDensity?: string;

    @AttributeDefinition({
        id: 'desktopColumns',
        name: 'Desktop columns',
        description: 'Default number of product columns on wide screens.',
        type: 'enum',
        values: ['3', '4', '5'],
        defaultValue: '4',
    })
    desktopColumns?: string;

    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Catalog image type',
        description: 'Catalog view type used as the primary image for each product.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({ id: 'showBadges', name: 'Show badges', type: 'boolean', defaultValue: true })
    showBadges?: boolean;

    @AttributeDefinition({ id: 'showWishlist', name: 'Show wishlist action', type: 'boolean', defaultValue: true })
    showWishlist?: boolean;

    @AttributeDefinition({ id: 'showQuickAdd', name: 'Show quick add', type: 'boolean', defaultValue: true })
    showQuickAdd?: boolean;

    @AttributeDefinition({ id: 'showSwatches', name: 'Show color swatches', type: 'boolean', defaultValue: true })
    showSwatches?: boolean;

    @AttributeDefinition({ id: 'showBrand', name: 'Show brand', type: 'boolean', defaultValue: true })
    showBrand?: boolean;

    @AttributeDefinition({ id: 'showCategory', name: 'Show category', type: 'boolean', defaultValue: true })
    showCategory?: boolean;

    @AttributeDefinition({ id: 'showProductName', name: 'Show product name', type: 'boolean', defaultValue: true })
    showProductName?: boolean;

    @AttributeDefinition({ id: 'showSku', name: 'Show SKU', type: 'boolean', defaultValue: true })
    showSku?: boolean;

    @AttributeDefinition({ id: 'showRating', name: 'Show rating', type: 'boolean', defaultValue: true })
    showRating?: boolean;

    @AttributeDefinition({ id: 'showPrice', name: 'Show price', type: 'boolean', defaultValue: true })
    showPrice?: boolean;

    @AttributeDefinition({ id: 'showPromotions', name: 'Show promotions', type: 'boolean', defaultValue: true })
    showPromotions?: boolean;

    @AttributeDefinition({
        id: 'maxSwatches',
        name: 'Maximum swatches',
        description: 'Maximum number of visible color swatches per product (between 1 and 12).',
        type: 'integer',
        defaultValue: 3,
    })
    maxSwatches?: number;

    @AttributeDefinition({
        id: 'additionalAttributes',
        name: 'Additional attributes',
        description: 'Up to five custom attributes separated by lines or commas, using id|Label.',
        type: 'text',
        defaultValue: '',
    })
    additionalAttributes?: string;
}
/* v8 ignore stop */

export interface PLPMerchandisingGridProps extends PLPMerchandisingGridAttributes {
    children?: ReactNode;
    className?: string;
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

function CardViewSelector({
    allowedViews,
    activeView,
    defaultView,
}: {
    allowedViews: PLPCardView[];
    activeView: PLPCardView;
    defaultView: PLPCardView;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation('category');
    const viewLabels: Record<PLPCardView, string> = {
        standard: t('cardViews.standard', { defaultValue: 'Standard' }),
        editorial: t('cardViews.editorial', { defaultValue: 'Editorial' }),
        compact: t('cardViews.compact', { defaultValue: 'Compact' }),
    };

    if (allowedViews.length < 2) return null;

    const selectView = (view: PLPCardView) => {
        const params = new URLSearchParams(location.search);
        if (view === defaultView) params.delete(PLP_VIEW_QUERY_PARAM);
        else params.set(PLP_VIEW_QUERY_PARAM, view);
        const search = params.toString();

        void navigate(
            {
                pathname: location.pathname,
                search: search ? `?${search}` : '',
                hash: location.hash,
            },
            { replace: true }
        );
    };

    return (
        <div
            data-slot="plp-card-view-selector"
            role="group"
            aria-label={t('cardViews.label', { defaultValue: 'Product card view' })}
            className="mb-4 flex flex-wrap justify-end gap-2">
            {allowedViews.map((view) => (
                <Button
                    key={view}
                    type="button"
                    size="sm"
                    variant={view === activeView ? 'default' : 'outline'}
                    aria-pressed={view === activeView}
                    onClick={() => selectView(view)}>
                    {viewLabels[view]}
                </Button>
            ))}
        </div>
    );
}

export default function PLPMerchandisingGrid({
    children,
    className,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...attributes
}: PLPMerchandisingGridProps) {
    const runtime = useProductListRuntime();
    const location = useLocation();
    const { isDesignMode } = usePageDesignerMode();
    const config = normalizePLPMerchandisingGridConfig(attributes);
    const activeView = resolvePLPCardView(config, new URLSearchParams(location.search).get(PLP_VIEW_QUERY_PARAM));
    const editorialsRegion = component?.regions?.find((region) => region.id === 'editorialCards');
    const authoredEditorials = (editorialsRegion?.components ?? []) as ComponentType[];
    const editorialItems: ProductGridEditorialItem[] = component
        ? authoredEditorials.map((editorial) => ({
              key: editorial.contentLinkUuid ?? editorial.id,
              position: normalizeEditorialCardPosition(
                  (editorial.data as unknown as { position?: unknown } | undefined)?.position
              ),
              element: (
                  <RegionComponent
                      key={editorial.contentLinkUuid ?? editorial.id}
                      component={editorial}
                      regionId={editorialsRegion?.id ?? 'editorialCards'}
                  />
              ),
          }))
        : Children.toArray(children).map((element) => ({
              key: isValidElement(element) ? String(element.key) : String(element),
              position: 4,
              element,
          }));

    if (!runtime) {
        if (!isDesignMode) return null;

        return (
            <section
                data-slot="sfnext-toolkit-plp-merchandising-grid-preview"
                role="status"
                aria-label="PLP merchandising grid preview"
                className={cn(
                    'border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground',
                    className
                )}>
                The grid uses the category products, filters and authored editorial cards when placed on a PLP.
            </section>
        );
    }

    return (
        <section
            data-slot="sfnext-toolkit-plp-merchandising-grid"
            data-card-view={activeView}
            className={cn('w-full', className)}>
            <CardViewSelector
                allowedViews={config.allowedCardViews}
                activeView={activeView}
                defaultView={config.defaultCardView}
            />
            <DeferredProductGrid
                {...runtime}
                tilePresentation={getPLPProductListConfigForView(config, activeView)}
                gridPresentation={{
                    desktopColumns: config.desktopColumns,
                    density: config.gridDensity,
                    cardSurface: config.cardSurface,
                    cardView: activeView,
                }}
                editorialItems={isDesignMode ? [] : editorialItems}
            />
            {isDesignMode && component && (
                <div data-slot="plp-editorial-authoring" className="mt-8 space-y-3">
                    <p className="text-sm font-medium text-foreground">Editorial interlinks</p>
                    <div className="relative">
                        <Region
                            component={component}
                            regionId="editorialCards"
                            className="grid min-h-40 grid-cols-1 gap-4 border border-dashed border-border p-4 sm:grid-cols-2"
                            data-slot="plp-editorial-cards"
                            errorElement={children ?? null}
                        />
                        {authoredEditorials.length === 0 && !children && (
                            <p
                                role="status"
                                className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
                                Add Editorial Cards here; their authored positions are applied in storefront mode.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export * from './config';
