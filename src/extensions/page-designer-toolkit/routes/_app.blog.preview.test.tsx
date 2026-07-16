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
import { fetchPageWithComponentDataOrThrow } from '@/lib/page-designer/page-loader.server';
import BlogPostPreview, { BLOG_PREVIEW_POST, loader } from './_app.blog.preview';

vi.mock('@/extensions/page-designer-toolkit/blog/content.server', () => ({
    fetchBlogPost: vi.fn(),
}));

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentDataOrThrow: vi.fn(),
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

const layoutPage = {
    id: 'blog-post-layout',
    typeId: BLOG_POST_PAGE_TYPE_ID,
    name: 'Blog post layout',
    visible: false,
    regions: [],
} as ShopperExperience.schemas['Page'];

const selectedPost: BlogPost = {
    id: 'selected-post',
    slug: 'selected-post',
    title: 'Selected post',
    tags: [],
    featured: false,
    seoTitle: 'Selected post',
    seoKeywords: [],
    visible: true,
};

function createArgs(url = 'https://internal.example/es/es/blog/preview?mode=edit') {
    return {
        request: new Request(url),
        params: {},
        context: { get: vi.fn(), set: vi.fn() },
    } as never;
}

function notFoundError() {
    return new ApiError({
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        body: { type: '', title: 'Not Found', detail: 'Failure' },
        rawBody: '',
        url: 'https://example.com',
        method: 'GET',
    });
}

describe('SFNext Toolkit blog post Page Designer preview route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isDesignModeActive).mockReturnValue(true);
        vi.mocked(isPreviewModeActive).mockReturnValue(false);
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue(layoutPage);
        vi.mocked(fetchBlogPost).mockResolvedValue(selectedPost);
    });

    test('is not publicly accessible', async () => {
        vi.mocked(isDesignModeActive).mockReturnValue(false);
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });
        expect(fetchPageWithComponentDataOrThrow).not.toHaveBeenCalled();
    });

    test('uses deterministic sample content while editing the Blog Post layout', async () => {
        await expect(loader(createArgs())).resolves.toMatchObject({
            post: BLOG_PREVIEW_POST,
            layoutPage,
            pageUrl: 'https://internal.example/es/es/blog/preview-post',
            isAuthoring: true,
        });
        expect(fetchPageWithComponentDataOrThrow).toHaveBeenCalledWith(expect.anything(), {
            pageId: 'blog-post-layout',
        });
        expect(fetchBlogPost).not.toHaveBeenCalled();
    });

    test('can preview a selected Content Asset and falls back when it is unavailable', async () => {
        await expect(
            loader(createArgs('https://example.com/es/es/blog/preview?mode=edit&postId=selected-post'))
        ).resolves.toMatchObject({
            post: selectedPost,
            pageUrl: 'https://example.com/es/es/blog/selected-post',
        });
        expect(fetchBlogPost).toHaveBeenCalledWith(expect.anything(), 'selected-post');

        vi.mocked(fetchBlogPost).mockResolvedValueOnce(null);
        await expect(
            loader(createArgs('https://example.com/es/es/blog/preview?postId=missing'))
        ).resolves.toMatchObject({
            post: BLOG_PREVIEW_POST,
        });
    });

    test('returns 404 for a missing or wrong-type Page Designer layout', async () => {
        vi.mocked(fetchPageWithComponentDataOrThrow).mockRejectedValueOnce(notFoundError());
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });

        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValueOnce({ ...layoutPage, typeId: 'blankPage' });
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });
    });

    test('renders the preview through the shared renderer with noindex authoring semantics', () => {
        render(
            <BlogPostPreview
                loaderData={{
                    post: BLOG_PREVIEW_POST,
                    layoutPage,
                    pageUrl: 'https://example.com/es/es/blog/preview-post',
                    isAuthoring: true,
                }}
            />
        );
        expect(screen.getByTestId('post-renderer')).toHaveTextContent('A sample blog post');
        expect(screen.getByTestId('post-renderer')).toHaveAttribute('data-authoring', 'true');
    });
});
