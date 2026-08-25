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
import type { HTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ComponentType } from '@/components/region';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { getRegionDefinition } from '@/lib/decorators/region-definition';
import MixedMediaCarousel, {
    fallback as registryFallback,
    MixedMediaCarouselFallback,
    MixedMediaCarouselMetadata,
    pauseMediaInInactiveCarouselSlides,
} from './index';

const pageDesignerMode = vi.hoisted(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: pageDesignerMode.isDesignMode, isPreviewMode: false }),
    };
});

vi.mock('@/components/ui/carousel', () => ({
    Carousel: ({
        children,
        setApi: _setApi,
        ...props
    }: HTMLAttributes<HTMLDivElement> & { setApi?: (api: unknown) => void }) => (
        <div data-testid="carousel" {...props}>
            {children}
        </div>
    ),
    CarouselContent: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
        <div data-testid="carousel-content" {...props}>
            {children}
        </div>
    ),
    CarouselItem: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
        <div data-testid="carousel-item" {...props}>
            {children}
        </div>
    ),
    CarouselPrevious: (props: HTMLAttributes<HTMLButtonElement>) => <button aria-label="Previous slide" {...props} />,
    CarouselNext: (props: HTMLAttributes<HTMLButtonElement>) => <button aria-label="Next slide" {...props} />,
}));

vi.mock('@/components/region', () => ({
    Region: ({ regionId, className }: { regionId: string; className?: string }) => (
        <div data-testid="authoring-region" data-region-id={regionId} className={className} />
    ),
}));

vi.mock('@/components/region/component', () => ({
    Component: ({ component }: { component: ComponentType }) => (
        <article data-testid="region-slide">{component.id}</article>
    ),
}));

