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

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { fetchBlogPost, searchAllBlogPosts, searchBlogPosts } from './content.server';

vi.mock('@/lib/api-clients.server', () => ({
    createApiClients: vi.fn(),
}));

const getContent = vi.fn();
const searchContent = vi.fn();
const context = {} as never;

function apiError(status: number) {
    return new ApiError({
        status,
        statusText: status === 404 ? 'Not Found' : 'Server Error',
        headers: new Headers(),
        body: { type: '', title: 'Error', detail: 'Failure' },
        rawBody: '',
        url: 'https://example.com',
        method: 'GET',
    });
}

describe('blog Content Asset data access', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createApiClients).mockReturnValue({
            shopperExperience: { getContent, searchContent },
        } as never);
    });

    test('fetches and normalizes a post by Content Asset ID', async () => {
        getContent.mockResolvedValue({
            data: { id: 'summer-edit', name: 'Summer edit', c_sfnextBlogBody: '<p>Article</p>' },
        });

        await expect(fetchBlogPost(context, 'summer-edit')).resolves.toMatchObject({
            id: 'summer-edit',
            title: 'Summer edit',
            bodyHtml: '<p>Article</p>',
        });
        expect(getContent).toHaveBeenCalledWith({ params: { path: { id: 'summer-edit' }, query: {} } });
    });

    test('does not call SCAPI for an unsafe ID and hides offline content', async () => {
        await expect(fetchBlogPost(context, '../private')).resolves.toBeNull();
        expect(createApiClients).not.toHaveBeenCalled();

        getContent.mockResolvedValue({ data: { id: 'draft', c_online: false, c_sfnextBlogBody: '<p>Draft</p>' } });
        await expect(fetchBlogPost(context, 'draft')).resolves.toBeNull();

        getContent.mockResolvedValue({ data: { id: 'ordinary-content', name: 'Not a blog post' } });
        await expect(fetchBlogPost(context, 'ordinary-content')).resolves.toBeNull();
    });

    test('maps only a 404 to null and preserves operational failures', async () => {
        getContent.mockRejectedValueOnce(apiError(404));
        await expect(fetchBlogPost(context, 'missing')).resolves.toBeNull();

        const error = apiError(500);
        getContent.mockRejectedValueOnce(error);
        await expect(fetchBlogPost(context, 'broken')).rejects.toBe(error);
    });

    test('searches one folder, clamps pagination and applies only a safe sort', async () => {
        searchContent.mockResolvedValue({
            data: {
                hits: [
                    { id: 'one', name: 'One', c_sfnextBlogBody: '<p>One</p>' },
                    { id: 'hidden', name: 'Hidden', c_online: false, c_sfnextBlogBody: '<p>Hidden</p>' },
                    { id: 'ordinary-content', name: 'Not a blog post' },
                ],
            },
        });

        await expect(
            searchBlogPosts(context, {
                folderId: 'blog-posts',
                limit: 999,
                offset: -10,
                query: '  summer\u0000  ',
                sort: 'c_sfnextBlogPublishedAt=desc',
            })
        ).resolves.toMatchObject([{ id: 'one', title: 'One' }]);
        expect(searchContent).toHaveBeenCalledWith({
            params: {
                query: {
                    refine: 'fdid=blog-posts',
                    limit: 200,
                    offset: 0,
                    q: 'summer',
                    sort: 'c_sfnextBlogPublishedAt=desc',
                },
            },
        });
    });

    test('rejects an unsafe folder locally and omits an invalid sort', async () => {
        await expect(searchBlogPosts(context, { folderId: 'folder|other', limit: 20 })).resolves.toEqual([]);
        expect(createApiClients).not.toHaveBeenCalled();

        searchContent.mockResolvedValue({ data: { hits: [] } });
        await searchBlogPosts(context, { folderId: 'blog-posts', limit: 20, sort: 'name;drop=desc' });
        expect(searchContent).toHaveBeenCalledWith({
            params: { query: { refine: 'fdid=blog-posts', limit: 20, offset: 0 } },
        });
    });

    test('retrieves a complete folder in batches of 200 using total and hits', async () => {
        const allHits = Array.from({ length: 450 }, (_, index) => ({
            id: `post-${index}`,
            name: `Post ${index}`,
            c_sfnextBlogBody: `<p>Post ${index}</p>`,
        }));
        searchContent.mockImplementation((request) => {
            const { offset, limit } = (request as { params: { query: { offset: number; limit: number } } }).params
                .query;
            return Promise.resolve({
                data: { total: allHits.length, hits: allHits.slice(offset, offset + limit) },
            });
        });

        const posts = await searchAllBlogPosts(context, {
            folderId: 'blog-posts',
            query: 'summer',
            sort: 'c_sfnextBlogPublishedAt=desc',
        });

        expect(posts).toHaveLength(450);
        expect(posts.at(0)?.id).toBe('post-0');
        expect(posts.at(-1)?.id).toBe('post-449');
        expect(searchContent).toHaveBeenCalledTimes(3);
        expect(searchContent).toHaveBeenNthCalledWith(1, {
            params: {
                query: {
                    refine: 'fdid=blog-posts',
                    limit: 200,
                    offset: 0,
                    q: 'summer',
                    sort: 'c_sfnextBlogPublishedAt=desc',
                },
            },
        });
        expect(searchContent).toHaveBeenNthCalledWith(3, {
            params: {
                query: {
                    refine: 'fdid=blog-posts',
                    limit: 50,
                    offset: 400,
                    q: 'summer',
                    sort: 'c_sfnextBlogPublishedAt=desc',
                },
            },
        });
    });

    test('caps an unexpectedly large folder at 10,000 results and 50 requests', async () => {
        searchContent.mockImplementation((request) => {
            const { offset, limit } = (request as { params: { query: { offset: number; limit: number } } }).params
                .query;
            return Promise.resolve({
                data: {
                    total: 20_000,
                    hits: Array.from({ length: limit }, (_, index) => ({
                        id: `post-${offset + index}`,
                        name: `Post ${offset + index}`,
                        c_sfnextBlogBody: `<p>Post ${offset + index}</p>`,
                    })),
                },
            });
        });

        const posts = await searchAllBlogPosts(context, { folderId: 'large-blog' });

        expect(posts).toHaveLength(10_000);
        expect(searchContent).toHaveBeenCalledTimes(50);
        expect(searchContent).toHaveBeenLastCalledWith({
            params: { query: { refine: 'fdid=large-blog', limit: 200, offset: 9_800 } },
        });
    });

    test('stops on a short page even when an inconsistent total claims more results', async () => {
        searchContent.mockResolvedValue({
            data: {
                total: 1_000,
                hits: [
                    { id: 'one', name: 'One', c_sfnextBlogBody: '<p>One</p>' },
                    { id: 'two', name: 'Two', c_sfnextBlogBody: '<p>Two</p>' },
                ],
            },
        });

        await expect(searchAllBlogPosts(context, { folderId: 'blog-posts' })).resolves.toHaveLength(2);
        expect(searchContent).toHaveBeenCalledTimes(1);
    });
});
