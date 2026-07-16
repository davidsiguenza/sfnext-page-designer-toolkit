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
import type { ContentCollectionItem } from '../content-model';
import type { ContentCollectionData } from '../loaders';
import ContentCollection, { ContentCollectionFallback } from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const items: ContentCollectionItem[] = [
    {
        id: 'spring-layering-guide',
        kind: 'blog',
        title: 'The spring layering guide',
        excerpt: 'Lightweight combinations for bright mornings, cool afternoons and every adventure.',
        imageUrl: '/images/hero-01.webp',
        imageAlt: 'Children wearing lightweight spring layers',
        author: 'Marta Ruiz',
        category: 'Style guide',
        publishedAt: '2026-03-18T09:00:00.000Z',
        readingTimeMinutes: 6,
    },
    {
        id: 'occasionwear-campaign',
        kind: 'generic',
        title: 'Occasionwear made simple',
        excerpt: 'A considered edit for celebrations and moments worth remembering.',
        imageUrl: '/images/hero-02.webp',
        imageAlt: 'Children dressed for a family celebration',
        category: 'Campaign',
        publishedAt: '2026-03-10T12:00:00.000Z',
        linkUrl: '/category/occasionwear',
    },
    {
        id: 'better-everyday-basics',
        kind: 'blog',
        title: 'Better everyday basics',
        excerpt: 'How fabric, fit and thoughtful details turn familiar essentials into lasting favourites.',
        imageUrl: '/images/hero-03.webp',
        imageAlt: 'Children wearing everyday essentials',
        author: 'Ana Soler',
        category: 'Behind the collection',
        publishedAt: '2026-02-26T08:30:00.000Z',
        readingTimeMinutes: 8,
    },
];

function data(sourceMode: ContentCollectionData['sourceMode']): ContentCollectionData {
    return {
        items,
        sourceMode,
        status: 'ready',
        missingIds: [],
        invalidIdCount: 0,
        filteredCount: 0,
        selectionTruncated: false,
        searchTruncated: false,
    };
}

const meta: Meta<typeof ContentCollection> = {
    title: 'SFNext Toolkit/Editorial/Content Collection',
    component: ContentCollection,
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
                    'Container-responsive collection for manually curated Content Asset IDs or the latest online assets in a Content Library folder. Blog and generic assets share one safe card model.',
            },
        },
    },
    args: {
        heading: 'Stories and inspiration',
        intro: 'Editorial ideas, campaigns and useful guides selected for the season.',
        imageRatio: 'landscape',
        columns: '3',
        showImage: true,
        showExcerpt: true,
        showCategory: true,
        showAuthor: true,
        showDate: true,
        showReadTime: true,
        ctaLabel: 'View content',
        linkMode: 'auto',
    },
    argTypes: {
        sourceMode: { control: 'inline-radio', options: ['manual', 'latest'] },
        layout: { control: 'inline-radio', options: ['grid', 'carousel'] },
        columns: { control: 'inline-radio', options: ['2', '3', '4'] },
        contentType: { control: 'inline-radio', options: ['all', 'blog', 'generic'] },
        imageRatio: { control: 'inline-radio', options: ['landscape', 'wide', 'square', 'portrait'] },
        linkMode: { control: 'inline-radio', options: ['auto', 'blog', 'template', 'none'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof ContentCollection>;

export const LatestCarousel: Story = {
    args: {
        sourceMode: 'latest',
        layout: 'carousel',
        data: data('latest'),
    },
};

export const ManualGrid: Story = {
    args: {
        sourceMode: 'manual',
        selectedContentIds: items.map((item) => item.id).join('\n'),
        layout: 'grid',
        data: data('manual'),
    },
};

export const Loading: Story = {
    render: () => <ContentCollectionFallback layout="carousel" columns="3" />,
};
