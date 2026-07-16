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

import type { RouterContextProvider } from 'react-router';
import { ApiError } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { isValidBlogPostId, normalizeBlogPost, type BlogPost } from './content-model';

export { normalizeBlogPost } from './content-model';
export type { BlogPost } from './content-model';

const MAX_CONTENT_SEARCH_LIMIT = 200;
const MAX_AGGREGATED_SEARCH_RESULTS = 10_000;
const SAFE_SORT = /^[A-Za-z][A-Za-z0-9_]*=(?:asc|desc)$/;
const UNSAFE_REFINEMENT_CHARACTERS = /[=|()]/;

export interface SearchBlogPostsOptions {
    /** Online Content folder configured for blog posts. */
    folderId: string;
    /** SCAPI accepts 1..200; out-of-range values are clamped. */
    limit: number;
    offset?: number;
    query?: string;
    /** Optional Content Search sort expression, for example c_blogPublishDate=desc. */
    sort?: string;
}

export interface SearchAllBlogPostsOptions extends Omit<SearchBlogPostsOptions, 'limit' | 'offset'> {
    /** Hard safety ceiling. Values above 10,000 are clamped. */
    maxResults?: number;
}

interface NormalizedSearchOptions {
    folderId: string;
    query?: string;
    sort?: string;
}

function isNotFound(error: unknown): boolean {
    if (error instanceof ApiError) return error.status === 404;
    return Boolean(
        error &&
            typeof error === 'object' &&
            'status' in error &&
            typeof (error as { status?: unknown }).status === 'number' &&
            (error as { status: number }).status === 404
    );
}

function normalizeFolderId(folderId: string): string | undefined {
    const normalized = folderId.trim();
    if (!normalized || UNSAFE_REFINEMENT_CHARACTERS.test(normalized) || containsControlCharacter(normalized)) {
        return undefined;
    }
    return normalized;
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

function normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) return 50;
    return Math.min(MAX_CONTENT_SEARCH_LIMIT, Math.max(1, Math.trunc(limit)));
}

function normalizeOffset(offset: number | undefined): number {
    return Number.isFinite(offset) ? Math.max(0, Math.trunc(offset as number)) : 0;
}

function normalizeMaxResults(maxResults: number | undefined): number {
    if (!Number.isFinite(maxResults)) return MAX_AGGREGATED_SEARCH_RESULTS;
    return Math.min(MAX_AGGREGATED_SEARCH_RESULTS, Math.max(1, Math.trunc(maxResults as number)));
}

function normalizeSearchOptions(
    options: Pick<SearchBlogPostsOptions, 'folderId' | 'query' | 'sort'>
): NormalizedSearchOptions | undefined {
    const folderId = normalizeFolderId(options.folderId);
    if (!folderId) return undefined;

    const query = options.query ? stripControlCharacters(options.query).trim().slice(0, 4000) : undefined;
    const sort = options.sort?.trim();
    return {
        folderId,
        ...(query ? { query } : {}),
        ...(sort && SAFE_SORT.test(sort) ? { sort } : {}),
    };
}

function buildSearchQuery(options: NormalizedSearchOptions, limit: number, offset: number) {
    return {
        refine: `fdid=${options.folderId}`,
        limit,
        offset,
        ...(options.query ? { q: options.query } : {}),
        ...(options.sort ? { sort: options.sort } : {}),
    };
}

function normalizeHits(hits: unknown): BlogPost[] {
    if (!Array.isArray(hits)) return [];
    return hits.map((content) => normalizeBlogPost(content)).filter(isRenderableBlogPost);
}

/** The toolkit's localized body attribute is the explicit blog-post marker. */
function isRenderableBlogPost(post: BlogPost | null): post is BlogPost {
    return Boolean(post?.visible && post.bodyHtml?.trim());
}

function normalizeTotal(total: unknown): number | undefined {
    return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? Math.trunc(total) : undefined;
}

/**
 * Loads one online Blog Content Asset. By convention `postId` is both the
 * Content Asset ID and the public slug used by `/blog/:postId`.
 */
export async function fetchBlogPost(
    context: RouterContextProvider | Readonly<RouterContextProvider>,
    postId: string
): Promise<BlogPost | null> {
    if (!isValidBlogPostId(postId)) return null;

    try {
        const clients = createApiClients(context);
        const response = await clients.shopperExperience.getContent({
            params: {
                path: { id: postId },
                query: {},
            },
        });
        const post = normalizeBlogPost(response.data);
        return isRenderableBlogPost(post) ? post : null;
    } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
    }
}

/**
 * Searches the configured Blog folder and returns normalized online posts.
 * Filtering, presentation order and client-visible pagination intentionally stay
 * with BlogPostGrid; this boundary only performs the indexed folder search.
 */
export async function searchBlogPosts(
    context: RouterContextProvider | Readonly<RouterContextProvider>,
    options: SearchBlogPostsOptions
): Promise<BlogPost[]> {
    const normalizedOptions = normalizeSearchOptions(options);
    if (!normalizedOptions) return [];

    const clients = createApiClients(context);
    const response = await clients.shopperExperience.searchContent({
        params: {
            query: buildSearchQuery(normalizedOptions, normalizeLimit(options.limit), normalizeOffset(options.offset)),
        },
    });

    return normalizeHits(response.data?.hits);
}

/**
 * Retrieves every online post in a Content folder in SCAPI-sized batches.
 *
 * The result count and request count are both bounded, and an empty or short
 * page terminates pagination even if an inconsistent upstream `total` claims
 * that more results exist. IDs are de-duplicated defensively across pages.
 */
export async function searchAllBlogPosts(
    context: RouterContextProvider | Readonly<RouterContextProvider>,
    options: SearchAllBlogPostsOptions
): Promise<BlogPost[]> {
    const normalizedOptions = normalizeSearchOptions(options);
    if (!normalizedOptions) return [];

    const maxResults = normalizeMaxResults(options.maxResults);
    const maxRequests = Math.ceil(maxResults / MAX_CONTENT_SEARCH_LIMIT);
    const clients = createApiClients(context);
    const posts: BlogPost[] = [];
    const seenIds = new Set<string>();
    let offset = 0;
    let expectedTotal: number | undefined;
    let requestCount = 0;

    while (offset < maxResults && requestCount < maxRequests) {
        const remainingByTotal = expectedTotal === undefined ? maxResults - offset : expectedTotal - offset;
        const limit = Math.min(MAX_CONTENT_SEARCH_LIMIT, maxResults - offset, remainingByTotal);
        if (limit <= 0) break;

        requestCount += 1;
        const response = await clients.shopperExperience.searchContent({
            params: { query: buildSearchQuery(normalizedOptions, limit, offset) },
        });
        const hits = Array.isArray(response.data?.hits) ? response.data.hits.slice(0, limit) : [];
        if (hits.length === 0) break;

        for (const post of normalizeHits(hits)) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                posts.push(post);
            }
        }

        offset += hits.length;
        expectedTotal = normalizeTotal(response.data?.total) ?? expectedTotal;

        if (hits.length < limit) break;
        if (expectedTotal !== undefined && offset >= expectedTotal) break;
    }

    return posts;
}
