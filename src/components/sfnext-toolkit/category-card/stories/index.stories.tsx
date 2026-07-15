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
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ShopperProducts } from '@/scapi';
import CategoryCard, { CategoryCardFallback } from '../index';

const category: ShopperProducts.schemas['Category'] = {
    id: 'girls',
    name: 'Girls',
    pageDescription: 'Fresh silhouettes designed for every adventure.',
    image: '/images/hero-01.webp',
};

const meta: Meta<typeof CategoryCard> = {
    title: 'SFNext Toolkit/Category/Category Card',
    component: CategoryCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Catalog-backed card for Category Carousel. Merchants can override copy, image, CTA, layout, ratio, and image focal point without introducing demo image fallbacks.',
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="w-[22rem] max-w-full">
                <Story />
            </div>
        ),
    ],
    args: {
        data: category,
        layout: 'overlay',
        ratio: 'square',
    },
    argTypes: {
        layout: { control: 'inline-radio', options: ['overlay', 'stacked'] },
        ratio: { control: 'inline-radio', options: ['square', 'landscape', 'portrait'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof CategoryCard>;

export const Overlay: Story = {};

export const Stacked: Story = {
    args: { layout: 'stacked', ratio: 'landscape' },
};

export const EditorialOverrides: Story = {
    args: {
        image: { path: '/images/hero-02.webp', focal_point: { x: 0.35, y: 0.5 } },
        title: 'Ceremony edit',
        copy: 'A curated selection for memorable celebrations.',
        ctaLabel: 'Discover the edit',
        ctaUrl: '/category/ceremony',
        ratio: 'portrait',
    },
};

export const WithoutImage: Story = {
    args: {
        data: { ...category, image: undefined, c_slotBannerImage: undefined },
        layout: 'stacked',
    },
};

export const Loading: Story = {
    render: () => <CategoryCardFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid w-[46rem] max-w-full grid-cols-2 gap-4">
            <CategoryCard data={category} />
            <CategoryCard data={category} layout="stacked" ratio="portrait" title="Stacked category" />
        </div>
    ),
};
