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
import PromoCard from '@/components/sfnext-toolkit/promo-card';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import PromoGrid, { PromoGridFallback } from './index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const CARD_CONTENT = [
    {
        eyebrow: '3–7 years',
        title: 'Girls',
        description: 'Fresh silhouettes, joyful colour and easy layers.',
        image: '/images/hero-01.webp',
    },
    {
        eyebrow: '3–7 years',
        title: 'Boys',
        description: 'Comfortable essentials made for every adventure.',
        image: '/images/hero-02.webp',
    },
    {
        eyebrow: '0–24 months',
        title: 'Baby',
        description: 'Soft layers designed for their first discoveries.',
        image: '/images/hero-03.webp',
    },
    {
        eyebrow: '8–16 years',
        title: 'Junior',
        description: 'Confident new-season looks with personality.',
        image: '/images/hero-04.webp',
    },
    {
        eyebrow: 'Occasion',
        title: 'Celebration',
        description: 'Special pieces for memorable days together.',
        image: '/images/hero-01.webp',
    },
];

function PromoCards({ featuredFirst = false }: { featuredFirst?: boolean }) {
    const cards = featuredFirst ? CARD_CONTENT : CARD_CONTENT.slice(0, 3);

    return cards.map((card, index) => (
        <PromoCard
            key={card.title}
            eyebrow={card.eyebrow}
            title={card.title}
            description={card.description}
            imageUrl={{ url: card.image, focalPoint: { x: 50, y: index === 0 ? 38 : 50 } }}
            imageAlt={`${card.title} new-season collection`}
            buttonText="Explore"
            buttonLink="/category/new-arrivals"
            layout={featuredFirst && index === 0 ? 'overlay' : 'stacked'}
            aspectRatio={featuredFirst && index === 0 ? 'square' : 'landscape'}
            ctaStyle={featuredFirst && index === 0 ? 'outline' : 'link'}
            hoverEffect="zoom"
        />
    ));
}

const DEFAULT_ARGS = {
    title: 'Shop by age',
    subtitle: 'Curated collections designed for every stage and every small adventure.',
    columns: '3',
    gap: 'md',
    surface: 'transparent',
    layout: 'equal',
    headerAlignment: 'left',
    shopAllLabel: 'View all collections',
    shopAllUrl: '/category/all',
};

const meta: Meta<typeof PromoGrid> = {
    title: 'SFNext Toolkit/Promo/Promo Grid',
    component: PromoGrid,
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
                    'Responsive Page Designer composition for up to six Promo Cards. Merchants can choose equal or featured-first hierarchy, align the editorial header and add a validated shop-all destination.',
            },
        },
    },
    args: DEFAULT_ARGS,
    argTypes: {
        columns: { control: 'inline-radio', options: ['2', '3', '4'] },
        gap: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        surface: { control: 'inline-radio', options: ['transparent', 'muted', 'card'] },
        layout: { control: 'inline-radio', options: ['equal', 'featured-first'] },
        headerAlignment: { control: 'inline-radio', options: ['left', 'center', 'right'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: (args) => (
        <PromoGrid {...args}>
            <PromoCards featuredFirst={args.layout === 'featured-first'} />
        </PromoGrid>
    ),
};

export default meta;
type Story = StoryObj<typeof PromoGrid>;

export const Default: Story = {};

export const FeaturedFirst: Story = {
    args: {
        title: 'This week’s stories',
        subtitle: 'Lead with the campaign that matters most, then support it with complementary edits.',
        layout: 'featured-first',
        columns: '3',
        surface: 'muted',
    },
};

export const CenteredHeader: Story = {
    args: {
        headerAlignment: 'center',
        surface: 'card',
    },
};

export const FourColumns: Story = {
    args: { columns: '4', gap: 'sm', surface: 'muted', headerAlignment: 'right' },
};

export const Loading: Story = {
    render: () => <PromoGridFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div data-slot="promo-grid-story-snapshot" className="bg-background p-4 md:p-8">
            <PromoGrid
                title="This week’s stories"
                subtitle="A featured campaign followed by supporting editorial collections."
                columns="3"
                gap="md"
                surface="muted"
                layout="featured-first"
                headerAlignment="left"
                shopAllLabel="View all collections"
                shopAllUrl="/category/all">
                <PromoCards featuredFirst />
            </PromoGrid>
        </div>
    ),
};
