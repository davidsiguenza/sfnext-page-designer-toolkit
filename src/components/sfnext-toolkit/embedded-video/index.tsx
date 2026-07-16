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
import {
    type ComponentPropsWithoutRef,
    type SyntheticEvent,
    useEffect,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { CircleAlert, Play, Video as VideoIcon } from 'lucide-react';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import {
    buildEmbedUrl,
    normalizeCaptionsUrl,
    normalizeSecureAssetUrl,
    resolveVideoSource,
    type ResolvedVideoSource,
} from './video-url';

const VIDEO_ASPECT_RATIOS = ['widescreen', 'cinematic', 'standard', 'square', 'portrait'] as const;
const VIDEO_MAX_WIDTHS = ['full', 'wide', 'narrow'] as const;
const VIDEO_PRELOAD_VALUES = ['none', 'metadata'] as const;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];
type VideoMaxWidth = (typeof VIDEO_MAX_WIDTHS)[number];
type VideoPreload = (typeof VIDEO_PRELOAD_VALUES)[number];

const embeddedVideoFrameVariants = cva('relative w-full overflow-hidden rounded-ui bg-muted', {
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

const VIDEO_MAX_WIDTH_CLASS: Record<VideoMaxWidth, string> = {
    full: 'w-full',
    wide: 'mx-auto w-full max-w-7xl',
    narrow: 'mx-auto w-full max-w-4xl',
};

const PROVIDER_LABEL: Record<ResolvedVideoSource['kind'], string> = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    direct: 'Direct video',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function resolvePosterUrl(image: Image | string | undefined): string | undefined {
    const authoredUrl = typeof image === 'string' ? image : image?.url || image?.path;
    return normalizeSecureAssetUrl(authoredUrl);
}

function normalizeLanguage(value: string | undefined): string {
    const language = value?.trim();
    return language && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language) ? language : 'en';
}

function normalizeStartAtSeconds(value: number | undefined): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? Math.min(Math.floor(numericValue), 86_400) : 0;
}

function getReducedMotionPreference(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(REDUCED_MOTION_QUERY).matches
        : false;
}

function subscribeToReducedMotion(callback: () => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', callback);
        return () => mediaQuery.removeEventListener('change', callback);
    }

    mediaQuery.addListener(callback);
    return () => mediaQuery.removeListener(callback);
}

function usePrefersReducedMotion(): boolean {
    // SSR fails safe: autoplay is enabled only after hydration confirms that the
    // shopper has not requested reduced motion.
    return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionPreference, () => true);
}

function captionsRequireCors(value: string | undefined): boolean {
    return Boolean(value && /^https:/i.test(value));
}

