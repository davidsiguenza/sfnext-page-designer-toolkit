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
import type { Route } from './+types/_app.page.$pageId';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { ApiError } from '@/scapi';
import { Region } from '@/components/region';
import { SeoMeta } from '@/components/seo-meta';
import { fetchPageWithComponentDataOrThrow } from '@/lib/page-designer/page-loader.server';
import { buildCanonicalUrl } from '@/utils/canonical-url';

export const BLANK_PAGE_TYPE_ID = 'sfnextToolkitBlankPage';

function isBlankPageType(typeId: string): boolean {
    return typeId === BLANK_PAGE_TYPE_ID || typeId === `page.${BLANK_PAGE_TYPE_ID}`;
}

export async function loader(args: Route.LoaderArgs) {
    const { pageId } = args.params;
    if (!pageId) {
        throw new Response('Page not found', { status: 404 });
    }

    const isAuthoring = isDesignModeActive(args.request) || isPreviewModeActive(args.request);

    try {
        const page = await fetchPageWithComponentDataOrThrow(args, { pageId });

        if (!isBlankPageType(page.typeId) || (!isAuthoring && page.visible === false)) {
            throw new Response('Page not found', { status: 404 });
        }

        const requestUrl = new URL(args.request.url);
        return {
            page,
            pageUrl: buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search),
            isAuthoring,
        };
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            throw new Response('Page not found', { status: 404 });
        }
        throw error;
    }
}

export default function BlankPage({ loaderData }: Route.ComponentProps) {
    const { page, pageUrl, isAuthoring } = loaderData;

    return (
        <main data-slot="sfnext-toolkit-blank-page" className="min-h-[12rem]">
            <SeoMeta
                title={page.pageTitle || page.name || page.id}
                description={page.pageDescription || page.description}
                noIndex={isAuthoring}
                openGraph={{ type: 'website', url: pageUrl }}
            />
            <Region className="min-h-[12rem]" page={page} regionId="main" />
        </main>
    );
}