describe('SFNext Toolkit mixed media carousel', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
    });

    test('publishes a mixed-media-slide-only nested region and safe carousel controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, MixedMediaCarouselMetadata)).toBe('SFNextToolkit.mixedMediaCarousel');
        expect(getRegionDefinition(MixedMediaCarouselMetadata, 'slides')).toMatchObject({
            maxComponents: 10,
            componentTypeInclusions: ['SFNextToolkit.mixedMediaSlide'],
        });

        const { fields } = getAttributeDefinitions(MixedMediaCarouselMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'title',
            'subtitle',
            'ariaLabel',
            'surface',
            'contentWidth',
            'showNavigation',
            'loop',
        ]);
        expect(fields.showNavigation.defaultValue).toBe(true);
        expect(fields.loop.defaultValue).toBe(false);
    });

    test('renders standalone slides with visible controls only when useful', () => {
        const { rerender } = render(
            <MixedMediaCarousel title="Campaign stories">
                <article>Image story</article>
                <article>Video story</article>
            </MixedMediaCarousel>
        );

        expect(screen.getByRole('heading', { name: 'Campaign stories' })).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-item')).toHaveLength(2);
        expect(screen.getAllByTestId('carousel-item')[0]).not.toHaveAttribute('aria-hidden');
        expect(screen.getAllByTestId('carousel-item')[1]).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getAllByTestId('carousel-item')[1]).toHaveAttribute('inert');
        expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();

        rerender(
            <MixedMediaCarousel ariaLabel="Single story">
                <article>Only story</article>
            </MixedMediaCarousel>
        );
        expect(screen.getByTestId('carousel')).toHaveAttribute('aria-label', 'Single story');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('pauses native media in slides that become inactive', () => {
        const root = document.createElement('section');
        root.innerHTML = `
            <div data-slot="carousel-item"><video></video></div>
            <div data-slot="carousel-item"><video></video></div>
        `;
        const [firstVideo, activeVideo] = Array.from(root.querySelectorAll('video'));
        const firstPause = vi.fn();
        const activePause = vi.fn();
        Object.defineProperty(firstVideo, 'pause', { configurable: true, value: firstPause });
        Object.defineProperty(activeVideo, 'pause', { configurable: true, value: activePause });

        pauseMediaInInactiveCarouselSlides(root, 1);

        expect(firstPause).toHaveBeenCalledOnce();
        expect(activePause).not.toHaveBeenCalled();
    });

    test('renders Page Designer region slides in authored order', () => {
        const component = {
            id: 'carousel-1',
            typeId: 'SFNextToolkit.mixedMediaCarousel',
            regions: [
                {
                    id: 'slides',
                    components: [
                        {
                            id: 'image-slide',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: {
                                mediaType: 'image',
                                desktopImage: '/campaign.jpg',
                                imageAlt: 'Campaign image',
                            },
                        },
                        {
                            id: 'video-slide',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: {
                                mediaType: 'video',
                                videoUrl: 'https://cdn.example.com/campaign.mp4',
                                videoTitle: 'Campaign video',
                            },
                        },
                    ],
                },
            ],
        } as unknown as ComponentType;

        render(<MixedMediaCarousel component={component} />);
        expect(screen.getAllByTestId('region-slide').map((element) => element.textContent)).toEqual([
            'image-slide',
            'video-slide',
        ]);
    });

    test('removes invalid video and inaccessible image slides before building storefront controls', () => {
        const component = {
            id: 'carousel-1',
            typeId: 'SFNextToolkit.mixedMediaCarousel',
            regions: [
                {
                    id: 'slides',
                    components: [
                        {
                            id: 'invalid-video',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: { mediaType: 'video', videoUrl: 'javascript:alert(1)', videoTitle: 'Unsafe' },
                        },
                        {
                            id: 'inaccessible-image',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: { mediaType: 'image', desktopImage: '/missing-alt.jpg' },
                        },
                        {
                            id: 'valid-image',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: {
                                mediaType: 'image',
                                desktopImage: '/campaign.jpg',
                                imageAlt: 'Campaign image',
                            },
                        },
                    ],
                },
            ],
        } as unknown as ComponentType;

        render(<MixedMediaCarousel component={component} />);

        expect(screen.getAllByTestId('region-slide')).toHaveLength(1);
        expect(screen.getByTestId('region-slide')).toHaveTextContent('valid-image');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('exposes the real nested region as a stable authoring canvas in design mode', () => {
        pageDesignerMode.isDesignMode = true;
        const component = {
            id: 'carousel-1',
            typeId: 'SFNextToolkit.mixedMediaCarousel',
            regions: [{ id: 'slides', components: [] }],
        } as unknown as ComponentType;

        render(<MixedMediaCarousel component={component} />);

        expect(screen.getByTestId('authoring-region')).toHaveAttribute('data-region-id', 'slides');
        expect(screen.getByRole('status')).toHaveTextContent('Add one or more Mixed Media Slides');
        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
    });

    test('applies contained width and muted surface variants', () => {
        const { container } = render(
            <MixedMediaCarousel surface="muted" contentWidth="contained">
                <article>Story</article>
            </MixedMediaCarousel>
        );

        expect(container.querySelector('[data-slot="sfnext-toolkit-mixed-media-carousel"]')).toHaveClass('bg-muted');
        expect(container.querySelector('[data-slot="mixed-media-carousel-container"]')).toHaveClass(
            'section-container'
        );
    });

    test('shows its empty instruction only in Page Designer design mode', () => {
        const { container, rerender } = render(<MixedMediaCarousel />);
        expect(container.firstChild).toBeNull();

        pageDesignerMode.isDesignMode = true;
        rerender(<MixedMediaCarousel />);
        expect(screen.getByRole('status')).toHaveTextContent('Add one or more Mixed Media Slides');
    });

    test('exports a registry fallback that preserves the carousel surface, width, and first visible slide ratio', () => {
        expect(registryFallback).toBe(MixedMediaCarouselFallback);

        const component = {
            id: 'carousel-fallback',
            typeId: 'SFNextToolkit.mixedMediaCarousel',
            regions: [
                {
                    id: 'slides',
                    components: [
                        {
                            id: 'invalid-video',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: { mediaType: 'video', videoUrl: 'javascript:alert(1)', videoTitle: 'Unsafe' },
                        },
                        {
                            id: 'portrait-image',
                            typeId: 'SFNextToolkit.mixedMediaSlide',
                            data: {
                                mediaType: 'image',
                                desktopImage: '/campaign.jpg',
                                aspectRatio: 'portrait',
                                title: 'Ceremony edit',
                            },
                        },
                    ],
                },
            ],
        } as unknown as ComponentType;

        const { container } = render(
            <MixedMediaCarouselFallback
                title="Campaign stories"
                subtitle="Editorial highlights"
                surface="muted"
                contentWidth="contained"
                component={component}
            />
        );

        const fallback = container.querySelector('[data-slot="sfnext-toolkit-mixed-media-carousel-fallback"]');
        expect(fallback).toHaveAttribute('aria-hidden', 'true');
        expect(fallback).toHaveClass('bg-muted');
        expect(container.querySelector('[data-slot="mixed-media-carousel-fallback-container"]')).toHaveClass(
            'section-container'
        );
        expect(container.querySelector('[data-slot="mixed-media-slide-fallback-frame"]')).toHaveClass('aspect-[9/16]');
    });

    test('does not reserve a storefront carousel when no authored slide can render', () => {
        const component = {
            id: 'empty-carousel',
            typeId: 'SFNextToolkit.mixedMediaCarousel',
            regions: [{ id: 'slides', components: [] }],
        } as unknown as ComponentType;

        const { container } = render(<MixedMediaCarouselFallback component={component} />);

        expect(container.firstChild).toBeNull();
    });
});
