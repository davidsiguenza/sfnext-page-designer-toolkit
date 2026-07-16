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
import { getLogger } from '@/lib/logger.server';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import { searchAllBlogPosts } from '@/extensions/page-designer-toolkit/blog/content.server';

const MAX_PAGE_SIZE = 24;

export interface BlogPostGridData {
    posts: BlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    paginationParam: string;
    error?: boolean;
}

interface BlogPostGridComponentData {
    folderId?: unknown;
    pageSize?: unknown;
    featuredOnly?: unknown;
    category?: unknown;
    sort?: unknown;
}

function normalizeInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(Math.max(Math.floor(numericValue), minimum), maximum) : fallback;
}

function normalizeString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizePaginationParam(componentId: unknown): string {
    const safeId = normalizeString(componentId)
        ?.replace(/[^A-Za-z0-9_-]/g, '')
        .slice(0, 64);
    return safeId ? `blogPage_${safeId}` : 'blogPage';
}

function dateValue(value: string | undefined): number {
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function prepareBlogPostGridData(
    posts: BlogPost[],
    options: {
        pageSize: number;
        requestedPage: number;
        paginationParam: string;
        featuredOnly: boolean;
        category?: string;
        sort: string;
    }
): BlogPostGridData {
    const normalizedCategory = options.category?.toLocaleLowerCase();
    const filteredPosts = posts.filter((post) => {
        if (options.featuredOnly && !post.featured) return false;
        return !normalizedCategory || post.category?.toLocaleLowerCase() === normalizedCategory;
    });

    const sortedPosts = [...filteredPosts].sort((left, right) => {
        if (options.sort === 'oldest') return dateValue(left.publishedAt) - dateValue(right.publishedAt);
        if (options.sort === 'title') return left.title.localeCompare(right.title);
        return dateValue(right.publishedAt) - dateValue(left.publishedAt);
    });
    const total = sortedPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / options.pageSize));
    const currentPage = Math.min(Math.max(options.requestedPage, 1), totalPages);
    const start = (currentPage - 1) * options.pageSize;

    return {
        posts: sortedPosts.slice(start, start + options.pageSize),
        total,
        totalPages,
        currentPage,
        pageSize: options.pageSize,
        paginationParam: options.paginationParam,
    };
}

/** Loads, normalizes, filters, sorts, and paginates blog Content Assets for Page Designer. */
export async function loader({
    componentData,
    context,
    request,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
    request: Request;
}): Promise<BlogPostGridData> {
    const component = componentData as ShopperExperience.schemas['Component'];
    const configured = (component.data ?? {}) as BlogPostGridComponentData;
    const folderId = normalizeString(configured.folderId) || 'sfnext-blog';
    const pageSize = normalizeInteger(configured.pageSize, 12, 1, MAX_PAGE_SIZE);
    const paginationParam = normalizePaginationParam(component.id);
    const requestedPage = normalizeInteger(new URL(request.url).searchParams.get(paginationParam), 1, 1, 10_000);
    const category = normalizeString(configured.category);
    const sort = normalizeString(configured.sort) || 'newest';

    try {
        const posts = await searchAllBlogPosts(context, { folderId });
        return prepareBlogPostGridData(posts, {
            pageSize,
            requestedPage,
            paginationParam,
            featuredOnly: configured.featuredOnly === true,
            category,
            sort,
        });
    } catch (error) {
        getLogger(context).warn('SFNext Toolkit blog search failed', {
            folderId,
            error: error instanceof Error ? error.name : 'UnknownError',
        });
        return {
            posts: [],
            total: 0,
            totalPages: 1,
            currentPage: 1,
            pageSize,
            paginationParam,
            error: true,
        };
    }
}
