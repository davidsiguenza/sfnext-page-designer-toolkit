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
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';

export enum ProductImageViewType {
    HI_RES = 'hi-res',
    LARGE = 'large',
    MEDIUM = 'medium',
    SMALL = 'small',
    SWATCH = 'swatch',
}

export interface ProductListAdditionalAttribute {
    id: string;
    label: string;
}

export interface ProductListConfig {
    imageViewType: ProductImageViewType;
    showBadges: boolean;
    showWishlist: boolean;
    showQuickAdd: boolean;
    showSwatches: boolean;
    showBrand: boolean;
    showCategory: boolean;
    showProductName: boolean;
    showSku: boolean;
    showRating: boolean;
    showPrice: boolean;
    showPromotions: boolean;
    maxSwatches: number;
    additionalAttributes: ProductListAdditionalAttribute[];
}

export type ProductListComponentAttributes = Partial<
    Record<Exclude<keyof ProductListConfig, 'additionalAttributes'>, unknown>
> & {
    additionalAttributes?: unknown;
};

export interface ProductListSearchParameters {
    imgTypes: string;
    includedCustomVariationProperties?: string[];
}

export const DEFAULT_PRODUCT_LIST_CONFIG: ProductListConfig = {
    imageViewType: ProductImageViewType.MEDIUM,
    showBadges: true,
    showWishlist: true,
    showQuickAdd: true,
    showSwatches: true,
    showBrand: true,
    showCategory: true,
    showProductName: true,
    showSku: true,
    showRating: true,
    showPrice: true,
    showPromotions: true,
    maxSwatches: 3,
    additionalAttributes: [],
};

const PRODUCT_IMAGE_VIEW_TYPES = new Set<string>(Object.values(ProductImageViewType));
const CUSTOM_ATTRIBUTE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const MAX_ADDITIONAL_ATTRIBUTES = 5;
const MIN_SWATCHES = 1;
const MAX_SWATCHES = 12;

function humanizeAttributeId(id: string): string {
    const withoutPrefix = id.replace(/^c_/, '');
    const words = withoutPrefix
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return words.replace(/\b\w/g, (character) => character.toUpperCase());
}

function parseAttributeEntry(value: string): ProductListAdditionalAttribute | null {
    const entry = value.trim();
    if (!entry) return null;

    const pipeIndex = entry.indexOf('|');
    const equalsIndex = entry.indexOf('=');
    const separatorIndexes = [pipeIndex, equalsIndex].filter((index) => index >= 0);
    const separatorIndex = separatorIndexes.length ? Math.min(...separatorIndexes) : -1;
    const rawId = (separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry).trim();
    const explicitLabel = (separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : '').trim();
    const unprefixedId = rawId.startsWith('c_') ? rawId.slice(2) : rawId;

    if (!CUSTOM_ATTRIBUTE_ID_PATTERN.test(unprefixedId)) return null;

    const id = `c_${unprefixedId}`;
    return {
        id,
        label: explicitLabel || humanizeAttributeId(id),
    };
}

/**
 * Parses the merchant-friendly `id|Label` / `id=Label` format accepted by Page Designer.
 * Invalid identifiers are ignored because SCAPI only accepts custom properties prefixed with `c_`.
 */
export function parseAdditionalAttributes(value: unknown): ProductListAdditionalAttribute[] {
    const entries = Array.isArray(value)
        ? value.flatMap((item) => {
              if (typeof item === 'string') return item.split(/[\n,]+/);
              if (item && typeof item === 'object') {
                  const { id, label } = item as { id?: unknown; label?: unknown };
                  if (typeof id === 'string') {
                      return [`${id}|${typeof label === 'string' ? label : ''}`];
                  }
              }
              return [];
          })
        : typeof value === 'string'
          ? value.split(/[\n,]+/)
          : [];

    const attributes: ProductListAdditionalAttribute[] = [];
    const seenIds = new Set<string>();

    for (const entry of entries) {
        const parsed = parseAttributeEntry(entry);
        if (!parsed || seenIds.has(parsed.id)) continue;

        seenIds.add(parsed.id);
        attributes.push(parsed);
        if (attributes.length === MAX_ADDITIONAL_ATTRIBUTES) break;
    }

    return attributes;
}

export function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
}

