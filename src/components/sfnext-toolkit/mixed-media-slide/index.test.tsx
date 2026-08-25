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
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import MixedMediaSlide, {
    fallback as registryFallback,
    hasRenderableMixedMediaSlideContent,
    MixedMediaSlideFallback,
    MixedMediaSlideMetadata,
} from './index';

const pageDesignerMode = { isDesignMode: false };

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => pageDesignerMode,
}));

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({
        src,
        alt,
        imageProps,
        artDirection,
        preloadMedia,
    }: {
        src: string;
        alt?: string;
        imageProps?: ImgHTMLAttributes<HTMLImageElement>;
        artDirection?: Array<{ src: string; media: string }>;
        preloadMedia?: string;
    }) => (
        <picture data-testid="dynamic-picture" data-preload-media={preloadMedia}>
            {artDirection?.map((source) => (
                <source key={source.media} media={source.media} srcSet={source.src} />
            ))}
            <img data-testid="dynamic-image" src={src} alt={alt} {...imageProps} />
        </picture>
    ),
}));

vi.mock('@/components/link', () => ({
    Link: ({
        to,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/sfnext-toolkit/embedded-video', () => ({
    default: ({
        videoUrl,
        videoTitle,
        captionsUrl,
        captionsLanguage,
        captionsLabel,
        transcriptUrl,
        transcriptLabel,
        playButtonLabel,
        clickToPlay,
        aspectRatio,
    }: {
        videoUrl?: string;
        videoTitle?: string;
        captionsUrl?: string;
        captionsLanguage?: string;
        captionsLabel?: string;
        transcriptUrl?: string;
        transcriptLabel?: string;
        playButtonLabel?: string;
        clickToPlay?: boolean;
        aspectRatio?: string;
    }) => (
        <figure
            data-testid="embedded-video"
            data-video-url={videoUrl}
            data-video-title={videoTitle}
            data-captions-url={captionsUrl}
            data-captions-language={captionsLanguage}
            data-captions-label={captionsLabel}
            data-transcript-url={transcriptUrl}
            data-transcript-label={transcriptLabel}
            data-play-button-label={playButtonLabel}
            data-click-to-play={String(clickToPlay)}
            data-aspect-ratio={aspectRatio}
        />
    ),
}));

describe('SFNext Toolkit mixed media slide', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
    });

    afterEach(async () => {
        await i18next.changeLanguage('en-GB');
    });

    test('publishes image, video, accessibility, layout, and CTA controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, MixedMediaSlideMetadata)).toBe('SFNextToolkit.mixedMediaSlide');

        const { fields } = getAttributeDefinitions(MixedMediaSlideMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'mediaType',
            'desktopImage',
            'mobileImage',
            'imageAlt',
            'decorativeImage',
            'priorityImage',
            'videoUrl',
            'videoTitle',
            'posterImage',
            'captionsUrl',
            'captionsLanguage',
            'transcriptUrl',
            'clickToPlay',
            'aspectRatio',
            'eyebrow',
            'title',
            'body',
            'headingLevel',
            'contentPlacement',
            'contentAlignment',
            'ctaLabel',
            'ctaUrl',
        ]);
        expect(fields.mediaType).toMatchObject({ values: ['image', 'video'], defaultValue: 'image' });
        expect(fields.aspectRatio.values).toContain('portrait');
        expect(fields.clickToPlay.defaultValue).toBe(true);
        expect(fields.captionsLanguage.defaultValue).toBeUndefined();
    });

    test('renders responsive image art direction, semantic copy, and a safe CTA', () => {
        render(
            <MixedMediaSlide
                desktopImage={{ path: '/desktop.jpg', focal_point: { x: 25, y: 75 } }}
                mobileImage={{ path: '/mobile.jpg', focal_point: { x: 50, y: 20 } }}
                imageAlt="Children wearing the ceremony collection"
                eyebrow="New collection"
                title="Ceremony edit"
                body="Looks for memorable days."
                headingLevel="h3"
                ctaLabel="Discover"
                ctaUrl="/category/ceremony"
            />
        );

        expect(screen.getAllByTestId('dynamic-image')).toHaveLength(1);
        expect(screen.getByRole('heading', { level: 3, name: 'Ceremony edit' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/category/ceremony');
        expect(screen.getByTestId('dynamic-picture').querySelector('source')).toHaveAttribute('srcset', '/mobile.jpg');
        expect(screen.getByTestId('dynamic-picture')).toHaveAttribute('data-preload-media', '(min-width: 48rem)');
        expect(screen.getByTestId('dynamic-image')).toHaveStyle({
            '--desktop-object-position': '25% 75%',
            '--mobile-object-position': '50% 20%',
        });
    });

    test('uses the mobile focal point when the mobile image is the only authored image', () => {
        render(
            <MixedMediaSlide
                mobileImage={{ path: '/mobile-only.jpg', focal_point: { x: 35, y: 65 } }}
                imageAlt="Mobile campaign"
            />
        );

        expect(screen.getByTestId('dynamic-image')).toHaveAttribute('src', '/mobile-only.jpg');
        expect(screen.getByTestId('dynamic-image')).toHaveStyle({ objectPosition: '35% 65%' });
        expect(screen.getByTestId('dynamic-picture').querySelector('source')).not.toBeInTheDocument();
    });

    test('reuses the accessible embedded-video implementation for video slides', () => {
        render(
            <MixedMediaSlide
                mediaType="video"
                videoUrl="https://cdn.example.com/campaign.mp4"
                videoTitle="Summer campaign"
                captionsUrl="/captions/campaign.vtt"
                transcriptUrl="/campaign-transcript"
                clickToPlay={false}
                aspectRatio="cinematic"
                title="Summer stories"
            />
        );

        const video = screen.getByTestId('embedded-video');
        expect(video).toHaveAttribute('data-video-url', 'https://cdn.example.com/campaign.mp4');
        expect(video).toHaveAttribute('data-video-title', 'Summer campaign');
        expect(video).toHaveAttribute('data-captions-url', '/captions/campaign.vtt');
        expect(video).toHaveAttribute('data-transcript-url', '/campaign-transcript');
        expect(video).toHaveAttribute('data-click-to-play', 'false');
        expect(video).toHaveAttribute('data-aspect-ratio', 'cinematic');
        expect(screen.getByRole('heading', { name: 'Summer stories' })).toBeInTheDocument();
    });

    test('localises inherited video labels and captions language from the storefront locale', async () => {
        await i18next.changeLanguage('es-ES');

        render(
            <MixedMediaSlide
                mediaType="video"
                videoUrl="https://cdn.example.com/campaign.mp4"
                videoTitle="Campaña de verano"
                captionsUrl="/captions/campaign.vtt"
                transcriptUrl="/campaign-transcript"
            />
        );

        const video = screen.getByTestId('embedded-video');
        expect(video).toHaveAttribute('data-play-button-label', 'Reproducir vídeo');
        expect(video).toHaveAttribute('data-captions-language', 'es-ES');
        expect(video).toHaveAttribute('data-captions-label', 'Subtítulos');
        expect(video).toHaveAttribute('data-transcript-label', 'Ver transcripción');
    });

    test('fails closed for an informative image without alternative text or a title', () => {
        expect(hasRenderableMixedMediaSlideContent({ desktopImage: '/campaign.jpg' })).toBe(false);
        expect(hasRenderableMixedMediaSlideContent({ desktopImage: '/campaign.jpg', imageAlt: 'Campaign image' })).toBe(
            true
        );
        expect(hasRenderableMixedMediaSlideContent({ desktopImage: '/campaign.jpg', decorativeImage: true })).toBe(
            true
        );

        const { container, rerender } = render(<MixedMediaSlide desktopImage="/campaign.jpg" />);
        expect(container.firstChild).toBeNull();

        rerender(<MixedMediaSlide desktopImage="/campaign.jpg" body="Campaign details" />);
        expect(screen.getByText('Campaign details')).toBeInTheDocument();
        expect(screen.queryByTestId('dynamic-image')).not.toBeInTheDocument();
        expect(container.querySelector('[data-slot="mixed-media-slide-image-frame"]')).not.toBeInTheDocument();

        pageDesignerMode.isDesignMode = true;
        rerender(<MixedMediaSlide desktopImage="/campaign.jpg" />);
        expect(container.querySelector('[data-authoring-state="missing-image-alt"]')).toHaveAttribute('role', 'status');
        expect(screen.getByText('Image alternative text required')).toBeInTheDocument();
    });

    test('omits invalid or untitled video-only slides from the storefront', () => {
        expect(
            hasRenderableMixedMediaSlideContent({
                mediaType: 'video',
                videoUrl: 'javascript:alert(1)',
                videoTitle: 'Unsafe video',
            })
        ).toBe(false);
        expect(
            hasRenderableMixedMediaSlideContent({
                mediaType: 'video',
                videoUrl: 'https://cdn.example.com/campaign.mp4',
            })
        ).toBe(false);
        expect(
            hasRenderableMixedMediaSlideContent({
                mediaType: 'video',
                videoUrl: 'https://cdn.example.com/campaign.mp4',
                videoTitle: 'Campaign video',
            })
        ).toBe(true);

        const { container } = render(
            <MixedMediaSlide mediaType="video" videoUrl="javascript:alert(1)" videoTitle="Unsafe video" />
        );
        expect(container.firstChild).toBeNull();
    });

    test('rejects unsafe CTA destinations', () => {
        render(
            <MixedMediaSlide
                desktopImage="/campaign.jpg"
                title="Safe campaign"
                ctaLabel="Unsafe action"
                ctaUrl="javascript:alert(1)"
            />
        );
        expect(screen.queryByRole('link', { name: 'Unsafe action' })).not.toBeInTheDocument();
    });

    test('shows an instruction only when an empty slide is being edited', () => {
        const { container, rerender } = render(<MixedMediaSlide />);
        expect(container.firstChild).toBeNull();

        pageDesignerMode.isDesignMode = true;
        rerender(<MixedMediaSlide />);
        expect(screen.getByText('Mixed media slide')).toBeInTheDocument();
        expect(container.querySelector('[data-authoring-empty="true"]')).toBeInTheDocument();
    });

    test('exports a registry fallback that preserves the authored media aspect ratio and copy placement', () => {
        expect(registryFallback).toBe(MixedMediaSlideFallback);

        const { container } = render(
            <MixedMediaSlideFallback
                desktopImage="/campaign.jpg"
                aspectRatio="portrait"
                contentPlacement="below"
                eyebrow="Collection"
                title="Ceremony edit"
                body="Looks for memorable days."
                ctaLabel="Discover"
                ctaUrl="/category/ceremony"
            />
        );

        const fallback = container.querySelector('[data-slot="sfnext-toolkit-mixed-media-slide-fallback"]');
        const frame = container.querySelector('[data-slot="mixed-media-slide-fallback-frame"]');
        const copy = container.querySelector('[data-slot="mixed-media-slide-fallback-copy"]');

        expect(fallback).toHaveAttribute('aria-hidden', 'true');
        expect(frame).toHaveClass('aspect-[9/16]');
        expect(copy).toHaveClass('bg-card');
        expect(copy).not.toHaveClass('absolute');
    });

    test('uses an overlay fallback for authored image overlays and omits empty storefront placeholders', () => {
        const { container, rerender } = render(
            <MixedMediaSlideFallback
                desktopImage="/campaign.jpg"
                aspectRatio="cinematic"
                contentPlacement="overlay"
                title="Summer stories"
            />
        );

        expect(container.querySelector('[data-slot="mixed-media-slide-fallback-frame"]')).toHaveClass('aspect-[21/9]');
        expect(container.querySelector('[data-slot="mixed-media-slide-fallback-copy"]')).toHaveClass('absolute');

        rerender(<MixedMediaSlideFallback />);
        expect(container.firstChild).toBeNull();
    });

    test('keeps fallback copy below media when an informative image has no accessible text', () => {
        const { container } = render(
            <MixedMediaSlideFallback
                desktopImage="/campaign.jpg"
                contentPlacement="overlay"
                body="The image is suppressed until its alternative text is configured."
            />
        );

        expect(container.querySelector('[data-slot="mixed-media-slide-fallback-copy"]')).toHaveClass('bg-card');
        expect(container.querySelector('[data-slot="mixed-media-slide-fallback-copy"]')).not.toHaveClass('absolute');
    });
});
