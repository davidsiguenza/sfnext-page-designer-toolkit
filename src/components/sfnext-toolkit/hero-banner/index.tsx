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
import { type ComponentPropsWithoutRef, type ElementType, useId } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const HERO_HEIGHTS = ['sm', 'md', 'lg', 'xl'] as const;
const HERO_POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
] as const;
const HERO_OVERLAYS = ['none', 'subtle', 'strong'] as const;
const HERO_HEADING_LEVELS = ['h1', 'h2', 'h3'] as const;
const HERO_VISUAL_SIZES = ['sm', 'md', 'lg'] as const;

type HeroHeight = (typeof HERO_HEIGHTS)[number];
type HeroPosition = (typeof HERO_POSITIONS)[number];
type HeroOverlay = (typeof HERO_OVERLAYS)[number];
type HeroHeadingLevel = (typeof HERO_HEADING_LEVELS)[number];
type HeroVisualSize = (typeof HERO_VISUAL_SIZES)[number];

// eslint-disable-next-line react-refresh/only-export-components -- shared by stories and related toolkit components.
export const heroBannerVariants = cva('relative w-full overflow-hidden bg-muted', {
    variants: {
        height: {
            sm: 'h-[20rem] md:h-[24rem]',
            md: 'h-[25rem] md:h-[31rem]',
            lg: 'h-[31rem] md:h-[39rem]',
            xl: 'h-[38rem] md:h-[48rem]',
        },
    },
    defaultVariants: {
        height: 'lg',
    },
});

const heroContentVariants = cva('section-container relative z-10 flex h-full py-8 md:py-12', {
    variants: {
        position: {
            'top-left': 'items-start justify-start',
            'top-center': 'items-start justify-center',
            'top-right': 'items-start justify-end',
            'middle-left': 'items-center justify-start',
            'middle-center': 'items-center justify-center',
            'middle-right': 'items-center justify-end',
            'bottom-left': 'items-end justify-start',
            'bottom-center': 'items-end justify-center',
            'bottom-right': 'items-end justify-end',
        },
    },
    defaultVariants: {
        position: 'middle-left',
    },
});

const heroOverlayVariants = cva('absolute inset-0', {
    variants: {
        overlay: {
            none: 'bg-transparent',
            subtle: 'bg-header-background/30',
            strong: 'bg-header-background/65',
        },
    },
    defaultVariants: {
        overlay: 'strong',
    },
});

const CONTENT_ALIGNMENT_CLASS = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
} as const;

const CTA_ALIGNMENT_CLASS = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
} as const;

