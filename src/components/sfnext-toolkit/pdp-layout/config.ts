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

export const PDP_COLUMN_RATIOS = ['50-50', '60-40', '65-35', '70-30'] as const;
export const PDP_MEDIA_SIDES = ['left', 'right'] as const;
export const PDP_GALLERY_PRESENTATIONS = ['grid', 'strip', 'carousel'] as const;

export type PdpColumnRatio = (typeof PDP_COLUMN_RATIOS)[number];
export type PdpMediaSide = (typeof PDP_MEDIA_SIDES)[number];
export type PdpGalleryPresentation = (typeof PDP_GALLERY_PRESENTATIONS)[number];

export interface PdpLayoutConfig {
    desktopColumnRatio: PdpColumnRatio;
    mediaSide: PdpMediaSide;
    galleryPresentation: PdpGalleryPresentation;
    stickyProductInfo: boolean;
    enableProductNavigation: boolean;
}

export type PdpLayoutComponentAttributes = Partial<Record<keyof PdpLayoutConfig, unknown>>;

export const DEFAULT_PDP_LAYOUT_CONFIG: PdpLayoutConfig = {
    desktopColumnRatio: '50-50',
    mediaSide: 'left',
    galleryPresentation: 'grid',
    stickyProductInfo: false,
    enableProductNavigation: false,
};

function normalizeEnum<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
    return typeof value === 'string' && values.includes(value as T) ? (value as T) : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : fallback;
    if (typeof value !== 'string') return fallback;

    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

export function normalizePdpLayoutConfig(value: PdpLayoutComponentAttributes | null | undefined): PdpLayoutConfig {
    const source = value ?? {};

    return {
        desktopColumnRatio: normalizeEnum(
            source.desktopColumnRatio,
            PDP_COLUMN_RATIOS,
            DEFAULT_PDP_LAYOUT_CONFIG.desktopColumnRatio
        ),
        mediaSide: normalizeEnum(source.mediaSide, PDP_MEDIA_SIDES, DEFAULT_PDP_LAYOUT_CONFIG.mediaSide),
        galleryPresentation: normalizeEnum(
            source.galleryPresentation,
            PDP_GALLERY_PRESENTATIONS,
            DEFAULT_PDP_LAYOUT_CONFIG.galleryPresentation
        ),
        stickyProductInfo: normalizeBoolean(source.stickyProductInfo, DEFAULT_PDP_LAYOUT_CONFIG.stickyProductInfo),
        enableProductNavigation: normalizeBoolean(
            source.enableProductNavigation,
            DEFAULT_PDP_LAYOUT_CONFIG.enableProductNavigation
        ),
    };
}

export function getPdpLayoutConfigFromPage(
    page: PageWithComponentData | null | undefined,
    regionId = 'pdpLayout'
): PdpLayoutConfig {
    const region = page?.regions?.find((candidate) => candidate.id === regionId);
    const layoutComponent = region?.components?.find((component) => component.typeId.endsWith('.pdpLayout'));
    const data = layoutComponent?.data as PdpLayoutComponentAttributes | undefined;

    return normalizePdpLayoutConfig(data);
}
