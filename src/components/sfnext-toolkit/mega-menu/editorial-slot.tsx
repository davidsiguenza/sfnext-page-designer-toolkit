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
/* eslint-disable react-refresh/only-export-components -- contextual selectors are colocated for tests. */

import { Suspense, type ReactNode } from 'react';
import { Await } from 'react-router';
import type { ShopperExperience } from '@/scapi';
import { EmbeddedComponentRegion } from '@/components/region/embedded-component-region';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import { cn } from '@/lib/utils';
import { normalizeMegaMenuFeatureImage } from '../mega-menu-feature/model';
import { MEGA_MENU_EXTRA_ITEMS_REGION_ID, MEGA_MENU_FEATURE_REGION_ID } from '../mega-menu-panel';
import { MegaMenuNavigateProvider } from './context';
import { MEGA_MENU_PANELS_REGION_ID } from './index';

const PANEL_TYPE_ID = 'SFNextToolkit.megaMenuPanel';
const BANNER_MODES = ['fallback', 'replace', 'alongside'] as const;
const WIDTHS = ['compact', 'standard', 'wide'] as const;

type Component = ShopperExperience.schemas['Component'];
type EditorialWidth = (typeof WIDTHS)[number];

const WIDTH_CLASSES: Record<EditorialWidth, string> = {
    compact: 'lg:w-64 xl:w-72',
    standard: 'lg:w-80 xl:w-96',
    wide: 'lg:w-96 xl:w-[28rem]',
};

function normalizeOption<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeMegaMenuTargetCategory(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === 'string' ? id.trim() || undefined : undefined;
    }
    return undefined;
}

export function getMegaMenuPanels(component: ComponentWithComponentData | null): Component[] {
    return (
        component?.regions
            ?.find((region) => region.id === MEGA_MENU_PANELS_REGION_ID)
            ?.components?.filter((panel) => panel.typeId === PANEL_TYPE_ID) ?? []
    );
}

/** First authored panel wins deterministically when a category was configured twice. */
export function selectMegaMenuPanel(
    component: ComponentWithComponentData | null,
    targetCategoryId: string
): Component | undefined {
    const normalizedTarget = targetCategoryId.trim();
    if (!normalizedTarget) return undefined;
    return getMegaMenuPanels(component).find(
        (panel) =>
            normalizeMegaMenuTargetCategory(
                (panel.data as { targetCategory?: unknown } | undefined)?.targetCategory
            ) === normalizedTarget
    );
}

export function getMegaMenuPanelCategoryIds(
    component: ComponentWithComponentData | null,
    variant: 'desktop' | 'mobile' = 'desktop'
): Set<string> {
    const rootData = (component?.data ?? {}) as Record<string, unknown>;
    if (!component || rootData.enabled === false || (variant === 'mobile' && rootData.mobileEditorial === false)) {
        return new Set();
    }

    return new Set(
        getMegaMenuPanels(component)
            .filter(megaMenuPanelHasContent)
            .flatMap((panel) => {
                const id = normalizeMegaMenuTargetCategory(
                    (panel.data as { targetCategory?: unknown } | undefined)?.targetCategory
                );
                return id ? [id] : [];
            })
    );
}

export function megaMenuPanelHasFeature(panel: Component | undefined): boolean {
    return Boolean(getMegaMenuPanelFeature(panel));
}

export function getMegaMenuPanelFeature(panel: Component | undefined): Component | undefined {
    return panel?.regions?.find((region) => region.id === MEGA_MENU_FEATURE_REGION_ID)?.components?.[0];
}

/** Mirrors the feature component's minimum live rendering contract. */
export function megaMenuFeatureHasManualRenderableContent(feature: Component | undefined): boolean {
    const data = (feature?.data ?? {}) as Record<string, unknown>;
    const hasText = ['title', 'copy'].some((key) => typeof data[key] === 'string' && Boolean(data[key].trim()));
    return hasText || Boolean(normalizeMegaMenuFeatureImage(data.imageOverride));
}

export function megaMenuFeatureLoaderDataIsReady(value: unknown): boolean {
    return Boolean(value && typeof value === 'object' && 'status' in value && value.status === 'ready');
}

export function megaMenuPanelHasContent(panel: Component | undefined): boolean {
    if (!panel) return false;
    const data = (panel.data ?? {}) as Record<string, unknown>;
    const hasText = ['heading', 'intro', 'extraItemsHeading'].some(
        (key) => typeof data[key] === 'string' && Boolean(data[key].trim())
    );
    const hasViewAll = data.showViewAll !== false && Boolean(normalizeMegaMenuTargetCategory(data.targetCategory));
    const hasRegionContent = panel.regions?.some(
        (region) =>
            (region.id === MEGA_MENU_EXTRA_ITEMS_REGION_ID || region.id === MEGA_MENU_FEATURE_REGION_ID) &&
            Boolean(region.components?.length)
    );
    return hasText || hasViewAll || Boolean(hasRegionContent);
}

