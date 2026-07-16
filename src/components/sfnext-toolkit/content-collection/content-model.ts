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

import { normalizeSafeLinkUrl } from '@/components/sfnext-toolkit/safe-link-url';

type UnknownRecord = Record<string, unknown>;

export type ContentCollectionItemKind = 'blog' | 'generic';

/** Storefront-safe card projection of either a blog post or an ordinary Content Asset. */
export interface ContentCollectionItem {
    id: string;
    kind: ContentCollectionItemKind;
    title: string;
    excerpt?: string;
    imageUrl?: string;
    imageAlt?: string;
    author?: string;
    publishedAt?: string;
    updatedAt?: string;
    category?: string;
    readingTimeMinutes?: number;
    linkUrl?: string;
}

/** Optional Content attribute IDs used ahead of the toolkit's portable aliases. */
export interface ContentFieldMappings {
    titleAttribute?: string;
    excerptAttribute?: string;
    imageAttribute?: string;
    imageAltAttribute?: string;
    dateAttribute?: string;
    authorAttribute?: string;
    categoryAttribute?: string;
    linkAttribute?: string;
}

const HTML_TAG = /<[^>]*>/g;
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const FIELD_ID = /^(?:c_)?[A-Za-z][A-Za-z0-9_]{0,127}$/;
const RESERVED_FIELD_IDS = new Set(['__proto__', 'prototype', 'constructor']);

const FIELD_KEYS = {
    title: ['c_sfnextContentTitle', 'c_blogTitle', 'c_title', 'title', 'name', 'pageTitle'],
    excerpt: [
        'c_sfnextContentExcerpt',
        'c_blogExcerpt',
        'c_excerpt',
        'c_teaser',
        'excerpt',
        'description',
        'pageDescription',
    ],
    image: [
        'c_sfnextContentImage',
        'c_sfnextBlogHeroImage',
        'c_blogHeroImage',
        'c_heroImage',
        'c_image',
        'heroImage',
        'image',
    ],
    imageAlt: [
        'c_sfnextContentImageAlt',
        'c_sfnextBlogHeroAlt',
        'c_blogHeroImageAlt',
        'c_heroImageAlt',
        'c_imageAlt',
        'heroImageAlt',
        'imageAlt',
    ],
    author: ['c_sfnextContentAuthor', 'c_sfnextBlogAuthor', 'c_blogAuthor', 'c_author', 'author'],
    publishedAt: [
        'c_sfnextContentPublishedAt',
        'c_sfnextBlogPublishedAt',
        'c_blogPublishDate',
        'c_publishDate',
        'c_publishedAt',
        'publishedAt',
        'creationDate',
    ],
    updatedAt: ['c_sfnextContentUpdatedAt', 'c_blogUpdatedDate', 'c_updatedAt', 'updatedAt', 'lastModified'],
    category: ['c_sfnextContentCategory', 'c_sfnextBlogCategory', 'c_blogCategory', 'c_category', 'category'],
    link: ['c_sfnextContentUrl', 'c_url', 'c_link', 'c_ctaUrl', 'linkUrl', 'url', 'link'],
    visible: ['c_online', 'online', 'visible'],
    readingTime: ['c_sfnextBlogReadTime', 'c_blogReadingTime', 'c_readingTime', 'readingTimeMinutes'],
    // Only explicit blog fields mark an asset as a blog post. Generic `body` fields must not
    // accidentally opt ordinary Content Assets into the public /blog/:id route.
    blogBody: ['c_sfnextBlogBody', 'c_blogBody'],
} as const;

function asRecord(value: unknown): UnknownRecord | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;
}

function hasOwn(record: UnknownRecord, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(record, key);
}

function firstDefined(record: UnknownRecord, keys: readonly string[]): unknown {
    for (const key of keys) {
        if (hasOwn(record, key) && record[key] !== undefined && record[key] !== null) return record[key];
    }
    return undefined;
}

function containsControlCharacter(value: string): boolean {
    return Array.from(value).some((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 31 || codePoint === 127;
    });
}

function stripControlCharacters(value: string): string {
    return Array.from(value)
        .filter((character) => {
            const codePoint = character.codePointAt(0) ?? 0;
            return codePoint > 31 && codePoint !== 127;
        })
        .join('');
}

function unwrapScalar(value: unknown, depth = 0): unknown {
    if (depth > 4) return value;
    const record = asRecord(value);
    if (!record) return value;

    for (const key of ['value', 'source', 'html', 'markup', 'text'] as const) {
        if (hasOwn(record, key) && record[key] !== undefined && record[key] !== null) {
            return unwrapScalar(record[key], depth + 1);
        }
    }
    return value;
}

function toStringValue(value: unknown): string | undefined {
    const unwrapped = unwrapScalar(value);
    if (typeof unwrapped === 'string') {
        const clean = stripControlCharacters(unwrapped).trim();
        return clean || undefined;
    }
    if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) return String(unwrapped);
    return undefined;
}

