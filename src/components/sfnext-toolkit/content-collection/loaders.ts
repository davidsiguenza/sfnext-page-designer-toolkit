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

import type { LoaderFunctionArgs } from 'react-router';
import type { ShopperExperience } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { getLogger } from '@/lib/logger.server';
import {
    normalizeContentCollectionItem,
    normalizeContentFolderId,
    parseSelectedContentIds,
    type ContentCollectionItem,
    type ContentFieldMappings,
} from './content-model';

const DEFAULT_FOLDER_ID = 'sfnext-blog';
const DEFAULT_ITEM_LIMIT = 6;
const MAX_ITEM_LIMIT = 24;
const CONTENT_SEARCH_PAGE_SIZE = 200;
// Sorting mapped Content fields happens after normalization, so Latest mode may
// need more than one search page. Keep that scan bounded for predictable SSR
// latency and ask merchants to use a narrower folder when the ceiling is hit.
const MAX_CONTENT_SEARCH_REQUESTS = 5;
const MAX_AGGREGATED_RESULTS = CONTENT_SEARCH_PAGE_SIZE * MAX_CONTENT_SEARCH_REQUESTS;

export type ContentCollectionSourceMode = 'manual' | 'latest';
export type ContentCollectionFilter = 'all' | 'blog' | 'generic';
export type ContentCollectionSort = 'newest' | 'oldest' | 'title';
export type ContentCollectionStatus = 'ready' | 'empty' | 'unconfigured' | 'error';

export interface ContentCollectionData {
    items: ContentCollectionItem[];
    sourceMode: ContentCollectionSourceMode;
    status: ContentCollectionStatus;
    missingIds: string[];
    invalidIdCount: number;
    filteredCount: number;
    selectionTruncated: boolean;
    searchTruncated: boolean;
}

interface ContentCollectionComponentData extends ContentFieldMappings {
    sourceMode?: unknown;
    selectedContentIds?: unknown;
    folderId?: unknown;
    limit?: unknown;
    contentType?: unknown;
    sort?: unknown;
}

function normalizeString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(Math.max(Math.floor(numericValue), minimum), maximum) : fallback;
}

function normalizeOption<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function normalizeMappings(data: ContentCollectionComponentData): ContentFieldMappings {
    return {
        titleAttribute: normalizeString(data.titleAttribute),
        excerptAttribute: normalizeString(data.excerptAttribute),
        imageAttribute: normalizeString(data.imageAttribute),
        imageAltAttribute: normalizeString(data.imageAltAttribute),
        dateAttribute: normalizeString(data.dateAttribute),
        authorAttribute: normalizeString(data.authorAttribute),
        categoryAttribute: normalizeString(data.categoryAttribute),
        linkAttribute: normalizeString(data.linkAttribute),
    };
}

function matchesFilter(item: ContentCollectionItem, filter: ContentCollectionFilter): boolean {
    return filter === 'all' || item.kind === filter;
}

function dateValue(item: ContentCollectionItem): number {
    const value = item.publishedAt || item.updatedAt;
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareTitle(left: ContentCollectionItem, right: ContentCollectionItem): number {
    return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
}

export function prepareLatestItems(
    items: ContentCollectionItem[],
    options: { filter: ContentCollectionFilter; sort: ContentCollectionSort; limit: number }
): { items: ContentCollectionItem[]; filteredCount: number } {
    const matchingItems = items.filter((item) => matchesFilter(item, options.filter));
    const filteredCount = items.length - matchingItems.length;
    const sortedItems = [...matchingItems].sort((left, right) => {
        if (options.sort === 'title') return compareTitle(left, right);
        const dateDifference = dateValue(left) - dateValue(right);
        if (dateDifference !== 0) return options.sort === 'oldest' ? dateDifference : -dateDifference;
        return compareTitle(left, right);
    });

    return { items: sortedItems.slice(0, options.limit), filteredCount };
}

function emptyResult(
    sourceMode: ContentCollectionSourceMode,
    status: ContentCollectionStatus,
    overrides: Partial<ContentCollectionData> = {}
): ContentCollectionData {
    return {
        items: [],
        sourceMode,
        status,
        missingIds: [],
        invalidIdCount: 0,
        filteredCount: 0,
        selectionTruncated: false,
        searchTruncated: false,
        ...overrides,
    };
}

async function loadSelectedItems(
    context: LoaderFunctionArgs['context'],
    ids: string[],
    mappings: ContentFieldMappings,
    filter: ContentCollectionFilter
): Promise<{ items: ContentCollectionItem[]; missingIds: string[]; filteredCount: number }> {
    const clients = createApiClients(context);
    const response = await clients.shopperExperience.getMultipleContent({
        params: { query: { ids } },
    });
    const records = Array.isArray(response.data?.data) ? response.data.data : [];
    const normalized = records
        .map((record) => normalizeContentCollectionItem(record, mappings))
        .filter((item): item is ContentCollectionItem => item !== null);
    const itemsById = new Map(normalized.map((item) => [item.id, item]));
    const orderedItems = ids.flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
    });
    const missingIds = ids.filter((id) => !itemsById.has(id));
    const items = orderedItems.filter((item) => matchesFilter(item, filter));

    return { items, missingIds, filteredCount: orderedItems.length - items.length };
}

