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
import { ArrowRight, ImageOff } from 'lucide-react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { useTranslation } from 'react-i18next';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import ProductPrice from '@/components/product-price';
import type { ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';
import { useMegaMenuNavigate } from '../mega-menu/context';
import {
    normalizeMegaMenuFeatureImage,
    normalizeMegaMenuFeatureSourceType,
    type MegaMenuFeatureLoaderData,
} from './model';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const FEATURE_LAYOUTS = ['stacked', 'overlay'] as const;
const FEATURE_RATIOS = ['landscape', 'square', 'portrait'] as const;
const FEATURE_OBJECT_FITS = ['cover', 'contain'] as const;
const FEATURE_TONES = ['default', 'muted', 'accent', 'dark'] as const;

type FeatureRatio = (typeof FEATURE_RATIOS)[number];
type FeatureTone = (typeof FEATURE_TONES)[number];

const RATIO_CLASSES: Record<FeatureRatio, string> = {
    landscape: 'aspect-[4/3]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

const TONE_CLASSES: Record<FeatureTone, string> = {
    default: 'border-border bg-card text-card-foreground',
    muted: 'border-border bg-muted text-foreground',
    accent: 'border-transparent bg-accent text-accent-foreground',
    dark: 'border-transparent bg-foreground text-background',
};

function normalizeOption<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
    return value && allowed.includes(value as T) ? (value as T) : fallback;
}

/* v8 ignore start - decorators are covered by generated metadata validation. */
@Component('megaMenuFeature', {
    name: 'Mega Menu Feature',
    description:
        'One lightweight graphical card sourced from a category, product, B2C Content Asset, Salesforce CMS record or custom editorial content.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitMegaMenuFeatureMetadata {
    @AttributeDefinition({
        id: 'sourceType',
        name: 'Content source',
        description: 'Choose the system that supplies the card defaults. Manual overrides below always win.',
        type: 'enum',
        values: ['category', 'product', 'content', 'cms', 'custom'],
        defaultValue: 'custom',
    })
    sourceType?: string;

    @AttributeDefinition({
        id: 'category',
        name: 'Source category',
        description:
            'Used when Content source is Category. Name, description, main image and destination are inherited.',
        type: 'category',
    })
    category?: string;

    @AttributeDefinition({
        id: 'product',
        name: 'Source product',
        description:
            'Used when Content source is Product. Product imagery, name, destination and optional price are inherited.',
        type: 'product',
    })
    product?: string;

    @AttributeDefinition({
        id: 'contentId',
        name: 'B2C Content Asset ID',
        description: 'Exact online Content Asset ID used when Content source is B2C Content.',
        type: 'string',
    })
    contentId?: string;

    @AttributeDefinition({
        id: 'cmsRecord',
        name: 'Salesforce CMS record',
        description:
            'Used for Salesforce CMS or as a starting point for Custom content. Configure field mappings when the record uses non-standard attribute IDs.',
        type: 'cms_record',
    })
    cmsRecord?: unknown;

    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Product image type',
        description:
            'Preferred catalog image view type for Product sources. If unavailable, the card falls back to another supported configured type.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({
        id: 'eyebrow',
        name: 'Eyebrow override',
        description: 'Optional short context label above the title.',
        type: 'string',
    })
    eyebrow?: string;

    @AttributeDefinition({
        id: 'title',
        name: 'Title override',
        description: 'Overrides the source title. Required for a purely Custom card.',
        type: 'string',
    })
    title?: string;

    @AttributeDefinition({
        id: 'copy',
        name: 'Copy override',
        description: 'Overrides the source description or excerpt.',
        type: 'text',
    })
    copy?: string;

    @AttributeDefinition({
        id: 'imageOverride',
        name: 'Image override',
        description:
            'Page Designer image used ahead of any catalog, Content or CMS image. Its focal point is preserved.',
        type: 'image',
    })
    imageOverride?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Overrides inherited alternative text when the image conveys information.',
        type: 'string',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description:
            'Uses empty alternative text for a purely decorative image. The linked card keeps its visible text as the accessible name.',
        type: 'boolean',
        defaultValue: false,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({
        id: 'badge',
        name: 'Badge',
        description: 'Optional short campaign marker such as New, Sale or Exclusive.',
        type: 'string',
    })
    badge?: string;

    @AttributeDefinition({
        id: 'ctaLabel',
        name: 'CTA label',
        description: 'Visible call-to-action text. A localized default is used when the card has a destination.',
        type: 'string',
    })
    ctaLabel?: string;

    @AttributeDefinition({
        id: 'ctaUrl',
        name: 'Destination override',
        description: 'Safe relative or HTTP(S) URL used ahead of the source destination.',
        type: 'url',
    })
    ctaUrl?: string;

    @AttributeDefinition({
        id: 'openInNewWindow',
        name: 'Open in new window',
        description: 'Intended for external campaign destinations. The link receives safe rel attributes.',
        type: 'boolean',
        defaultValue: false,
    })
    openInNewWindow?: boolean;

    @AttributeDefinition({
        id: 'showProductPrice',
        name: 'Show product price',
        description: 'Shows the storefront price when the source is Product.',
        type: 'boolean',
        defaultValue: true,
    })
    showProductPrice?: boolean;

    @AttributeDefinition({
        id: 'layout',
        name: 'Card layout',
        type: 'enum',
        values: ['stacked', 'overlay'],
        defaultValue: 'stacked',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'imageRatio',
        name: 'Image ratio',
        type: 'enum',
        values: ['landscape', 'square', 'portrait'],
        defaultValue: 'landscape',
    })
    imageRatio?: string;

    @AttributeDefinition({
        id: 'objectFit',
        name: 'Image fit',
        type: 'enum',
        values: ['cover', 'contain'],
        defaultValue: 'cover',
    })
    objectFit?: string;

    @AttributeDefinition({
        id: 'tone',
        name: 'Color tone',
        description: 'Semantic storefront tokens only; compatible with theme changes and dark mode.',
        type: 'enum',
        values: ['default', 'muted', 'accent', 'dark'],
        defaultValue: 'default',
    })
    tone?: string;

    @AttributeDefinition({ id: 'titleAttribute', name: 'CMS/Content title attribute', type: 'string' })
    titleAttribute?: string;

    @AttributeDefinition({ id: 'excerptAttribute', name: 'CMS/Content copy attribute', type: 'string' })
    excerptAttribute?: string;

    @AttributeDefinition({ id: 'imageAttribute', name: 'CMS/Content image attribute', type: 'string' })
    imageAttribute?: string;

    @AttributeDefinition({ id: 'imageAltAttribute', name: 'CMS/Content image alt attribute', type: 'string' })
    imageAltAttribute?: string;

    @AttributeDefinition({ id: 'linkAttribute', name: 'CMS/Content link attribute', type: 'string' })
    linkAttribute?: string;

    @AttributeDefinition({ id: 'eyebrowAttribute', name: 'CMS eyebrow attribute', type: 'string' })
    eyebrowAttribute?: string;
}
/* v8 ignore stop */

