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
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ArrowRight, PanelsTopLeft } from 'lucide-react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { useTranslation } from 'react-i18next';
import { Link } from '@/components/link';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { routes, routeHref } from '@/route-paths';
import { cn } from '@/lib/utils';
import { useMegaMenuNavigate } from '../mega-menu/context';

export const MEGA_MENU_EXTRA_ITEMS_REGION_ID = 'extraItems';
export const MEGA_MENU_FEATURE_REGION_ID = 'feature';

const PANEL_SURFACES = ['transparent', 'card', 'muted', 'accent'] as const;
const PANEL_DENSITIES = ['compact', 'comfortable'] as const;
const PANEL_LAYOUTS = ['links-first', 'feature-first'] as const;

type PanelSurface = (typeof PANEL_SURFACES)[number];
type PanelDensity = (typeof PANEL_DENSITIES)[number];

const SURFACE_CLASSES: Record<PanelSurface, string> = {
    transparent: 'bg-transparent text-header-menu-foreground',
    card: 'border border-border bg-card text-card-foreground shadow-sm',
    muted: 'bg-muted text-foreground',
    accent: 'bg-accent text-accent-foreground',
};

const DENSITY_CLASSES: Record<PanelDensity, string> = {
    compact: 'gap-3 p-3',
    comfortable: 'gap-5 p-5',
};

function normalizeOption<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
    return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeCategoryId(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === 'string' ? id.trim() || undefined : undefined;
    }
    return undefined;
}

/* v8 ignore start - decorators are covered by generated metadata validation. */
@Component('megaMenuPanel', {
    name: 'Mega Menu Panel',
    description:
        'Targets one standard root category and adds curated links plus one optional graphical feature to its submenu.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'extraItems',
        name: 'Extra links',
        description: 'Add up to eight Mega Menu Links for campaigns, services, guides or deep links.',
        maxComponents: 8,
        componentTypeInclusions: ['SFNextToolkit.megaMenuLink'],
    },
    {
        id: 'feature',
        name: 'Graphical feature',
        description:
            'Add at most one Mega Menu Feature backed by a category, product, B2C Content Asset, Salesforce CMS record or manual content.',
        maxComponents: 1,
        componentTypeInclusions: ['SFNextToolkit.megaMenuFeature'],
    },
])
export class SFNextToolkitMegaMenuPanelMetadata {
    @AttributeDefinition({
        id: 'targetCategory',
        name: 'Target root category',
        description: 'Select the top-level catalog category whose standard submenu this panel augments.',
        type: 'category',
        required: true,
    })
    targetCategory?: string;

    @AttributeDefinition({
        id: 'heading',
        name: 'Panel heading',
        description: 'Optional editorial heading above the extra links and feature.',
        type: 'string',
    })
    heading?: string;

    @AttributeDefinition({
        id: 'intro',
        name: 'Supporting text',
        description: 'Optional short introduction for the panel.',
        type: 'text',
    })
    intro?: string;

    @AttributeDefinition({
        id: 'extraItemsHeading',
        name: 'Extra links heading',
        description: 'Optional accessible label displayed above the curated links.',
        type: 'string',
    })
    extraItemsHeading?: string;

    @AttributeDefinition({
        id: 'showViewAll',
        name: 'Show category link',
        description: 'Adds a direct link to the target category below the panel heading.',
        type: 'boolean',
        defaultValue: true,
    })
    showViewAll?: boolean;

    @AttributeDefinition({
        id: 'viewAllLabel',
        name: 'Category link label',
        description: 'Defaults to “View all” in the current storefront language when empty.',
        type: 'string',
    })
    viewAllLabel?: string;

    @AttributeDefinition({
        id: 'layout',
        name: 'Content order',
        description: 'Choose whether curated links or the graphical feature appears first.',
        type: 'enum',
        values: ['links-first', 'feature-first'],
        defaultValue: 'links-first',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'surface',
        name: 'Panel surface',
        description: 'Token-based surface that remains compatible with storefront themes and dark mode.',
        type: 'enum',
        values: ['transparent', 'card', 'muted', 'accent'],
        defaultValue: 'transparent',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'density',
        name: 'Density',
        description: 'Controls spacing inside the editorial panel.',
        type: 'enum',
        values: ['compact', 'comfortable'],
        defaultValue: 'comfortable',
    })
    density?: string;

    @AttributeDefinition({
        id: 'editorialWidth',
        name: 'Desktop width',
        description: 'Width reserved for this editorial panel beside the inherited category navigation.',
        type: 'enum',
        values: ['compact', 'standard', 'wide'],
        defaultValue: 'standard',
    })
    editorialWidth?: string;

