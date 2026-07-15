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
import PromoCard, { PromoCardFallback } from './index';

const meta: Meta<typeof PromoCard> = {
    title: 'SFNext Toolkit/Promo/Promo Card',
    component: PromoCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Merchant-authored promotion that reuses the storefront ContentCard. Designed as a child of SFNextToolkit.promoGrid.',
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
        title: 'New season',
        description: 'Discover versatile pieces selected for every day.',
        imageUrl: 'https://placehold.co/800x600?text=Campaign',
        imageAlt: 'Child wearing a new-season outfit',
        buttonText: 'Shop the edit',
        buttonLink: '/category/new-arrivals',
        showBackground: true,
        showBorder: true,
    },
    argTypes: {
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof PromoCard>;

export const Default: Story = {};

export const TextOnly: Story = {
    args: {
        title: 'Member event',
        description: 'Early access is available online for a limited time.',
        imageUrl: undefined,
        imageAlt: undefined,
        buttonText: 'Explore benefits',
        buttonLink: '/page/member-benefits',
    },
};

export const Loading: Story = {
    render: () => <PromoCardFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid w-[46rem] max-w-full grid-cols-2 gap-4">
            <PromoCard {...meta.args} />
            <PromoCard
                title="Text-only promotion"
                description="Useful when editorial imagery is not required."
                buttonText="Learn more"
                buttonLink="/page/editorial"
            />
        </div>
    ),
};
