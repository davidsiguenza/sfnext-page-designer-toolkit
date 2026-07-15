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
import PromoCard from '@/components/sfnext-toolkit/promo-card';
import PromoGrid, { PromoGridFallback } from './index';

const cards = [
    {
        title: 'Girls',
        description: 'Fresh silhouettes and joyful colour.',
        image: 'https://placehold.co/800x600?text=Girls',
    },
    {
        title: 'Boys',
        description: 'Comfortable essentials made for play.',
        image: 'https://placehold.co/800x600?text=Boys',
    },
    {
        title: 'Baby',
        description: 'Soft layers for their first adventures.',
        image: 'https://placehold.co/800x600?text=Baby',
    },
];

const meta: Meta<typeof PromoGrid> = {
    title: 'SFNext Toolkit/Promo/Promo Grid',
    component: PromoGrid,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Responsive parent component for up to six SFNextToolkit.promoCard children. It stacks on mobile and uses the authored desktop column count.',
            },
        },
    },
    args: {
        title: 'Shop by age',
        subtitle: 'Curated collections for every stage.',
        columns: '3',
        gap: 'md',
        surface: 'transparent',
    },
    argTypes: {
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: (args) => (
        <PromoGrid {...args}>
            {cards.map((card) => (
                <PromoCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    imageUrl={card.image}
                    imageAlt=""
                    buttonText="Explore"
                    buttonLink="/category/new-arrivals"
                />
            ))}
        </PromoGrid>
    ),
};

export default meta;
type Story = StoryObj<typeof PromoGrid>;

export const Default: Story = {};

export const FourColumns: Story = {
    args: { columns: '4', gap: 'sm', surface: 'muted' },
};

export const Loading: Story = {
    render: () => <PromoGridFallback />,
};

export const Snapshot: Story = {
    args: { surface: 'card' },
};
