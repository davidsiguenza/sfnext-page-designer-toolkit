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
import { forwardRef, type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { DynamicImage } from '@/components/dynamic-image';
import HtmlFragment from '@/components/html-fragment';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const MEDIA_POSITIONS = ['left', 'right'] as const;
const MEDIA_RATIOS = ['landscape', 'square', 'portrait', 'auto'] as const;
const MEDIA_SURFACES = ['transparent', 'background', 'muted', 'card', 'secondary'] as const;
const CONTENT_ALIGNMENTS = ['start', 'center', 'end'] as const;
const CONTENT_SPACING = ['sm', 'md', 'lg'] as const;
const HEADING_LEVELS = ['h2', 'h3', 'h4'] as const;
const CTA_STYLES = ['primary', 'secondary', 'outline', 'link'] as const;

type MediaPosition = (typeof MEDIA_POSITIONS)[number];
type MediaRatio = (typeof MEDIA_RATIOS)[number];
type MediaSurface = (typeof MEDIA_SURFACES)[number];
type ContentAlignment = (typeof CONTENT_ALIGNMENTS)[number];
type ContentSpacing = (typeof CONTENT_SPACING)[number];
type HeadingLevel = (typeof HEADING_LEVELS)[number];
type CtaStyle = (typeof CTA_STYLES)[number];
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const mediaContentVariants = cva('w-full overflow-hidden rounded-ui', {
    variants: {
        surface: {
            transparent: 'bg-transparent text-foreground',
            background: 'bg-background text-foreground',
            muted: 'bg-muted text-foreground',
            card: 'border border-border bg-card text-card-foreground',
            secondary: 'bg-secondary text-secondary-foreground',
        },
    },
    defaultVariants: {
        surface: 'transparent',
    },
});

const MEDIA_RATIO_CLASS: Record<MediaRatio, string> = {
    landscape: 'aspect-[4/3]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    auto: 'min-h-64',
};

const CONTENT_ALIGNMENT_CLASS: Record<ContentAlignment, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
};

const CONTENT_SPACING_CLASS: Record<ContentSpacing, string> = {
    sm: 'p-5 md:p-6',
    md: 'p-6 md:p-10',
    lg: 'p-8 md:p-14',
};

