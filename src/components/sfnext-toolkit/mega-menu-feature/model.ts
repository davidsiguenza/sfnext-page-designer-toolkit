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

import type { ShopperProducts } from '@/scapi';
import type { Image } from '@/types';
import { routes, routeHref } from '@/route-paths';
import { getPrimaryProductImageUrl } from '@/lib/product/product-utils';
import {
    normalizeContentCollectionItem,
    type ContentCollectionItem,
    type ContentFieldMappings,
} from '../content-collection/content-model';
import { normalizeSafeLinkUrl } from '../safe-link-url';

type UnknownRecord = Record<string, unknown>;
type Product = ShopperProducts.schemas['Product'];
type Category = ShopperProducts.schemas['Category'];

export const MEGA_MENU_FEATURE_SOURCE_TYPES = ['category', 'product', 'content', 'cms', 'custom'] as const;
export const MEGA_MENU_FEATURE_IMAGE_VIEW_TYPES = ['hi-res', 'large', 'medium', 'small', 'swatch'] as const;

export type MegaMenuFeatureSourceType = (typeof MEGA_MENU_FEATURE_SOURCE_TYPES)[number];
export type MegaMenuFeatureImageViewType = (typeof MEGA_MENU_FEATURE_IMAGE_VIEW_TYPES)[number];
export type MegaMenuFeatureStatus = 'ready' | 'unconfigured' | 'not-found' | 'error';

export interface MegaMenuFeatureImage {
    src: string;
    alt?: string;
    focalPoint?: Image['focalPoint'];
    requestedViewType?: MegaMenuFeatureImageViewType;
    resolvedViewType?: string;
}

/** Small, navigation-safe projection. Raw CMS/Content payloads never reach the component. */
export interface MegaMenuFeatureItem {
    sourceType: MegaMenuFeatureSourceType;
    sourceId?: string;
    title?: string;
    copy?: string;
    eyebrow?: string;
    image?: MegaMenuFeatureImage;
    destination?: string;
    product?: Product;
    currency?: string;
}

export interface MegaMenuFeatureLoaderData {
    status: MegaMenuFeatureStatus;
    item?: MegaMenuFeatureItem;
}

export interface MegaMenuFeatureFieldMappings extends ContentFieldMappings {
    eyebrowAttribute?: string;
}

export interface MegaMenuFeatureConfiguration extends MegaMenuFeatureFieldMappings {
    sourceType?: unknown;
    category?: unknown;
    product?: unknown;
    contentId?: unknown;
    cmsRecord?: unknown;
    imageViewType?: unknown;
}

function asRecord(value: unknown): UnknownRecord | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;
}

function unwrapScalar(value: unknown, depth = 0): unknown {
    if (depth > 5) return value;
    const record = asRecord(value);
    if (!record) return value;
    for (const key of ['value', 'source', 'text', 'html', 'markup'] as const) {
        if (record[key] !== undefined && record[key] !== null) return unwrapScalar(record[key], depth + 1);
    }
    return value;
}

export function normalizeMegaMenuFeatureId(value: unknown): string | undefined {
    const scalar = unwrapScalar(value);
    if (typeof scalar === 'string') return scalar.trim() || undefined;
    const record = asRecord(value);
    const id = record?.id;
    return typeof id === 'string' ? id.trim() || undefined : undefined;
}

export function normalizeMegaMenuFeatureSourceType(value: unknown): MegaMenuFeatureSourceType {
    return typeof value === 'string' && (MEGA_MENU_FEATURE_SOURCE_TYPES as readonly string[]).includes(value)
        ? (value as MegaMenuFeatureSourceType)
        : 'custom';
}

export function normalizeMegaMenuFeatureImageViewType(value: unknown): MegaMenuFeatureImageViewType {
    return typeof value === 'string' && (MEGA_MENU_FEATURE_IMAGE_VIEW_TYPES as readonly string[]).includes(value)
        ? (value as MegaMenuFeatureImageViewType)
        : 'medium';
}

