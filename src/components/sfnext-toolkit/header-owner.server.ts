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

import { createContext, type LoaderFunctionArgs } from 'react-router';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import {
    fetchComponentWithComponentData,
    type ComponentWithComponentData,
} from '@/lib/page-designer/component-loader.server';
import { HEADER_COMPONENT_ID } from './mega-menu/header-region';
import { MEGA_MENU_FEATURE_TYPE_ID, withMegaMenuFeatureData } from './mega-menu-feature/loaders';
import { projectSiteThemeHeaderOwner } from './site-theme/header-site-theme-model';

const headerOwnerPromiseContext = createContext<Promise<ComponentWithComponentData | null> | null>(null);

const SITE_THEME_CACHE_TTL_MS = 30_000;
const SITE_THEME_COLD_WAIT_MS = 1_000;
const SITE_THEME_REFRESH_HARD_TIMEOUT_MS = 5_000;
const SITE_THEME_CACHE_MAX_ENTRIES = 100;

interface SiteThemeCacheScope {
    siteId: string;
    localeId: string;
}

interface SiteThemeCacheEntry {
    hasValue: boolean;
    value: ComponentWithComponentData | null;
    refreshedAt: number;
    refresh: Promise<ComponentWithComponentData | null> | null;
    refreshStartedAt: number;
    refreshGeneration: number;
}

/**
 * Per-instance cache of the sanitized Header projection used by the root shell.
 * It never stores the complete Header tree or descendant loader data, so menu,
 * product, customer, and request-specific payloads cannot cross requests.
 */
const publishedSiteThemeCache = new Map<string, SiteThemeCacheEntry>();

function getSiteThemeCacheKey({ siteId, localeId }: SiteThemeCacheScope): string {
    return `${siteId}\u0000${localeId}`;
}

function createSiteThemeCacheEntry(): SiteThemeCacheEntry {
    return {
        hasValue: false,
        value: null,
        refreshedAt: 0,
        refresh: null,
        refreshStartedAt: 0,
        refreshGeneration: 0,
    };
}

function getOrCreateSiteThemeCacheEntry(key: string): SiteThemeCacheEntry {
    const existing = publishedSiteThemeCache.get(key);
    if (existing) return existing;

    const entry = createSiteThemeCacheEntry();
    publishedSiteThemeCache.set(key, entry);

    if (publishedSiteThemeCache.size > SITE_THEME_CACHE_MAX_ENTRIES) {
        const oldestKey = publishedSiteThemeCache.keys().next().value;
        if (oldestKey && oldestKey !== key) publishedSiteThemeCache.delete(oldestKey);
    }

    return entry;
}

function refreshPublishedSiteTheme(
    args: LoaderFunctionArgs,
    entry: SiteThemeCacheEntry
): Promise<ComponentWithComponentData | null> {
    const now = Date.now();
    if (entry.refresh && now - entry.refreshStartedAt < SITE_THEME_REFRESH_HARD_TIMEOUT_MS) {
        return entry.refresh;
    }

    // A generation that has exceeded the hard timeout may be superseded by the
    // next request. Its promise cannot be cancelled, so use an identity plus
    // generation guard below to prevent a late result from overwriting the
    // replacement generation.
    const generation = entry.refreshGeneration + 1;
    entry.refreshGeneration = generation;
    entry.refreshStartedAt = now;

    const refresh = fetchHeaderOwnerOnce(args)
        .then(projectSiteThemeHeaderOwner)
        .then((value) => {
            if (entry.refreshGeneration !== generation || entry.refresh !== refresh) return value;
            entry.hasValue = true;
            entry.value = value;
            entry.refreshedAt = Date.now();
            return value;
        })
        .finally(() => {
            if (entry.refreshGeneration === generation && entry.refresh === refresh) entry.refresh = null;
        });

    entry.refresh = refresh;
    return refresh;
}

async function waitForSiteThemeRefresh(
    refresh: Promise<ComponentWithComponentData | null>
): Promise<ComponentWithComponentData | null> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutSentinel = Symbol('site-theme-refresh-timeout');
    const timeout = new Promise<typeof timeoutSentinel>((resolve) => {
        timeoutId = setTimeout(() => resolve(timeoutSentinel), SITE_THEME_COLD_WAIT_MS);
    });

    try {
        const result = await Promise.race([refresh, timeout]);
        if (result === timeoutSentinel) {
            // Bound this caller's critical-path wait, but leave the refresh in
            // flight so a slightly slow valid response can warm the cache in
            // the background. A later request can supersede it only after the
            // hard timeout enforced by refreshPublishedSiteTheme().
            return null;
        }
        return result;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

/**
 * Fetches the fixed Page Designer Header owner at most once per request. Root
 * uses the raw owner for critical theming; `_app` enriches the same result with
 * Mega Menu feature batches without issuing a second component request.
 */
export function fetchHeaderOwnerOnce(args: LoaderFunctionArgs): Promise<ComponentWithComponentData | null> {
    const existing = args.context.get(headerOwnerPromiseContext);
    if (existing) return existing;

    const pending = fetchComponentWithComponentData(
        args,
        { componentId: HEADER_COMPONENT_ID },
        {
            preserveRequestedComponentId: true,
            excludeDescendantLoaderTypeIds: [MEGA_MENU_FEATURE_TYPE_ID],
        }
    );
    args.context.set(headerOwnerPromiseContext, pending);
    return pending;
}

export async function fetchHeaderOwnerWithMegaMenuDataOnce(
    args: LoaderFunctionArgs
): Promise<ComponentWithComponentData | null> {
    return withMegaMenuFeatureData(args.context, await fetchHeaderOwnerOnce(args));
}

/**
 * Returns the published Site Theme projection for the universal root shell.
 *
 * - Edit/Preview never read or mutate the published cache.
 * - A warm value is returned synchronously from the per-instance cache.
 * - An expired value is replaced by a bounded refresh rather than served stale.
 * - A cold or expired request waits at most one second, keeping an unavailable Shopper
 *   Experience API from delaying checkout or authentication indefinitely.
 *
 * After the 30-second freshness window, the next request either receives the
 * refreshed projection or fails closed to the code-defined palette. Only the
 * minimal, non-personal theme child is cached; `_app` still uses the
 * request-scoped raw owner for navigation.
 */
export async function fetchPublishedSiteThemeHeader(
    args: LoaderFunctionArgs,
    scope: SiteThemeCacheScope
): Promise<ComponentWithComponentData | null> {
    if (isDesignModeActive(args.request) || isPreviewModeActive(args.request)) return null;

    const entry = getOrCreateSiteThemeCacheEntry(getSiteThemeCacheKey(scope));
    const age = Date.now() - entry.refreshedAt;

    if (entry.hasValue && age < SITE_THEME_CACHE_TTL_MS) return entry.value;

    const refresh = refreshPublishedSiteTheme(args, entry);
    return waitForSiteThemeRefresh(refresh);
}

/** Test-only reset for deterministic cache and timeout coverage. */
export function resetPublishedSiteThemeCache(): void {
    publishedSiteThemeCache.clear();
}
