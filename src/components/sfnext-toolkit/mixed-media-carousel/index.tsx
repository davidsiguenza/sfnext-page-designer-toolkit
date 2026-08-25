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
import { Children, type ComponentPropsWithoutRef, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { Region, type ComponentType } from '@/components/region';
import { Component as RegionComponent } from '@/components/region/component';
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import {
    hasRenderableMixedMediaSlideContent,
    MixedMediaSlideFallback,
    type MixedMediaSlideProps,
} from '@/components/sfnext-toolkit/mixed-media-slide';
import { Skeleton } from '@/components/ui/skeleton';

const SURFACES = ['default', 'muted'] as const;
const CONTENT_WIDTHS = ['full', 'contained'] as const;

type Surface = (typeof SURFACES)[number];
type ContentWidth = (typeof CONTENT_WIDTHS)[number];

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const mixedMediaCarouselVariants = cva('w-full text-foreground', {
    variants: {
        surface: {
            default: 'bg-background',
            muted: 'bg-muted',
        },
    },
    defaultVariants: {
        surface: 'default',
    },
});

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Stops media that became hidden when the active carousel slide changes. */
// eslint-disable-next-line react-refresh/only-export-components -- exported for focused DOM behavior tests.
export function pauseMediaInInactiveCarouselSlides(root: HTMLElement, activeIndex: number) {
    const slides = root.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]');

    slides.forEach((slide, index) => {
        if (index === activeIndex) return;

        slide.querySelectorAll('video, audio').forEach((media) => {
            (media as HTMLMediaElement).pause();
        });

        slide.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
            const provider = frame.closest<HTMLElement>('[data-provider]')?.dataset.provider;
            if (provider === 'youtube') {
                frame.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                    '*'
                );
            } else if (provider === 'vimeo') {
                frame.contentWindow?.postMessage({ method: 'pause' }, '*');
            }
        });
    });
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('mixedMediaCarousel', {
    name: 'Mixed Media Carousel',
    description:
        'One-slide-at-a-time carousel for merchant-authored image and video slides, with optional navigation and safe looping.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'slides',
        name: 'Mixed media slides',
        description: 'Add up to ten SFNext Toolkit Mixed Media Slides.',
        maxComponents: 10,
        componentTypeInclusions: ['SFNextToolkit.mixedMediaSlide'],
    },
])
export class MixedMediaCarouselMetadata {
    @AttributeDefinition({ id: 'title', name: 'Title', type: 'string' })
    title?: string;

    @AttributeDefinition({ id: 'subtitle', name: 'Subtitle', type: 'text' })
    subtitle?: string;

    @AttributeDefinition({
        id: 'ariaLabel',
        name: 'Accessible carousel label',
        description: 'Used when no visible title is provided.',
        type: 'string',
        defaultValue: 'Mixed media carousel',
    })
    ariaLabel?: string;

    @AttributeDefinition({
        id: 'surface',
        name: 'Surface tone',
        type: 'enum',
        values: ['default', 'muted'],
        defaultValue: 'default',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'contentWidth',
        name: 'Carousel width',
        type: 'enum',
        values: ['full', 'contained'],
        defaultValue: 'full',
    })
    contentWidth?: string;

    @AttributeDefinition({
        id: 'showNavigation',
        name: 'Show previous and next controls',
        type: 'boolean',
        defaultValue: true,
    })
    showNavigation?: boolean;

    @AttributeDefinition({
        id: 'loop',
        name: 'Loop navigation',
        description:
            'Lets shoppers continue from the last slide to the first. Automatic playback is intentionally disabled.',
        type: 'boolean',
        defaultValue: false,
    })
    loop?: boolean;
}
/* v8 ignore stop */