function normalizeMediaUrl(value: unknown): string | undefined {
    const scalar = unwrapScalar(value);
    if (typeof scalar !== 'string') return undefined;
    const clean = scalar.trim();
    const hasControlCharacters = [...clean].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127;
    });
    if (!clean || hasControlCharacters || clean.includes('\\')) return undefined;
    if (clean.startsWith('//')) return `https:${clean}`;
    if (clean.startsWith('/') || clean.startsWith('./') || clean.startsWith('../')) return clean;
    try {
        const url = new URL(clean);
        return url.protocol === 'https:' ? url.href : undefined;
    } catch {
        return clean.includes(':') ? undefined : clean;
    }
}

export function normalizeMegaMenuFeatureImage(value: unknown): MegaMenuFeatureImage | undefined {
    const direct = normalizeMediaUrl(value);
    if (direct) return { src: direct };

    const record = asRecord(value);
    if (!record) return undefined;
    const src =
        normalizeMediaUrl(record.url) ||
        normalizeMediaUrl(record.path) ||
        normalizeMediaUrl(record.src) ||
        normalizeMediaUrl(record.file);
    if (!src) return undefined;

    const focalPointRecord = asRecord(record.focalPoint) || asRecord(record.focal_point);
    return {
        src,
        ...(focalPointRecord
            ? {
                  focalPoint: {
                      x: focalPointRecord.x as number | string | undefined,
                      y: focalPointRecord.y as number | string | undefined,
                  },
              }
            : {}),
    };
}

function flattenCmsRecord(value: unknown): UnknownRecord | undefined {
    const record = asRecord(value);
    if (!record) return undefined;
    const attributes = asRecord(record.attributes);
    if (!attributes) return undefined;
    return {
        id: normalizeMegaMenuFeatureId(record.id) || 'cms-record',
        ...attributes,
    };
}

function mappedCmsValue(record: UnknownRecord, configured: string | undefined, candidates: readonly string[]): unknown {
    const normalized = configured?.trim();
    const keys = normalized
        ? [normalized, ...(normalized.startsWith('c_') ? [] : [`c_${normalized}`]), ...candidates]
        : candidates;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(record, key) && record[key] !== undefined && record[key] !== null) {
            return record[key];
        }
    }
    return undefined;
}

function plainText(value: unknown): string | undefined {
    const scalar = unwrapScalar(value);
    if (typeof scalar !== 'string') return undefined;
    const text = scalar
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text || undefined;
}

/**
 * Re-check projected destinations at the feature boundary. In addition to the
 * shared protocol allowlist, reject scheme-shaped values containing whitespace
 * before `:` (for example `java script:`) so an upstream text normalizer cannot
 * accidentally turn a control-character payload into an apparently relative URL.
 */
function normalizeFeatureDestination(value: unknown): string | undefined {
    const scalar = unwrapScalar(value);
    if (typeof scalar !== 'string') return undefined;
    const safe = normalizeSafeLinkUrl(scalar);
    if (!safe) return undefined;

    const colonIndex = safe.indexOf(':');
    if (colonIndex > 0) {
        const possibleScheme = safe.slice(0, colonIndex);
        if (/\s/.test(possibleScheme) && /^[a-z][a-z\d+.-]*$/i.test(possibleScheme.replace(/\s/g, ''))) {
            return undefined;
        }
    }

    return safe;
}

function trimmedString(value: unknown): string | undefined {
    return typeof value === 'string' ? value.trim() || undefined : undefined;
}

