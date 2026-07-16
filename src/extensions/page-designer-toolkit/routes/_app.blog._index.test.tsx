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
import { fetchPageWithComponentDataOrThrow } from '@/lib/page-designer/page-loader.server';
import { BLOG_HOME_PAGE_TYPE_ID } from '@/extensions/page-designer-toolkit/blog/page-types';
import BlogHome, { buildBlogHomeCanonicalUrl, loader } from './_app.blog._index';

vi.mock('@/lib/page-designer/page-loader.server', () => ({
    fetchPageWithComponentDataOrThrow: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/mode', () => ({
    isDesignModeActive: vi.fn(() => false),
    isPreviewModeActive: vi.fn(() => false),
}));

vi.mock('@/components/region', () => ({
    Region: ({ regionId }: { regionId: string }) => <div data-testid={`region-${regionId}`} />,
}));

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: ({ title, noIndex }: { title?: string; noIndex?: boolean }) => (
        <div data-testid="seo-meta" data-title={title} data-no-index={String(Boolean(noIndex))} />
    ),
}));

const page = {
    id: 'blog',
    typeId: BLOG_HOME_PAGE_TYPE_ID,
    name: 'Journal',
    pageTitle: 'Editorial Journal',
    pageDescription: 'Stories and inspiration.',
    visible: true,
    regions: [],
} as ShopperExperience.schemas['Page'];

function createArgs(request = new Request('https://internal.example/es/es/blog?utm_source=test')) {
    return {
        request,
        params: {},
        context: { get: vi.fn(), set: vi.fn() },
    } as never;
}

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

describe('SFNext Toolkit blog home route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue(page);
        vi.mocked(isDesignModeActive).mockReturnValue(false);
        vi.mocked(isPreviewModeActive).mockReturnValue(false);
    });

    test('loads the fixed Blog Home page and builds its canonical public URL', async () => {
        const request = new Request('http://internal.example/es/es/blog?mode=edit&utm_source=test', {
            headers: { 'x-forwarded-host': 'shop.example.com', 'x-forwarded-proto': 'https' },
        });

        await expect(loader(createArgs(request))).resolves.toMatchObject({
            page,
            pageUrl: 'https://shop.example.com/es/es/blog',
            isAuthoring: false,
        });
        expect(fetchPageWithComponentDataOrThrow).toHaveBeenCalledWith(expect.anything(), { pageId: 'blog' });
    });

    test('canonicalizes valid grid pagination and strips authoring or malformed parameters', () => {
        expect(
            buildBlogHomeCanonicalUrl(
                'https://shop.example.com',
                '/es/es/blog/',
                '?utm_source=test&mode=edit&blogPage_grid-b=3&blogPage_grid-a=2&blogPage_bad=01&blogPage=10001'
            )
        ).toBe('https://shop.example.com/es/es/blog?blogPage_grid-a=2&blogPage_grid-b=3');
    });

    test('returns a real 404 for a missing, wrong-type or invisible live page', async () => {
        vi.mocked(fetchPageWithComponentDataOrThrow).mockRejectedValueOnce(apiError(404));
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });

        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValueOnce({ ...page, typeId: 'homePage' });
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });

        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValueOnce({ ...page, visible: false });
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });
    });

    test('allows an invisible page in authoring and preserves non-404 failures', async () => {
        vi.mocked(isPreviewModeActive).mockReturnValue(true);
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValueOnce({ ...page, visible: false });
        await expect(loader(createArgs())).resolves.toMatchObject({ isAuthoring: true });

        const error = apiError(500);
        vi.mocked(fetchPageWithComponentDataOrThrow).mockRejectedValueOnce(error);
        await expect(loader(createArgs())).rejects.toBe(error);
    });

    test('renders SEO, canonical and every declared Blog Home region', () => {
        render(<BlogHome loaderData={{ page, pageUrl: 'https://shop.example.com/es/es/blog', isAuthoring: true }} />);

        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-title', 'Editorial Journal');
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-no-index', 'true');
        expect(screen.getByTestId('region-hero')).toBeInTheDocument();
        expect(screen.getByTestId('region-featured')).toBeInTheDocument();
        expect(screen.getByTestId('region-posts')).toBeInTheDocument();
        expect(screen.getByTestId('region-afterPosts')).toBeInTheDocument();
        expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
            'href',
            'https://shop.example.com/es/es/blog'
        );
    });
});
