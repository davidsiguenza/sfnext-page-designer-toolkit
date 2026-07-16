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

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { ApiError, type ShopperExperience } from '@/scapi';
import { fetchBlogPost } from '@/extensions/page-designer-toolkit/blog/content.server';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import { BLOG_POST_PAGE_TYPE_ID } from '@/extensions/page-designer-toolkit/blog/page-types';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';
import BlogPostRoute, { loader } from './_app.blog.$postId';

vi.mock('@/extensions/page-designer-toolkit/blog/content.server', () => ({
    fetchBlogPost: vi.fn(),
}));

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentData: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/mode', () => ({
    isDesignModeActive: vi.fn(() => false),
    isPreviewModeActive: vi.fn(() => false),
}));

vi.mock('@/extensions/page-designer-toolkit/blog/blog-post', () => ({
    BlogPostRenderer: ({ post, pageUrl, isAuthoring }: { post: BlogPost; pageUrl: string; isAuthoring: boolean }) => (
        <div data-testid="post-renderer" data-url={pageUrl} data-authoring={String(isAuthoring)}>
            {post.title}
        </div>
    ),
}));

const post: BlogPost = {
    id: 'summer-edit',
    slug: 'summer-edit',
    title: 'Summer edit',
    tags: [],
    featured: false,
    seoTitle: 'Summer edit',
    seoKeywords: [],
    visible: true,
};

const layoutPage = {
    id: 'blog-post-layout',
    typeId: BLOG_POST_PAGE_TYPE_ID,
    name: 'Blog post layout',
    visible: true,
    regions: [],
} as ShopperExperience.schemas['Page'];

function createArgs(postId = post.id, request?: Request) {
    return {
        request: request || new Request(`https://internal.example/es/es/blog/${postId}?utm_source=test`),
        params: { postId },
        context: { get: vi.fn(), set: vi.fn() },
    } as never;
}

describe('SFNext Toolkit blog post route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchBlogPost).mockResolvedValue(post);
        vi.mocked(fetchPageWithComponentData).mockResolvedValue(layoutPage);
        vi.mocked(isDesignModeActive).mockReturnValue(false);
        vi.mocked(isPreviewModeActive).mockReturnValue(false);
    });

    test('loads a Content Asset by slug with the optional Blog Post layout', async () => {
        const request = new Request('http://internal.example/es/es/blog/summer-edit', {
            headers: { 'x-forwarded-host': 'shop.example.com', 'x-forwarded-proto': 'https' },
        });
        await expect(loader(createArgs(post.id, request))).resolves.toMatchObject({
            post,
            layoutPage,
            pageUrl: 'https://shop.example.com/es/es/blog/summer-edit',
            isAuthoring: false,
        });
        expect(fetchBlogPost).toHaveBeenCalledWith(expect.anything(), 'summer-edit');
        expect(fetchPageWithComponentData).toHaveBeenCalledWith(expect.anything(), {
            pageId: 'blog-post-layout',
        });
    });

    test('returns 404 for an unsafe or missing post without exposing a blank page', async () => {
        await expect(loader(createArgs('../private'))).rejects.toMatchObject({ status: 404 });
        expect(fetchBlogPost).not.toHaveBeenCalled();

        vi.mocked(fetchBlogPost).mockResolvedValueOnce(null);
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });
    });

    test('converts response-shaped SCAPI authorization errors into a real 503 Response', async () => {
        vi.mocked(fetchBlogPost).mockRejectedValueOnce(
            new ApiError({
                status: 403,
                statusText: 'Forbidden',
                headers: new Headers(),
                body: { type: 'Forbidden', title: 'Forbidden', detail: 'Missing content scope' },
                rawBody: JSON.stringify({ detail: 'Missing content scope' }),
                url: 'https://api.example.com/contents/summer-edit',
                method: 'GET',
            })
        );

        const error = await loader(createArgs()).then(
            () => {
                throw new Error('expected loader to throw a Response');
            },
            (reason: unknown) => reason
        );

        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(503);
        expect(await (error as Response).text()).toBe('Blog content access is unavailable');
    });

    test('normalizes unexpected content failures into a real 500 Response', async () => {
        vi.mocked(fetchBlogPost).mockRejectedValueOnce(new TypeError('Network failed'));

        const error = await loader(createArgs()).then(
            () => {
                throw new Error('expected loader to throw a Response');
            },
            (reason: unknown) => reason
        );

        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(500);
    });

    test('validates the optional layout type and ignores an invisible layout on the live site', async () => {
        vi.mocked(fetchPageWithComponentData).mockResolvedValueOnce({ ...layoutPage, typeId: 'blankPage' });
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });

        vi.mocked(fetchPageWithComponentData).mockResolvedValueOnce({ ...layoutPage, visible: false });
        await expect(loader(createArgs())).resolves.toMatchObject({ layoutPage: null });
    });

    test('keeps an invisible layout available to Page Designer authoring', async () => {
        vi.mocked(isDesignModeActive).mockReturnValue(true);
        const hiddenLayout = { ...layoutPage, visible: false };
        vi.mocked(fetchPageWithComponentData).mockResolvedValueOnce(hiddenLayout);

        await expect(loader(createArgs())).resolves.toMatchObject({
            layoutPage: hiddenLayout,
            isAuthoring: true,
        });
    });

    test('renders through the shared article renderer', () => {
        render(
            <BlogPostRoute
                loaderData={{
                    post,
                    layoutPage,
                    pageUrl: 'https://shop.example.com/es/es/blog/summer-edit',
                    isAuthoring: false,
                }}
            />
        );

        expect(screen.getByTestId('post-renderer')).toHaveTextContent('Summer edit');
        expect(screen.getByTestId('post-renderer')).toHaveAttribute(
            'data-url',
            'https://shop.example.com/es/es/blog/summer-edit'
        );
    });
});
