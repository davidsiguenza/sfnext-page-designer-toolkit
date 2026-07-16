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
import { describe, expect, test } from 'vitest';
import { buildEmbedUrl, normalizeCaptionsUrl, normalizeSecureAssetUrl, resolveVideoSource } from './video-url';

describe('embedded video URL security', () => {
    test.each([
        ['https://www.youtube.com/watch?v=M7lc1UVf-VE', { kind: 'youtube', videoId: 'M7lc1UVf-VE' }],
        ['https://youtu.be/M7lc1UVf-VE?t=30', { kind: 'youtube', videoId: 'M7lc1UVf-VE' }],
        ['https://www.youtube-nocookie.com/embed/M7lc1UVf-VE', { kind: 'youtube', videoId: 'M7lc1UVf-VE' }],
        ['https://youtube.com/shorts/M7lc1UVf-VE', { kind: 'youtube', videoId: 'M7lc1UVf-VE' }],
        ['https://vimeo.com/76979871', { kind: 'vimeo', videoId: '76979871' }],
        ['https://player.vimeo.com/video/76979871', { kind: 'vimeo', videoId: '76979871' }],
        ['/media/campaign.mp4', { kind: 'direct', url: '/media/campaign.mp4' }],
        ['media/campaign.WEBM?version=2', { kind: 'direct', url: 'media/campaign.WEBM?version=2' }],
        [
            'https://cdn.example.com/video/launch.ogv#chapter',
            { kind: 'direct', url: 'https://cdn.example.com/video/launch.ogv#chapter' },
        ],
    ])('resolves the supported source %s', (value, expected) => {
        expect(resolveVideoSource(`  ${value}  `)).toEqual(expected);
    });

    test.each([
        undefined,
        '',
        '//www.youtube.com/watch?v=M7lc1UVf-VE',
        'http://www.youtube.com/watch?v=M7lc1UVf-VE',
        'https://youtube.com.evil.example/watch?v=M7lc1UVf-VE',
        'https://youtube.com@evil.example/watch?v=M7lc1UVf-VE',
        'https://www.youtube.com/watch?v=invalid',
        'https://vimeo.com/not-a-video',
        'https://untrusted.example/embed/M7lc1UVf-VE',
        'https://cdn.example.com/video/readme.txt',
        'javascript:alert(1)',
        'data:video/mp4;base64,AAAA',
        'blob:https://example.com/id',
        '/media/safe.mp4\n<script>',
        '/media/safe.mp4%0aevil',
        '/\\evil.example/video.mp4',
        '/media/\\evil.mp4',
    ])('rejects unsupported or unsafe source %s', (value) => {
        expect(resolveVideoSource(value)).toBeUndefined();
    });

    test('builds a canonical privacy-enhanced YouTube URL and adds the playlist required for looping', () => {
        const url = new URL(
            buildEmbedUrl(
                { kind: 'youtube', videoId: 'M7lc1UVf-VE' },
                { autoplay: true, controls: false, loop: true, muted: true, startAtSeconds: 45 }
            )
        );

        expect(url.origin).toBe('https://www.youtube-nocookie.com');
        expect(url.pathname).toBe('/embed/M7lc1UVf-VE');
        expect(Object.fromEntries(url.searchParams)).toMatchObject({
            autoplay: '1',
            controls: '0',
            loop: '1',
            playlist: 'M7lc1UVf-VE',
            playsinline: '1',
            rel: '0',
            start: '45',
        });
    });

    test('enables Vimeo Do Not Track and does not carry arbitrary authored parameters', () => {
        const url = new URL(
            buildEmbedUrl(
                { kind: 'vimeo', videoId: '76979871' },
                { autoplay: false, controls: true, loop: false, muted: false, startAtSeconds: 75 }
            )
        );

        expect(url.origin).toBe('https://player.vimeo.com');
        expect(url.pathname).toBe('/video/76979871');
        expect(url.hash).toBe('#t=75s');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            dnt: '1',
            playsinline: '1',
            autoplay: '0',
            muted: '0',
            controls: '1',
            loop: '0',
        });
    });

    test.each(['/captions/es.vtt', 'captions/en.VTT?version=2', 'https://cdn.example.com/captions/fr.vtt'])(
        'accepts secure WebVTT captions %s',
        (value) => {
            expect(normalizeCaptionsUrl(value)).toBe(value);
        }
    );

    test.each([
        'https://cdn.example.com/captions/file.srt',
        'http://cdn.example.com/file.vtt',
        'data:text/vtt,x',
        '/\\evil.example/captions.vtt',
    ])('rejects unsafe or unsupported captions %s', (value) => {
        expect(normalizeCaptionsUrl(value)).toBeUndefined();
    });

    test('normalizes only relative and HTTPS poster assets', () => {
        expect(normalizeSecureAssetUrl(' /images/poster.webp ')).toBe('/images/poster.webp');
        expect(normalizeSecureAssetUrl('https://cdn.example.com/poster')).toBe('https://cdn.example.com/poster');
        expect(normalizeSecureAssetUrl('javascript:alert(1)')).toBeUndefined();
        expect(normalizeSecureAssetUrl('http://cdn.example.com/poster.jpg')).toBeUndefined();
        expect(normalizeSecureAssetUrl('/\\evil.example/poster.jpg')).toBeUndefined();
        expect(normalizeSecureAssetUrl('/transcripts/\\evil')).toBeUndefined();
    });
});
