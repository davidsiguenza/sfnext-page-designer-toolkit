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
import {
    normalizeBoolean,
    normalizeProductListConfig,
    type ProductListComponentAttributes,
    type ProductListConfig,
} from '@/components/product-list/config';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';

export const PLP_VIEW_QUERY_PARAM = 'plpView';

export const PLP_CARD_VIEWS = ['standard', 'editorial', 'compact'] as const;
export type PLPCardView = (typeof PLP_CARD_VIEWS)[number];

export const PLP_ALLOWED_VIEW_PRESETS = ['standard-only', 'standard-editorial', 'standard-compact', 'all'] as const;
export type PLPAllowedViewPreset = (typeof PLP_ALLOWED_VIEW_PRESETS)[number];

export const PLP_CARD_SURFACES = ['card', 'muted', 'transparent'] as const;
export type PLPCardSurface = (typeof PLP_CARD_SURFACES)[number];

export const PLP_GRID_DENSITIES = ['compact', 'regular', 'comfortable'] as const;
export type PLPGridDensity = (typeof PLP_GRID_DENSITIES)[number];

export const PLP_DESKTOP_COLUMNS = ['3', '4', '5'] as const;
export type PLPDesktopColumns = (typeof PLP_DESKTOP_COLUMNS)[number];

export interface PLPMerchandisingGridAttributes extends ProductListComponentAttributes {
    stickyControls?: unknown;
    stickyFilters?: unknown;
    defaultCardView?: unknown;
    allowedCardViews?: unknown;
    cardSurface?: unknown;
    gridDensity?: unknown;
    desktopColumns?: unknown;
}

export interface PLPMerchandisingGridConfig {
    stickyControls: boolean;
    stickyFilters: boolean;
    defaultCardView: PLPCardView;
    allowedCardViews: PLPCardView[];
    cardSurface: PLPCardSurface;
    gridDensity: PLPGridDensity;
    desktopColumns: PLPDesktopColumns;
    productList: ProductListConfig;
}

export const DEFAULT_PLP_MERCHANDISING_GRID_CONFIG: PLPMerchandisingGridConfig = {
    stickyControls: false,
    stickyFilters: false,
    defaultCardView: 'standard',
    allowedCardViews: ['standard'],
    cardSurface: 'card',
    gridDensity: 'regular',
    desktopColumns: '4',
    productList: normalizeProductListConfig(undefined),
};

const ALLOWED_VIEWS_BY_PRESET: Record<PLPAllowedViewPreset, PLPCardView[]> = {
    'standard-only': ['standard'],
    'standard-editorial': ['standard', 'editorial'],
    'standard-compact': ['standard', 'compact'],
    all: [...PLP_CARD_VIEWS],
};

function normalizeEnum<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
    return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function normalizePLPMerchandisingGridConfig(
    value: PLPMerchandisingGridAttributes | null | undefined
): PLPMerchandisingGridConfig {
    const source = value ?? {};
    const allowedPreset = normalizeEnum(
        source.allowedCardViews,
        PLP_ALLOWED_VIEW_PRESETS,
        'standard-only' as PLPAllowedViewPreset
    );
    const allowedCardViews = ALLOWED_VIEWS_BY_PRESET[allowedPreset];
    const requestedDefault = normalizeEnum(source.defaultCardView, PLP_CARD_VIEWS, 'standard' as PLPCardView);

    return {
        stickyControls: normalizeBoolean(source.stickyControls, false),
        stickyFilters: normalizeBoolean(source.stickyFilters, false),
        defaultCardView: allowedCardViews.includes(requestedDefault) ? requestedDefault : allowedCardViews[0],
        allowedCardViews,
        cardSurface: normalizeEnum(source.cardSurface, PLP_CARD_SURFACES, 'card' as PLPCardSurface),
        gridDensity: normalizeEnum(source.gridDensity, PLP_GRID_DENSITIES, 'regular' as PLPGridDensity),
        desktopColumns: normalizeEnum(source.desktopColumns, PLP_DESKTOP_COLUMNS, '4' as PLPDesktopColumns),
        productList: normalizeProductListConfig(source),
    };
}

export function resolvePLPCardView(config: PLPMerchandisingGridConfig, requestedView: unknown): PLPCardView {
    return typeof requestedView === 'string' && config.allowedCardViews.includes(requestedView as PLPCardView)
        ? (requestedView as PLPCardView)
        : config.defaultCardView;
}

/** Applies meaningful content-density presets while preserving merchant choices for core commerce actions. */
export function getPLPProductListConfigForView(
    config: PLPMerchandisingGridConfig,
    view: PLPCardView
): ProductListConfig {
    if (view === 'standard') return config.productList;

    if (view === 'editorial') {
        return {
            ...config.productList,
            showCategory: false,
            showSku: false,
            additionalAttributes: [],
        };
    }

    return {
        ...config.productList,
        showSwatches: false,
        showBrand: false,
        showCategory: false,
        showSku: false,
        showRating: false,
        showPromotions: false,
        additionalAttributes: [],
    };
}

export function getPLPMerchandisingGridConfigFromPage(
    page: PageWithComponentData | null | undefined,
    regionId = 'plpMerchandisingGrid'
): PLPMerchandisingGridConfig | null {
    const region = page?.regions?.find((candidate) => candidate.id === regionId);
    const component = region?.components?.find((candidate) => candidate.typeId.endsWith('.plpMerchandisingGrid'));

    if (!component) return null;

    return normalizePLPMerchandisingGridConfig(component.data as PLPMerchandisingGridAttributes | undefined);
}

export function getPLPMerchandisingGridConfigKey(config: PLPMerchandisingGridConfig): string {
    return JSON.stringify([
        config.stickyControls,
        config.stickyFilters,
        config.defaultCardView,
        config.allowedCardViews,
        config.cardSurface,
        config.gridDensity,
        config.desktopColumns,
        config.productList,
    ]);
}
