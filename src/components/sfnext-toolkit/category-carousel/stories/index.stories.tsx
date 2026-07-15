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
import CategoryCard from '@/components/sfnext-toolkit/category-card';
import CategoryCarousel, { CategoryCarouselFallback } from '../index';

const categories: ShopperProducts.schemas['Category'][] = [
    {
        id: 'girls',
        name: 'Girls',
        pageDescription: 'Fresh silhouettes for every adventure.',
        image: '/images/hero-01.webp',
    },
    {
        id: 'boys',
        name: 'Boys',
        pageDescription: 'Comfortable essentials made for play.',
        image: '/images/hero-02.webp',
    },
    {
        id: 'baby',
        name: 'Baby',
        pageDescription: 'Soft layers for their first moments.',
        image: '/images/hero-03.webp',
    },
    {
        id: 'newborn',
        name: 'Newborn',
        pageDescription: 'Thoughtful pieces for the earliest days.',
        image: '/images/hero-04.webp',
    },
];

const meta: Meta<typeof CategoryCarousel> = {
    title: 'SFNext Toolkit/Category/Category Carousel',
    component: CategoryCarousel,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Reusable CarouselSection composition that can load child categories automatically or accept only SFNextToolkit.categoryCard entries in its manual Page Designer region.',
            },
        },
    },
    args: {
        parentCategory: 'root',
        data: categories,
        title: 'Shop by category',
        subtitle: 'Explore collections selected for every stage.',
        shopAllText: 'Shop all',
        tone: 'default',
    },
    argTypes: {
        tone: { control: 'inline-radio', options: ['default', 'muted'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof CategoryCarousel>;

export const Automatic: Story = {};

export const Muted: Story = {
    args: { tone: 'muted' },
};

export const ManualCards: Story = {
    args: {
        parentCategory: undefined,
        data: undefined,
        children: categories.slice(0, 3).map((category) => <CategoryCard key={category.id} category={category} />),
    },
};

export const Loading: Story = {
    render: () => <CategoryCarouselFallback />,
};

export const Snapshot: Story = {
    args: { tone: 'muted', data: categories.slice(0, 3) },
};