export interface MixedMediaCarouselProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title' | 'children'> {
    title?: string;
    subtitle?: string;
    ariaLabel?: string;
    surface?: Surface;
    contentWidth?: ContentWidth;
    showNavigation?: boolean;
    loop?: boolean;
    children?: ReactNode;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function MixedMediaCarousel({
    title,
    subtitle,
    ariaLabel,
    surface,
    contentWidth,
    showNavigation = true,
    loop = false,
    children,
    className,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: MixedMediaCarouselProps) {
    const { isDesignMode } = usePageDesignerMode();
    const headingId = useId();
    const carouselSectionRef = useRef<HTMLElement>(null);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);
    const slidesRegion = component?.regions?.find((region) => region.id === 'slides');
    const regionSlides = slidesRegion?.components ?? [];
    const visibleRegionSlides = isDesignMode
        ? regionSlides
        : regionSlides.filter((slide) =>
              hasRenderableMixedMediaSlideContent((slide.data ?? {}) as unknown as Partial<MixedMediaSlideProps>)
          );
    const standaloneSlideCount = Children.count(children);
    const slideCount = visibleRegionSlides.length || standaloneSlideCount;
    const resolvedTitle = title?.trim();
    const resolvedSubtitle = subtitle?.trim();
    const resolvedAriaLabel = ariaLabel?.trim() || 'Mixed media carousel';
    const resolvedSurface = normalizeValue(surface, SURFACES, 'default');
    const resolvedContentWidth = normalizeValue(contentWidth, CONTENT_WIDTHS, 'full');
    const containerClassName = resolvedContentWidth === 'contained' ? 'section-container' : 'w-full';
    const carouselHeader = (resolvedTitle || resolvedSubtitle) && (
        <div data-slot="mixed-media-carousel-header" className="section-container space-y-2 pt-8">
            {resolvedTitle && (
                <h2 id={headingId} className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {resolvedTitle}
                </h2>
            )}
            {resolvedSubtitle && <p className="max-w-3xl text-muted-foreground">{resolvedSubtitle}</p>}
        </div>
    );

    useEffect(() => {
        if (!carouselApi) return;

        const updateActiveIndex = () => setActiveIndex(carouselApi.selectedScrollSnap());
        updateActiveIndex();
        carouselApi.on('select', updateActiveIndex);
        carouselApi.on('reInit', updateActiveIndex);

        return () => {
            carouselApi.off('select', updateActiveIndex);
            carouselApi.off('reInit', updateActiveIndex);
        };
    }, [carouselApi]);

    useEffect(() => {
        if (carouselSectionRef.current) {
            pauseMediaInInactiveCarouselSlides(carouselSectionRef.current, activeIndex);
        }
    }, [activeIndex]);

    // A transform-driven carousel is hostile to Page Designer drag/drop. In EDIT mode,
    // expose the real nested Region as a stable authoring canvas so slides can be added,
    // selected and reordered. Preview/storefront mode keeps the one-at-a-time carousel.
    if (isDesignMode && component) {
        return (
            <section
                {...props}
                data-slot="sfnext-toolkit-mixed-media-carousel"
                data-authoring-layout="stacked"
                className={cn(mixedMediaCarouselVariants({ surface: resolvedSurface }), className)}>
                {carouselHeader}
                <div className={cn(containerClassName, 'py-6')}>
                    <div className="relative">
                        <Region
                            component={component}
                            regionId="slides"
                            className="grid min-h-40 gap-4 border border-dashed border-border p-4"
                            data-slot="mixed-media-carousel-authoring-region"
                        />
                        {slideCount === 0 && (
                            <p
                                data-slot="mixed-media-carousel-empty"
                                role="status"
                                className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
                                Add one or more Mixed Media Slides to the carousel region.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    if (slideCount === 0) {
        if (!isDesignMode) return null;

        return (
            <section
                {...props}
                data-slot="sfnext-toolkit-mixed-media-carousel"
                className={cn(mixedMediaCarouselVariants({ surface: resolvedSurface }), className)}>
                <div className="section-container py-8">
                    <p
                        data-slot="mixed-media-carousel-empty"
                        role="status"
                        className="border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        Add one or more Mixed Media Slides to the carousel region.
                    </p>
                </div>
            </section>
        );
    }

    const slideItems =
        visibleRegionSlides.length > 0 && slidesRegion
            ? visibleRegionSlides.map((slide, index) => {
                  const typedSlide = slide as ComponentType;
                  return (
                      <CarouselItem
                          key={typedSlide.contentLinkUuid ?? typedSlide.id}
                          className="basis-full pl-0"
                          aria-hidden={index === activeIndex ? undefined : true}
                          inert={index === activeIndex ? undefined : true}>
                          <RegionComponent
                              component={typedSlide}
                              regionId={slidesRegion.id}
                              className="h-full w-full"
                          />
                      </CarouselItem>
                  );
              })
            : Children.map(children, (slide, index) => (
                  <CarouselItem
                      className="basis-full pl-0"
                      aria-hidden={index === activeIndex ? undefined : true}
                      inert={index === activeIndex ? undefined : true}>
                      {slide}
                  </CarouselItem>
              ));

    return (
        <section
            ref={carouselSectionRef}
            {...props}
            data-slot="sfnext-toolkit-mixed-media-carousel"
            className={cn(mixedMediaCarouselVariants({ surface: resolvedSurface }), className)}>
            {carouselHeader}
            <div data-slot="mixed-media-carousel-container" className={cn(containerClassName, 'py-6')}>
                <Carousel
                    opts={{ align: 'start', loop: Boolean(loop) }}
                    setApi={setCarouselApi}
                    aria-labelledby={resolvedTitle ? headingId : undefined}
                    aria-label={resolvedTitle ? undefined : resolvedAriaLabel}
                    className="w-full">
                    <CarouselContent className="ml-0 items-stretch">{slideItems}</CarouselContent>
                    {showNavigation && slideCount > 1 && (
                        <>
                            <CarouselPrevious className="left-3 z-20 size-10 translate-x-0 shadow-ui md:left-5" />
                            <CarouselNext className="right-3 z-20 size-10 translate-x-0 shadow-ui md:right-5" />
                        </>
                    )}
                </Carousel>
            </div>
        </section>
    );
}

type MixedMediaCarouselFallbackProps = Pick<
    MixedMediaCarouselProps,
    'title' | 'subtitle' | 'surface' | 'contentWidth'
> & {
    component?: ComponentType;
};

/** Stable loading state registered by the Page Designer component registry. */
export function MixedMediaCarouselFallback({
    title,
    subtitle,
    surface,
    contentWidth,
    component,
}: MixedMediaCarouselFallbackProps = {}) {
    const { isDesignMode } = usePageDesignerMode();
    const resolvedSurface = normalizeValue(surface, SURFACES, 'default');
    const resolvedContentWidth = normalizeValue(contentWidth, CONTENT_WIDTHS, 'full');
    const containerClassName = resolvedContentWidth === 'contained' ? 'section-container' : 'w-full';
    const regionSlides = component?.regions?.find((region) => region.id === 'slides')?.components ?? [];
    const firstVisibleSlide = isDesignMode
        ? regionSlides[0]
        : regionSlides.find((slide) =>
              hasRenderableMixedMediaSlideContent((slide.data ?? {}) as unknown as Partial<MixedMediaSlideProps>)
          );

    if (component && !firstVisibleSlide && !isDesignMode) return null;

    const firstSlideProps = (firstVisibleSlide?.data ?? {}) as unknown as Partial<MixedMediaSlideProps>;
    const hasTitle = Boolean(title?.trim());
    const hasSubtitle = Boolean(subtitle?.trim());

    return (
        <section
            data-slot="sfnext-toolkit-mixed-media-carousel-fallback"
            aria-hidden="true"
            className={mixedMediaCarouselVariants({ surface: resolvedSurface })}>
            {(hasTitle || hasSubtitle) && (
                <div data-slot="mixed-media-carousel-fallback-header" className="section-container space-y-2 pt-8">
                    {hasTitle && <Skeleton className="h-9 w-64 max-w-full md:h-10" />}
                    {hasSubtitle && <Skeleton className="h-6 w-full max-w-3xl" />}
                </div>
            )}
            <div data-slot="mixed-media-carousel-fallback-container" className={cn(containerClassName, 'py-6')}>
                <MixedMediaSlideFallback {...firstSlideProps} />
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MixedMediaCarouselFallback as fallback };
