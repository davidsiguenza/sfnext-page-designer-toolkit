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
import { Region } from '@/components/region';
import { SeoMeta } from '@/components/seo-meta';
import { fetchPageWithComponentDataOrThrow, type PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import { getPublicOrigin } from '@/utils/schema-url';
import {
    BLOG_HOME_PAGE_ID,
    BLOG_HOME_PAGE_TYPE_ID,
    isPageType,
} from '@/extensions/page-designer-toolkit/blog/page-types';

export interface BlogHomeLoaderData {
    page: PageWithComponentData;
    pageUrl: string;
    isAuthoring: boolean;
}

const BLOG_PAGE_PARAMETER = /^blogPage(?:_[A-Za-z0-9_-]{1,64})?$/;

/** Builds a canonical that preserves only valid, content-changing blog pagination. */
export function buildBlogHomeCanonicalUrl(origin: string, pathname: string, search: string): string {
    const baseCanonical = buildCanonicalUrl(origin, pathname);
    if (!baseCanonical) return '';

    const canonical = new URL(baseCanonical);
    for (const [key, value] of new URLSearchParams(search)) {
        if (!BLOG_PAGE_PARAMETER.test(key) || !/^[1-9]\d*$/.test(value)) continue;
        const page = Number(value);
        if (page > 1 && page <= 10_000) canonical.searchParams.set(key, String(page));
    }
    canonical.searchParams.sort();
    return canonical.toString();
}

function notFound(): never {
    throw new Response('Blog page not found', { status: 404 });
}

/** Loads the single Page Designer page that composes the public blog landing page. */
export async function loader(args: LoaderFunctionArgs): Promise<BlogHomeLoaderData> {
    const isAuthoring = isDesignModeActive(args.request) || isPreviewModeActive(args.request);

    try {
        const page = await fetchPageWithComponentDataOrThrow(args, { pageId: BLOG_HOME_PAGE_ID });
        if (!isPageType(page.typeId, BLOG_HOME_PAGE_TYPE_ID) || (!isAuthoring && page.visible === false)) {
            notFound();
        }

        const requestUrl = new URL(args.request.url);
        return {
            page,
            pageUrl: buildBlogHomeCanonicalUrl(getPublicOrigin(args.request), requestUrl.pathname, requestUrl.search),
            isAuthoring,
        };
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    }
}

/** Blog home composed entirely from the four regions declared by its Page Designer template. */
export default function BlogHome({ loaderData }: { loaderData: BlogHomeLoaderData }) {
    const { page, pageUrl, isAuthoring } = loaderData;

    return (
        <div data-slot="sfnext-toolkit-blog-home-page" className="min-h-[12rem]">
            <SeoMeta
                title={page.pageTitle || page.name || 'Blog'}
                description={page.pageDescription || page.description}
                noIndex={isAuthoring}
                openGraph={{ type: 'website', url: pageUrl }}
            />
            <link rel="canonical" href={pageUrl} />
            <Region page={page} regionId="hero" />
            <Region page={page} regionId="featured" />
            <Region page={page} regionId="posts" />
            <Region page={page} regionId="afterPosts" />
        </div>
    );
}
