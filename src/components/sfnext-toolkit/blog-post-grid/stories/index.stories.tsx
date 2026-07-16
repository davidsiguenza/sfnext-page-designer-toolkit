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
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, useInRouterContext } from 'react-router';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import BlogPostGrid, { BlogPostGridFallback } from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter initialEntries={['/blog']}>{content}</MemoryRouter>;
}

const posts: BlogPost[] = [
    {
        id: 'spring-layering-guide',
        slug: 'spring-layering-guide',
        title: 'The spring layering guide',
        excerpt: 'Lightweight combinations designed for bright mornings, cool afternoons and every adventure.',
        author: 'Marta Ruiz',
        publishedAt: '2026-03-18T09:00:00.000Z',
        heroImageUrl: '/images/hero-01.webp',
        heroImageAlt: 'Children wearing lightweight spring layers',
        category: 'Style guide',
        tags: ['Spring', 'Layering'],
        featured: true,
        readingTimeMinutes: 6,
        seoTitle: 'The spring layering guide',
        seoKeywords: ['spring', 'childrenswear'],
        visible: true,
    },
    {
        id: 'occasionwear-made-simple',
        slug: 'occasionwear-made-simple',
        title: 'Occasionwear made simple',
        excerpt: 'A considered edit for celebrations, family gatherings and the moments worth remembering.',
        author: 'Lucía Ferrer',
        publishedAt: '2026-03-10T12:00:00.000Z',
        heroImageUrl: '/images/hero-02.webp',
        heroImageAlt: 'Children dressed for a family celebration',
        category: 'Inspiration',
        tags: ['Occasions'],
        featured: false,
        readingTimeMinutes: 4,
        seoTitle: 'Occasionwear made simple',
        seoKeywords: ['occasionwear'],
        visible: true,
    },
    {
        id: 'better-everyday-basics',
        slug: 'better-everyday-basics',
        title: 'Better everyday basics',
        excerpt: 'How fabric, fit and thoughtful details turn familiar essentials into lasting favourites.',
        author: 'Ana Soler',
        publishedAt: '2026-02-26T08:30:00.000Z',
        category: 'Behind the collection',
        tags: ['Essentials', 'Design'],
        featured: false,
        readingTimeMinutes: 8,
        seoTitle: 'Better everyday basics',
        seoKeywords: ['essentials', 'design'],
        visible: true,
    },
];

const defaultData = {
    posts,
    total: posts.length,
    totalPages: 1,
    currentPage: 1,
    pageSize: 6,
    paginationParam: 'blogPage_story',
};

const meta: Meta<typeof BlogPostGrid> = {
    title: 'SFNext Toolkit/Editorial/Blog Post Grid',
    component: BlogPostGrid,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoryProviders>
                <Story />
            </StoryProviders>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Editorial grid for localized Blog Content Assets. Its server loader filters, sorts and paginates normalized BlogPost records while the component owns responsive presentation.',
            },
        },
    },
    args: {
        heading: 'Ideas for every little adventure',
        intro: 'Seasonal inspiration, practical guides and stories from behind our collections.',
        columns: '3',
        imageRatio: 'landscape',
        showExcerpt: true,
        showCategory: true,
        showAuthor: true,
        showDate: true,
        showReadTime: true,
        showPagination: true,
        ctaLabel: 'Read article',
        readTimeTemplate: '{minutes} min read',
        data: defaultData,
    },
    argTypes: {
        columns: { control: 'inline-radio', options: ['2', '3', '4'] },
        imageRatio: { control: 'inline-radio', options: ['landscape', 'wide', 'square', 'portrait'] },
        sort: { control: 'inline-radio', options: ['newest', 'oldest', 'title'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof BlogPostGrid>;

export const Default: Story = {};

export const FourColumnCompact: Story = {
    args: {
        columns: '4',
        imageRatio: 'portrait',
        showExcerpt: false,
        showAuthor: false,
    },
};

export const FeaturedStory: Story = {
    args: {
        columns: '2',
        imageRatio: 'wide',
        heading: 'Featured story',
        intro: undefined,
        data: { ...defaultData, posts: posts.filter((post) => post.featured), total: 1 },
    },
};

export const Paginated: Story = {
    args: {
        data: {
            ...defaultData,
            posts: posts.slice(0, 2),
            total: 8,
            totalPages: 4,
            currentPage: 2,
            pageSize: 2,
        },
    },
};

export const Empty: Story = {
    args: {
        heading: 'Latest stories',
        intro: undefined,
        emptyMessage: 'No stories match this selection.',
        data: { ...defaultData, posts: [], total: 0 },
    },
};

export const SafeErrorFallback: Story = {
    args: {
        heading: 'Latest stories',
        emptyMessage: 'Stories are temporarily unavailable. Please try again later.',
        data: { ...defaultData, posts: [], total: 0, error: true },
    },
};

export const Loading: Story = {
    render: () => <BlogPostGridFallback />,
};

export const Snapshot: Story = {
    args: {
        columns: '3',
        data: defaultData,
    },
};
