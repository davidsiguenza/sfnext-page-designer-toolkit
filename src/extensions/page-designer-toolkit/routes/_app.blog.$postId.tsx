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
import { fetchPageWithComponentData, type PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getPublicOrigin } from '@/utils/schema-url';

export interface BlogPostLoaderData {
    post: BlogPost;
    layoutPage: PageWithComponentData | null;
    pageUrl: string;
    isAuthoring: boolean;
}

function notFound(): never {
    throw new Response('Blog post not found', { status: 404 });
}

/**
 * SCAPI errors are response-shaped objects (`status`, `headers`, ...), which
 * React Router can mistake for a native Response and then try to read with
 * `.text()`. Always cross the loader boundary with a real Response instead.
 */
function rethrowAsRouteResponse(error: unknown): never {
    if (error instanceof Response) throw error;

    if (error instanceof ApiError) {
        const isAuthorizationFailure = error.status === 401 || error.status === 403;
        throw new Response(isAuthorizationFailure ? 'Blog content access is unavailable' : 'Blog content unavailable', {
            status: isAuthorizationFailure ? 503 : error.status >= 500 ? 502 : 500,
        });
    }

    throw new Response('Internal Server Error', { status: 500 });
}

/** Loads the Content Asset identified by the URL slug and its optional visual frame. */
export async function loader(args: LoaderFunctionArgs): Promise<BlogPostLoaderData> {
    const postId = args.params.postId;
    if (!isValidBlogPostId(postId)) notFound();

    const isAuthoring = isDesignModeActive(args.request) || isPreviewModeActive(args.request);
    let post: BlogPost | null;
    let candidateLayoutPage: PageWithComponentData | null;
    try {
        [post, candidateLayoutPage] = await Promise.all([
            fetchBlogPost(args.context, postId),
            fetchPageWithComponentData(args, { pageId: BLOG_POST_LAYOUT_PAGE_ID }),
        ]);
    } catch (error) {
        rethrowAsRouteResponse(error);
    }

    if (!post) notFound();
    if (candidateLayoutPage && !isPageType(candidateLayoutPage.typeId, BLOG_POST_PAGE_TYPE_ID)) notFound();

    const layoutPage = !isAuthoring && candidateLayoutPage?.visible === false ? null : candidateLayoutPage;
    const requestUrl = new URL(args.request.url);
    return {
        post,
        layoutPage,
        pageUrl: buildCanonicalUrl(getPublicOrigin(args.request), requestUrl.pathname, requestUrl.search),
        isAuthoring,
    };
}

export default function BlogPostRoute({ loaderData }: { loaderData: BlogPostLoaderData }) {
    return <BlogPostRenderer {...loaderData} />;
}
