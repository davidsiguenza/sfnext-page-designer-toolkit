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
import { ApiError, type ShopperExperience } from '@/scapi';
import { fetchPageWithComponentDataOrThrow } from '@/lib/page-designer/page-loader.server';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import ToolkitGenericPage, { BLANK_PAGE_TYPE_ID, BRANDING_STUDIO_PAGE_TYPE_ID, loader } from './_app.page.$pageId';

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

const mockPage = {
    id: 'campaign',
    typeId: BLANK_PAGE_TYPE_ID,
    name: 'Campaign page',
    visible: true,
    regions: [{ id: 'main', components: [] }],
} as ShopperExperience.schemas['Page'];

function createArgs(pageId = mockPage.id) {
    return {
        request: new Request(`https://example.com/es/es/page/${pageId}`),
        params: { pageId },
        context: { get: vi.fn(), set: vi.fn() },
    } as never;
}

describe('SFNext Toolkit generic page route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue(mockPage);
        vi.mocked(isDesignModeActive).mockReturnValue(false);
        vi.mocked(isPreviewModeActive).mockReturnValue(false);
    });

    test('loads the requested toolkit blank page', async () => {
        const result = await loader(createArgs());

        expect(fetchPageWithComponentDataOrThrow).toHaveBeenCalledWith(expect.anything(), {
            pageId: 'campaign',
        });
        expect(result).toMatchObject({
            page: mockPage,
            pageUrl: 'https://example.com/es/es/page/campaign',
            isAuthoring: false,
        });
    });

    test.each([BRANDING_STUDIO_PAGE_TYPE_ID, `page.${BRANDING_STUDIO_PAGE_TYPE_ID}`])(
        'loads Branding Studio page type %s through the shared route',
        async (typeId) => {
            const brandingPage = {
                ...mockPage,
                id: 'branding-studio',
                typeId,
                name: 'Branding Studio',
            } as ShopperExperience.schemas['Page'];
            vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue(brandingPage);

            await expect(loader(createArgs('branding-studio'))).resolves.toMatchObject({
                page: brandingPage,
                isAuthoring: false,
            });
        }
    );

    test('rejects pages created from a different page type', async () => {
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue({
            ...mockPage,
            typeId: 'homePage',
        });

        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });
    });

    test('keeps non-404 API failures visible', async () => {
        const serverError = new ApiError({
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers(),
            body: { type: '', title: 'Server Error', detail: 'Failure' },
            rawBody: '',
            url: 'https://example.com',
            method: 'GET',
        });
        vi.mocked(fetchPageWithComponentDataOrThrow).mockRejectedValue(serverError);

        await expect(loader(createArgs())).rejects.toBe(serverError);
    });

    test('allows an invisible page only in authoring mode', async () => {
        vi.mocked(fetchPageWithComponentDataOrThrow).mockResolvedValue({ ...mockPage, visible: false });
        await expect(loader(createArgs())).rejects.toMatchObject({ status: 404 });

        vi.mocked(isDesignModeActive).mockReturnValue(true);
        await expect(loader(createArgs())).resolves.toMatchObject({ isAuthoring: true });
    });

    test('renders SEO metadata and the unrestricted main region', () => {
        const Component = ToolkitGenericPage as unknown as (props: {
            loaderData: { page: typeof mockPage; pageUrl: string; isAuthoring: boolean };
        }) => React.ReactNode;

        render(
            <Component
                loaderData={{
                    page: mockPage,
                    pageUrl: 'https://example.com/es/es/page/campaign',
                    isAuthoring: true,
                }}
            />
        );

        expect(screen.getByTestId('region-main')).toBeInTheDocument();
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-title', 'Campaign page');
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-no-index', 'true');
    });
});
