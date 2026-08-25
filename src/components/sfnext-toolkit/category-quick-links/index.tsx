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
import { type ComponentPropsWithoutRef, type CSSProperties, useId } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { useRouteLoaderData } from 'react-router';
import type { ShopperProducts } from '@/scapi';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { routes, routeHref } from '@/route-paths';
import { cn } from '@/lib/utils';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

type Category = ShopperProducts.schemas['Category'];

type CategoryRouteData = {
    category?: Category;
};

const QUICK_LINK_TONES = ['default', 'muted'] as const;
const QUICK_LINK_ALIGNMENTS = ['start', 'center'] as const;

type QuickLinkTone = (typeof QUICK_LINK_TONES)[number];
type QuickLinkAlignment = (typeof QUICK_LINK_ALIGNMENTS)[number];

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const categoryQuickLinksVariants = cva('w-full border-y border-border text-foreground', {
    variants: {
        tone: {
            default: 'bg-background/95',
            muted: 'bg-muted/95',
        },
        sticky: {
            true: 'sticky z-40 supports-[backdrop-filter]:backdrop-blur-md',
            false: '',
        },
    },
    defaultVariants: {
        tone: 'default',
        sticky: false,
    },
});

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function normalizeMaxItems(value: number | undefined): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(Math.max(Math.floor(numericValue), 1), 20) : 12;
}

function categoryKey(category: Category, index: number): string {
    return category.id?.trim() || `category-quick-link-${index}`;
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('categoryQuickLinks', {
    name: 'Category Quick Links',
    description:
        'Context-aware horizontal navigation for the current category children, with an optional alternate source category and storefront-only sticky behavior.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class CategoryQuickLinksMetadata {
    @AttributeDefinition({
        id: 'sourceCategory',
        name: 'Source category override',
        description:
            'Optional category whose immediate children become links. Leave empty to use the current category.',
        type: 'category',
    })
    sourceCategory?: string;

    @AttributeDefinition({
        id: 'title',
        name: 'Visible title',
        description: 'Optional heading displayed before the links.',
        type: 'string',
    })
    title?: string;

    @AttributeDefinition({
        id: 'ariaLabel',
        name: 'Accessible navigation label',
        description: 'Concise label announced for this navigation when no visible title is provided.',
        type: 'string',
        defaultValue: 'Category quick links',
    })
    ariaLabel?: string;

    @AttributeDefinition({
        id: 'sticky',
        name: 'Sticky below header',
        description:
            'Keeps the links below the storefront header while scrolling. Disabled in Page Designer edit mode.',
        type: 'boolean',
        defaultValue: false,
    })
    sticky?: boolean;

    @AttributeDefinition({
        id: 'tone',
        name: 'Surface tone',
        type: 'enum',
        values: ['default', 'muted'],
        defaultValue: 'default',
    })
    tone?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Desktop alignment',
        description: 'Links remain horizontally scrollable on small screens.',
        type: 'enum',
        values: ['start', 'center'],
        defaultValue: 'start',
    })
    alignment?: string;

    @AttributeDefinition({
        id: 'maxItems',
        name: 'Maximum links',
        description: 'Limits the current category children displayed, from one to twenty.',
        type: 'integer',
        defaultValue: 12,
    })
    maxItems?: number;
}
/* v8 ignore stop */

export interface CategoryQuickLinksProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'title'> {
    sourceCategory?: string;
    title?: string;
    ariaLabel?: string;
    sticky?: boolean;
    tone?: QuickLinkTone;
    alignment?: QuickLinkAlignment;
    maxItems?: number;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: Category | null;
}

export default function CategoryQuickLinks({
    sourceCategory,
    title,
    ariaLabel,
    sticky = false,
    tone,
    alignment,
    maxItems,
    className,
    style,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
    ...props
}: CategoryQuickLinksProps) {
    const { isDesignMode } = usePageDesignerMode();
    const routeData = useRouteLoaderData<CategoryRouteData>('routes/_app.category.$categoryId');
    const headingId = useId();
    const hasSourceOverride = Boolean(sourceCategory?.trim());
    const source = hasSourceOverride ? data : routeData?.category;
    const links = (source?.categories ?? []).slice(0, normalizeMaxItems(maxItems));
    const currentCategoryId = routeData?.category?.id?.trim();
    const resolvedTitle = title?.trim();
    const resolvedAriaLabel = ariaLabel?.trim() || 'Category quick links';
    const resolvedTone = normalizeValue(tone, QUICK_LINK_TONES, 'default');
    const resolvedAlignment = normalizeValue(alignment, QUICK_LINK_ALIGNMENTS, 'start');
    const isSticky = Boolean(sticky) && !isDesignMode;
    const stickyStyle: CSSProperties | undefined = isSticky ? { top: 'var(--header-height, 0px)', ...style } : style;

    if (links.length === 0) {
        if (!isDesignMode) return null;

        return (
            <nav
                {...props}
                data-slot="sfnext-toolkit-category-quick-links"
                aria-label={resolvedAriaLabel}
                className={cn(categoryQuickLinksVariants({ tone: resolvedTone, sticky: false }), className)}
                style={style}>
                <div className="section-container py-4">
                    <p
                        data-slot="category-quick-links-empty"
                        role="status"
                        className="border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                        The selected category has no child categories to display.
                    </p>
                </div>
            </nav>
        );
    }

    return (
        <nav
            {...props}
            data-slot="sfnext-toolkit-category-quick-links"
            data-sticky={isSticky || undefined}
            aria-labelledby={resolvedTitle ? headingId : undefined}
            aria-label={resolvedTitle ? undefined : resolvedAriaLabel}
            className={cn(categoryQuickLinksVariants({ tone: resolvedTone, sticky: isSticky }), className)}
            style={stickyStyle}>
            <div className="section-container py-3">
                {resolvedTitle && (
                    <h2 id={headingId} data-slot="category-quick-links-title" className="mb-2 text-sm font-semibold">
                        {resolvedTitle}
                    </h2>
                )}
                <div data-slot="category-quick-links-scroll" className="overflow-x-auto overscroll-x-contain">
                    <ul
                        data-slot="category-quick-links-list"
                        className={cn(
                            'flex min-w-max items-center gap-2 py-1',
                            resolvedAlignment === 'center' && 'md:mx-auto md:w-max'
                        )}>
                        {links.map((category, index) => {
                            const id = category.id?.trim();
                            const label = category.name?.trim() || id;
                            if (!id || !label) return null;

                            const isCurrent = id === currentCategoryId;
                            return (
                                <li key={categoryKey(category, index)} data-slot="category-quick-links-item">
                                    <Link
                                        to={routeHref(routes.category, { categoryId: id })}
                                        aria-current={isCurrent ? 'page' : undefined}
                                        className={cn(
                                            'inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                                            isCurrent &&
                                                'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                        )}>
                                        {label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