const CTA_VARIANT: Record<CtaStyle, ButtonVariant> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    link: 'link',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function hasAuthoredValue(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

function resolveImage(image: Image | string | undefined): { src: string; focalPoint?: Image['focalPoint'] } {
    if (typeof image === 'string') return { src: image };
    return {
        src: image?.url || image?.path || '',
        focalPoint: image?.focalPoint || image?.focal_point,
    };
}

/* v8 ignore start - decorator behavior is covered by the shared decorator tests. */
@Component('mediaContent', {
    name: 'Media + Content',
    description: 'Responsive image and editorial content split with semantic token surfaces and an optional CTA.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitMediaContentMetadata {
    @AttributeDefinition({
        id: 'imageUrl',
        name: 'Image',
        type: 'image',
        required: false,
    })
    imageUrl?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image Alt Text',
        description:
            'Describe informative images. When empty, the heading is used; without a heading it is decorative.',
        type: 'string',
        required: false,
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'imageTitle',
        name: 'Image Title',
        type: 'string',
        required: false,
    })
    imageTitle?: string;

    @AttributeDefinition({
        id: 'mediaPosition',
        name: 'Desktop Image Position',
        description: 'The image remains first on small screens and moves to this side on larger screens.',
        type: 'enum',
        values: [...MEDIA_POSITIONS],
        defaultValue: 'left',
    })
    mediaPosition?: string;

    @AttributeDefinition({
        id: 'mediaRatio',
        name: 'Image Ratio',
        type: 'enum',
        values: [...MEDIA_RATIOS],
        defaultValue: 'landscape',
    })
    mediaRatio?: string;

    @AttributeDefinition({ id: 'eyebrow', name: 'Eyebrow', type: 'string', required: false })
    eyebrow?: string;

    @AttributeDefinition({ id: 'heading', name: 'Heading', type: 'string', required: false })
    heading?: string;

    @AttributeDefinition({
        id: 'headingLevel',
        name: 'Heading Level',
        type: 'enum',
        values: [...HEADING_LEVELS],
        defaultValue: 'h2',
    })
    headingLevel?: string;

    @AttributeDefinition({
        id: 'content',
        name: 'Content',
        type: 'markup',
        required: false,
    })
    content?: string;

    @AttributeDefinition({ id: 'ctaLabel', name: 'CTA Label', type: 'string', required: false })
    ctaLabel?: string;

    @AttributeDefinition({ id: 'ctaUrl', name: 'CTA URL', type: 'url', required: false })
    ctaUrl?: string;

    @AttributeDefinition({
        id: 'ctaStyle',
        name: 'CTA Style',
        type: 'enum',
        values: [...CTA_STYLES],
        defaultValue: 'primary',
    })
    ctaStyle?: string;

    @AttributeDefinition({
        id: 'surface',
        name: 'Surface',
        type: 'enum',
        values: [...MEDIA_SURFACES],
        defaultValue: 'transparent',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'contentAlignment',
        name: 'Vertical Content Alignment',
        type: 'enum',
        values: [...CONTENT_ALIGNMENTS],
        defaultValue: 'center',
    })
    contentAlignment?: string;

    @AttributeDefinition({
        id: 'contentSpacing',
        name: 'Content Spacing',
        type: 'enum',
        values: [...CONTENT_SPACING],
        defaultValue: 'md',
    })
    contentSpacing?: string;
}
/* v8 ignore stop */

export interface MediaContentProps extends Omit<ComponentPropsWithoutRef<'article'>, 'content'> {
    imageUrl?: Image | string;
    imageAlt?: string;
    imageTitle?: string;
    mediaPosition?: MediaPosition;
    mediaRatio?: MediaRatio;
    eyebrow?: string;
    heading?: string;
    headingLevel?: HeadingLevel;
    content?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaStyle?: CtaStyle;
    surface?: MediaSurface;
    contentAlignment?: ContentAlignment;
    contentSpacing?: ContentSpacing;
    loading?: HTMLImageElement['loading'];

