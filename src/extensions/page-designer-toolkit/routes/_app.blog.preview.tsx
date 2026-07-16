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
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { ApiError } from '@/scapi';
import { BlogPostRenderer } from '@/extensions/page-designer-toolkit/blog/blog-post';
import { fetchBlogPost } from '@/extensions/page-designer-toolkit/blog/content.server';
import { isValidBlogPostId, type BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import {
    BLOG_POST_LAYOUT_PAGE_ID,
    BLOG_POST_PAGE_TYPE_ID,
    isPageType,
} from '@/extensions/page-designer-toolkit/blog/page-types';
import { fetchPageWithComponentDataOrThrow, type PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getPublicOrigin } from '@/utils/schema-url';

export const BLOG_PREVIEW_POST: BlogPost = {
    id: 'preview-post',
    slug: 'preview-post',
    title: 'A sample blog post',
    excerpt: 'Use this sample article to compose the reusable header and footer areas around a real blog post.',
    bodyHtml:
        '<h2>Design the article experience</h2><p>The article itself comes from a Commerce Cloud Content Asset. Page Designer controls the reusable regions before and after it.</p><p>Open this page in Page Designer, add components to those regions, and publish the layout when it is ready.</p>',
    author: 'Editorial team',
    publishedAt: '2026-01-15T09:00:00.000Z',
    category: 'Inspiration',
    tags: ['Storefront Next', 'Page Designer'],
    featured: false,
    readingTimeMinutes: 2,
    seoTitle: 'A sample blog post',
    seoDescription: 'Page Designer preview content for the reusable Blog Post layout.',
    seoKeywords: [],
    visible: true,
};

export interface BlogPostPreviewLoaderData {
    post: BlogPost;
    layoutPage: PageWithComponentData;
    pageUrl: string;
    isAuthoring: true;
}

function notFound(): never {
    throw new Response('Blog post preview not found', { status: 404 });
}

function articlePathFromPreview(pathname: string, slug: string): string {
    const articlePath = `/blog/${encodeURIComponent(slug)}`;
    return /\/blog\/preview\/?$/.test(pathname) ? pathname.replace(/\/blog\/preview\/?$/, articlePath) : articlePath;
}

/**
 * Page Designer authoring endpoint for the reusable article frame. An optional
 * `postId` query parameter replaces the deterministic sample with a live Content Asset.
 */
export async function loader(args: LoaderFunctionArgs): Promise<BlogPostPreviewLoaderData> {
    if (!isDesignModeActive(args.request) && !isPreviewModeActive(args.request)) notFound();

    const requestUrl = new URL(args.request.url);
    const requestedPostId = requestUrl.searchParams.get('postId') || undefined;
    const postPromise = isValidBlogPostId(requestedPostId)
        ? fetchBlogPost(args.context, requestedPostId)
        : Promise.resolve(null);

    try {
        const [layoutPage, requestedPost] = await Promise.all([
            fetchPageWithComponentDataOrThrow(args, { pageId: BLOG_POST_LAYOUT_PAGE_ID }),
            postPromise,
        ]);
        if (!isPageType(layoutPage.typeId, BLOG_POST_PAGE_TYPE_ID)) notFound();

        const post = requestedPost || BLOG_PREVIEW_POST;
        return {
            post,
            layoutPage,
            pageUrl: buildCanonicalUrl(
                getPublicOrigin(args.request),
                articlePathFromPreview(requestUrl.pathname, post.slug)
            ),
            isAuthoring: true,
        };
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    }
}

export default function BlogPostPreview({ loaderData }: { loaderData: BlogPostPreviewLoaderData }) {
    return <BlogPostRenderer {...loaderData} />;
}
