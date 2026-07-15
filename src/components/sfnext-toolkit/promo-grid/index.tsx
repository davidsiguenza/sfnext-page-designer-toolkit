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
import { type ComponentPropsWithoutRef, type ReactNode, useId } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { Link } from '@/components/link';
import { Region, type ComponentType } from '@/components/region';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const COLUMN_CLASSES = {
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const;

const GAP_CLASSES = {
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
} as const;

const SURFACE_CLASSES = {
    transparent: 'bg-transparent text-foreground',
    muted: 'bg-muted text-foreground',
    card: 'border-ui border-border bg-card text-card-foreground',
} as const;

const LAYOUT_CLASSES = {
    equal: '',
    'featured-first': 'grid-flow-row-dense sm:[&>*:first-child]:col-span-2',
} as const;

const HEADER_ALIGNMENT_CLASSES = {
    left: 'mr-auto items-start text-left',
    center: 'mx-auto items-center text-center',
    right: 'ml-auto items-end text-right',
} as const;

type PromoGridColumns = keyof typeof COLUMN_CLASSES;
type PromoGridGap = keyof typeof GAP_CLASSES;
type PromoGridSurface = keyof typeof SURFACE_CLASSES;
type PromoGridLayout = keyof typeof LAYOUT_CLASSES;
type PromoGridHeaderAlignment = keyof typeof HEADER_ALIGNMENT_CLASSES;

const promoGridDefaults = {
    columns: '3' as PromoGridColumns,
    gap: 'md' as PromoGridGap,
    surface: 'transparent' as PromoGridSurface,
    layout: 'equal' as PromoGridLayout,
    headerAlignment: 'left' as PromoGridHeaderAlignment,
} as const;

function normalizeOption<T extends string>(value: string | undefined, options: Record<T, string>, fallback: T): T {
    return value && Object.prototype.hasOwnProperty.call(options, value) ? (value as T) : fallback;
}

function hasText(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('promoGrid', {
    name: 'Promo Grid',
    description:
        'Responsive editorial grid for two to six Promo Cards, with equal or featured-first hierarchy and an optional safe shop-all link.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'items',
        name: 'Promo cards',
        description: 'Add up to six promotional cards. Only SFNext Toolkit Promo Cards are accepted.',
        maxComponents: 6,
        componentTypeInclusions: ['SFNextToolkit.promoCard'],
    },
])
export class PromoGridMetadata {
    @AttributeDefinition({
        name: 'Title',
        description: 'Optional accessible heading shown above the cards.',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Subtitle',
        description: 'Optional supporting copy shown below the heading.',
        type: 'text',
    })
    subtitle?: string;

    @AttributeDefinition({
        name: 'Desktop columns',
        description: 'Cards always stack on mobile and use two columns on tablet before this desktop layout.',
        type: 'enum',
        values: ['2', '3', '4'],
        defaultValue: '3',
    })
    columns?: string;

    @AttributeDefinition({
        name: 'Gap',
        description: 'Responsive spacing between promotional cards.',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'md',
    })
    gap?: string;

    @AttributeDefinition({
        name: 'Surface',
        description: 'Semantic storefront surface applied to the complete section.',
        type: 'enum',
        values: ['transparent', 'muted', 'card'],
        defaultValue: 'transparent',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'layout',
        name: 'Card layout',
        description: 'Keep every card equal or let the first promotion span two columns from tablet upwards.',
        type: 'enum',
        values: ['equal', 'featured-first'],
        defaultValue: 'equal',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'headerAlignment',
        name: 'Header alignment',
        description: 'Alignment for the title, supporting copy and shop-all link.',
        type: 'enum',
        values: ['left', 'center', 'right'],
        defaultValue: 'left',
    })
    headerAlignment?: string;

    @AttributeDefinition({
        id: 'shopAllLabel',
        name: 'Shop-all label',
        description: 'Optional link label. It is hidden until both a label and destination are provided.',
    })
    shopAllLabel?: string;

    @AttributeDefinition({
        id: 'shopAllUrl',
        name: 'Shop-all destination',
        description: 'Safe internal or external destination for the collection link.',
        type: 'url',
    })
    shopAllUrl?: string;
}
/* v8 ignore stop */

export interface PromoGridProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
    title?: string;
    subtitle?: string;
    columns?: string;
    gap?: string;
    surface?: string;
    layout?: string;
    headerAlignment?: string;
    shopAllLabel?: string;
    shopAllUrl?: string;
    children?: ReactNode;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function PromoGrid({
    title,
    subtitle,
    columns,
    gap,
    surface,
    layout,
    headerAlignment,
    shopAllLabel,
    shopAllUrl,
    children,
    className,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: PromoGridProps) {
    const headingId = useId();
    const resolvedColumns = normalizeOption(columns, COLUMN_CLASSES, promoGridDefaults.columns);
    const resolvedGap = normalizeOption(gap, GAP_CLASSES, promoGridDefaults.gap);
    const resolvedSurface = normalizeOption(surface, SURFACE_CLASSES, promoGridDefaults.surface);
    const resolvedLayout = normalizeOption(layout, LAYOUT_CLASSES, promoGridDefaults.layout);
    const resolvedHeaderAlignment = normalizeOption(
        headerAlignment,
        HEADER_ALIGNMENT_CLASSES,
        promoGridDefaults.headerAlignment
    );
    const safeShopAllUrl = normalizeSafeLinkUrl(shopAllUrl);
    const hasShopAll = Boolean(safeShopAllUrl && hasText(shopAllLabel));
    const hasHeader = hasText(title) || hasText(subtitle) || hasShopAll;
    const itemsClassName = cn(
        'grid items-stretch [&>*]:h-full [&>*]:min-w-0',
        COLUMN_CLASSES[resolvedColumns],
        GAP_CLASSES[resolvedGap],
        LAYOUT_CLASSES[resolvedLayout]
    );

    const items = component ? (
        <Region
            component={component}
            regionId="items"
            data-slot="promo-grid-items"
            className={itemsClassName}
            errorElement={children ?? null}
        />
    ) : (
        <div data-slot="promo-grid-items" className={itemsClassName}>
            {children}
        </div>
    );

    return (
        <section
            {...props}
            data-slot="sfnext-toolkit-promo-grid"
            data-layout={resolvedLayout}
            aria-labelledby={hasText(title) ? headingId : undefined}
            className={cn('w-full rounded-ui px-4 py-8 md:px-6 md:py-10', SURFACE_CLASSES[resolvedSurface], className)}>
            {hasHeader && (
                <header
                    data-slot="promo-grid-header"
                    className={cn(
                        'mb-6 flex max-w-3xl flex-col gap-2 md:mb-8',
                        HEADER_ALIGNMENT_CLASSES[resolvedHeaderAlignment]
                    )}>
                    {hasText(title) && (
                        <h2
                            id={headingId}
                            data-slot="promo-grid-title"
                            className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            {title.trim()}
                        </h2>
                    )}
                    {hasText(subtitle) && (
                        <p
                            data-slot="promo-grid-subtitle"
                            className="max-w-2xl text-base leading-7 text-muted-foreground">
                            {subtitle.trim()}
                        </p>
                    )}
                    {hasShopAll && safeShopAllUrl && (
                        <div data-slot="promo-grid-actions" className="pt-1">
                            <Button asChild variant="link" className="h-auto px-0 py-1">
                                <Link to={safeShopAllUrl}>
                                    {shopAllLabel?.trim()}
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </header>
            )}
            {items}
        </section>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function PromoGridFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-promo-grid-fallback"
            aria-hidden="true"
            className="w-full space-y-6 px-4 py-8 md:px-6 md:py-10">
            <div data-slot="promo-grid-fallback-header" className="space-y-2">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div data-slot="promo-grid-fallback-items" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="aspect-[4/3] w-full" />
                ))}
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { PromoGridFallback as fallback };