    // Page Designer plumbing is consumed here and must not leak onto the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export const MediaContent = forwardRef<HTMLElement, MediaContentProps>(
    (
        {
            imageUrl,
            imageAlt,
            imageTitle,
            mediaPosition,
            mediaRatio,
            eyebrow,
            heading,
            headingLevel,
            content,
            ctaLabel,
            ctaUrl,
            ctaStyle,
            surface,
            contentAlignment,
            contentSpacing,
            loading = 'lazy',
            className,
            regionId: _regionId,
            component: _component,
            componentData: _componentData,
            designMetadata: _designMetadata,
            data: _data,
            ...props
        },
        ref
    ) => {
        const { src, focalPoint } = resolveImage(imageUrl);
        const hasImage = Boolean(src);
        const hasEyebrow = hasAuthoredValue(eyebrow);
        const hasHeading = hasAuthoredValue(heading);
        const hasContent = hasAuthoredValue(content);
        const safeCtaUrl = normalizeSafeLinkUrl(ctaUrl);
        const hasCta = Boolean(safeCtaUrl);
        const hasEditorialContent = hasEyebrow || hasHeading || hasContent || hasCta;

        if (!hasImage && !hasEditorialContent) return null;

        const resolvedPosition = normalizeValue(mediaPosition, MEDIA_POSITIONS, 'left');
        const resolvedRatio = normalizeValue(mediaRatio, MEDIA_RATIOS, 'landscape');
        const resolvedSurface = normalizeValue(surface, MEDIA_SURFACES, 'transparent');
        const resolvedAlignment = normalizeValue(contentAlignment, CONTENT_ALIGNMENTS, 'center');
        const resolvedSpacing = normalizeValue(contentSpacing, CONTENT_SPACING, 'md');
        const resolvedCtaStyle = normalizeValue(ctaStyle, CTA_STYLES, 'primary');
        const HeadingTag = normalizeValue(headingLevel, HEADING_LEVELS, 'h2') as ElementType;
        const twoColumns = hasImage && hasEditorialContent;
        const objectPosition = `${focalPointToCss(focalPoint?.x)} ${focalPointToCss(focalPoint?.y)}`;

        return (
            <article
                {...props}
                ref={ref}
                data-slot="sfnext-toolkit-media-content"
                className={cn(mediaContentVariants({ surface: resolvedSurface }), className)}>
                <div
                    data-slot="sfnext-toolkit-media-content-layout"
                    className={cn('grid grid-cols-1', twoColumns && 'md:grid-cols-2')}>
                    {hasImage && (
                        <div
                            data-slot="sfnext-toolkit-media-content-media"
                            className={cn(
                                'overflow-hidden bg-muted',
                                MEDIA_RATIO_CLASS[resolvedRatio],
                                twoColumns && resolvedPosition === 'right' && 'md:order-2'
                            )}>
                            <DynamicImage
                                src={src}
                                alt={imageAlt?.trim() || heading?.trim() || ''}
                                widths={['100vw', '50vw', '50vw']}
                                loading={loading}
                                className="h-full w-full"
                                imageProps={{
                                    className: 'h-full w-full',
                                    title: imageTitle?.trim() || undefined,
                                    style: { objectPosition },
                                }}
                            />
                        </div>
                    )}
                    {hasEditorialContent && (
                        <div
                            data-slot="sfnext-toolkit-media-content-body"
                            className={cn(
                                'flex min-w-0 flex-col gap-4',
                                CONTENT_ALIGNMENT_CLASS[resolvedAlignment],
                                CONTENT_SPACING_CLASS[resolvedSpacing],
                                twoColumns && resolvedPosition === 'right' && 'md:order-1'
                            )}>
                            {hasEyebrow && (
                                <p
                                    data-slot="sfnext-toolkit-media-content-eyebrow"
                                    className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    {eyebrow.trim()}
                                </p>
                            )}
                            {hasHeading && (
                                <HeadingTag
                                    data-slot="sfnext-toolkit-media-content-heading"
                                    className="text-3xl font-semibold tracking-tight md:text-4xl">
                                    {heading.trim()}
                                </HeadingTag>
                            )}
                            {hasContent && (
                                <div data-slot="sfnext-toolkit-media-content-copy">
                                    <HtmlFragment
                                        content={content}
                                        className="text-base leading-7 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-4 [&_ul]:list-disc"
                                    />
                                </div>
                            )}
                            {hasCta && safeCtaUrl && (
                                <div data-slot="sfnext-toolkit-media-content-actions" className="pt-1">
                                    <Button asChild variant={CTA_VARIANT[resolvedCtaStyle]}>
                                        <Link to={safeCtaUrl}>{ctaLabel?.trim() || 'Learn more'}</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </article>
        );
    }
);

MediaContent.displayName = 'MediaContent';

export default MediaContent;

/** Stable loading state registered by the Page Designer component registry. */
export function MediaContentFallback() {
    return (
        <article
            data-slot="sfnext-toolkit-media-content-fallback"
            aria-hidden="true"
            className="grid w-full grid-cols-1 overflow-hidden rounded-ui bg-muted md:grid-cols-2">
            <Skeleton className="aspect-[4/3] h-full min-h-64 w-full rounded-none" />
            <div className="flex flex-col justify-center space-y-4 p-6 md:p-10">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-9 w-28" />
            </div>
        </article>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MediaContentFallback as fallback };