const HEADING_SIZE_CLASS: Record<HeroVisualSize, string> = {
    sm: 'text-3xl font-semibold tracking-tight md:text-4xl',
    md: 'text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl',
    lg: 'text-5xl font-semibold leading-none tracking-tight md:text-6xl lg:text-7xl',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function resolveImage(image: Image | string | undefined): { src: string; focalPoint?: Image['focalPoint'] } {
    if (typeof image === 'string') return { src: image.trim() };
    return {
        src: image?.url || image?.path || '',
        focalPoint: image?.focalPoint || image?.focal_point,
    };
}

function hasText(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

function horizontalAlignment(position: HeroPosition): keyof typeof CONTENT_ALIGNMENT_CLASS {
    if (position.endsWith('-center')) return 'center';
    if (position.endsWith('-right')) return 'right';
    return 'left';
}

/* v8 ignore start - decorator behavior is covered by metadata assertions. */
@Component('heroBanner', {
    name: 'Hero Banner',
    description:
        'Responsive campaign hero with desktop and mobile imagery, safe calls to action, semantic headings and token-based overlays.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitHeroBannerMetadata {
    @AttributeDefinition({
        id: 'desktopImage',
        name: 'Desktop image',
        description: 'Primary content-library image used on tablet and desktop screens.',
        type: 'image',
    })
    desktopImage?: Image;

    @AttributeDefinition({
        id: 'mobileImage',
        name: 'Mobile image',
        description: 'Optional portrait crop used below the tablet breakpoint.',
        type: 'image',
    })
    mobileImage?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Describe an informative image. Leave empty only when Decorative image is enabled.',
        type: 'string',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description:
            'Hides campaign imagery from assistive technology when the adjacent copy conveys the same meaning.',
        type: 'boolean',
        defaultValue: true,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({ id: 'eyebrow', name: 'Eyebrow', type: 'string' })
    eyebrow?: string;

    @AttributeDefinition({ id: 'title', name: 'Title', type: 'string' })
    title?: string;

    @AttributeDefinition({ id: 'body', name: 'Body', type: 'text' })
    body?: string;

    @AttributeDefinition({
        id: 'headingLevel',
        name: 'Heading level',
        description: 'Use H1 only when this hero owns the page title.',
        type: 'enum',
        values: ['h1', 'h2', 'h3'],
        defaultValue: 'h1',
    })
    headingLevel?: string;

    @AttributeDefinition({
        id: 'visualSize',
        name: 'Title size',
        description: 'Visual title scale, independent of its semantic heading level.',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'lg',
    })
    visualSize?: string;

    @AttributeDefinition({
        id: 'contentPosition',
        name: 'Content position',
        type: 'enum',
        values: [
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-center',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right',
        ],
        defaultValue: 'middle-left',
    })
    contentPosition?: string;

    @AttributeDefinition({
        id: 'height',
        name: 'Height',
        type: 'enum',
        values: ['sm', 'md', 'lg', 'xl'],
        defaultValue: 'lg',
    })
    height?: string;

    @AttributeDefinition({
        id: 'overlay',
        name: 'Image overlay',
        description: 'Token-based contrast treatment placed between the image and content.',
        type: 'enum',
        values: ['none', 'subtle', 'strong'],
        defaultValue: 'strong',
    })
    overlay?: string;

    @AttributeDefinition({ id: 'primaryCtaLabel', name: 'Primary CTA label', type: 'string' })
    primaryCtaLabel?: string;

    @AttributeDefinition({ id: 'primaryCtaUrl', name: 'Primary CTA destination', type: 'url' })
    primaryCtaUrl?: string;

    @AttributeDefinition({ id: 'secondaryCtaLabel', name: 'Secondary CTA label', type: 'string' })
    secondaryCtaLabel?: string;

    @AttributeDefinition({ id: 'secondaryCtaUrl', name: 'Secondary CTA destination', type: 'url' })
    secondaryCtaUrl?: string;
}
/* v8 ignore stop */

export interface HeroBannerProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
    desktopImage?: Image | string;
    mobileImage?: Image | string;
    imageAlt?: string;
    decorativeImage?: boolean;
    eyebrow?: string;
    title?: string;
    body?: string;
    headingLevel?: HeroHeadingLevel;
    visualSize?: HeroVisualSize;
    contentPosition?: HeroPosition;
    height?: HeroHeight;
    overlay?: HeroOverlay;
    primaryCtaLabel?: string;
    primaryCtaUrl?: string;
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;

    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function HeroBanner({
    desktopImage,
    mobileImage,
    imageAlt,
    decorativeImage = true,
    eyebrow,
    title,
    body,
    headingLevel,
    visualSize,
    contentPosition,
    height,
    overlay,
    primaryCtaLabel,
    primaryCtaUrl,
    secondaryCtaLabel,
    secondaryCtaUrl,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: HeroBannerProps) {
    const { isDesignMode } = usePageDesignerMode();
    const headingId = useId();
    const desktop = resolveImage(desktopImage);
    const mobile = resolveImage(mobileImage);
    const desktopSrc = desktop.src || mobile.src;
    const hasMobileArtDirection = Boolean(desktop.src && mobile.src);
    const hasImage = Boolean(desktopSrc);
    const hasEyebrow = hasText(eyebrow);
    const hasTitle = hasText(title);
    const hasBody = hasText(body);
    const safePrimaryUrl = normalizeSafeLinkUrl(primaryCtaUrl);
    const safeSecondaryUrl = normalizeSafeLinkUrl(secondaryCtaUrl);
    const hasPrimaryCta = Boolean(safePrimaryUrl && hasText(primaryCtaLabel));
    const hasSecondaryCta = Boolean(safeSecondaryUrl && hasText(secondaryCtaLabel));
    const hasAuthoredContent = hasImage || hasEyebrow || hasTitle || hasBody || hasPrimaryCta || hasSecondaryCta;
    const isAuthoringEmpty = isDesignMode && !hasAuthoredContent;

    if (!hasAuthoredContent && !isDesignMode) return null;

    const resolvedHeight = normalizeValue(height, HERO_HEIGHTS, 'lg');
    const resolvedPosition = normalizeValue(contentPosition, HERO_POSITIONS, 'middle-left');
    const resolvedOverlay = normalizeValue(overlay, HERO_OVERLAYS, 'strong');
    const resolvedHeadingLevel = normalizeValue(headingLevel, HERO_HEADING_LEVELS, 'h1');
    const resolvedVisualSize = normalizeValue(visualSize, HERO_VISUAL_SIZES, 'lg');
    const alignment = horizontalAlignment(resolvedPosition);
    const HeadingTag = resolvedHeadingLevel as ElementType;
    const resolvedEyebrow = hasEyebrow ? eyebrow.trim() : isAuthoringEmpty ? 'Page Designer' : undefined;
    const resolvedTitle = hasTitle ? title.trim() : isAuthoringEmpty ? 'Hero banner' : undefined;
    const resolvedBody = hasBody
        ? body.trim()
        : isAuthoringEmpty
          ? 'Add campaign imagery, a page title and up to two calls to action.'
          : undefined;
    const resolvedAlt = decorativeImage ? '' : imageAlt?.trim() || title?.trim() || '';
    const desktopObjectPosition = `${focalPointToCss(desktop.focalPoint?.x)} ${focalPointToCss(desktop.focalPoint?.y)}`;
    const mobileObjectPosition = `${focalPointToCss(mobile.focalPoint?.x)} ${focalPointToCss(mobile.focalPoint?.y)}`;
    const imagePriority = hasMobileArtDirection ? 'auto' : 'high';

    return (
        <section
            {...props}
            data-slot="sfnext-toolkit-hero-banner"
            data-authoring-empty={isAuthoringEmpty || undefined}
            aria-labelledby={resolvedTitle ? headingId : undefined}
            className={cn(
                heroBannerVariants({ height: resolvedHeight }),
                isAuthoringEmpty && 'border border-dashed border-border',
                className
            )}>
            {hasImage && (
                <div data-slot="hero-banner-media" className="absolute inset-0">
                    <DynamicImage
                        src={desktopSrc}
                        alt={resolvedAlt}
                        widths={['100vw']}
                        priority={imagePriority}
                        loading="eager"
                        className={cn(
                            'absolute inset-0 h-full w-full [&_picture]:block [&_picture]:h-full [&_picture]:w-full',
                            hasMobileArtDirection && 'hidden md:block'
                        )}
                        imageProps={{
                            'aria-hidden': decorativeImage || undefined,
                            className: 'h-full w-full object-cover',
                            style: { objectPosition: desktopObjectPosition },
                        }}
                    />
                    {hasMobileArtDirection && (
                        <DynamicImage
                            src={mobile.src}
                            alt={resolvedAlt}
                            widths={['100vw']}
                            priority="auto"
                            loading="eager"
                            className="absolute inset-0 h-full w-full md:hidden [&_picture]:block [&_picture]:h-full [&_picture]:w-full"
                            imageProps={{
                                'aria-hidden': decorativeImage || undefined,
                                className: 'h-full w-full object-cover',
                                style: { objectPosition: mobileObjectPosition },
                            }}
                        />
                    )}
                    <div
                        data-slot="hero-banner-overlay"
                        aria-hidden="true"
                        className={heroOverlayVariants({ overlay: resolvedOverlay })}
                    />
                </div>
            )}

            <div data-slot="hero-banner-content" className={heroContentVariants({ position: resolvedPosition })}>
                <div
                    data-slot="hero-banner-copy"
                    className={cn('flex w-full max-w-2xl flex-col gap-4', CONTENT_ALIGNMENT_CLASS[alignment])}>
                    {resolvedEyebrow && (
                        <p
                            data-slot="hero-banner-eyebrow"
                            className={cn(
                                'text-sm font-semibold uppercase tracking-wider',
                                hasImage ? 'text-header-foreground/85' : 'text-muted-foreground'
                            )}>
                            {resolvedEyebrow}
                        </p>
                    )}
                    {resolvedTitle && (
                        <HeadingTag
                            id={headingId}
                            data-slot="hero-banner-title"
                            className={cn(
                                HEADING_SIZE_CLASS[resolvedVisualSize],
                                hasImage ? 'text-header-foreground' : 'text-foreground'
                            )}>
                            {resolvedTitle}
                        </HeadingTag>
                    )}
                    {resolvedBody && (
                        <p
                            data-slot="hero-banner-body"
                            className={cn(
                                'max-w-xl whitespace-pre-line text-base leading-7 md:text-lg',
                                hasImage ? 'text-header-foreground/90' : 'text-muted-foreground'
                            )}>
                            {resolvedBody}
                        </p>
                    )}
                    {(hasPrimaryCta || hasSecondaryCta) && (
                        <div
                            data-slot="hero-banner-actions"
                            className={cn('flex flex-wrap gap-3 pt-2', CTA_ALIGNMENT_CLASS[alignment])}>
                            {hasPrimaryCta && safePrimaryUrl && (
                                <Button asChild size="lg">
                                    <Link to={safePrimaryUrl}>{primaryCtaLabel?.trim()}</Link>
                                </Button>
                            )}
                            {hasSecondaryCta && safeSecondaryUrl && (
                                <Button asChild size="lg" variant="outline">
                                    <Link to={safeSecondaryUrl}>{secondaryCtaLabel?.trim()}</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function HeroBannerFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-hero-banner-fallback"
            aria-hidden="true"
            className="relative h-[31rem] w-full overflow-hidden bg-muted md:h-[39rem]">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            <div className="section-container relative flex h-full items-center py-12">
                <div className="w-full max-w-2xl space-y-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-14 w-4/5" />
                    <Skeleton className="h-5 w-3/5" />
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { HeroBannerFallback as fallback };
