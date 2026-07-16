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
import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import EmbeddedVideo, {
    EmbeddedVideoFallback,
    SFNextToolkitEmbeddedVideoMetadata,
    type EmbeddedVideoProps,
} from './index';

const mockPageDesignerMode = vi.fn(() => ({ isDesignMode: false, isPreviewMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockPageDesignerMode(),
}));

function renderEmbeddedVideo(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit embedded video', () => {
    beforeEach(() => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('defers YouTube until one click, then renders and focuses a canonical privacy-enhanced player', async () => {
        const user = userEvent.setup();
        renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="https://www.youtube.com/watch?v=M7lc1UVf-VE&autoplay=1"
                videoTitle="Spring campaign film"
                playButtonLabel="Watch film"
                aspectRatio="cinematic"
                maxWidth="narrow"
                startAtSeconds={32}
                data-testid="video"
            />
        );

        const root = screen.getByTestId('video');
        expect(screen.queryByTitle('Spring campaign film')).not.toBeInTheDocument();
        expect(root.querySelector('[data-slot="embedded-video-click-to-play"]')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Watch film: Spring campaign film' }));

        const iframe = screen.getByTitle('Spring campaign film');
        const sourceUrl = new URL(iframe.getAttribute('src') ?? '');

        expect(root).toHaveClass('max-w-4xl');
        expect(root.querySelector('[data-slot="embedded-video-frame"]')).toHaveClass('aspect-[21/9]');
        expect(sourceUrl.origin).toBe('https://www.youtube-nocookie.com');
        expect(sourceUrl.pathname).toBe('/embed/M7lc1UVf-VE');
        expect(sourceUrl.searchParams.get('autoplay')).toBe('1');
        expect(sourceUrl.searchParams.has('mute')).toBe(false);
        expect(sourceUrl.searchParams.get('controls')).toBe('1');
        expect(sourceUrl.searchParams.get('start')).toBe('32');
        expect(iframe).toHaveAttribute('loading', 'lazy');
        expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
        expect(iframe).toHaveAttribute('allowfullscreen');
        expect(iframe).toHaveFocus();
    });

    test('keeps YouTube autoplay manual because muted autoplay is not part of its documented embed contract', () => {
        renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="https://www.youtube.com/watch?v=M7lc1UVf-VE"
                videoTitle="Manual YouTube campaign"
                autoplay
            />
        );

        expect(screen.queryByTitle('Manual YouTube campaign')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Play video: Manual YouTube campaign' })).toBeInTheDocument();
    });

    test('renders Vimeo with Do Not Track and autoplay-safe muting', () => {
        renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="https://vimeo.com/76979871"
                videoTitle="Behind the collection"
                autoplay
                muted={false}
                loop
            />
        );

        const sourceUrl = new URL(screen.getByTitle('Behind the collection').getAttribute('src') ?? '');
        expect(sourceUrl.origin).toBe('https://player.vimeo.com');
        expect(sourceUrl.searchParams.get('dnt')).toBe('1');
        expect(sourceUrl.searchParams.get('autoplay')).toBe('1');
        expect(sourceUrl.searchParams.get('muted')).toBe('1');
        expect(sourceUrl.searchParams.get('loop')).toBe('1');
    });

    test('renders direct video with permanent controls, poster, inline playback, captions, and transcript', () => {
        const { container } = renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="https://cdn.example.com/media/campaign.mp4"
                videoTitle="Campaign with audio description"
                posterImage={{ path: '/images/campaign-poster.webp' }}
                captionsUrl="/captions/campaign-es.vtt"
                captionsLanguage="es-ES"
                captionsLabel="Español"
                caption="A look behind the campaign."
                transcriptUrl="/transcripts/campaign"
                transcriptLabel="Read the transcript"
                autoplay
                muted={false}
                loop
                preload="none"
                startAtSeconds={18}
            />
        );

        const player = container.querySelector('video');
        const track = container.querySelector('track');
        const details = container.querySelector('[data-slot="embedded-video-details"]');

        expect(player).toHaveAttribute('src', 'https://cdn.example.com/media/campaign.mp4');
        expect(player).toHaveAttribute('aria-label', 'Campaign with audio description');
        expect(player).toHaveAttribute('controls');
        expect(player).toHaveAttribute('playsinline');
        expect(player).toHaveAttribute('poster', '/images/campaign-poster.webp');
        expect(player).toHaveAttribute('preload', 'none');
        expect(player).not.toHaveAttribute('crossorigin');
        expect((player as HTMLVideoElement).autoplay).toBe(true);
        expect((player as HTMLVideoElement).muted).toBe(true);
        expect((player as HTMLVideoElement).loop).toBe(true);
        fireEvent.loadedMetadata(player as HTMLVideoElement);
        expect((player as HTMLVideoElement).currentTime).toBe(18);
        expect(track).toHaveAttribute('kind', 'captions');
        expect(track).toHaveAttribute('src', '/captions/campaign-es.vtt');
        expect(track).toHaveAttribute('srclang', 'es-ES');
        expect(track).toHaveAttribute('label', 'Español');
        expect(track).toHaveAttribute('default');
        expect(screen.getByText('A look behind the campaign.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Read the transcript' }).getAttribute('href')).toContain(
            '/transcripts/campaign'
        );
        expect(player).toHaveAttribute('aria-describedby', details?.id);
    });

    test('enables anonymous CORS only for an absolute cross-origin captions URL', () => {
        const { container } = renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="/media/campaign.mp4"
                videoTitle="Campaign with remote captions"
                captionsUrl="https://captions.example.com/campaign-en.vtt"
            />
        );

        expect(container.querySelector('video')).toHaveAttribute('crossorigin', 'anonymous');
    });

    test('uses accessible fallbacks and safely normalizes malformed presentation options', () => {
        const props = {
            videoUrl: '/media/editorial.webm',
            videoTitle: 'Editorial video',
            aspectRatio: 'unknown',
            maxWidth: 'unknown',
            preload: 'auto',
            captionsUrl: '/captions/unsafe.srt',
            captionsLanguage: 'not valid!',
            transcriptUrl: 'javascript:alert(1)',
            allowFullscreen: false,
        } as unknown as EmbeddedVideoProps;
        const { container } = renderEmbeddedVideo(<EmbeddedVideo {...props} />);

        const player = container.querySelector('video');
        expect(player).toHaveAttribute('aria-label', 'Editorial video');
        expect(player).toHaveAttribute('preload', 'metadata');
        expect(container.querySelector('[data-slot="embedded-video-frame"]')).toHaveClass('aspect-video');
        expect(container.querySelector('[data-slot="sfnext-toolkit-embedded-video"]')).toHaveClass('max-w-7xl');
        expect(container.querySelector('track')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('rejects backslashes in direct video, poster, captions, and transcript paths', () => {
        const { container, rerender } = renderEmbeddedVideo(
            <EmbeddedVideo videoUrl="/\\evil.example/campaign.mp4" videoTitle="Unsafe direct video" />
        );
        expect(container).toBeEmptyDOMElement();

        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <EmbeddedVideo
                        videoUrl="/media/campaign.mp4"
                        videoTitle="Safe direct video"
                        posterImage="/\\evil.example/poster.webp"
                        captionsUrl="/\\evil.example/captions.vtt"
                        transcriptUrl="/\\evil.example/transcript"
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );

        const player = container.querySelector('video');
        expect(player).not.toHaveAttribute('poster');
        expect(container.querySelector('track')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('fails closed for unsafe or unsupported video URLs outside design mode', () => {
        const { container, rerender } = renderEmbeddedVideo(
            <EmbeddedVideo videoUrl="javascript:alert(1)" videoTitle="Unsafe" />
        );
        expect(container).toBeEmptyDOMElement();

        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <EmbeddedVideo videoUrl="https://attacker.example/embed/M7lc1UVf-VE" videoTitle="Unsafe" />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });

    test('never mounts a third-party player in Page Designer edit mode', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        const { container } = renderEmbeddedVideo(
            <EmbeddedVideo videoUrl="https://youtu.be/M7lc1UVf-VE" videoTitle="Campaign preview" autoplay />
        );

        expect(container.querySelector('iframe')).not.toBeInTheDocument();
        expect(container.querySelector('[data-slot="embedded-video-provider-placeholder"]')).toBeInTheDocument();
        expect(screen.getByText('YouTube preview is disabled while editing.')).toBeInTheDocument();
    });

    test('disables configured autoplay when the shopper prefers reduced motion', () => {
        const mediaQuery = {
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        };
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => mediaQuery)
        );

        renderEmbeddedVideo(
            <EmbeddedVideo
                videoUrl="https://vimeo.com/76979871"
                videoTitle="Motion-conscious campaign"
                autoplay
                clickToPlay={false}
            />
        );

        const root = screen.getByTitle('Motion-conscious campaign').closest('figure');
        const sourceUrl = new URL(screen.getByTitle('Motion-conscious campaign').getAttribute('src') ?? '');
        expect(root).toHaveAttribute('data-reduced-motion', 'true');
        expect(sourceUrl.searchParams.get('autoplay')).toBe('0');
        expect(sourceUrl.searchParams.get('muted')).toBe('0');
    });

    test('fails safe during SSR so autoplay cannot start before reduced-motion hydration', () => {
        const html = renderToString(
            <EmbeddedVideo
                videoUrl="https://vimeo.com/76979871"
                videoTitle="Server-rendered campaign"
                autoplay
                clickToPlay={false}
            />
        );

        expect(html).toContain('data-reduced-motion="true"');
        expect(html).toContain('autoplay=0');
    });

    test('suppresses autoplay for direct media in Page Designer edit mode', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        const { container } = renderEmbeddedVideo(
            <EmbeddedVideo videoUrl="/media/campaign.mp4" videoTitle="Direct preview" autoplay />
        );

        const player = container.querySelector('video') as HTMLVideoElement;
        expect(player.autoplay).toBe(false);
        expect(player).toHaveClass('pointer-events-none');
        expect(player).toHaveAttribute('controls');
    });

    test.each([
        [undefined, 'empty', 'Add a video URL and an accessible title in Page Designer.'],
        ['https://evil.example/embed/video', 'invalid', 'Use YouTube, Vimeo, or a secure MP4, WebM or Ogg video URL.'],
    ])('renders a useful %s authoring state', (videoUrl, state, message) => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        const { container } = renderEmbeddedVideo(<EmbeddedVideo videoUrl={videoUrl} />);

        expect(container.querySelector('[data-slot="sfnext-toolkit-embedded-video"]')).toHaveAttribute(
            'data-authoring-state',
            state
        );
        expect(screen.getByText(message)).toBeInTheDocument();
    });

    test('requires an accessible title in live and authoring modes', () => {
        const { container, rerender } = renderEmbeddedVideo(<EmbeddedVideo videoUrl="https://youtu.be/M7lc1UVf-VE" />);
        expect(container).toBeEmptyDOMElement();

        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <EmbeddedVideo videoUrl="https://youtu.be/M7lc1UVf-VE" />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(container.querySelector('[data-authoring-state="missing-title"]')).toBeInTheDocument();
        expect(screen.getByText('Accessible title required')).toBeInTheDocument();
    });

    test('publishes the complete literal Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitEmbeddedVideoMetadata)).toBe(
            'SFNextToolkit.embeddedVideo'
        );

        const { fields } = getAttributeDefinitions(SFNextToolkitEmbeddedVideoMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'videoUrl',
            'videoTitle',
            'playButtonLabel',
            'posterImage',
            'caption',
            'captionsUrl',
            'captionsLanguage',
            'captionsLabel',
            'transcriptUrl',
            'transcriptLabel',
            'aspectRatio',
            'maxWidth',
            'clickToPlay',
            'startAtSeconds',
            'autoplay',
            'muted',
            'loop',
            'preload',
            'allowFullscreen',
        ]);
        expect(fields.videoUrl).toMatchObject({ type: 'url', required: true });
        expect(fields.videoTitle).toMatchObject({ type: 'string', required: true });
        expect(fields.playButtonLabel).toMatchObject({ type: 'string', defaultValue: 'Play video' });
        expect(fields.posterImage).toMatchObject({ type: 'image' });
        expect(fields.captionsUrl).toMatchObject({ type: 'url' });
        expect(fields.aspectRatio).toMatchObject({
            values: ['widescreen', 'cinematic', 'standard', 'square', 'portrait'],
            defaultValue: 'widescreen',
        });
        expect(fields.maxWidth).toMatchObject({ values: ['full', 'wide', 'narrow'], defaultValue: 'wide' });
        expect(fields.clickToPlay).toMatchObject({ type: 'boolean', defaultValue: true });
        expect(fields.startAtSeconds).toMatchObject({ type: 'integer', defaultValue: 0 });
        expect(fields.autoplay).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.muted).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.loop).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.preload).toMatchObject({ values: ['none', 'metadata'], defaultValue: 'metadata' });
        expect(fields.allowFullscreen).toMatchObject({ type: 'boolean', defaultValue: true });
    });

    test('provides a stable registered fallback', () => {
        const { container } = render(<EmbeddedVideoFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-embedded-video-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    });
});