function toPlainText(value: unknown): string | undefined {
    const text = toStringValue(value);
    if (!text) return undefined;
    const plain = text.replace(HTML_TAG, ' ').replace(/\s+/g, ' ').trim();
    return plain || undefined;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
    const unwrapped = unwrapScalar(value);
    if (typeof unwrapped === 'boolean') return unwrapped;
    if (typeof unwrapped === 'number') return unwrapped !== 0;
    if (typeof unwrapped === 'string') {
        const normalized = unwrapped.trim().toLowerCase();
        if (['true', '1', 'yes', 'on', 'online'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off', 'offline'].includes(normalized)) return false;
    }
    return fallback;
}

function toPositiveInteger(value: unknown): number | undefined {
    const unwrapped = unwrapScalar(value);
    const parsed =
        typeof unwrapped === 'number'
            ? unwrapped
            : typeof unwrapped === 'string'
              ? Number.parseInt(unwrapped, 10)
              : Number.NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.min(999, Math.max(1, Math.round(parsed)));
}

function toDateString(value: unknown): string | undefined {
    const date = toStringValue(value);
    return date && Number.isFinite(Date.parse(date)) ? date : undefined;
}

function normalizeMediaUrl(value: string): string | undefined {
    const clean = stripControlCharacters(value).trim();
    if (!clean) return undefined;
    if (clean.startsWith('//')) return `https:${clean}`;
    if (clean.startsWith('/') || clean.startsWith('./') || clean.startsWith('../')) return clean;

    try {
        const url = new URL(clean);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
    } catch {
        return clean.includes(':') ? undefined : clean;
    }
}

function toImageUrl(value: unknown, depth = 0): string | undefined {
    if (depth > 5) return undefined;
    const direct = toStringValue(value);
    if (direct) return normalizeMediaUrl(direct);

    const record = asRecord(value);
    if (!record) return undefined;
    for (const key of ['url', 'absURL', 'src', 'path', 'file', 'value'] as const) {
        const resolved = toImageUrl(record[key], depth + 1);
        if (resolved) return resolved;
    }
    return undefined;
}

function normalizeFieldId(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    if (!normalized || !FIELD_ID.test(normalized) || RESERVED_FIELD_IDS.has(normalized)) return undefined;
    return normalized;
}

function mappedKeys(value: string | undefined): string[] {
    const normalized = normalizeFieldId(value);
    if (!normalized) return [];
    return normalized.startsWith('c_') ? [normalized] : [normalized, `c_${normalized}`];
}

function mappedValue(record: UnknownRecord, configured: string | undefined, fallbackKeys: readonly string[]): unknown {
    return firstDefined(record, [...mappedKeys(configured), ...fallbackKeys]);
}

function estimateReadingTime(bodyHtml: string | undefined): number | undefined {
    if (!bodyHtml) return undefined;
    const words = bodyHtml.replace(HTML_TAG, ' ').match(WORD)?.length ?? 0;
    return words > 0 ? Math.max(1, Math.ceil(words / 200)) : undefined;
}

/**
 * Generic Content IDs are not URL slugs. Accept their full platform range while
 * rejecting only values unsafe for the comma-separated multi-content request.
 */
export function normalizeContentAssetId(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    if (!normalized || normalized.length > 256 || normalized.includes(',') || containsControlCharacter(normalized)) {
        return undefined;
    }
    return normalized;
}

/** A folder ID is embedded into `refine=fdid=...`; reject refinement syntax locally. */
export function normalizeContentFolderId(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    if (!normalized || normalized.length > 256 || containsControlCharacter(normalized) || /[=|()]/.test(normalized)) {
        return undefined;
    }
    return normalized;
}

export function parseSelectedContentIds(
    value: unknown,
    limit: number
): { ids: string[]; invalidCount: number; truncated: boolean } {
    if (typeof value !== 'string') return { ids: [], invalidCount: 0, truncated: false };

    const ids: string[] = [];
    const seen = new Set<string>();
    let invalidCount = 0;
    let validCount = 0;

    for (const rawValue of value.split(/[\n,]/)) {
        if (!rawValue.trim()) continue;
        const id = normalizeContentAssetId(rawValue);
        if (!id) {
            invalidCount += 1;
            continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        validCount += 1;
        if (ids.length < limit) ids.push(id);
    }

    return { ids, invalidCount, truncated: validCount > ids.length };
}

/** Normalize open-schema Shopper Experience content without requiring blog-only fields. */
export function normalizeContentCollectionItem(
    content: unknown,
    mappings: ContentFieldMappings = {}
): ContentCollectionItem | null {
    const record = asRecord(content);
    if (!record) return null;

    const id = normalizeContentAssetId(record.id);
    if (!id || !toBoolean(firstDefined(record, FIELD_KEYS.visible), true)) return null;

    const title = toPlainText(mappedValue(record, mappings.titleAttribute, FIELD_KEYS.title)) || id;
    const publishedAt = toDateString(mappedValue(record, mappings.dateAttribute, FIELD_KEYS.publishedAt));
    const updatedAt = toDateString(firstDefined(record, FIELD_KEYS.updatedAt));
    const blogBody = toStringValue(firstDefined(record, FIELD_KEYS.blogBody));
    const explicitReadingTime = toPositiveInteger(firstDefined(record, FIELD_KEYS.readingTime));
    const rawLink = toStringValue(mappedValue(record, mappings.linkAttribute, FIELD_KEYS.link));

    return {
        id,
        kind: blogBody ? 'blog' : 'generic',
        title,
        excerpt: toPlainText(mappedValue(record, mappings.excerptAttribute, FIELD_KEYS.excerpt)),
        imageUrl: toImageUrl(mappedValue(record, mappings.imageAttribute, FIELD_KEYS.image)),
        imageAlt: toPlainText(mappedValue(record, mappings.imageAltAttribute, FIELD_KEYS.imageAlt)),
        author: toPlainText(mappedValue(record, mappings.authorAttribute, FIELD_KEYS.author)),
        publishedAt: publishedAt || updatedAt,
        updatedAt,
        category: toPlainText(mappedValue(record, mappings.categoryAttribute, FIELD_KEYS.category)),
        readingTimeMinutes: explicitReadingTime ?? estimateReadingTime(blogBody),
        linkUrl: normalizeSafeLinkUrl(rawLink),
    };
}