async function searchAllItems(
    context: LoaderFunctionArgs['context'],
    folderId: string,
    mappings: ContentFieldMappings
): Promise<{ items: ContentCollectionItem[]; truncated: boolean }> {
    const clients = createApiClients(context);
    const items: ContentCollectionItem[] = [];
    const seenIds = new Set<string>();
    let offset = 0;
    let expectedTotal: number | undefined;
    let lastPageWasFull = false;

    while (offset < MAX_AGGREGATED_RESULTS) {
        const remainingByTotal = expectedTotal === undefined ? MAX_AGGREGATED_RESULTS - offset : expectedTotal - offset;
        const limit = Math.min(CONTENT_SEARCH_PAGE_SIZE, MAX_AGGREGATED_RESULTS - offset, remainingByTotal);
        if (limit <= 0) break;

        const response = await clients.shopperExperience.searchContent({
            params: { query: { refine: `fdid=${folderId}`, limit, offset } },
        });
        const hits = Array.isArray(response.data?.hits) ? response.data.hits.slice(0, limit) : [];
        if (hits.length === 0) break;

        for (const hit of hits) {
            const item = normalizeContentCollectionItem(hit, mappings);
            if (item && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                items.push(item);
            }
        }

        offset += hits.length;
        lastPageWasFull = hits.length === limit;
        const total = response.data?.total;
        if (typeof total === 'number' && Number.isFinite(total) && total >= 0) expectedTotal = Math.trunc(total);

        if (hits.length < limit) break;
        if (expectedTotal !== undefined && offset >= expectedTotal) break;
    }

    const truncated =
        expectedTotal !== undefined ? expectedTotal > offset : offset >= MAX_AGGREGATED_RESULTS && lastPageWasFull;
    return { items, truncated };
}

/** Loads manually curated or folder-backed Content Assets for Page Designer. */
export async function loader({
    componentData,
    context,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
}): Promise<ContentCollectionData> {
    const component = componentData as ShopperExperience.schemas['Component'];
    const configured = (component.data ?? {}) as ContentCollectionComponentData;
    const sourceMode = normalizeOption(configured.sourceMode, ['manual', 'latest'] as const, 'latest');
    const contentFilter = normalizeOption(configured.contentType, ['all', 'blog', 'generic'] as const, 'all');
    const sort = normalizeOption(configured.sort, ['newest', 'oldest', 'title'] as const, 'newest');
    const limit = normalizeInteger(configured.limit, DEFAULT_ITEM_LIMIT, 1, MAX_ITEM_LIMIT);
    const mappings = normalizeMappings(configured);

    if (sourceMode === 'manual') {
        const selection = parseSelectedContentIds(configured.selectedContentIds, limit);
        if (selection.ids.length === 0) {
            return emptyResult(sourceMode, 'unconfigured', {
                invalidIdCount: selection.invalidCount,
                selectionTruncated: selection.truncated,
            });
        }

        try {
            const result = await loadSelectedItems(context, selection.ids, mappings, contentFilter);
            return {
                items: result.items,
                sourceMode,
                status: result.items.length > 0 ? 'ready' : 'empty',
                missingIds: result.missingIds,
                invalidIdCount: selection.invalidCount,
                filteredCount: result.filteredCount,
                selectionTruncated: selection.truncated,
                searchTruncated: false,
            };
        } catch (error) {
            getLogger(context).warn('SFNext Toolkit manual content collection failed', {
                sourceMode,
                error: error instanceof Error ? error.name : 'UnknownError',
            });
            return emptyResult(sourceMode, 'error', {
                invalidIdCount: selection.invalidCount,
                selectionTruncated: selection.truncated,
            });
        }
    }

    const configuredFolder = normalizeString(configured.folderId) || DEFAULT_FOLDER_ID;
    const folderId = normalizeContentFolderId(configuredFolder);
    if (!folderId) return emptyResult(sourceMode, 'unconfigured');

    try {
        const result = await searchAllItems(context, folderId, mappings);
        const prepared = prepareLatestItems(result.items, { filter: contentFilter, sort, limit });
        return {
            items: prepared.items,
            sourceMode,
            status: prepared.items.length > 0 ? 'ready' : 'empty',
            missingIds: [],
            invalidIdCount: 0,
            filteredCount: prepared.filteredCount,
            selectionTruncated: false,
            searchTruncated: result.truncated,
        };
    } catch (error) {
        getLogger(context).warn('SFNext Toolkit latest content collection failed', {
            sourceMode,
            folderId,
            error: error instanceof Error ? error.name : 'UnknownError',
        });
        return emptyResult(sourceMode, 'error');
    }
}
