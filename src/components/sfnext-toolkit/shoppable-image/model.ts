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

export const SHOPPABLE_IMAGE_SCHEMA_VERSION = 1;
export const SHOPPABLE_IMAGE_MAX_HOTSPOTS = 12;

export type ShoppableImageSourceMode = 'manual' | 'productSet';

export interface ShoppableHotspot {
    id: string;
    productId: string;
    /** Authoring-only display name. Live name, price and availability always come from SCAPI. */
    productName?: string;
    label?: string;
    /** Desktop coordinates expressed as percentages of the uncropped image. */
    x: number;
    y: number;
    /** Optional mobile coordinates. The desktop value is used when omitted. */
    mobileX?: number;
    mobileY?: number;
}

export interface ShoppableImageConfig {
    version: typeof SHOPPABLE_IMAGE_SCHEMA_VERSION;
    sourceMode: ShoppableImageSourceMode;
    productSetId?: string;
    /** Optional persisted preview URLs used only by the Business Manager visual editor. */
    desktopPreviewUrl?: string;
    mobilePreviewUrl?: string;
    hotspots: ShoppableHotspot[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const parseValue = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

const cleanString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized || undefined;
};

const cleanPreviewUrl = (value: unknown): string | undefined => {
    const normalized = cleanString(value);
    if (!normalized) return undefined;
    return /^(https?:)?\/\//i.test(normalized) || normalized.startsWith('/') ? normalized : undefined;
};

export const clampHotspotCoordinate = (value: unknown, fallback = 50): number => {
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (!Number.isFinite(number)) return fallback;
    return Math.round(Math.min(100, Math.max(0, number)) * 10) / 10;
};

const optionalCoordinate = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return clampHotspotCoordinate(value);
};

const unwrapCustomValue = (rawValue: unknown): unknown => {
    const parsed = parseValue(rawValue);
    if (!isRecord(parsed)) return parsed;

    // Some older custom editors wrapped their payload in `{value: ...}`. Accept that
    // shape without allowing it to shadow a legitimate v1 object.
    if (!('sourceMode' in parsed) && !('hotspots' in parsed) && 'value' in parsed) {
        return parseValue(parsed.value);
    }
    return parsed;
};

export const createEmptyShoppableImageConfig = (): ShoppableImageConfig => ({
    version: SHOPPABLE_IMAGE_SCHEMA_VERSION,
    sourceMode: 'manual',
    hotspots: [],
});

/** Normalizes untrusted Page Designer custom-editor data into the public v1 contract. */
export function normalizeShoppableImageConfig(rawValue: unknown): ShoppableImageConfig {
    const source = unwrapCustomValue(rawValue);
    if (!isRecord(source)) return createEmptyShoppableImageConfig();

    const sourceMode: ShoppableImageSourceMode = source.sourceMode === 'productSet' ? 'productSet' : 'manual';
    const rawHotspots = Array.isArray(source.hotspots) ? source.hotspots : [];
    const hotspots: ShoppableHotspot[] = [];

    for (let index = 0; index < rawHotspots.length && hotspots.length < SHOPPABLE_IMAGE_MAX_HOTSPOTS; index += 1) {
        const candidate = rawHotspots[index];
        if (!isRecord(candidate)) continue;
        const productId = cleanString(candidate.productId);
        if (!productId) continue;

        hotspots.push({
            id: cleanString(candidate.id) ?? `hotspot-${index + 1}`,
            productId,
            ...(cleanString(candidate.productName) ? { productName: cleanString(candidate.productName) } : {}),
            ...(cleanString(candidate.label) ? { label: cleanString(candidate.label) } : {}),
            x: clampHotspotCoordinate(candidate.x),
            y: clampHotspotCoordinate(candidate.y),
            ...(optionalCoordinate(candidate.mobileX) !== undefined
                ? { mobileX: optionalCoordinate(candidate.mobileX) }
                : {}),
            ...(optionalCoordinate(candidate.mobileY) !== undefined
                ? { mobileY: optionalCoordinate(candidate.mobileY) }
                : {}),
        });
    }

    return {
        version: SHOPPABLE_IMAGE_SCHEMA_VERSION,
        sourceMode,
        ...(cleanString(source.productSetId) ? { productSetId: cleanString(source.productSetId) } : {}),
        ...(cleanPreviewUrl(source.desktopPreviewUrl)
            ? { desktopPreviewUrl: cleanPreviewUrl(source.desktopPreviewUrl) }
            : {}),
        ...(cleanPreviewUrl(source.mobilePreviewUrl)
            ? { mobilePreviewUrl: cleanPreviewUrl(source.mobilePreviewUrl) }
            : {}),
        hotspots,
    };
}

/** Creates usable starter positions when a Product Set is configured before its points. */
export function createAutomaticHotspots(productIds: string[]): ShoppableHotspot[] {
    const ids = Array.from(new Set(productIds.map((id) => id.trim()).filter(Boolean))).slice(
        0,
        SHOPPABLE_IMAGE_MAX_HOTSPOTS
    );
    if (!ids.length) return [];

    const columns = ids.length <= 4 ? 2 : 3;
    const rows = Math.ceil(ids.length / columns);

    return ids.map((productId, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        return {
            id: `set-hotspot-${index + 1}`,
            productId,
            x: ((column + 1) / (columns + 1)) * 100,
            y: ((row + 1) / (rows + 1)) * 100,
        };
    });
}
