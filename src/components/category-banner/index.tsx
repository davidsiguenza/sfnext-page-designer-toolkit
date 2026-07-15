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
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigation, useRouteLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { useConfig } from '@salesforce/storefront-next-runtime/config';
import { toImageUrl } from '@/lib/images/dynamic-image';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';

type CategoryRouteData = {
    category: ShopperProducts.schemas['Category'];
    searchResultCritical: ShopperSearch.schemas['ProductSearchResult'];
};

export type CategoryBannerHeight = 'sm' | 'md' | 'lg';
export type CategoryBannerAlignment = 'left' | 'center' | 'right';
export type CategoryBannerOverlay = 'none' | 'subtle' | 'medium' | 'strong';

export interface CategoryBannerProps {
    /** Page Designer image override. When absent, the current category image is used. */
    image?: Image | string;
    /** Text override. Empty values fall back to the current category hierarchy. */
    eyebrow?: string;
    /** Title override. Empty values fall back to the current category name. */
    title?: string;
    /** Description override. Empty values fall back to the current category description. */
    description?: string;
    /** Product count override. When absent, the current PLP search total is used. */
    productCount?: number;
    showEyebrow?: boolean;
    showDescription?: boolean;
    showProductCount?: boolean;
    height?: CategoryBannerHeight;
    alignment?: CategoryBannerAlignment;
    overlay?: CategoryBannerOverlay;
    /** Keeps the fallback PLP banner's duplicate visual title out of the accessibility tree. */
    decorativeText?: boolean;
    className?: string;
}

const HEIGHT_CLASS: Record<CategoryBannerHeight, string> = {
    sm: 'h-[250px] md:h-[300px] lg:h-[350px]',
    md: 'h-[350px] md:h-[450px] lg:h-[500px]',
    lg: 'h-[450px] md:h-[550px] lg:h-[650px]',
};

const ALIGNMENT_CLASS: Record<CategoryBannerAlignment, string> = {
    left: 'text-left',
    center: 'mx-auto text-center',
    right: 'ml-auto text-right',
};

const OVERLAY_CLASS: Record<CategoryBannerOverlay, string> = {
    none: '',
    subtle: 'bg-foreground/20',
    medium: 'bg-foreground/40',
    strong: 'bg-gradient-to-b from-foreground/20 via-foreground/40 to-foreground/70',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && values.includes(value as T) ? (value as T) : fallback;
}

function resolveImageSource(image: Image | string | undefined): string | undefined {
    if (typeof image === 'string') return image.trim() || undefined;
    return image?.url || image?.path;
}

function resolveText(override: string | undefined, fallback: string | undefined): string | undefined {
    const value = override?.trim();
    return value || fallback;
}

/**
 * Fallback banner for Product Listing Pages when no hero component is configured
 * in the plpTopFullWidth Page Designer region. The optional props also make this
 * presentation reusable by the SFNext Toolkit category hero.
 *
 * Image resolution: explicit override -> c_slotBannerImage -> category.image -> bg-muted.
 */
