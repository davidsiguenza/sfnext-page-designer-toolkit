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

import type { ReactElement, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import type { ContentCollectionItem } from './content-model';
import type { ContentCollectionData } from './loaders';
import ContentCollection, { ContentCollectionFallback, SFNextToolkitContentCollectionMetadata } from './index';

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

vi.mock('@/components/carousel-section', () => ({
    CarouselSection: ({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) => (
        <div data-testid="carousel-section">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
            {children}
        </div>
    ),
}));

vi.mock('@/components/ui/carousel', () => ({
    CarouselItem: ({ children, className }: { children: ReactNode; className?: string }) => (
        <div data-testid="carousel-item" className={className}>
            {children}
        </div>
    ),
}));

function makeItem(id: string, overrides: Partial<ContentCollectionItem> = {}): ContentCollectionItem {
    return { id, kind: 'generic', title: `Content ${id}`, ...overrides };
}

function makeData(
    items: ContentCollectionItem[],
    overrides: Partial<ContentCollectionData> = {}
): ContentCollectionData {
    return {
        items,
        sourceMode: 'latest',
        status: items.length ? 'ready' : 'empty',
        missingIds: [],
        invalidIdCount: 0,
        filteredCount: 0,
        selectionTruncated: false,
        searchTruncated: false,
        ...overrides,
    };
}

function renderCollection(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit content collection', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
    });

    test('publishes the complete Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitContentCollectionMetadata)).toBe(
            'SFNextToolkit.contentCollection'
        );
        const { fields } = getAttributeDefinitions(SFNextToolkitContentCollectionMetadata.prototype);

        expect(fields.sourceMode).toMatchObject({ values: ['manual', 'latest'], defaultValue: 'latest' });
        expect(fields.selectedContentIds).toMatchObject({ type: 'text' });
        expect(fields.limit).toMatchObject({ type: 'integer', defaultValue: 6 });
        expect(fields.contentType).toMatchObject({ values: ['all', 'blog', 'generic'], defaultValue: 'all' });
        expect(fields.layout).toMatchObject({ values: ['grid', 'carousel'], defaultValue: 'carousel' });
        expect(fields.linkMode).toMatchObject({ values: ['auto', 'blog', 'template', 'none'], defaultValue: 'auto' });
        expect(fields.imageAttribute).toMatchObject({ type: 'string' });
        expect(fields.linkAttribute).toMatchObject({ type: 'string' });
    });

    test('renders a container-responsive grid card with blog auto-linking and configurable fields', () => {
        const item = makeItem('spring story', {
            kind: 'blog',
            title: 'Spring story',
            excerpt: 'A practical seasonal guide.',
            imageUrl: '/images/spring.webp',
            imageAlt: 'Spring outfit',
            author: 'Editorial team',
            category: 'Inspiration',
            publishedAt: '2026-03-14T09:30:00.000Z',
            readingTimeMinutes: 5,
        });
        const { container } = renderCollection(
            <ContentCollection
                layout="grid"
                columns="4"
                heading="Stories"
                intro="Ideas for the season"
                ctaLabel="Read story"
                data={makeData([item])}
            />
        );

        expect(screen.getByRole('heading', { level: 2, name: 'Stories' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Spring outfit' })).toHaveAttribute('src', '/images/spring.webp');
        expect(screen.getByText('Inspiration')).toBeInTheDocument();
        expect(screen.getByText('Editorial team')).toBeInTheDocument();
        expect(screen.getByText('5 min read')).toBeInTheDocument();
        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(screen.getByRole('link', { name: 'Spring story' }).getAttribute('href')).toContain(
            '/blog/spring%20story'
        );
        expect(screen.getByText('Read story')).toBeInTheDocument();
        expect(container.querySelector('[data-slot="sfnext-toolkit-content-collection"]')).toHaveClass(
            '@container/content-collection'
        );
        expect(container.querySelector('.grid')).toHaveClass('@5xl/content-collection:grid-cols-4');
    });

    test('uses the shared carousel with container-based item widths and leaves unlinked generic cards inert', () => {
        renderCollection(
            <ContentCollection
                layout="carousel"
                columns="3"
                linkMode="auto"
                data={makeData([makeItem('one'), makeItem('two')])}
            />
        );

        expect(screen.getByTestId('carousel-section')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-item')).toHaveLength(2);
        expect(screen.getAllByTestId('carousel-item')[0]).toHaveClass('@4xl/content-collection:basis-1/3');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('shows actionable diagnostics only to Page Designer authors', () => {
        pageDesignerMode.isDesignMode = true;
        renderCollection(
            <ContentCollection
                sourceMode="manual"
                data={makeData([], {
                    sourceMode: 'manual',
                    status: 'empty',
                    missingIds: ['missing-one'],
                    invalidIdCount: 1,
                })}
            />
        );

        expect(screen.getByText(/Unavailable Content Asset IDs: missing-one/)).toBeInTheDocument();
        expect(screen.getByText(/invalid Content Asset ID/)).toBeInTheDocument();
        expect(screen.getByText('No matching content was found')).toBeInTheDocument();
    });

    test('hides operational failures on the live storefront and guides an unconfigured author', () => {
        const { container, rerender } = renderCollection(
            <ContentCollection data={makeData([], { status: 'error' })} />
        );
        expect(container.firstChild).toBeNull();

        pageDesignerMode.isDesignMode = true;
        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <ContentCollection sourceMode="manual" />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByText('Add Content Asset IDs')).toBeInTheDocument();
    });

    test('provides a stable layout-aware loading fallback', () => {
        const { container } = render(<ContentCollectionFallback layout="grid" columns="2" />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-content-collection-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(10);
    });
});