/* v8 ignore start - decorator behavior is covered by metadata assertions. */
@Component('embeddedVideo', {
    name: 'Embedded Video',
    description:
        'Accessible YouTube, Vimeo or direct video with privacy-conscious embeds, safe media URLs, responsive ratios, captions and transcript support.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitEmbeddedVideoMetadata {
    @AttributeDefinition({
        id: 'videoUrl',
        name: 'Video URL',
        description:
            'HTTPS YouTube or Vimeo URL, or an HTTPS/storefront-relative MP4, WebM or Ogg file. Other hosts and protocols are rejected.',
        type: 'url',
        required: true,
    })
    videoUrl?: string;

    @AttributeDefinition({
        id: 'videoTitle',
        name: 'Accessible video title',
        description: 'Required concise title announced by assistive technology for the player.',
        type: 'string',
        required: true,
    })
    videoTitle?: string;

    @AttributeDefinition({
        id: 'playButtonLabel',
        name: 'Play button label',
        description: 'Localised action label shown by click-to-play, for example “Play video” or “Reproducir vídeo”.',
        type: 'string',
        defaultValue: 'Play video',
    })
    playButtonLabel?: string;

    @AttributeDefinition({
        id: 'posterImage',
        name: 'Poster image',
        description: 'Optional poster shown by click-to-play and before a direct video starts.',
        type: 'image',
    })
    posterImage?: Image;

    @AttributeDefinition({
        id: 'caption',
        name: 'Visible caption',
        description: 'Optional supporting text displayed beneath the player.',
        type: 'text',
    })
    caption?: string;

    @AttributeDefinition({
        id: 'captionsUrl',
        name: 'WebVTT captions URL',
        description: 'Optional HTTPS or storefront-relative .vtt captions file for direct video.',
        type: 'url',
    })
    captionsUrl?: string;

    @AttributeDefinition({
        id: 'captionsLanguage',
        name: 'Captions language',
        description: 'BCP 47 language code such as en, es or es-ES.',
        type: 'string',
        defaultValue: 'en',
    })
    captionsLanguage?: string;

    @AttributeDefinition({
        id: 'captionsLabel',
        name: 'Captions label',
        description: 'Language name shown in the native player captions menu, for example “Español”.',
        type: 'string',
        defaultValue: 'Captions',
    })
    captionsLabel?: string;

    @AttributeDefinition({
        id: 'transcriptUrl',
        name: 'Transcript URL',
        description: 'Optional secure HTTPS or storefront-relative transcript destination.',
        type: 'url',
    })
    transcriptUrl?: string;

    @AttributeDefinition({
        id: 'transcriptLabel',
        name: 'Transcript link label',
        description: 'Localised text for the optional transcript link.',
        type: 'string',
        defaultValue: 'View transcript',
    })
    transcriptLabel?: string;

    @AttributeDefinition({
        id: 'aspectRatio',
        name: 'Aspect ratio',
        description: 'Responsive player frame ratio. Portrait is intended for vertical campaign video.',
        type: 'enum',
        values: ['widescreen', 'cinematic', 'standard', 'square', 'portrait'],
        defaultValue: 'widescreen',
    })
    aspectRatio?: string;

    @AttributeDefinition({
        id: 'maxWidth',
        name: 'Maximum width',
        description: 'Full uses the available region; Wide and Narrow apply readable storefront maximum widths.',
        type: 'enum',
        values: ['full', 'wide', 'narrow'],
        defaultValue: 'wide',
    })
    maxWidth?: string;

    @AttributeDefinition({
        id: 'clickToPlay',
        name: 'Click to play',
        description:
            'Recommended for YouTube and Vimeo. The third-party iframe is not loaded until the shopper activates the player.',
        type: 'boolean',
        defaultValue: true,
    })
    clickToPlay?: boolean;

    @AttributeDefinition({
        id: 'startAtSeconds',
        name: 'Start time in seconds',
        description: 'Optional whole-second offset, limited to 24 hours.',
        type: 'integer',
        defaultValue: 0,
    })
    startAtSeconds?: number;

    @AttributeDefinition({
        id: 'autoplay',
        name: 'Autoplay',
        description:
            'Disabled by default. Available for Vimeo and direct video; YouTube remains manual because its documented embed parameters cannot guarantee muted autoplay.',
        type: 'boolean',
        defaultValue: false,
    })
    autoplay?: boolean;

    @AttributeDefinition({
        id: 'muted',
        name: 'Muted',
        description:
            'Starts Vimeo or direct playback without sound. Supported autoplay forces this option on at runtime.',
        type: 'boolean',
        defaultValue: false,
    })
    muted?: boolean;

    @AttributeDefinition({
        id: 'loop',
        name: 'Loop',
        description: 'Restarts the video when playback reaches the end.',
        type: 'boolean',
        defaultValue: false,
    })
    loop?: boolean;

    @AttributeDefinition({
        id: 'preload',
        name: 'Direct video preload',
        description: 'Metadata loads video dimensions and duration; None defers media loading until playback.',
        type: 'enum',
        values: ['none', 'metadata'],
        defaultValue: 'metadata',
    })
    preload?: string;

    @AttributeDefinition({
        id: 'allowFullscreen',
        name: 'Allow fullscreen',
        description: 'Lets shoppers open provider videos in fullscreen mode.',
        type: 'boolean',
        defaultValue: true,
    })
    allowFullscreen?: boolean;
}
/* v8 ignore stop */

export interface EmbeddedVideoProps extends Omit<ComponentPropsWithoutRef<'figure'>, 'title'> {
    videoUrl?: string;
    videoTitle?: string;
    playButtonLabel?: string;
    posterImage?: Image | string;
    caption?: string;
    captionsUrl?: string;
    captionsLanguage?: string;
    captionsLabel?: string;
    transcriptUrl?: string;
    transcriptLabel?: string;
    aspectRatio?: VideoAspectRatio;
    maxWidth?: VideoMaxWidth;
    clickToPlay?: boolean;
    startAtSeconds?: number;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: VideoPreload;
    allowFullscreen?: boolean;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function EmbeddedVideo({
    videoUrl,
    videoTitle,
    playButtonLabel,
    posterImage,
    caption,
    captionsUrl,
    captionsLanguage,
    captionsLabel,
    transcriptUrl,
    transcriptLabel,
    aspectRatio,
    maxWidth,
    clickToPlay = true,
    startAtSeconds = 0,
    autoplay = false,
    muted = false,
    loop = false,
    preload,
    allowFullscreen = true,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: EmbeddedVideoProps) {
    const { isDesignMode } = usePageDesignerMode();
    const detailsId = useId();
    const prefersReducedMotion = usePrefersReducedMotion();
    const [activatedVideoUrl, setActivatedVideoUrl] = useState<string>();
    const providerPlayerRef = useRef<HTMLIFrameElement>(null);
    const source = resolveVideoSource(videoUrl);
    const hasAuthoredUrl = Boolean(videoUrl?.trim());
    const resolvedAspectRatio = normalizeValue(aspectRatio, VIDEO_ASPECT_RATIOS, 'widescreen');
    const resolvedMaxWidth = normalizeValue(maxWidth, VIDEO_MAX_WIDTHS, 'wide');
    const resolvedPreload = normalizeValue(preload, VIDEO_PRELOAD_VALUES, 'metadata');
    const resolvedStartAtSeconds = normalizeStartAtSeconds(startAtSeconds);
    const authoredTitle = videoTitle?.trim();
    const missingRequiredTitle = !authoredTitle;
    const resolvedTitle = authoredTitle || 'Embedded video';
    const resolvedPlayButtonLabel = playButtonLabel?.trim() || 'Play video';
    const resolvedCaption = caption?.trim();
    const resolvedTranscriptUrl = normalizeSecureAssetUrl(transcriptUrl);
    const resolvedTranscriptLabel = transcriptLabel?.trim() || 'View transcript';
    const hasDetails = Boolean(resolvedCaption || resolvedTranscriptUrl);
    const effectiveAutoplay = Boolean(autoplay) && !isDesignMode && !prefersReducedMotion && source?.kind !== 'youtube';
    const effectiveMuted = Boolean(muted) || effectiveAutoplay;

    useEffect(() => {
        if (activatedVideoUrl && activatedVideoUrl === videoUrl?.trim()) {
            providerPlayerRef.current?.focus();
        }
    }, [activatedVideoUrl, videoUrl]);

    if ((!source || missingRequiredTitle) && !isDesignMode) return null;

    const rootClasses = cn(VIDEO_MAX_WIDTH_CLASS[resolvedMaxWidth], className);
    const frameClasses = embeddedVideoFrameVariants({ aspectRatio: resolvedAspectRatio });

    if (!source || missingRequiredTitle) {
        const isInvalid = hasAuthoredUrl;
        const isMissingTitle = Boolean(source) && missingRequiredTitle;

        return (
            <figure
                {...props}
                data-slot="sfnext-toolkit-embedded-video"
                data-authoring-state={isMissingTitle ? 'missing-title' : isInvalid ? 'invalid' : 'empty'}
                className={rootClasses}>
                <div
                    data-slot="embedded-video-authoring-placeholder"
                    className={cn(
                        frameClasses,
                        'flex flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center text-foreground'
                    )}>
                    {isInvalid || isMissingTitle ? (
                        <CircleAlert aria-hidden="true" className="size-8 text-destructive" />
                    ) : (
                        <VideoIcon aria-hidden="true" className="size-8 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                        <p className="font-semibold">
                            {isMissingTitle
                                ? 'Accessible title required'
                                : isInvalid
                                  ? 'Unsupported video URL'
                                  : 'Embedded video'}
                        </p>
                        <p className="max-w-xl text-sm text-muted-foreground">
                            {isMissingTitle
                                ? 'Add a concise title that describes this video for assistive technology.'
                                : isInvalid
                                  ? 'Use YouTube, Vimeo, or a secure MP4, WebM or Ogg video URL.'
                                  : 'Add a video URL and an accessible title in Page Designer.'}
                        </p>
                    </div>
                </div>
            </figure>
        );
    }

    const authoredVideoUrl = videoUrl?.trim();
    const providerActivated = Boolean(authoredVideoUrl) && activatedVideoUrl === authoredVideoUrl;
    const renderProviderPlaceholder = isDesignMode && source.kind !== 'direct';
    const renderClickToPlay =
        !isDesignMode && source.kind !== 'direct' && clickToPlay && !effectiveAutoplay && !providerActivated;
    const safeCaptionsUrl = source.kind === 'direct' ? normalizeCaptionsUrl(captionsUrl) : undefined;
    const posterUrl = resolvePosterUrl(posterImage);
    const language = normalizeLanguage(captionsLanguage);
    const label = captionsLabel?.trim() || 'Captions';
    const providerAutoplay = effectiveAutoplay || (clickToPlay && providerActivated);
    const embedUrl =
        source.kind === 'direct'
            ? undefined
            : buildEmbedUrl(source, {
                  autoplay: providerAutoplay,
                  controls: true,
                  loop: Boolean(loop),
                  muted: effectiveMuted,
                  startAtSeconds: resolvedStartAtSeconds,
              });
    const iframeAllow = allowFullscreen
        ? 'autoplay; encrypted-media; picture-in-picture; fullscreen'
        : 'autoplay; encrypted-media; picture-in-picture';

    return (
        <figure
            {...props}
            data-slot="sfnext-toolkit-embedded-video"
            data-reduced-motion={prefersReducedMotion || undefined}
            className={rootClasses}>
            <div data-slot="embedded-video-frame" data-provider={source.kind} className={frameClasses}>
                {renderProviderPlaceholder ? (
                    <div
                        data-slot="embedded-video-provider-placeholder"
                        className="flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed border-border p-6 text-center text-foreground">
                        <VideoIcon aria-hidden="true" className="size-8 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="font-semibold">{resolvedTitle}</p>
                            <p className="text-sm text-muted-foreground">
                                {PROVIDER_LABEL[source.kind]} preview is disabled while editing.
                            </p>
                        </div>
                    </div>
                ) : renderClickToPlay ? (
                    <div
                        data-slot="embedded-video-click-to-play"
                        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted p-6 text-center text-foreground">
                        {posterUrl && (
                            <img
                                data-slot="embedded-video-click-to-play-poster"
                                src={posterUrl}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        )}
                        {posterUrl && (
                            <div
                                data-slot="embedded-video-click-to-play-overlay"
                                aria-hidden="true"
                                className="absolute inset-0 bg-header-background/55"
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <p className={cn('font-semibold', posterUrl && 'text-header-foreground')}>
                                {resolvedTitle}
                            </p>
                            <Button
                                data-slot="embedded-video-play-button"
                                type="button"
                                size="lg"
                                variant={posterUrl ? 'secondary' : 'default'}
                                aria-label={`${resolvedPlayButtonLabel}: ${resolvedTitle}`}
                                onClick={() => setActivatedVideoUrl(authoredVideoUrl)}>
                                <Play aria-hidden="true" />
                                {resolvedPlayButtonLabel}
                            </Button>
                        </div>
                    </div>
                ) : source.kind === 'direct' ? (
                    <video
                        data-slot="embedded-video-native-player"
                        src={source.url}
                        aria-label={resolvedTitle}
                        aria-describedby={hasDetails ? detailsId : undefined}
                        poster={posterUrl}
                        controls
                        playsInline
                        autoPlay={effectiveAutoplay}
                        muted={effectiveMuted}
                        loop={Boolean(loop)}
                        preload={resolvedPreload}
                        onLoadedMetadata={(event: SyntheticEvent<HTMLVideoElement>) => {
                            if (resolvedStartAtSeconds > 0) event.currentTarget.currentTime = resolvedStartAtSeconds;
                        }}
                        crossOrigin={captionsRequireCors(safeCaptionsUrl) ? 'anonymous' : undefined}
                        className={cn('h-full w-full object-contain', isDesignMode && 'pointer-events-none')}>
                        {safeCaptionsUrl && (
                            <track kind="captions" src={safeCaptionsUrl} srcLang={language} label={label} default />
                        )}
                    </video>
                ) : (
                    <iframe
                        ref={providerPlayerRef}
                        data-slot="embedded-video-provider-player"
                        src={embedUrl}
                        title={resolvedTitle}
                        aria-describedby={hasDetails ? detailsId : undefined}
                        loading="lazy"
                        allow={iframeAllow}
                        allowFullScreen={allowFullscreen}
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        className="h-full w-full border-0"
                    />
                )}
            </div>

            {hasDetails && (
                <figcaption
                    id={detailsId}
                    data-slot="embedded-video-details"
                    className="flex flex-wrap items-start justify-between gap-3 pt-3 text-sm text-muted-foreground">
                    {resolvedCaption && <span data-slot="embedded-video-caption">{resolvedCaption}</span>}
                    {resolvedTranscriptUrl && (
                        <Link
                            data-slot="embedded-video-transcript"
                            to={resolvedTranscriptUrl}
                            className="rounded-sm font-semibold text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
                            {resolvedTranscriptLabel}
                        </Link>
                    )}
                </figcaption>
            )}
        </figure>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function EmbeddedVideoFallback() {
    return (
        <figure
            data-slot="sfnext-toolkit-embedded-video-fallback"
            aria-hidden="true"
            className="mx-auto w-full max-w-7xl">
            <Skeleton className="aspect-video w-full rounded-ui" />
            <div className="flex justify-between gap-4 pt-3">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-4 w-28" />
            </div>
        </figure>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { EmbeddedVideoFallback as fallback };
