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
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import type { BlogPostGridData } from './loaders';
import BlogPostGrid, { BlogPostGridFallback, SFNextToolkitBlogPostGridMetadata } from './index';

const pageDesignerMode = vi.hoisted(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: pageDesignerMode.isDesignMode, isPreviewMode: false }),
    };
});

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

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

function makeData(posts: BlogPost[], overrides: Partial<BlogPostGridData> = {}): BlogPostGridData {
    return {
        posts,
        total: posts.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: 12,
        paginationParam: 'blogPage_grid-1',
        ...overrides,
    };
}

function renderGrid(element: ReactElement, initialEntry = '/blog') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit blog post grid', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
    });

    test('publishes the Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitBlogPostGridMetadata)).toBe('SFNextToolkit.blogPostGrid');

        const { fields } = getAttributeDefinitions(SFNextToolkitBlogPostGridMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'folderId',
            'heading',
            'intro',
            'pageSize',
            'columns',
            'imageRatio',
            'sort',
            'featuredOnly',
            'category',
            'showExcerpt',
            'showCategory',
            'showAuthor',
            'showDate',
            'showReadTime',
            'showPagination',
            'ctaLabel',
            'readTimeTemplate',
            'emptyMessage',
        ]);
        expect(fields.folderId).toMatchObject({ type: 'string', defaultValue: 'sfnext-blog', required: true });
        expect(fields.pageSize).toMatchObject({ type: 'integer', defaultValue: 12 });
        expect(fields.columns).toMatchObject({ values: ['2', '3', '4'], defaultValue: '3' });
        expect(fields.imageRatio).toMatchObject({
            values: ['landscape', 'wide', 'square', 'portrait'],
            defaultValue: 'landscape',
        });
        expect(fields.sort).toMatchObject({ values: ['newest', 'oldest', 'title'], defaultValue: 'newest' });
        expect(fields.readTimeTemplate).toMatchObject({ defaultValue: '{minutes} min read' });
    });

    test('renders the complete BlogPost contract as an accessible article card', () => {
        const post = makePost('spring-layering', {
            title: 'How to layer for spring',
            excerpt: 'A practical guide to comfortable changing-weather outfits.',
            author: 'Marta Ruiz',
            publishedAt: '2026-03-14T09:30:00.000Z',
            heroImageUrl: '/images/hero-01.webp',
            heroImageAlt: 'Child wearing a layered spring outfit',
            category: 'Style guide',
            readingTimeMinutes: 7,
        });

        const { container } = renderGrid(
            <BlogPostGrid
                folderId="sfnext-blog"
                pageSize={6}
                sort="newest"
                featuredOnly={false}
                category="Style guide"
                heading="Stories for every day"
                intro="Ideas, inspiration and practical advice."
                ctaLabel="Read story"
                readTimeTemplate="About {minutes} minutes"
                data={makeData([post])}
            />
        );

        expect(screen.getByRole('heading', { level: 2, name: 'Stories for every day' })).toBeInTheDocument();
        expect(screen.getByText('Ideas, inspiration and practical advice.')).toBeInTheDocument();
        expect(screen.getByRole('article')).toHaveAttribute('data-slot', 'sfnext-toolkit-blog-post-card');
        expect(screen.getByRole('img', { name: 'Child wearing a layered spring outfit' })).toHaveAttribute(
            'src',
            '/images/hero-01.webp'
        );
        expect(screen.getByText('Style guide')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'How to layer for spring' })).toBeInTheDocument();
        expect(screen.getByText('A practical guide to comfortable changing-weather outfits.')).toBeInTheDocument();
        expect(screen.getByText('Marta Ruiz')).toBeInTheDocument();
        expect(screen.getByText('About 7 minutes')).toBeInTheDocument();
        expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-03-14T09:30:00.000Z');
        expect(screen.getByRole('link', { name: 'Read story' }).getAttribute('href')).toContain(
            '/blog/spring-layering'
        );
        const section = container.querySelector('[data-slot="sfnext-toolkit-blog-post-grid"]');
        expect(section).not.toHaveAttribute('folderId');
        expect(section).not.toHaveAttribute('pageSize');
        expect(section).not.toHaveAttribute('sort');
        expect(section).not.toHaveAttribute('featuredOnly');
        expect(section).not.toHaveAttribute('category');
    });

    test('renders the configured empty state without inventing article cards', () => {
        renderGrid(<BlogPostGrid emptyMessage="No stories match this selection." data={makeData([])} />);

        expect(screen.getByText('No stories match this selection.')).toBeInTheDocument();
        expect(screen.queryByRole('article')).not.toBeInTheDocument();
        expect(document.querySelector('[data-slot="blog-post-grid-empty"]')).toBeInTheDocument();
    });

    test('shows actionable authoring guidance when the component has no connected data', () => {
        pageDesignerMode.isDesignMode = true;
        renderGrid(<BlogPostGrid />);

        expect(screen.getByText('Connect the blog content folder')).toBeInTheDocument();
        expect(screen.getByText(/Publish Content Assets in the configured folder/)).toBeInTheDocument();
    });

    test('distinguishes a loader failure from a legitimately empty blog in authoring', () => {
        pageDesignerMode.isDesignMode = true;
        renderGrid(<BlogPostGrid data={makeData([], { error: true })} />);

        expect(screen.getByText('The blog content could not be loaded')).toBeInTheDocument();
        expect(screen.getByText(/folder ID, and content search index/)).toBeInTheDocument();
    });

    test('preserves unrelated query parameters while creating previous and next page links', () => {
        renderGrid(
            <BlogPostGrid
                data={makeData([makePost('page-two')], {
                    total: 5,
                    totalPages: 3,
                    currentPage: 2,
                    pageSize: 2,
                })}
            />,
            '/blog?campaign=spring&blogPage_grid-1=2'
        );

        const previousHref = screen.getByRole('link', { name: 'Previous page' }).getAttribute('href');
        const nextHref = screen.getByRole('link', { name: 'Next page' }).getAttribute('href');
        expect(previousHref).not.toBeNull();
        expect(nextHref).not.toBeNull();

        const previous = new URL(previousHref ?? '/', 'https://example.com');
        const next = new URL(nextHref ?? '/', 'https://example.com');

        expect(previous.searchParams.get('campaign')).toBe('spring');
        expect(previous.searchParams.has('blogPage_grid-1')).toBe(false);
        expect(next.searchParams.get('campaign')).toBe('spring');
        expect(next.searchParams.get('blogPage_grid-1')).toBe('3');
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    test('provides a stable three-card loading state', () => {
        const { container } = render(<BlogPostGridFallback />);

        expect(container.querySelector('[data-slot="sfnext-toolkit-blog-post-grid-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(17);
    });
});
