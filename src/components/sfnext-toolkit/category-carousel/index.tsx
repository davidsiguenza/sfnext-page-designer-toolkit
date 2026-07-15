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
import { Children, type ReactNode } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import type { ShopperProducts } from '@/scapi';
import { CarouselSection } from '@/components/carousel-section';
import { type ComponentType } from '@/components/region';
import { Component as RegionComponent } from '@/components/region/component';
import CategoryCard from '@/components/sfnext-toolkit/category-card';
import { CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { routes, routeHref } from '@/route-paths';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const TONE_CLASSES = {
    default: 'bg-background text-foreground',
    muted: 'bg-muted text-foreground',
} as const;

const carouselItemClassName = 'w-[280px] basis-auto py-1 sm:w-[320px]';
type Category = ShopperProducts.schemas['Category'];

function normalizeTone(value: string | undefined): keyof typeof TONE_CLASSES {
    return value === 'muted' ? 'muted' : 'default';
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('categoryCarousel', {
    name: 'Category Carousel',
    description:
        'Carousel populated automatically from a parent category or manually with SFNext Toolkit Category Cards.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'cards',
        name: 'Category cards',
        description: 'Manual mode: add up to twelve SFNext Toolkit Category Cards.',
        maxComponents: 12,
        componentTypeInclusions: ['SFNextToolkit.categoryCard'],
    },
])
export class CategoryCarouselMetadata {
    @AttributeDefinition({
        name: 'Parent category',
        description:
            'When selected, immediate child categories are loaded automatically and the manual cards region is ignored.',
        type: 'category',
    })
    parentCategory?: string;

    @AttributeDefinition({
        name: 'Title',
        type: 'string',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Subtitle',
        type: 'text',
    })
    subtitle?: string;

    @AttributeDefinition({
        name: 'Shop-all label',
        type: 'string',
    })
    shopAllText?: string;

    @AttributeDefinition({
        name: 'Shop-all URL override',
        description: 'Optional safe destination. The parent category URL is used by default in automatic mode.',
        type: 'url',
    })
    shopAllUrl?: string;

    @AttributeDefinition({
        name: 'Tone',
        type: 'enum',
        values: ['default', 'muted'],
        defaultValue: 'default',
    })
    tone?: string;
}
/* v8 ignore stop */

export interface CategoryCarouselProps {
    parentCategory?: string;
    title?: string;
    subtitle?: string;
    shopAllText?: string;
    shopAllUrl?: string;
    tone?: string;
    className?: string;
    children?: ReactNode;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: Category[] | null;
}

export default function CategoryCarousel({
    parentCategory,
    title,
    subtitle,
    shopAllText,
    shopAllUrl,
    tone,
    className,
    children,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
}: CategoryCarouselProps) {
    const { isDesignMode } = usePageDesignerMode();
    const resolvedTone = normalizeTone(tone);
    const cardsRegion = component?.regions?.find((region) => region.id === 'cards');
    const regionComponents = cardsRegion?.components ?? [];
    const automaticCategories = Array.isArray(data) ? data : [];
    const useAutomaticMode = Boolean(parentCategory) || automaticCategories.length > 0;
    const standaloneItems =
        Children.map(children, (child) => <CarouselItem className={carouselItemClassName}>{child}</CarouselItem>) ?? [];
    const parentCategoryUrl = parentCategory ? routeHref(routes.category, { categoryId: parentCategory }) : undefined;
    const resolvedShopAllUrl = normalizeSafeLinkUrl(shopAllUrl) || parentCategoryUrl;

    let items: ReactNode[] = [];
    if (useAutomaticMode) {
        items = automaticCategories.map((category) => (
            <CarouselItem key={category.id} className={carouselItemClassName}>
                <CategoryCard category={category} className="h-full w-full" />
            </CarouselItem>
        ));
    } else if (regionComponents.length > 0 && cardsRegion) {
        items = regionComponents.map((regionComponent) => {
            const typedComponent = regionComponent as ComponentType;
            return (
                <CarouselItem
                    key={typedComponent.contentLinkUuid ?? typedComponent.id}
                    className={carouselItemClassName}>
                    <RegionComponent component={typedComponent} regionId={cardsRegion.id} className="h-full w-full" />
                </CarouselItem>
            );
        });
    } else {
        items = standaloneItems;
    }

    if (items.length === 0) {
        if (!isDesignMode) return null;

        return (
            <section
                data-slot="sfnext-toolkit-category-carousel"
                className={cn('w-full', TONE_CLASSES[resolvedTone], className)}>
                <div className="section-container py-8">
                    <div
                        data-slot="category-carousel-empty-state"
                        role="status"
                        className="rounded-ui border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        Select a parent category or add Category Cards to the manual region.
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            data-slot="sfnext-toolkit-category-carousel"
            className={cn('w-full', TONE_CLASSES[resolvedTone], className)}>
            <CarouselSection
                title={title?.trim() || undefined}
                subtitle={subtitle?.trim() || undefined}
                shopAllText={shopAllText?.trim() || undefined}
                shopAllUrl={resolvedShopAllUrl}
                ariaLabel={title?.trim() || 'Category carousel'}>
                {items}
            </CarouselSection>
        </section>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function CategoryCarouselFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-category-carousel-fallback"
            aria-hidden="true"
            className="w-full bg-background">
            <div className="section-container space-y-6 py-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="aspect-square w-[280px] shrink-0" />
                    ))}
                </div>
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { CategoryCarouselFallback as fallback };
