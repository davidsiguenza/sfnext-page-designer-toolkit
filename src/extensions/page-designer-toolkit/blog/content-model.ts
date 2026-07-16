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

/**
 * Storefront-safe representation of a Blog content asset.
 *
 * The Shopper Experience Content schema intentionally exposes custom attributes
 * through an open `c_*` bag. Keeping normalization at this boundary prevents the
 * routes and Page Designer components from depending on the exact wire shape.
 */
export interface BlogPost {
    /** Content Asset ID. The blog convention is to keep this equal to the URL slug. */
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    bodyHtml?: string;
    author?: string;
    publishedAt?: string;
    updatedAt?: string;
    heroImageUrl?: string;
    heroImageAlt?: string;
    category?: string;
    tags: string[];
    featured: boolean;
    readingTimeMinutes?: number;
    seoTitle: string;
    seoDescription?: string;
    seoKeywords: string[];
    /** False is respected in fixtures/imports; Shopper Experience already omits offline assets. */
    visible: boolean;
}

type UnknownRecord = Record<string, unknown>;

const BLOG_POST_ID_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,255}$/u;
const HTML_TAG = /<[^>]*>/g;
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

const FIELD_KEYS = {
    title: ['c_blogTitle', 'c_title', 'title', 'name', 'pageTitle'],
    excerpt: ['c_blogExcerpt', 'c_excerpt', 'c_teaser', 'excerpt', 'description', 'pageDescription'],
    body: ['c_sfnextBlogBody', 'c_blogBody', 'c_body', 'c_content', 'bodyHtml', 'body', 'content'],
    author: ['c_sfnextBlogAuthor', 'c_blogAuthor', 'c_author', 'author'],
    publishedAt: [
        'c_sfnextBlogPublishedAt',
        'c_blogPublishDate',
        'c_publishDate',
        'c_publishedAt',
        'publishedAt',
        'creationDate',
    ],
    updatedAt: ['c_blogUpdatedDate', 'c_updatedAt', 'updatedAt', 'lastModified'],
    heroImage: ['c_sfnextBlogHeroImage', 'c_blogHeroImage', 'c_heroImage', 'c_image', 'heroImage', 'image'],
    heroImageAlt: [
        'c_sfnextBlogHeroAlt',
        'c_blogHeroImageAlt',
        'c_heroImageAlt',
        'c_imageAlt',
        'heroImageAlt',
        'imageAlt',
    ],
    category: ['c_sfnextBlogCategory', 'c_blogCategory', 'c_category', 'category'],
    tags: ['c_sfnextBlogTags', 'c_blogTags', 'c_tags', 'tags'],
    featured: ['c_sfnextBlogFeatured', 'c_blogFeatured', 'c_featured', 'featured'],
    readingTime: ['c_sfnextBlogReadTime', 'c_blogReadingTime', 'c_readingTime', 'readingTimeMinutes', 'readingTime'],
    visible: ['c_blogOnline', 'c_online', 'online', 'visible'],
} as const;

function asRecord(value: unknown): UnknownRecord | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;
}

function firstDefined(record: UnknownRecord, keys: readonly string[]): unknown {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null) return record[key];
    }
    return undefined;
}

function stripControlCharacters(value: string): string {
    return Array.from(value)
        .filter((character) => {
            const codePoint = character.codePointAt(0) ?? 0;
            return codePoint > 31 && codePoint !== 127;
        })
        .join('');
}

/**
 * Content data can be returned directly or in editor/data-binding envelopes.
 * Unwrap the common scalar envelopes without recursively walking arbitrary data.
 */
function unwrapScalar(value: unknown, depth = 0): unknown {
    if (depth > 4) return value;
    const record = asRecord(value);
    if (!record) return value;

    for (const key of ['value', 'source', 'html', 'markup', 'text'] as const) {
        if (record[key] !== undefined && record[key] !== null) {
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

function collectStrings(value: unknown): string[] {
    const unwrapped = unwrapScalar(value);
    if (Array.isArray(unwrapped)) return unwrapped.flatMap(collectStrings);

    const text = toStringValue(unwrapped);
    if (!text) return [];
    return text
        .split(/[,|;\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        const key = value.toLocaleLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
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
        // Library-relative paths such as "images/blog/hero.jpg" are valid.
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

function estimateReadingTime(bodyHtml: string | undefined): number | undefined {
    if (!bodyHtml) return undefined;
    const words = bodyHtml.replace(HTML_TAG, ' ').match(WORD)?.length ?? 0;
    return words > 0 ? Math.max(1, Math.ceil(words / 200)) : undefined;
}

/** Returns true for a Content Asset ID that is safe to use as one URL segment. */
export function isValidBlogPostId(value: string | undefined): value is string {
    return Boolean(value && BLOG_POST_ID_PATTERN.test(value));
}

/**
 * Normalizes a Shopper Experience Content Asset into a stable BlogPost.
 * Returns null only when the payload has no usable Content Asset ID.
 */
export function normalizeBlogPost(content: unknown): BlogPost | null {
    const record = asRecord(content);
    if (!record) return null;

    const id = toStringValue(record.id);
    if (!id) return null;

    const title = toPlainText(firstDefined(record, FIELD_KEYS.title)) || id;
    const excerpt = toPlainText(firstDefined(record, FIELD_KEYS.excerpt));
    const bodyHtml = toStringValue(firstDefined(record, FIELD_KEYS.body));
    const pageTitle = toPlainText(record.pageTitle);
    const pageDescription = toPlainText(record.pageDescription);
    const pageKeywords = uniqueStrings(collectStrings(record.pageKeywords));
    const explicitReadingTime = toPositiveInteger(firstDefined(record, FIELD_KEYS.readingTime));

    return {
        id,
        // Shopper Experience retrieves one Content Asset by ID. Keeping the
        // public slug identical prevents links that can never resolve.
        slug: id,
        title,
        excerpt,
        bodyHtml,
        author: toPlainText(firstDefined(record, FIELD_KEYS.author)),
        publishedAt: toDateString(firstDefined(record, FIELD_KEYS.publishedAt)),
        updatedAt: toDateString(firstDefined(record, FIELD_KEYS.updatedAt)),
        heroImageUrl: toImageUrl(firstDefined(record, FIELD_KEYS.heroImage)),
        heroImageAlt: toPlainText(firstDefined(record, FIELD_KEYS.heroImageAlt)),
        category: toPlainText(firstDefined(record, FIELD_KEYS.category)),
        tags: uniqueStrings(collectStrings(firstDefined(record, FIELD_KEYS.tags))),
        featured: toBoolean(firstDefined(record, FIELD_KEYS.featured), false),
        readingTimeMinutes: explicitReadingTime ?? estimateReadingTime(bodyHtml),
        seoTitle: pageTitle || title,
        seoDescription: pageDescription || excerpt,
        seoKeywords: pageKeywords,
        visible: toBoolean(firstDefined(record, FIELD_KEYS.visible), true),
    };
}