export function filterMegaMenuComponentToPanel(
    component: ComponentWithComponentData,
    panel: Component
): ComponentWithComponentData {
    return {
        ...component,
        regions: component.regions?.map((region) =>
            region.id === MEGA_MENU_PANELS_REGION_ID ? { ...region, components: [panel] } : region
        ),
    };
}

interface MegaMenuEditorialSlotProps {
    component: ComponentWithComponentData | null | Promise<ComponentWithComponentData | null> | undefined;
    targetCategoryId: string;
    fallback?: ReactNode;
    variant?: 'desktop' | 'mobile';
    onNavigate?: () => void;
    className?: string;
}

function ResolvedMegaMenuEditorialSlot({
    component,
    targetCategoryId,
    fallback,
    variant = 'desktop',
    onNavigate,
    className,
}: Omit<MegaMenuEditorialSlotProps, 'component'> & { component: ComponentWithComponentData | null }) {
    const rootData = (component?.data ?? {}) as Record<string, unknown>;
    const fallbackOnly = () =>
        variant === 'desktop' && fallback ? (
            <aside data-slot="mega-menu-standard-banner" data-present="true" className={cn('self-stretch', className)}>
                {fallback}
            </aside>
        ) : null;

    if (!component || rootData.enabled === false) return fallbackOnly();
    if (variant === 'mobile' && rootData.mobileEditorial === false) return null;

    const panel = selectMegaMenuPanel(component, targetCategoryId);
    if (!panel || !megaMenuPanelHasContent(panel)) return fallbackOnly();

    const panelData = (panel.data ?? {}) as Record<string, unknown>;
    const globalMode = normalizeOption(rootData.defaultStandardBannerMode, BANNER_MODES, 'fallback');
    const panelMode =
        panelData.standardBannerMode === 'inherit'
            ? globalMode
            : normalizeOption(panelData.standardBannerMode, BANNER_MODES, globalMode);
    const feature = getMegaMenuPanelFeature(panel);
    const width = normalizeOption(panelData.editorialWidth, WIDTHS, 'standard');
    const filteredComponent = filterMegaMenuComponentToPanel(component, panel);

    const renderSlot = (hasRenderableFeature: boolean) => {
        const showFallback =
            variant === 'desktop' &&
            Boolean(fallback) &&
            (panelMode === 'alongside' || (panelMode === 'fallback' && !hasRenderableFeature));

        return (
            <aside
                data-slot="mega-menu-editorial-slot"
                data-present="true"
                data-target-category={targetCategoryId}
                data-banner-mode={panelMode}
                className={cn(
                    'min-w-0 shrink-0 space-y-4 self-stretch',
                    variant === 'desktop' ? WIDTH_CLASSES[width] : 'w-full py-3',
                    className
                )}>
                {showFallback && <div data-slot="mega-menu-standard-banner">{fallback}</div>}
                <MegaMenuNavigateProvider onNavigate={onNavigate}>
                    <EmbeddedComponentRegion
                        component={filteredComponent}
                        regionId={MEGA_MENU_PANELS_REGION_ID}
                        errorElement={showFallback ? null : fallback}
                    />
                </MegaMenuNavigateProvider>
            </aside>
        );
    };

    const manualFeatureIsRenderable = megaMenuFeatureHasManualRenderableContent(feature);
    const featureData = feature?.id ? component.componentData?.[feature.id] : undefined;
    const mustResolveFallbackFeature =
        variant === 'desktop' &&
        Boolean(fallback) &&
        panelMode === 'fallback' &&
        Boolean(feature) &&
        !manualFeatureIsRenderable;

    if (!mustResolveFallbackFeature) {
        return renderSlot(Boolean(feature));
    }

    if (!(featureData instanceof Promise)) {
        return renderSlot(megaMenuFeatureLoaderDataIsReady(featureData));
    }

    const unresolvedFallback = renderSlot(false);
    return (
        <Suspense fallback={unresolvedFallback}>
            <Await resolve={featureData} errorElement={unresolvedFallback}>
                {(resolved) => renderSlot(megaMenuFeatureLoaderDataIsReady(resolved))}
            </Await>
        </Suspense>
    );
}

/** Contextual bridge between the fixed catalog menu and its Header-assigned PD content block. */
export function MegaMenuEditorialSlot({ component, ...props }: MegaMenuEditorialSlotProps) {
    if (component === undefined) {
        return <ResolvedMegaMenuEditorialSlot component={null} {...props} />;
    }
    if (component instanceof Promise) {
        const suspenseFallback = <ResolvedMegaMenuEditorialSlot component={null} {...props} />;
        return (
            <Suspense fallback={suspenseFallback}>
                <Await resolve={component} errorElement={suspenseFallback}>
                    {(resolved) => <ResolvedMegaMenuEditorialSlot component={resolved} {...props} />}
                </Await>
            </Suspense>
        );
    }
    return <ResolvedMegaMenuEditorialSlot component={component} {...props} />;
}
