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
import { cva, type VariantProps } from 'class-variance-authority';
import { ImageIcon } from 'lucide-react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const PROMO_CARD_LAYOUTS = ['stacked', 'overlay'] as const;
const PROMO_CARD_RATIOS = ['landscape', 'square', 'portrait'] as const;
const PROMO_CARD_CTA_STYLES = ['primary', 'secondary', 'outline', 'link'] as const;
const PROMO_CARD_HOVER_EFFECTS = ['none', 'lift', 'zoom'] as const;

type PromoCardLayout = (typeof PROMO_CARD_LAYOUTS)[number];
type PromoCardRatio = (typeof PROMO_CARD_RATIOS)[number];
type PromoCardCtaStyle = (typeof PROMO_CARD_CTA_STYLES)[number];
type PromoCardHoverEffect = (typeof PROMO_CARD_HOVER_EFFECTS)[number];
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

const promoCardDefaults = {
    showBackground: true,
    showBorder: true,
    layout: 'stacked' as PromoCardLayout,
    aspectRatio: 'landscape' as PromoCardRatio,
    ctaStyle: 'primary' as PromoCardCtaStyle,
    hoverEffect: 'lift' as PromoCardHoverEffect,
} as const;

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const promoCardVariants = cva(
    'group relative flex h-full min-w-0 overflow-hidden rounded-ui text-foreground outline-none focus-within:ring-ring/50 focus-within:ring-[3px]',
    {
        variants: {
            layout: {
                stacked: 'flex-col',
                overlay: 'min-h-80',
            },
            background: {
                true: 'bg-card text-card-foreground',
                false: 'bg-transparent text-foreground',
            },
            border: {
                true: 'border-ui border-border',
                false: 'border border-transparent',
            },
            hoverEffect: {
                none: '',
                lift: 'motion-safe:transition-[transform,box-shadow] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg motion-reduce:transform-none',
                zoom: 'motion-safe:transition-shadow motion-safe:hover:shadow-md',
            },
        },
        defaultVariants: {
            layout: 'stacked',
            background: true,
            border: true,
            hoverEffect: 'lift',
        },
    }
);

