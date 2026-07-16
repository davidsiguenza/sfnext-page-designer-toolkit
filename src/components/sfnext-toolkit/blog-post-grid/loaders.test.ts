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
import type { LoaderFunctionArgs } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import { searchAllBlogPosts } from '@/extensions/page-designer-toolkit/blog/content.server';
import { loader, prepareBlogPostGridData } from './loaders';

const loggerMocks = vi.hoisted(() => {
    const logger = {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    };
    return { logger, getLogger: vi.fn(() => logger) };
});

vi.mock('@/extensions/page-designer-toolkit/blog/content.server', () => ({ searchAllBlogPosts: vi.fn() }));
vi.mock('@/lib/logger.server', () => ({ getLogger: loggerMocks.getLogger }));

const mockedSearchAllBlogPosts = vi.mocked(searchAllBlogPosts);
const context = {} as LoaderFunctionArgs['context'];

function makePost(id: string, overrides: Partial<BlogPost> = {}): BlogPost {
    return {
        id,
        slug: id,
        title: `Post ${id}`,
        tags: [],
        featured: false,
        seoTitle: `Post ${id}`,
        seoKeywords: [],
        visible: true,
        ...overrides,
    };
}

describe('SFNext Toolkit blog post grid data preparation', () => {
    const posts = [
        makePost('zebra', {
            title: 'Zebra layers',
            category: 'News',
            featured: true,
            publishedAt: '2026-02-10T00:00:00.000Z',
        }),
        makePost('alpha', {
            title: 'Alpha essentials',
            category: 'news',
            featured: true,
            publishedAt: '2026-03-15T00:00:00.000Z',
        }),
        makePost('middle', {
            title: 'Middle story',
            category: 'News',
            featured: false,
            publishedAt: '2026-01-05T00:00:00.000Z',
        }),
    ];

    test('filters case-insensitively, sorts by title and paginates the filtered result', () => {
        const result = prepareBlogPostGridData(posts, {
            pageSize: 1,
            requestedPage: 2,
            paginationParam: 'blogPage_featured',
            featuredOnly: true,
            category: 'NEWS',
            sort: 'title',
        });

        expect(result).toMatchObject({
            total: 2,
            totalPages: 2,
            currentPage: 2,
            pageSize: 1,
            paginationParam: 'blogPage_featured',
        });
        expect(result.posts.map((post) => post.id)).toEqual(['zebra']);
    });

    test.each([
        ['newest', ['alpha', 'zebra', 'middle']],
        ['oldest', ['middle', 'zebra', 'alpha']],
    ])('supports %s publication-date ordering', (sort, expectedIds) => {
        const result = prepareBlogPostGridData(posts, {
            pageSize: 24,
            requestedPage: 1,
            paginationParam: 'blogPage',
            featuredOnly: false,
            sort,
        });

        expect(result.posts.map((post) => post.id)).toEqual(expectedIds);
    });

    test('clamps an out-of-range page and keeps empty collections on page one', () => {
        const lastPage = prepareBlogPostGridData(posts, {
            pageSize: 2,
            requestedPage: 99,
            paginationParam: 'blogPage',
            featuredOnly: false,
            sort: 'newest',
        });
        const empty = prepareBlogPostGridData([], {
            pageSize: 12,
            requestedPage: 9,
            paginationParam: 'blogPage',
            featuredOnly: false,
            sort: 'newest',
        });

        expect(lastPage.currentPage).toBe(2);
        expect(lastPage.posts.map((post) => post.id)).toEqual(['middle']);
        expect(empty).toMatchObject({ posts: [], total: 0, totalPages: 1, currentPage: 1 });
    });
});

describe('SFNext Toolkit blog post grid loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('searches the configured folder and normalizes filters, limits and component-scoped pagination', async () => {
        const posts = Array.from({ length: 30 }, (_, index) =>
            makePost(`post-${index + 1}`, {
                title: `Post ${String(index + 1).padStart(2, '0')}`,
                category: index === 0 ? 'Other' : 'News',
                featured: index !== 1,
                publishedAt: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
            })
        );
        mockedSearchAllBlogPosts.mockResolvedValue(posts);

        const result = await loader({
            componentData: {
                id: 'grid @home!',
                data: {
                    folderId: '  editorial-blog  ',
                    pageSize: 99,
                    featuredOnly: true,
                    category: ' NEWS ',
                    sort: ' oldest ',
                },
            },
            context,
            request: new Request('https://example.com/blog?blogPage_gridhome=2'),
        });

        expect(mockedSearchAllBlogPosts).toHaveBeenCalledWith(context, { folderId: 'editorial-blog' });
        expect(result).toMatchObject({
            total: 28,
            totalPages: 2,
            currentPage: 2,
            pageSize: 24,
            paginationParam: 'blogPage_gridhome',
        });
        expect(result.posts.map((post) => post.id)).toEqual(['post-27', 'post-28', 'post-29', 'post-30']);
    });

    test('returns a stable error result and warns without leaking the original error message', async () => {
        mockedSearchAllBlogPosts.mockRejectedValue(new TypeError('secret upstream response'));

        const result = await loader({
            componentData: { data: { pageSize: 'invalid' } },
            context,
            request: new Request('https://example.com/blog?blogPage=9'),
        });

        expect(mockedSearchAllBlogPosts).toHaveBeenCalledWith(context, { folderId: 'sfnext-blog' });
        expect(result).toEqual({
            posts: [],
            total: 0,
            totalPages: 1,
            currentPage: 1,
            pageSize: 12,
            paginationParam: 'blogPage',
            error: true,
        });
        expect(loggerMocks.getLogger).toHaveBeenCalledWith(context);
        expect(loggerMocks.logger.warn).toHaveBeenCalledWith('SFNext Toolkit blog search failed', {
            folderId: 'sfnext-blog',
            error: 'TypeError',
        });
        expect(loggerMocks.logger.warn).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ error: 'secret upstream response' })
        );
    });
});