export default function CategoryBanner({
    image,
    eyebrow,
    title,
    description,
    productCount,
    showEyebrow = true,
    showDescription = false,
    showProductCount = true,
    height = 'sm',
    alignment = 'left',
    overlay = 'strong',
    decorativeText = true,
    className,
}: CategoryBannerProps = {}) {
    const loaderData = useRouteLoaderData<CategoryRouteData>('routes/_app.category.$categoryId');
    const { t } = useTranslation('category');
    const navigation = useNavigation();
    const location = useLocation();
    const config = useConfig();

    const category = loaderData?.category;
    const routeTotal = loaderData?.searchResultCritical?.total;
    const hasProductCountOverride =
        typeof productCount === 'number' && Number.isFinite(productCount) && productCount >= 0;
    const total = hasProductCountOverride ? Math.floor(productCount) : routeTotal;

    const isCountPending = useMemo(() => {
        if (hasProductCountOverride) return false;
        if (navigation.state === 'idle' || !navigation.location) return false;
        if (navigation.location.pathname !== location.pathname) return false;
        const current = new URLSearchParams(location.search);
        const next = new URLSearchParams(navigation.location.search);
        return ['refine', 'sort', 'offset'].some(
            (param) => current.getAll(param).join(',') !== next.getAll(param).join(',')
        );
    }, [hasProductCountOverride, navigation.state, navigation.location, location.pathname, location.search]);

    const rootCategoryName = category?.parentCategoryTree?.find((parent) => parent.id !== 'root')?.name;
    const resolvedEyebrow = resolveText(eyebrow, rootCategoryName);
    const resolvedTitle = resolveText(title, category?.name);
    const resolvedDescription = resolveText(description, category?.pageDescription || category?.description);

    const categoryImageUrl =
        (typeof category?.c_slotBannerImage === 'string' && category.c_slotBannerImage) ||
        (typeof category?.image === 'string' && category.image) ||
        undefined;
    const overrideImageUrl = resolveImageSource(image);
    const rawImageUrl = overrideImageUrl || categoryImageUrl;
    const imageSrc = toImageUrl({ src: rawImageUrl, config }) ?? rawImageUrl;
    const focalPoint = typeof image === 'object' ? image.focalPoint || image.focal_point : undefined;
    const imageStyle: CSSProperties | undefined = focalPoint
        ? { objectPosition: `${focalPointToCss(focalPoint.x)} ${focalPointToCss(focalPoint.y)}` }
        : undefined;

    const [imageFailed, setImageFailed] = useState(false);
    useEffect(() => setImageFailed(false), [rawImageUrl]);
    const handleImageError = useCallback(() => setImageFailed(true), []);

    const hasImage = !!imageSrc && !imageFailed;
    const resolvedHeight = normalizeValue(height, ['sm', 'md', 'lg'] as const, 'sm');
    const resolvedAlignment = normalizeValue(alignment, ['left', 'center', 'right'] as const, 'left');
    const resolvedOverlay = normalizeValue(overlay, ['none', 'subtle', 'medium', 'strong'] as const, 'strong');
    const TitleElement = decorativeText ? 'p' : 'h2';

    return (
        <section
            data-slot="category-banner"
            className={cn('relative w-full overflow-hidden', HEIGHT_CLASS[resolvedHeight], className)}>
            <div data-slot="category-banner-media" className="absolute inset-0">
                {hasImage ? (
                    <img
                        data-slot="category-banner-image"
                        src={imageSrc}
                        alt=""
                        aria-hidden="true"
                        fetchPriority="high"
                        className="h-full w-full object-cover"
                        style={imageStyle}
                        onError={handleImageError}
                    />
                ) : (
                    <div data-slot="category-banner-image-fallback" className="absolute inset-0 bg-muted" />
                )}
                {hasImage && (
                    <div
                        data-slot="category-banner-overlay"
                        className={cn('absolute inset-0', OVERLAY_CLASS[resolvedOverlay])}
                    />
                )}
            </div>

            <div data-slot="category-banner-content" className="relative flex h-full items-end">
                <div className="section-container w-full pb-8 md:pb-10">
                    <div className={cn('max-w-2xl', ALIGNMENT_CLASS[resolvedAlignment])}>
                        {showEyebrow && resolvedEyebrow && (
                            <p
                                data-slot="category-banner-eyebrow"
                                aria-hidden={decorativeText || undefined}
                                className={cn(
                                    'mb-4 text-xs font-medium uppercase tracking-widest md:text-sm',
                                    hasImage ? 'text-background/80' : 'text-muted-foreground'
                                )}>
                                {resolvedEyebrow}
                            </p>
                        )}
                        {resolvedTitle && (
                            <TitleElement
                                data-slot="category-banner-title"
                                aria-hidden={decorativeText || undefined}
                                className={cn(
                                    'mb-4 text-4xl font-light leading-tight tracking-tight md:text-5xl lg:text-6xl xl:text-7xl',
                                    hasImage ? 'text-background' : 'text-foreground'
                                )}>
                                {resolvedTitle}
                            </TitleElement>
                        )}
                        {showDescription && resolvedDescription && (
                            <p
                                data-slot="category-banner-description"
                                className={cn(
                                    'mb-3 max-w-xl text-base leading-relaxed md:text-lg',
                                    resolvedAlignment === 'center' && 'mx-auto',
                                    resolvedAlignment === 'right' && 'ml-auto',
                                    hasImage ? 'text-background/90' : 'text-muted-foreground'
                                )}>
                                {resolvedDescription}
                            </p>
                        )}
                        {showProductCount && (
                            <div
                                data-slot="category-banner-count"
                                className={cn(
                                    'text-2xl font-light',
                                    hasImage ? 'text-background/90' : 'text-muted-foreground'
                                )}
                                aria-live="polite">
                                {isCountPending
                                    ? t('banner.counting')
                                    : total !== undefined && t('banner.productsAvailable', { count: total })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
