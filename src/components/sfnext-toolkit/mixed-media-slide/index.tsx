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
import { type ComponentPropsWithoutRef, type CSSProperties, type ElementType, useId } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { CircleAlert, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import EmbeddedVideo from '@/components/sfnext-toolkit/embedded-video';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { focalPointToCss } from '@/lib/images/focal-point';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';
import { resolveVideoSource } from '../embedded-video/video-url';

const MEDIA_TYPES = ['image', 'video'] as const;
const ASPECT_RATIOS = ['widescreen', 'cinematic', 'standard', 'square', 'portrait'] as const;
const CONTENT_PLACEMENTS = ['overlay', 'below'] as const;
const CONTENT_ALIGNMENTS = ['left', 'center', 'right'] as const;
const HEADING_LEVELS = ['h2', 'h3'] as const;
const MOBILE_ART_DIRECTION_MEDIA = '(max-width: 47.999rem)';
const DESKTOP_ART_DIRECTION_MEDIA = '(min-width: 48rem)';

type MediaType = (typeof MEDIA_TYPES)[number];
type AspectRatio = (typeof ASPECT_RATIOS)[number];
type ContentPlacement = (typeof CONTENT_PLACEMENTS)[number];
type ContentAlignment = (typeof CONTENT_ALIGNMENTS)[number];
type HeadingLevel = (typeof HEADING_LEVELS)[number];

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const mixedMediaSlideFrameVariants = cva('relative w-full overflow-hidden bg-muted', {
    variants: {
        aspectRatio: {
            widescreen: 'aspect-video',
            cinematic: 'aspect-[21/9]',
            standard: 'aspect-[4/3]',
            square: 'aspect-square',
            portrait: 'aspect-[9/16]',
        },
    },
    defaultVariants: {
        aspectRatio: 'widescreen',
    },
});

const CONTENT_ALIGNMENT_CLASS: Record<ContentAlignment, string> = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function resolveImage(image: Image | string | undefined): { src: string; focalPoint?: Image['focalPoint'] } {
    if (typeof image === 'string') return { src: image.trim() };
    return {
        src: (image?.url || image?.path || '').trim(),
        focalPoint: image?.focalPoint || image?.focal_point,
    };
}

function hasText(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('mixedMediaSlide', {
    name: 'Mixed Media Slide',
    description:
        'Image or accessible video slide with responsive art direction and an optional safe editorial call to action. Use only inside a Mixed Media Carousel.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class MixedMediaSlideMetadata {
    @AttributeDefinition({
        id: 'mediaType',
        name: 'Media type',
        type: 'enum',
        values: ['image', 'video'],
        defaultValue: 'image',
    })
    mediaType?: string;

    @AttributeDefinition({
        id: 'desktopImage',
        name: 'Desktop image',
        description: 'Primary image used when Media type is Image.',
        type: 'image',
    })
    desktopImage?: Image;

    @AttributeDefinition({
        id: 'mobileImage',
        name: 'Mobile image',
        description: 'Optional alternate crop displayed below the tablet breakpoint.',
        type: 'image',
    })
    mobileImage?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Describe informative imagery. Leave empty only when Decorative image is enabled.',
        type: 'string',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description: 'Hides the image from assistive technology when adjacent copy conveys the same meaning.',
        type: 'boolean',
        defaultValue: false,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({
        id: 'priorityImage',
        name: 'Prioritize image loading',
        description: 'Enable only for the first above-the-fold slide. Other slides remain lazy-loaded.',
        type: 'boolean',
        defaultValue: false,
    })
    priorityImage?: boolean;

    @AttributeDefinition({
        id: 'videoUrl',
        name: 'Video URL',
        description: 'Secure YouTube, Vimeo, MP4, WebM or Ogg URL used when Media type is Video.',
        type: 'url',
    })
    videoUrl?: string;

    @AttributeDefinition({
        id: 'videoTitle',
        name: 'Accessible video title',
        description: 'Required when Media type is Video.',
        type: 'string',
    })
    videoTitle?: string;

    @AttributeDefinition({
        id: 'posterImage',
        name: 'Video poster',
        type: 'image',
    })
    posterImage?: Image;

    @AttributeDefinition({
        id: 'captionsUrl',
        name: 'WebVTT captions URL',
        description: 'Optional captions for direct video files.',
        type: 'url',
    })
    captionsUrl?: string;

    @AttributeDefinition({
        id: 'captionsLanguage',
        name: 'Captions language',
        description: 'Optional BCP 47 language code. Leave empty to use the current storefront locale.',
        type: 'string',
    })
    captionsLanguage?: string;

    @AttributeDefinition({
        id: 'transcriptUrl',
        name: 'Transcript URL',
        type: 'url',
    })
    transcriptUrl?: string;

    @AttributeDefinition({
        id: 'clickToPlay',
        name: 'Click to play',
        description: 'Defers third-party video loading until the shopper activates it.',
        type: 'boolean',
        defaultValue: true,
    })
    clickToPlay?: boolean;

    @AttributeDefinition({
        id: 'aspectRatio',
        name: 'Media aspect ratio',
        type: 'enum',
        values: ['widescreen', 'cinematic', 'standard', 'square', 'portrait'],
        defaultValue: 'widescreen',
    })
    aspectRatio?: string;

    @AttributeDefinition({ id: 'eyebrow', name: 'Eyebrow', type: 'string' })
    eyebrow?: string;

    @AttributeDefinition({ id: 'title', name: 'Title', type: 'string' })
    title?: string;

    @AttributeDefinition({ id: 'body', name: 'Body', type: 'text' })
    body?: string;

    @AttributeDefinition({
        id: 'headingLevel',
        name: 'Heading level',
        description: 'Choose the level that follows the surrounding page heading hierarchy.',
        type: 'enum',
        values: ['h2', 'h3'],
        defaultValue: 'h2',
    })
    headingLevel?: string;

    @AttributeDefinition({
        id: 'contentPlacement',
        name: 'Content placement',
        description: 'Overlay is available for image slides; video content is always displayed below the player.',
        type: 'enum',
        values: ['overlay', 'below'],
        defaultValue: 'overlay',
    })
    contentPlacement?: string;

    @AttributeDefinition({
        id: 'contentAlignment',
        name: 'Content alignment',
        type: 'enum',
        values: ['left', 'center', 'right'],
        defaultValue: 'left',
    })
    contentAlignment?: string;

    @AttributeDefinition({ id: 'ctaLabel', name: 'CTA label', type: 'string' })
    ctaLabel?: string;

    @AttributeDefinition({ id: 'ctaUrl', name: 'CTA destination', type: 'url' })
    ctaUrl?: string;
}
/* v8 ignore stop */

export interface MixedMediaSlideProps extends Omit<ComponentPropsWithoutRef<'article'>, 'title'> {
    mediaType?: MediaType;
    desktopImage?: Image | string;
    mobileImage?: Image | string;
    imageAlt?: string;
    decorativeImage?: boolean;
    priorityImage?: boolean;
    videoUrl?: string;
    videoTitle?: string;
    posterImage?: Image | string;
    captionsUrl?: string;
    captionsLanguage?: string;
    transcriptUrl?: string;
    clickToPlay?: boolean;
    aspectRatio?: AspectRatio;
    eyebrow?: string;
    title?: string;
    body?: string;
    headingLevel?: HeadingLevel;
    contentPlacement?: ContentPlacement;
    contentAlignment?: ContentAlignment;
    ctaLabel?: string;
    ctaUrl?: string;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

// eslint-disable-next-line react-refresh/only-export-components
export function hasRenderableMixedMediaSlideContent(value: Partial<MixedMediaSlideProps>): boolean {
    const resolvedMediaType = normalizeValue(value.mediaType, MEDIA_TYPES, 'image');
    const desktop = resolveImage(value.desktopImage);
    const mobile = resolveImage(value.mobileImage);
    const hasImage = Boolean(desktop.src || mobile.src);
    const hasAccessibleImage =
        hasImage && (value.decorativeImage === true || hasText(value.imageAlt) || hasText(value.title));
    const hasValidVideo = Boolean(resolveVideoSource(value.videoUrl) && hasText(value.videoTitle));
    const hasCopy = hasText(value.eyebrow) || hasText(value.title) || hasText(value.body);
    const hasCta = Boolean(normalizeSafeLinkUrl(value.ctaUrl) && hasText(value.ctaLabel));
    const hasMedia = resolvedMediaType === 'image' ? hasAccessibleImage : hasValidVideo;

    return hasMedia || hasCopy || hasCta;
}

export default function MixedMediaSlide({
    mediaType,
    desktopImage,
    mobileImage,
    imageAlt,
    decorativeImage = false,
    priorityImage = false,
    videoUrl,
    videoTitle,
    posterImage,
    captionsUrl,
    captionsLanguage,
    transcriptUrl,
    clickToPlay = true,
    aspectRatio,
    eyebrow,
    title,
    body,
    headingLevel,
    contentPlacement,
    contentAlignment,
    ctaLabel,
    ctaUrl,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: MixedMediaSlideProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t, i18n } = useTranslation('common');
    const headingId = useId();
    const resolvedMediaType = normalizeValue(mediaType, MEDIA_TYPES, 'image');
    const resolvedAspectRatio = normalizeValue(aspectRatio, ASPECT_RATIOS, 'widescreen');
    const resolvedPlacement = normalizeValue(contentPlacement, CONTENT_PLACEMENTS, 'overlay');
    const resolvedAlignment = normalizeValue(contentAlignment, CONTENT_ALIGNMENTS, 'left');
    const resolvedHeadingLevel = normalizeValue(headingLevel, HEADING_LEVELS, 'h2');
    const desktop = resolveImage(desktopImage);
    const mobile = resolveImage(mobileImage);
    const desktopSrc = desktop.src || mobile.src;
    const hasMobileArtDirection = Boolean(desktop.src && mobile.src);
    const hasImage = Boolean(desktopSrc);
    const hasAuthoredVideoUrl = hasText(videoUrl);
    const hasValidVideo = Boolean(resolveVideoSource(videoUrl) && hasText(videoTitle));
    const hasEyebrow = hasText(eyebrow);
    const hasTitle = hasText(title);
    const hasBody = hasText(body);
    const accessibleImageText = imageAlt?.trim() || title?.trim();
    const hasAccessibleImage = hasImage && (decorativeImage || Boolean(accessibleImageText));
    const isAuthoringMissingImageAlt = isDesignMode && resolvedMediaType === 'image' && hasImage && !hasAccessibleImage;
    const safeCtaUrl = normalizeSafeLinkUrl(ctaUrl);
    const hasCta = Boolean(safeCtaUrl && hasText(ctaLabel));
    const hasCopy = hasEyebrow || hasTitle || hasBody || hasCta;
    const hasSelectedMedia = resolvedMediaType === 'image' ? hasAccessibleImage : hasValidVideo;
    const isAuthoringEmpty =
        isDesignMode && !hasSelectedMedia && !hasCopy && !(resolvedMediaType === 'video' && hasAuthoredVideoUrl);

    if (!hasSelectedMedia && !hasCopy && !isDesignMode) return null;

    if (isAuthoringMissingImageAlt) {
        return (
            <article
                {...props}
                data-slot="sfnext-toolkit-mixed-media-slide"
                data-authoring-state="missing-image-alt"
                role="status"
                className={cn(
                    mixedMediaSlideFrameVariants({ aspectRatio: resolvedAspectRatio }),
                    'flex flex-col items-center justify-center gap-3 border border-dashed border-destructive p-8 text-center text-foreground',
                    className
                )}>
                <CircleAlert aria-hidden="true" className="size-8 text-destructive" />
                <div className="space-y-1">
                    <p className="font-semibold">Image alternative text required</p>
                    <p className="text-sm text-muted-foreground">
                        Add image alternative text or a slide title, or mark the image as decorative.
                    </p>
                </div>
            </article>
        );
    }

    if (isAuthoringEmpty) {
        return (
            <article
                {...props}
                data-slot="sfnext-toolkit-mixed-media-slide"
                data-authoring-empty="true"
                className={cn(
                    mixedMediaSlideFrameVariants({ aspectRatio: resolvedAspectRatio }),
                    'flex flex-col items-center justify-center gap-3 border border-dashed border-border p-8 text-center text-foreground',
                    className
                )}>
                <ImageIcon aria-hidden="true" className="size-8 text-muted-foreground" />
                <div className="space-y-1">
                    <p className="font-semibold">Mixed media slide</p>
                    <p className="text-sm text-muted-foreground">Choose an image or video and add optional content.</p>
                </div>
            </article>
        );
    }

    const HeadingTag = resolvedHeadingLevel as ElementType;
    const resolvedAlt = decorativeImage ? '' : accessibleImageText || '';
    const defaultFocalPoint = desktop.src ? desktop.focalPoint : mobile.focalPoint;
    const desktopObjectPosition = `${focalPointToCss(defaultFocalPoint?.x)} ${focalPointToCss(defaultFocalPoint?.y)}`;
    const mobileObjectPosition = `${focalPointToCss(mobile.focalPoint?.x)} ${focalPointToCss(mobile.focalPoint?.y)}`;
    const useOverlay = resolvedMediaType === 'image' && hasAccessibleImage && resolvedPlacement === 'overlay';
    const imagePriority = priorityImage ? 'high' : 'auto';
    const artDirectedObjectPosition = hasMobileArtDirection
        ? ({
              '--mobile-object-position': mobileObjectPosition,
              '--desktop-object-position': desktopObjectPosition,
          } as CSSProperties)
        : { objectPosition: desktopObjectPosition };

    const copy = hasCopy ? (
        <div
            data-slot="mixed-media-slide-copy"
            className={cn(
                'flex w-full flex-col gap-3',
                CONTENT_ALIGNMENT_CLASS[resolvedAlignment],
                useOverlay
                    ? 'absolute inset-x-4 bottom-4 z-10 max-w-[calc(100%-2rem)] bg-background/90 p-5 text-foreground shadow-ui backdrop-blur-sm md:inset-x-auto md:left-8 md:bottom-8 md:max-w-xl md:p-7'
                    : 'bg-card p-5 text-card-foreground md:p-7'
            )}>
            {hasEyebrow && (
                <p
                    data-slot="mixed-media-slide-eyebrow"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {eyebrow.trim()}
                </p>
            )}
            {hasTitle && (
                <HeadingTag
                    id={headingId}
                    data-slot="mixed-media-slide-title"
                    className="text-2xl font-semibold tracking-tight md:text-4xl">
                    {title.trim()}
                </HeadingTag>
            )}
            {hasBody && (
                <p
                    data-slot="mixed-media-slide-body"
                    className="max-w-2xl whitespace-pre-line text-sm leading-6 md:text-base">
                    {body.trim()}
                </p>
            )}
            {hasCta && safeCtaUrl && (
                <div data-slot="mixed-media-slide-actions" className="pt-1">
                    <Button asChild>
                        <Link to={safeCtaUrl}>{ctaLabel?.trim()}</Link>
                    </Button>
                </div>
            )}
        </div>
    ) : null;

    return (
        <article
            {...props}
            data-slot="sfnext-toolkit-mixed-media-slide"
            data-media-type={resolvedMediaType}
            aria-labelledby={hasTitle ? headingId : undefined}
            className={cn('relative h-full w-full overflow-hidden bg-card text-card-foreground', className)}>
            {resolvedMediaType === 'image' ? (
                hasAccessibleImage ? (
                    <div
                        data-slot="mixed-media-slide-image-frame"
                        className={mixedMediaSlideFrameVariants({ aspectRatio: resolvedAspectRatio })}>
                        <DynamicImage
                            src={desktopSrc}
                            alt={resolvedAlt}
                            widths={['100vw']}
                            priority={imagePriority}
                            loading={priorityImage ? 'eager' : 'lazy'}
                            artDirection={
                                hasMobileArtDirection
                                    ? [
                                          {
                                              src: mobile.src,
                                              media: MOBILE_ART_DIRECTION_MEDIA,
                                              widths: ['100vw'],
                                          },
                                      ]
                                    : undefined
                            }
                            preloadMedia={hasMobileArtDirection ? DESKTOP_ART_DIRECTION_MEDIA : undefined}
                            className="absolute inset-0 h-full w-full [&_picture]:block [&_picture]:h-full [&_picture]:w-full"
                            imageProps={{
                                'aria-hidden': decorativeImage || undefined,
                                role: decorativeImage ? 'presentation' : undefined,
                                className: cn(
                                    'h-full w-full object-cover',
                                    hasMobileArtDirection &&
                                        '[object-position:var(--mobile-object-position)] md:[object-position:var(--desktop-object-position)]'
                                ),
                                style: artDirectedObjectPosition,
                            }}
                        />
                        {useOverlay && copy}
                    </div>
                ) : null
            ) : (
                <EmbeddedVideo
                    videoUrl={videoUrl}
                    videoTitle={videoTitle}
                    playButtonLabel={t('media.playVideo')}
                    posterImage={posterImage}
                    captionsUrl={captionsUrl}
                    captionsLanguage={captionsLanguage?.trim() || i18n.resolvedLanguage || i18n.language || 'en'}
                    captionsLabel={t('media.captions')}
                    transcriptUrl={transcriptUrl}
                    transcriptLabel={t('media.viewTranscript')}
                    clickToPlay={clickToPlay}
                    aspectRatio={resolvedAspectRatio}
                    maxWidth="full"
                    className="w-full"
                />
            )}
            {!useOverlay && copy}
        </article>
    );
}

type MixedMediaSlideFallbackProps = Pick<
    MixedMediaSlideProps,
    | 'mediaType'
    | 'desktopImage'
    | 'mobileImage'
    | 'imageAlt'
    | 'decorativeImage'
    | 'videoUrl'
    | 'videoTitle'
    | 'aspectRatio'
    | 'contentPlacement'
    | 'eyebrow'
    | 'title'
    | 'body'
    | 'ctaLabel'
    | 'ctaUrl'
>;

/** Stable, ratio-aware loading state registered by the Page Designer component registry. */
export function MixedMediaSlideFallback(props: MixedMediaSlideFallbackProps = {}) {
    const { isDesignMode } = usePageDesignerMode();
    const resolvedMediaType = normalizeValue(props.mediaType, MEDIA_TYPES, 'image');
    const resolvedAspectRatio = normalizeValue(props.aspectRatio, ASPECT_RATIOS, 'widescreen');
    const resolvedPlacement = normalizeValue(props.contentPlacement, CONTENT_PLACEMENTS, 'overlay');
    const desktop = resolveImage(props.desktopImage);
    const mobile = resolveImage(props.mobileImage);
    const hasImage = Boolean(desktop.src || mobile.src);
    const hasAccessibleImage =
        hasImage && (props.decorativeImage === true || hasText(props.imageAlt) || hasText(props.title));
    const hasEyebrow = hasText(props.eyebrow);
    const hasTitle = hasText(props.title);
    const hasBody = hasText(props.body);
    const hasCta = Boolean(normalizeSafeLinkUrl(props.ctaUrl) && hasText(props.ctaLabel));
    const hasCopy = hasEyebrow || hasTitle || hasBody || hasCta;
    const useOverlay = resolvedMediaType === 'image' && hasAccessibleImage && resolvedPlacement === 'overlay';

    if (!hasRenderableMixedMediaSlideContent(props) && !isDesignMode) return null;

    const copyFallback = hasCopy ? (
        <div
            data-slot="mixed-media-slide-fallback-copy"
            className={cn(
                'flex w-full flex-col gap-3',
                useOverlay
                    ? 'absolute inset-x-4 bottom-4 z-10 max-w-[calc(100%-2rem)] bg-background/90 p-5 shadow-ui md:inset-x-auto md:left-8 md:bottom-8 md:max-w-xl md:p-7'
                    : 'bg-card p-5 md:p-7'
            )}>
            {hasEyebrow && <Skeleton className="h-3 w-24" />}
            {hasTitle && <Skeleton className="h-8 w-2/3 md:h-10" />}
            {hasBody && (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            )}
            {hasCta && <Skeleton className="h-10 w-28" />}
        </div>
    ) : null;

    return (
        <article
            data-slot="sfnext-toolkit-mixed-media-slide-fallback"
            aria-hidden="true"
            className="relative h-full w-full overflow-hidden bg-card text-card-foreground">
            <div
                data-slot="mixed-media-slide-fallback-frame"
                className={mixedMediaSlideFrameVariants({ aspectRatio: resolvedAspectRatio })}>
                <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                {useOverlay && copyFallback}
            </div>
            {!useOverlay && copyFallback}
        </article>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MixedMediaSlideFallback as fallback };
