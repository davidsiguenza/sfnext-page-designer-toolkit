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
import { describe, expect, test, vi } from 'vitest';
import type { BlogPost } from './content-model';
import { BlogPostRenderer, createBlogPostJsonLd } from './blog-post';

vi.mock('react-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-router')>()),
    useRouteLoaderData: vi.fn(() => ({ nonce: 'test-nonce' })),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string; count?: number }) =>
            (options?.defaultValue || _key).replace('{{count}}', String(options?.count ?? '')),
        i18n: { language: 'en', resolvedLanguage: 'en' },
    }),
}));

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/components/html-fragment', () => ({
    default: ({ content }: { content: string }) => <div data-testid="article-body">{content}</div>,
}));

vi.mock('@/components/json-ld', () => ({
    JsonLd: ({ data }: { data: Record<string, unknown> }) => (
        <script data-testid="json-ld" type="application/ld+json">
            {JSON.stringify(data)}
        </script>
    ),
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock('@/components/region', () => ({
    Region: ({ regionId }: { regionId: string }) => <div data-testid={`region-${regionId}`} />,
}));

vi.mock('@/components/seo-meta', () => ({
    SeoMeta: ({ title, noIndex }: { title?: string; noIndex?: boolean }) => (
        <div data-testid="seo-meta" data-title={title} data-no-index={String(Boolean(noIndex))} />
    ),
}));

const post: BlogPost = {
    id: 'summer-edit',
    slug: 'summer-edit',
    title: 'Summer edit',
    excerpt: 'Light looks for warm days.',
    bodyHtml: '<p>Article body</p>',
    author: 'Editorial team',
    publishedAt: '2026-07-12T10:15:00.000Z',
    updatedAt: '2026-07-13T08:00:00.000Z',
    heroImageUrl: '/images/summer.jpg',
    heroImageAlt: 'Child wearing a summer outfit',
    category: 'Inspiration',
    tags: ['Summer', 'Kids'],
    featured: true,
    readingTimeMinutes: 4,
    seoTitle: 'Summer edit | Journal',
    seoDescription: 'Discover the summer edit.',
    seoKeywords: ['summer'],
    visible: true,
};

describe('BlogPostRenderer', () => {
    test('builds complete BlogPosting structured data with absolute media', () => {
        expect(createBlogPostJsonLd(post, 'https://example.com/es/es/blog/summer-edit')).toMatchObject({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: 'Summer edit',
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: { '@type': 'Person', name: 'Editorial team' },
            image: ['https://example.com/images/summer.jpg'],
            articleSection: 'Inspiration',
            keywords: 'Summer, Kids',
            timeRequired: 'PT4M',
            url: 'https://example.com/es/es/blog/summer-edit',
        });
    });

    test('renders an accessible article, canonical URL and both Page Designer regions', () => {
        render(
            <BlogPostRenderer
                post={post}
                pageUrl="https://example.com/es/es/blog/summer-edit"
                layoutPage={{ id: 'layout', typeId: 'sfnextToolkitBlogPostPage' }}
            />
        );

        expect(screen.getByRole('heading', { level: 1, name: 'Summer edit' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Child wearing a summer outfit' })).toHaveAttribute(
            'src',
            'https://example.com/images/summer.jpg'
        );
        expect(screen.getByTestId('article-body')).toHaveTextContent('<p>Article body</p>');
        expect(screen.getByTestId('region-beforeArticle')).toBeInTheDocument();
        expect(screen.getByTestId('region-afterArticle')).toBeInTheDocument();
        expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
            'href',
            'https://example.com/es/es/blog/summer-edit'
        );
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-title', 'Summer edit | Journal');
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-no-index', 'false');
    });

    test('shows a useful empty state only while authoring', () => {
        const emptyPost = { ...post, bodyHtml: undefined };
        const { rerender } = render(
            <BlogPostRenderer post={emptyPost} pageUrl="https://example.com/blog/summer-edit" />
        );
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        rerender(<BlogPostRenderer post={emptyPost} pageUrl="https://example.com/blog/summer-edit" isAuthoring />);
        expect(screen.getByRole('status')).toHaveTextContent('Add the article body');
        expect(screen.getByTestId('seo-meta')).toHaveAttribute('data-no-index', 'true');
    });
});
