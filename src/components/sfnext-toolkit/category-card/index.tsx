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
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { useTranslation } from 'react-i18next';
import type { ShopperProducts } from '@/scapi';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { routes, routeHref } from '@/route-paths';
import type { Image } from '@/types';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const LAYOUT_CLASSES = {
    overlay: 'overlay',
    stacked: 'stacked',
} as const;

const RATIO_CLASSES = {
    square: 'aspect-square',
    landscape: 'aspect-[4/3]',
    portrait: 'aspect-[3/4]',
} as const;

type Category = ShopperProducts.schemas['Category'];

function normalizeOption<T extends Record<string, unknown>>(
    value: string | undefined,
    options: T,
    fallback: Extract<keyof T, string>
): Extract<keyof T, string> {
    return value && Object.prototype.hasOwnProperty.call(options, value)
        ? (value as Extract<keyof T, string>)
        : fallback;
}

function resolveImage(
    image: Image | string | undefined,
    category: Category | undefined
): { src: string; focalPoint?: Image['focalPoint'] } {
    if (typeof image === 'string' && image.trim()) return { src: image.trim() };

    if (typeof image === 'object' && image !== null) {
        const overrideSrc = image.url || image.path;
        if (overrideSrc) {
            return {
                src: overrideSrc,
                focalPoint: image.focalPoint || image.focal_point,
            };
        }
    }

    const categoryImage =
        (typeof category?.image === 'string' && category.image) ||
        (typeof category?.c_slotBannerImage === 'string' && category.c_slotBannerImage) ||
        '';
    return { src: categoryImage };
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('categoryCard', {
    name: 'Category Card',
    description:
        'Catalog-backed category card with editorial overrides, focal-point-aware imagery, and safe navigation.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class CategoryCardMetadata {
    @AttributeDefinition({
        name: 'Category',
        description: 'Select the catalog category used for default content and destination.',
        type: 'category',
    })
    category?: string;

    @AttributeDefinition({
        name: 'Image override',
        description: 'Optional Page Designer image. Its configured focal point is preserved.',
        type: 'image',
    })
    image?: Image;

    @AttributeDefinition({
        name: 'Title override',
        description: 'Optional title. When empty, the selected category name is used.',
        type: 'string',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Copy override',
        description: 'Optional supporting copy. When empty, the selected category description is used.',
        type: 'text',
    })
    copy?: string;

    @AttributeDefinition({
        name: 'CTA label',
        description: 'Optional call-to-action label.',
        type: 'string',
    })
    ctaLabel?: string;

    @AttributeDefinition({
        name: 'CTA URL override',
        description: 'Optional safe destination. When empty, the selected category URL is used.',
        type: 'url',
    })
    ctaUrl?: string;

    @AttributeDefinition({
        name: 'Layout',
        type: 'enum',
        values: ['overlay', 'stacked'],
        defaultValue: 'overlay',
    })
    layout?: string;

    @AttributeDefinition({
        name: 'Image ratio',
        type: 'enum',
        values: ['square', 'landscape', 'portrait'],
        defaultValue: 'square',
    })
    ratio?: string;
}
/* v8 ignore stop */

export interface CategoryCardProps extends Omit<ComponentPropsWithoutRef<'article'>, 'title'> {
    category?: string | Category;
    image?: Image | string;
    title?: string;
    copy?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    layout?: string;
    ratio?: string;
    loading?: HTMLImageElement['loading'];

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: Category | null;
}

export default function CategoryCard({
    category,
    image,
    title,
    copy,
    ctaLabel,
    ctaUrl,
    layout,
    ratio,
    loading = 'lazy',
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
    ...props
}: CategoryCardProps) {
    const { t } = useTranslation('home');
    const categoryData = data || (typeof category === 'object' && category !== null ? category : undefined);
    const resolvedLayout = normalizeOption(layout, LAYOUT_CLASSES, 'overlay');
    const resolvedRatio = normalizeOption(ratio, RATIO_CLASSES, 'square');
    const resolvedTitle = title?.trim() || categoryData?.name?.trim() || '';
    const resolvedCopy =
        copy?.trim() || categoryData?.pageDescription?.trim() || categoryData?.description?.trim() || '';
    const resolvedCtaLabel = ctaLabel?.trim() || (categoryData ? t('categoryGrid.shopNowButton') : '');
    const { src, focalPoint } = resolveImage(image, categoryData);
    const objectPosition = `${focalPointToCss(focalPoint?.x)} ${focalPointToCss(focalPoint?.y)}`;
    const categoryId = categoryData?.id?.trim();
    const categoryUrl = categoryId ? routeHref(routes.category, { categoryId }) : undefined;
    const destination = normalizeSafeLinkUrl(ctaUrl) || categoryUrl;
    const hasCta = Boolean(resolvedCtaLabel && destination);
    const hasContent = Boolean(resolvedTitle || resolvedCopy || hasCta || src);

    if (!hasContent) return null;

    const media = (
        <div
            data-slot="category-card-media"
            className={cn('relative overflow-hidden bg-muted', RATIO_CLASSES[resolvedRatio])}>
            {src ? (
                <DynamicImage
                    src={src}
                    alt={resolvedTitle}
                    widths={['100vw', '50vw', '25vw']}
                    loading={loading}
                    className="h-full w-full"
                    imageProps={{
                        className:
                            'h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105',
                        style: { objectPosition },
                    }}
                />
            ) : (
                <div
                    data-slot="category-card-image-placeholder"
                    aria-hidden="true"
                    className="h-full w-full bg-muted"
                />
            )}
        </div>
    );

    const details = (
        <div data-slot="category-card-content" className="space-y-2">
            {resolvedTitle && (
                <h3 data-slot="category-card-title" className="text-xl font-semibold tracking-tight md:text-2xl">
                    {resolvedTitle}
                </h3>
            )}
            {resolvedCopy && (
                <p data-slot="category-card-copy" className="text-sm opacity-90">
                    {resolvedCopy}
                </p>
            )}
            {hasCta && (
                <span
                    data-slot="category-card-cta"
                    className={cn(
                        'inline-flex text-sm font-semibold underline-offset-4',
                        resolvedLayout === 'overlay'
                            ? 'text-background hover:underline'
                            : 'text-primary hover:underline'
                    )}>
                    {resolvedCtaLabel}
                </span>
            )}
        </div>
    );

    const cardContent =
        resolvedLayout === 'overlay' ? (
            <div data-slot="category-card-overlay-layout" className="relative">
                {media}
                <div
                    data-slot="category-card-overlay"
                    className="absolute inset-x-0 bottom-0 bg-foreground/75 p-5 text-background md:p-6">
                    {details}
                </div>
            </div>
        ) : (
            <div data-slot="category-card-stacked-layout">
                {media}
                <div className="bg-card p-5 text-card-foreground md:p-6">{details}</div>
            </div>
        );

    return (
        <article
            data-slot="sfnext-toolkit-category-card"
            className={cn(
                'h-full overflow-hidden rounded-ui border border-border bg-card text-card-foreground',
                className
            )}
            {...props}>
            {destination ? (
                <Link
                    to={destination}
                    className="group block h-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
                    {cardContent}
                </Link>
            ) : (
                <div className="group h-full">{cardContent}</div>
            )}
        </article>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function CategoryCardFallback() {
    return (
        <article
            data-slot="sfnext-toolkit-category-card-fallback"
            aria-hidden="true"
            className="h-full overflow-hidden rounded-ui border border-border bg-card">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
            </div>
        </article>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { CategoryCardFallback as fallback };
