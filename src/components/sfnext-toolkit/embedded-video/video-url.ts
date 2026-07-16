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

const URL_BASE = 'https://storefront.invalid';
const ENCODED_CONTROL_CHARACTERS = /%(?:00|0a|0d)/i;
const DIRECT_VIDEO_EXTENSION = /\.(?:m4v|mp4|og[gv]|webm)$/i;
const CAPTIONS_EXTENSION = /\.vtt$/i;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;

const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

interface ParsedSecureUrl {
    authoredUrl: string;
    parsedUrl: URL;
    isAbsolute: boolean;
}

export type ResolvedVideoSource =
    | { kind: 'youtube'; videoId: string }
    | { kind: 'vimeo'; videoId: string }
    | { kind: 'direct'; url: string };

export interface EmbedPlaybackOptions {
    autoplay: boolean;
    controls: boolean;
    loop: boolean;
    muted: boolean;
    startAtSeconds: number;
}

function parseSecureUrl(value: string | undefined): ParsedSecureUrl | undefined {
    const authoredUrl = value?.trim();
    const hasControlCharacters = [...(authoredUrl ?? '')].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127;
    });
    if (
        !authoredUrl ||
        hasControlCharacters ||
        ENCODED_CONTROL_CHARACTERS.test(authoredUrl) ||
        authoredUrl.startsWith('//') ||
        authoredUrl.includes('\\')
    ) {
        return undefined;
    }

    const protocol = authoredUrl.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
    if (protocol && protocol !== 'https') return undefined;

    try {
        const parsedUrl = new URL(authoredUrl, URL_BASE);
        if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) return undefined;

        return {
            authoredUrl,
            parsedUrl,
            isAbsolute: Boolean(protocol),
        };
    } catch {
        return undefined;
    }
}

function resolveYouTubeId(parsedUrl: URL): string | undefined {
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    let candidate: string | null | undefined;

    if (hostname === 'youtu.be') {
        [candidate] = pathSegments;
    } else if (parsedUrl.pathname === '/watch') {
        candidate = parsedUrl.searchParams.get('v');
    } else if (['embed', 'shorts', 'live'].includes(pathSegments[0] ?? '')) {
        candidate = pathSegments[1];
    }

    return candidate && YOUTUBE_ID.test(candidate) ? candidate : undefined;
}

function resolveVimeoId(parsedUrl: URL): string | undefined {
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const candidate = parsedUrl.hostname.toLowerCase() === 'player.vimeo.com' ? pathSegments[1] : pathSegments.at(-1);
    return candidate && VIMEO_ID.test(candidate) ? candidate : undefined;
}

/**
 * Resolves only allow-listed video providers and browser-native media files.
 * Arbitrary iframe hosts, insecure absolute URLs, executable protocols, credentials,
 * and unsupported direct-file extensions fail closed.
 */
export function resolveVideoSource(value: string | undefined): ResolvedVideoSource | undefined {
    const secureUrl = parseSecureUrl(value);
    if (!secureUrl) return undefined;

    const { authoredUrl, parsedUrl, isAbsolute } = secureUrl;
    const hostname = parsedUrl.hostname.toLowerCase();

    if (isAbsolute && YOUTUBE_HOSTS.has(hostname)) {
        const videoId = resolveYouTubeId(parsedUrl);
        return videoId ? { kind: 'youtube', videoId } : undefined;
    }

    if (isAbsolute && VIMEO_HOSTS.has(hostname)) {
        const videoId = resolveVimeoId(parsedUrl);
        return videoId ? { kind: 'vimeo', videoId } : undefined;
    }

    if (DIRECT_VIDEO_EXTENSION.test(parsedUrl.pathname)) {
        return { kind: 'direct', url: authoredUrl };
    }

    return undefined;
}

/** Builds a canonical privacy-conscious embed URL without preserving merchant-authored query parameters. */
export function buildEmbedUrl(
    source: Extract<ResolvedVideoSource, { kind: 'youtube' | 'vimeo' }>,
    options: EmbedPlaybackOptions
): string {
    const parameters = new URLSearchParams();

    if (source.kind === 'youtube') {
        parameters.set('playsinline', '1');
        parameters.set('rel', '0');
        parameters.set('autoplay', options.autoplay ? '1' : '0');
        parameters.set('controls', options.controls ? '1' : '0');
        parameters.set('loop', options.loop ? '1' : '0');
        if (options.startAtSeconds > 0) parameters.set('start', String(options.startAtSeconds));
        if (options.loop) parameters.set('playlist', source.videoId);

        return `https://www.youtube-nocookie.com/embed/${source.videoId}?${parameters.toString()}`;
    }

    parameters.set('dnt', '1');
    parameters.set('playsinline', '1');
    parameters.set('autoplay', options.autoplay ? '1' : '0');
    parameters.set('muted', options.muted ? '1' : '0');
    parameters.set('controls', options.controls ? '1' : '0');
    parameters.set('loop', options.loop ? '1' : '0');

    const startFragment = options.startAtSeconds > 0 ? `#t=${options.startAtSeconds}s` : '';
    return `https://player.vimeo.com/video/${source.videoId}?${parameters.toString()}${startFragment}`;
}

/** Allows a relative storefront asset or an absolute HTTPS asset, while rejecting active protocols. */
export function normalizeSecureAssetUrl(value: string | undefined): string | undefined {
    return parseSecureUrl(value)?.authoredUrl;
}

/** Captions are restricted to secure WebVTT resources. */
export function normalizeCaptionsUrl(value: string | undefined): string | undefined {
    const secureUrl = parseSecureUrl(value);
    return secureUrl && CAPTIONS_EXTENSION.test(secureUrl.parsedUrl.pathname) ? secureUrl.authoredUrl : undefined;
}