export function projectCmsFeature(
    cmsRecord: unknown,
    mappings: MegaMenuFeatureFieldMappings = {}
): MegaMenuFeatureItem | undefined {
    const flattened = flattenCmsRecord(cmsRecord);
    if (!flattened) return undefined;

    const normalized = normalizeContentCollectionItem(flattened, mappings);
    const rawImage = mappedCmsValue(flattened, mappings.imageAttribute, [
        'c_sfnextContentImage',
        'c_sfnextBlogHeroImage',
        'c_heroImage',
        'c_image',
        'heroImage',
        'thumbnail',
        'image',
    ]);
    const image = normalizeMegaMenuFeatureImage(rawImage);
    const sourceId = normalizeMegaMenuFeatureId(asRecord(cmsRecord)?.id);
    const fallbackTitle = plainText(mappedCmsValue(flattened, mappings.titleAttribute, ['title', 'name', 'headline']));
    const fallbackCopy = plainText(
        mappedCmsValue(flattened, mappings.excerptAttribute, ['description', 'excerpt', 'summary', 'copy'])
    );
    const rawLink = mappedCmsValue(flattened, mappings.linkAttribute, ['url', 'link', 'linkUrl', 'ctaUrl']);
    const eyebrow = plainText(
        mappedCmsValue(flattened, mappings.eyebrowAttribute, ['eyebrow', 'category', 'kicker', 'label'])
    );
    const syntheticTitle = sourceId || 'cms-record';
    const title = normalized?.title === syntheticTitle ? fallbackTitle : normalized?.title || fallbackTitle;

    if (!title && !fallbackCopy && !image) return undefined;
    return {
        sourceType: 'cms',
        sourceId,
        title,
        copy: normalized?.excerpt || fallbackCopy,
        eyebrow,
        image: image
            ? {
                  ...image,
                  alt: normalized?.imageAlt || title,
              }
            : normalized?.imageUrl
              ? { src: normalized.imageUrl, alt: normalized.imageAlt || title }
              : undefined,
        destination: normalizeFeatureDestination(rawLink) || normalizeFeatureDestination(normalized?.linkUrl),
    };
}

export function projectCategoryFeature(category: Category): MegaMenuFeatureItem {
    const sourceId = category.id?.trim();
    const rawImage =
        (typeof category.image === 'string' && category.image) ||
        (typeof category.c_slotBannerImage === 'string' && category.c_slotBannerImage) ||
        (typeof category.c_headerMenuImage === 'string' && category.c_headerMenuImage) ||
        undefined;
    const image = normalizeMegaMenuFeatureImage(rawImage);
    return {
        sourceType: 'category',
        sourceId,
        title: category.name?.trim(),
        copy: category.pageDescription?.trim() || category.description?.trim(),
        image: image ? { ...image, alt: category.name?.trim() } : undefined,
        destination: sourceId ? routeHref(routes.category, { categoryId: sourceId }) : undefined,
    };
}

function findResolvedProductViewType(product: Product, requested: MegaMenuFeatureImageViewType): string | undefined {
    const viewTypes = [requested, 'medium', 'large', 'hi-res', 'small', 'swatch'];
    return viewTypes.find((viewType, index) => {
        if (index > 0 && viewType === requested) return false;
        return product.imageGroups?.some((group) => group.viewType === viewType && Boolean(group.images?.[0]));
    });
}

export function projectProductFeature(
    product: Product,
    imageViewType: MegaMenuFeatureImageViewType,
    currency?: string
): MegaMenuFeatureItem {
    const sourceId = trimmedString(product.id) || trimmedString(product.productId);
    const productName = trimmedString(product.name) || trimmedString(product.productName);
    const resolvedViewType = findResolvedProductViewType(product, imageViewType);
    const src = resolvedViewType ? getPrimaryProductImageUrl(product, resolvedViewType) : undefined;
    return {
        sourceType: 'product',
        sourceId,
        title: productName,
        copy: trimmedString(product.shortDescription) || trimmedString(product.brand),
        image: src
            ? {
                  src,
                  alt: productName,
                  requestedViewType: imageViewType,
                  resolvedViewType,
              }
            : undefined,
        destination: sourceId ? routeHref(routes.product, { productId: sourceId }) : undefined,
        product,
        currency: product.currency || currency,
    };
}

export function projectContentFeature(item: ContentCollectionItem): MegaMenuFeatureItem {
    const destination =
        normalizeFeatureDestination(item.linkUrl) ||
        (item.kind === 'blog' ? normalizeSafeLinkUrl(`/blog/${encodeURIComponent(item.id)}`) : undefined);
    return {
        sourceType: 'content',
        sourceId: item.id,
        title: item.title,
        copy: item.excerpt,
        eyebrow: item.category,
        image: item.imageUrl ? { src: item.imageUrl, alt: item.imageAlt || item.title } : undefined,
        destination,
    };
}

export function emptyMegaMenuFeatureData(status: Exclude<MegaMenuFeatureStatus, 'ready'>): MegaMenuFeatureLoaderData {
    return { status };
}