    @AttributeDefinition({
        id: 'standardBannerMode',
        name: 'Catalog banner behavior',
        description:
            'Inherit the global setting, use the catalog banner only as fallback, replace it, or show it alongside the Page Designer feature.',
        type: 'enum',
        values: ['inherit', 'fallback', 'replace', 'alongside'],
        defaultValue: 'inherit',
    })
    standardBannerMode?: string;
}
/* v8 ignore stop */

export interface MegaMenuPanelProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title' | 'children'> {
    targetCategory?: string | { id?: string };
    heading?: string;
    intro?: string;
    extraItemsHeading?: string;
    showViewAll?: boolean;
    viewAllLabel?: string;
    layout?: string;
    surface?: string;
    density?: string;
    editorialWidth?: string;
    standardBannerMode?: string;
    extraItems?: ReactNode;
    feature?: ReactNode;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
    regionId?: string;
}

export default function MegaMenuPanel({
    targetCategory,
    heading,
    intro,
    extraItemsHeading,
    showViewAll = true,
    viewAllLabel,
    layout,
    surface,
    density,
    editorialWidth: _editorialWidth,
    standardBannerMode: _standardBannerMode,
    extraItems,
    feature,
    component,
    className,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    regionId: _regionId,
    ...props
}: MegaMenuPanelProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t } = useTranslation('extPageDesignerToolkit');
    const onNavigate = useMegaMenuNavigate();
    const categoryId = normalizeCategoryId(targetCategory);
    const resolvedSurface = normalizeOption(surface, PANEL_SURFACES, 'transparent');
    const resolvedDensity = normalizeOption(density, PANEL_DENSITIES, 'comfortable');
    const resolvedLayout = normalizeOption(layout, PANEL_LAYOUTS, 'links-first');
    const resolvedHeading = heading?.trim();
    const resolvedIntro = intro?.trim();
    const resolvedExtraItemsHeading = extraItemsHeading?.trim();
    const resolvedViewAllLabel = viewAllLabel?.trim() || t('megaMenu.viewAll', 'View all');

    if (!categoryId && !isDesignMode) return null;

    const extraItemsContent = component ? (
        <Region
            component={component}
            regionId={MEGA_MENU_EXTRA_ITEMS_REGION_ID}
            errorElement={extraItems ?? null}
            className="grid gap-1"
        />
    ) : (
        extraItems
    );
    const featureContent = component ? (
        <Region
            component={component}
            regionId={MEGA_MENU_FEATURE_REGION_ID}
            errorElement={feature ?? null}
            className="w-full"
        />
    ) : (
        feature
    );

    return (
        <section
            data-slot="sfnext-toolkit-mega-menu-panel"
            data-target-category={categoryId}
            className={cn(
                '@container/mega-menu-panel flex w-full flex-col rounded-xl',
                SURFACE_CLASSES[resolvedSurface],
                DENSITY_CLASSES[resolvedDensity],
                className
            )}
            {...props}>
            {(resolvedHeading || resolvedIntro || (showViewAll && categoryId)) && (
                <header data-slot="mega-menu-panel-header" className="space-y-2">
                    {resolvedHeading && (
                        <h3 data-slot="mega-menu-panel-heading" className="text-base font-semibold tracking-tight">
                            {resolvedHeading}
                        </h3>
                    )}
                    {resolvedIntro && (
                        <p data-slot="mega-menu-panel-intro" className="text-sm text-muted-foreground">
                            {resolvedIntro}
                        </p>
                    )}
                    {showViewAll && categoryId && (
                        <Link
                            data-slot="mega-menu-panel-view-all"
                            to={routeHref(routes.category, { categoryId })}
                            onClick={onNavigate}
                            className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {resolvedViewAllLabel}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    )}
                </header>
            )}

            {!categoryId && isDesignMode && (
                <div
                    data-slot="mega-menu-panel-unconfigured"
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    <PanelsTopLeft className="size-4" aria-hidden="true" />
                    {t('megaMenu.configurePanel', 'Select the root category this panel should enhance')}
                </div>
            )}

            <div data-slot="mega-menu-panel-content" className="grid min-w-0 gap-4">
                <div
                    data-slot="mega-menu-panel-extra-items"
                    className={cn('min-w-0', resolvedLayout === 'feature-first' && 'order-2')}>
                    {resolvedExtraItemsHeading && (
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {resolvedExtraItemsHeading}
                        </h4>
                    )}
                    {extraItemsContent}
                </div>
                <div
                    data-slot="mega-menu-panel-feature"
                    className={cn('min-w-0', resolvedLayout === 'feature-first' && 'order-1')}>
                    {featureContent}
                </div>
            </div>
        </section>
    );
}

export function MegaMenuPanelFallback() {
    return (
        <div
            data-slot="sfnext-toolkit-mega-menu-panel-fallback"
            aria-hidden="true"
            className="space-y-4 rounded-xl border border-border p-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-40 w-full rounded-lg" />
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MegaMenuPanelFallback as fallback };