const ASPECT_RATIO_CLASS: Record<PromoCardRatio, string> = {
    landscape: 'aspect-[4/3]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

const CTA_VARIANT: Record<PromoCardCtaStyle, ButtonVariant> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    link: 'link',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function hasText(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

function resolveImage(image: Image | string | undefined): { src: string; focalPoint?: Image['focalPoint'] } {
    if (typeof image === 'string') return { src: image.trim() };

    return {
        src: (image?.url || image?.path || '').trim(),
        focalPoint: image?.focalPoint || image?.focal_point,
    };
}

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('promoCard', {
    name: 'Promo Card',
    description:
        'Editorial promotion with stacked or image-overlay layouts, responsive crops and a safe call to action. Use it inside a Promo Grid.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class PromoCardMetadata {
    @AttributeDefinition({
        name: 'Title',
        description: 'Short promotional heading.',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Description',
        description: 'Supporting copy displayed with the promotional heading.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'imageUrl',
        name: 'Image',
        description: 'Promotional image selected from the content library. Its configured focal point is respected.',
        type: 'image',
    })
    imageUrl?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Describe informative images. When empty, the card title is used as the alternative text.',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description: 'Enable when the image adds no information beyond the card title and copy.',
        type: 'boolean',
        defaultValue: false,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({
        id: 'buttonText',
        name: 'CTA label',
        description: 'Link label. The CTA is hidden until both a label and destination are provided.',
    })
    buttonText?: string;

    @AttributeDefinition({
        id: 'buttonLink',
        name: 'CTA destination',
        description: 'Internal or external destination for the call to action.',
        type: 'url',
    })
    buttonLink?: string;

    @AttributeDefinition({
        id: 'showBackground',
        name: 'Show background',
        description: 'Applies the storefront card surface behind the content.',
        type: 'boolean',
        defaultValue: true,
    })
    showBackground?: boolean;

    @AttributeDefinition({
        id: 'showBorder',
        name: 'Show border',
        description: 'Displays the semantic storefront border around the card.',
        type: 'boolean',
        defaultValue: true,
    })
    showBorder?: boolean;

    @AttributeDefinition({
        id: 'eyebrow',
        name: 'Eyebrow',
        description: 'Optional short label shown above the card title.',
    })
    eyebrow?: string;

    @AttributeDefinition({
        id: 'layout',
        name: 'Layout',
        description: 'Stack content below the image or place it in a readable panel over the image.',
        type: 'enum',
        values: ['stacked', 'overlay'],
        defaultValue: 'stacked',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'aspectRatio',
        name: 'Image aspect ratio',
        description: 'Editorial crop applied while preserving the image focal point.',
        type: 'enum',
        values: ['landscape', 'square', 'portrait'],
        defaultValue: 'landscape',
    })
    aspectRatio?: string;

    @AttributeDefinition({
        id: 'ctaStyle',
        name: 'CTA style',
        description: 'Semantic storefront treatment for the call to action.',
        type: 'enum',
        values: ['primary', 'secondary', 'outline', 'link'],
        defaultValue: 'primary',
    })
    ctaStyle?: string;

    @AttributeDefinition({
        id: 'hoverEffect',
        name: 'Hover effect',
        description: 'Optional motion-safe lift or image zoom. Keyboard focus always remains visible.',
        type: 'enum',
        values: ['none', 'lift', 'zoom'],
        defaultValue: 'lift',
    })
    hoverEffect?: string;
}
/* v8 ignore stop */

export interface PromoCardProps extends Omit<ComponentPropsWithoutRef<'article'>, 'children'> {
    title?: string;
    description?: string;
    imageUrl?: Image | string;
    imageAlt?: string;
    decorativeImage?: boolean;
    buttonText?: string;
    buttonLink?: string;
    showBackground?: boolean;
    showBorder?: boolean;
    eyebrow?: string;
    layout?: PromoCardLayout;
    aspectRatio?: PromoCardRatio;
    ctaStyle?: PromoCardCtaStyle;
    hoverEffect?: PromoCardHoverEffect;
    loading?: HTMLImageElement['loading'];

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

/**
 * Editorial Page Designer card with responsive imagery, focal-point support,
 * accessible motion and safe storefront navigation.
 */
export default function PromoCard({
    className,
    title,
    description,
    imageUrl,
    imageAlt,
    decorativeImage = false,
    buttonText,
    buttonLink,
    showBackground = promoCardDefaults.showBackground,
    showBorder = promoCardDefaults.showBorder,
    eyebrow,
    layout,
    aspectRatio,
    ctaStyle,
    hoverEffect,
    loading = 'lazy',
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: PromoCardProps) {
    const { isDesignMode } = usePageDesignerMode();
    const image = resolveImage(imageUrl);
    const hasImage = Boolean(image.src);
    const hasEyebrow = hasText(eyebrow);
    const hasTitle = hasText(title);
    const hasDescription = hasText(description);
    const safeButtonLink = normalizeSafeLinkUrl(buttonLink);
    const hasCta = Boolean(safeButtonLink && hasText(buttonText));
    const hasAuthoredContent = hasImage || hasEyebrow || hasTitle || hasDescription || hasCta;
    const isAuthoringEmpty = isDesignMode && !hasAuthoredContent;

    if (!hasAuthoredContent && !isDesignMode) return null;

    const resolvedLayout = hasImage ? normalizeValue(layout, PROMO_CARD_LAYOUTS, promoCardDefaults.layout) : 'stacked';
    const resolvedRatio = normalizeValue(aspectRatio, PROMO_CARD_RATIOS, promoCardDefaults.aspectRatio);
    const resolvedCtaStyle = normalizeValue(ctaStyle, PROMO_CARD_CTA_STYLES, promoCardDefaults.ctaStyle);
    const resolvedHoverEffect = normalizeValue(hoverEffect, PROMO_CARD_HOVER_EFFECTS, promoCardDefaults.hoverEffect);
    const objectPosition = `${focalPointToCss(image.focalPoint?.x)} ${focalPointToCss(image.focalPoint?.y)}`;
    const resolvedAlt = decorativeImage ? '' : imageAlt?.trim() || title?.trim() || '';

    if (isAuthoringEmpty) {
        return (
            <article
                {...props}
                data-slot="sfnext-toolkit-promo-card"
                data-authoring-empty="true"
                className={cn(
                    'flex min-h-72 h-full flex-col items-center justify-center gap-4 rounded-ui border border-dashed border-border bg-muted p-8 text-center text-foreground',
                    className
                )}>
                <span
                    data-slot="promo-card-empty-icon"
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                    <ImageIcon className="size-6" />
                </span>
                <div data-slot="promo-card-empty" className="max-w-xs space-y-1.5">
                    <h3 className="text-lg font-semibold">Promo card</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Add an image, message or call to action to build this promotion.
                    </p>
                </div>
            </article>
        );
    }

    const body = hasEyebrow || hasTitle || hasDescription || hasCta;

    return (
        <article
            {...props}
            data-slot="sfnext-toolkit-promo-card"
            data-layout={resolvedLayout}
            className={cn(
                promoCardVariants({
                    layout: resolvedLayout,
                    background: showBackground,
                    border: showBorder,
                    hoverEffect: resolvedHoverEffect,
                }),
                className
            )}>
            {hasImage && (
                <div
                    data-slot="promo-card-media"
                    className={cn(
                        'relative w-full shrink-0 overflow-hidden bg-muted',
                        ASPECT_RATIO_CLASS[resolvedRatio],
                        resolvedLayout === 'overlay' && 'absolute inset-0 h-full'
                    )}>
                    <DynamicImage
                        src={image.src}
                        alt={resolvedAlt}
                        widths={['100vw', '50vw', '33vw']}
                        loading={loading}
                        className="h-full w-full [&_picture]:block [&_picture]:h-full [&_picture]:w-full"
                        imageProps={{
                            'aria-hidden': decorativeImage || undefined,
                            role: decorativeImage ? 'presentation' : undefined,
                            className: cn(
                                'h-full w-full object-cover motion-reduce:transition-none',
                                resolvedHoverEffect === 'zoom' &&
                                    'motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 motion-safe:group-focus-within:scale-105'
                            ),
                            style: { objectPosition },
                        }}
                    />
                </div>
            )}

            {body && (
                <div
                    data-slot="promo-card-body"
                    className={cn(
                        'relative z-10 flex min-w-0 flex-col items-start gap-3 p-5 md:p-6',
                        resolvedLayout === 'stacked' && 'flex-1',
                        resolvedLayout === 'overlay' &&
                            'm-4 mt-auto max-w-[calc(100%-2rem)] self-stretch rounded-ui bg-background/90 text-foreground shadow-md backdrop-blur-sm'
                    )}>
                    {hasEyebrow && (
                        <p
                            data-slot="promo-card-eyebrow"
                            className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {eyebrow.trim()}
                        </p>
                    )}
                    {hasTitle && (
                        <h3
                            data-slot="promo-card-title"
                            className="text-xl font-semibold leading-tight tracking-tight md:text-2xl">
                            {title.trim()}
                        </h3>
                    )}
                    {hasDescription && (
                        <p
                            data-slot="promo-card-description"
                            className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                            {description.trim()}
                        </p>
                    )}
                    {hasCta && safeButtonLink && (
                        <div data-slot="promo-card-actions" className="mt-auto pt-1">
                            <Button asChild variant={CTA_VARIANT[resolvedCtaStyle]}>
                                <Link to={safeButtonLink}>{buttonText?.trim()}</Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function PromoCardFallback() {
    return (
        <article
            data-slot="sfnext-toolkit-promo-card-fallback"
            aria-hidden="true"
            className="h-full overflow-hidden rounded-ui border-ui border-border bg-card text-card-foreground">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div data-slot="promo-card-fallback-body" className="space-y-3 p-6">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-24" />
            </div>
        </article>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { PromoCardFallback as fallback };