export function normalizeInteger(
    value: unknown,
    fallback: number,
    minimum = Number.MIN_SAFE_INTEGER,
    maximum = Number.MAX_SAFE_INTEGER
): number {
    const normalizedString = typeof value === 'string' ? value.trim() : null;
    if (normalizedString === '') return fallback;
    const parsed =
        typeof value === 'number' ? value : normalizedString !== null ? Number(normalizedString) : Number.NaN;
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

export function normalizeProductImageViewType(
    value: unknown,
    fallback = DEFAULT_PRODUCT_LIST_CONFIG.imageViewType
): ProductImageViewType {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return PRODUCT_IMAGE_VIEW_TYPES.has(normalized) ? (normalized as ProductImageViewType) : fallback;
}

export function normalizeProductListConfig(
    value: ProductListComponentAttributes | null | undefined
): ProductListConfig {
    const source = value ?? {};

    return {
        imageViewType: normalizeProductImageViewType(source.imageViewType),
        showBadges: normalizeBoolean(source.showBadges, DEFAULT_PRODUCT_LIST_CONFIG.showBadges),
        showWishlist: normalizeBoolean(source.showWishlist, DEFAULT_PRODUCT_LIST_CONFIG.showWishlist),
        showQuickAdd: normalizeBoolean(source.showQuickAdd, DEFAULT_PRODUCT_LIST_CONFIG.showQuickAdd),
        showSwatches: normalizeBoolean(source.showSwatches, DEFAULT_PRODUCT_LIST_CONFIG.showSwatches),
        showBrand: normalizeBoolean(source.showBrand, DEFAULT_PRODUCT_LIST_CONFIG.showBrand),
        showCategory: normalizeBoolean(source.showCategory, DEFAULT_PRODUCT_LIST_CONFIG.showCategory),
        showProductName: normalizeBoolean(source.showProductName, DEFAULT_PRODUCT_LIST_CONFIG.showProductName),
        showSku: normalizeBoolean(source.showSku, DEFAULT_PRODUCT_LIST_CONFIG.showSku),
        showRating: normalizeBoolean(source.showRating, DEFAULT_PRODUCT_LIST_CONFIG.showRating),
        showPrice: normalizeBoolean(source.showPrice, DEFAULT_PRODUCT_LIST_CONFIG.showPrice),
        showPromotions: normalizeBoolean(source.showPromotions, DEFAULT_PRODUCT_LIST_CONFIG.showPromotions),
        maxSwatches: normalizeInteger(
            source.maxSwatches,
            DEFAULT_PRODUCT_LIST_CONFIG.maxSwatches,
            MIN_SWATCHES,
            MAX_SWATCHES
        ),
        additionalAttributes: parseAdditionalAttributes(source.additionalAttributes),
    };
}

export function getProductListConfigFromPage(
    page: PageWithComponentData | null | undefined,
    regionId = 'plpProductList'
): ProductListConfig {
    const region = page?.regions?.find((candidate) => candidate.id === regionId);
    const productListComponent = region?.components?.find((component) => component.typeId.endsWith('.productList'));
    const data = productListComponent?.data as unknown as ProductListComponentAttributes | undefined;

    return normalizeProductListConfig(data);
}

export function getProductListSearchParameters(config: ProductListConfig): ProductListSearchParameters {
    const imageTypes = [config.imageViewType];
    if (config.showSwatches) imageTypes.push(ProductImageViewType.SWATCH);

    const customPropertyIds = [...new Set(config.additionalAttributes.map(({ id }) => id))].slice(
        0,
        MAX_ADDITIONAL_ATTRIBUTES
    );

    return {
        imgTypes: [...new Set(imageTypes)].join(','),
        ...(customPropertyIds.length > 0 && { includedCustomVariationProperties: customPropertyIds }),
    };
}

export function getProductListConfigKey(config: ProductListConfig): string {
    return JSON.stringify([
        config.imageViewType,
        config.showBadges,
        config.showWishlist,
        config.showQuickAdd,
        config.showSwatches,
        config.showBrand,
        config.showCategory,
        config.showProductName,
        config.showSku,
        config.showRating,
        config.showPrice,
        config.showPromotions,
        config.maxSwatches,
        config.additionalAttributes.map(({ id, label }) => [id, label]),
    ]);
}