export interface MegaMenuFeatureProps extends Omit<ComponentPropsWithoutRef<'article'>, 'title'> {
    sourceType?: string;
    category?: string;
    product?: string;
    contentId?: string;
    cmsRecord?: unknown;
    imageViewType?: string;
    eyebrow?: string;
    title?: string;
    copy?: string;
    imageOverride?: Image | string;
    imageAlt?: string;
    decorativeImage?: boolean;
    badge?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    openInNewWindow?: boolean;
    showProductPrice?: boolean;
    layout?: string;
    imageRatio?: string;
    objectFit?: string;
    tone?: string;
    titleAttribute?: string;
    excerptAttribute?: string;
    imageAttribute?: string;
    imageAltAttribute?: string;
    linkAttribute?: string;
    eyebrowAttribute?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: MegaMenuFeatureLoaderData;
    regionId?: string;
}

export default function MegaMenuFeature({
    sourceType,
    category: _category,
    product: _product,
    contentId: _contentId,
    cmsRecord: _cmsRecord,
    imageViewType: _imageViewType,
    eyebrow,
    title,
    copy,
    imageOverride,
    imageAlt,
    decorativeImage = false,
    badge,
    ctaLabel,
    ctaUrl,
    openInNewWindow = false,
    showProductPrice = true,
    layout,
    imageRatio,
    objectFit,
    tone,
    titleAttribute: _titleAttribute,
    excerptAttribute: _excerptAttribute,
    imageAttribute: _imageAttribute,
    imageAltAttribute: _imageAltAttribute,
    linkAttribute: _linkAttribute,
    eyebrowAttribute: _eyebrowAttribute,
    className,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    regionId: _regionId,
    data,
    ...props
}: MegaMenuFeatureProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t } = useTranslation('extPageDesignerToolkit');
    const onNavigate = useMegaMenuNavigate();
    const resolvedSourceType = normalizeMegaMenuFeatureSourceType(sourceType);
    const resolvedLayout = normalizeOption(layout, FEATURE_LAYOUTS, 'stacked');
    const resolvedRatio = normalizeOption(imageRatio, FEATURE_RATIOS, 'landscape');
    const resolvedObjectFit = normalizeOption(objectFit, FEATURE_OBJECT_FITS, 'cover');
    const resolvedTone = normalizeOption(tone, FEATURE_TONES, 'default');
    const item = data?.item;
    const overrideImage = normalizeMegaMenuFeatureImage(imageOverride);
    const resolvedImage = overrideImage || item?.image;
    const resolvedEyebrow = eyebrow?.trim() || item?.eyebrow?.trim();
    const resolvedTitle = title?.trim() || item?.title?.trim();
    const resolvedCopy = copy?.trim() || item?.copy?.trim();
    const resolvedBadge = badge?.trim();
    const destination = normalizeSafeLinkUrl(ctaUrl) || item?.destination;
    const resolvedCta = ctaLabel?.trim() || (destination ? t('megaMenu.discover', 'Discover') : undefined);
    const resolvedAlt = decorativeImage ? '' : imageAlt?.trim() || resolvedImage?.alt || resolvedTitle || '';

    if (!resolvedTitle && !resolvedCopy && !resolvedImage) {
        if (!isDesignMode) return null;
        const status = data?.status || 'unconfigured';
        return (
            <article
                {...props}
                data-slot="sfnext-toolkit-mega-menu-feature-empty"
                data-status={status}
                role="status"
                className={cn(
                    'flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center text-muted-foreground',
                    className
                )}>
                <span className="space-y-2">
                    <ImageOff className="mx-auto size-5" aria-hidden="true" />
                    <span className="block text-sm font-medium">
                        {status === 'not-found'
                            ? t('megaMenu.featureNotFound', 'Selected feature content is unavailable')
                            : status === 'error'
                              ? t('megaMenu.featureError', 'Feature content could not be loaded')
                              : t('megaMenu.configureFeature', 'Choose a source or add custom feature content')}
                    </span>
                </span>
            </article>
        );
    }

    const objectPosition = `${focalPointToCss(resolvedImage?.focalPoint?.x)} ${focalPointToCss(
        resolvedImage?.focalPoint?.y
    )}`;
    const details = (
        <div
            data-slot="mega-menu-feature-details"
            className={cn(
                'relative z-10 space-y-2 p-4',
                resolvedLayout === 'overlay' &&
                    'bg-gradient-to-t from-foreground/90 via-foreground/60 to-transparent pt-16 text-background'
            )}>
            {(resolvedEyebrow || resolvedBadge) && (
                <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wider">
                    {resolvedEyebrow && <span data-slot="mega-menu-feature-eyebrow">{resolvedEyebrow}</span>}
                    {resolvedBadge && (
                        <span
                            data-slot="mega-menu-feature-badge"
                            className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                            {resolvedBadge}
                        </span>
                    )}
                </div>
            )}
            {resolvedTitle && (
                <h3
                    data-slot="mega-menu-feature-title"
                    className="text-base font-semibold leading-tight tracking-tight">
                    {resolvedTitle}
                </h3>
            )}
            {resolvedCopy && (
                <p
                    data-slot="mega-menu-feature-copy"
                    className={cn(
                        'line-clamp-3 text-xs leading-5',
                        resolvedLayout === 'overlay' ? 'text-background/90' : 'text-muted-foreground'
                    )}>
                    {resolvedCopy}
                </p>
            )}
            {showProductPrice && item?.product && item.currency && (
                <ProductPrice
                    product={item.product}
                    currency={item.currency}
                    hidePromo
                    currentPriceProps={{ className: 'text-sm font-semibold' }}
                    className="text-sm"
                />
            )}
            {resolvedCta && destination && (
                <span
                    data-slot="mega-menu-feature-cta"
                    className="inline-flex items-center gap-1 text-xs font-semibold">
                    {resolvedCta}
                    <ArrowRight
                        className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5"
                        aria-hidden="true"
                    />
                </span>
            )}
        </div>
    );
    const media = (
        <div
            data-slot="mega-menu-feature-media"
            className={cn('relative overflow-hidden bg-muted', RATIO_CLASSES[resolvedRatio])}>
            {resolvedImage ? (
                <DynamicImage
                    src={resolvedImage.src}
                    alt={resolvedAlt}
                    loading="lazy"
                    widths={['100vw', '50vw', '25vw', '20vw']}
                    className="h-full w-full"
                    imageProps={{
                        className: cn(
                            'h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]',
                            resolvedObjectFit === 'contain' ? 'object-contain' : 'object-cover'
                        ),
                        style: { objectPosition },
                    }}
                />
            ) : (
                <div className="h-full w-full bg-muted" aria-hidden="true" />
            )}
            {resolvedLayout === 'overlay' && <div className="absolute inset-x-0 bottom-0">{details}</div>}
        </div>
    );
    const card = (
        <div
            data-slot="mega-menu-feature-card"
            className={cn(
                'group overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md',
                TONE_CLASSES[resolvedTone]
            )}>
            {media}
            {resolvedLayout === 'stacked' && details}
        </div>
    );

    return (
        <article
            {...props}
            data-slot="sfnext-toolkit-mega-menu-feature"
            data-source-type={resolvedSourceType}
            data-requested-image-type={item?.image?.requestedViewType}
            data-resolved-image-type={item?.image?.resolvedViewType}
            className={cn('w-full min-w-0', className)}>
            {destination ? (
                <Link
                    to={destination}
                    target={openInNewWindow ? '_blank' : undefined}
                    rel={openInNewWindow ? 'noopener noreferrer' : undefined}
                    onClick={onNavigate}
                    className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {card}
                </Link>
            ) : (
                card
            )}
        </article>
    );
}

export function MegaMenuFeatureFallback({ imageRatio }: Pick<MegaMenuFeatureProps, 'imageRatio'>) {
    const resolvedRatio = normalizeOption(imageRatio, FEATURE_RATIOS, 'landscape');
    return (
        <div
            data-slot="sfnext-toolkit-mega-menu-feature-fallback"
            aria-hidden="true"
            className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className={cn('w-full rounded-none', RATIO_CLASSES[resolvedRatio])} />
            <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MegaMenuFeatureFallback as fallback };
