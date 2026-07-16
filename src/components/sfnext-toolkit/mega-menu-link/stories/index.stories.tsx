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
import MegaMenuLink from '../index';

const meta: Meta<typeof MegaMenuLink> = {
    title: 'SFNext Toolkit/Navigation/Mega Menu/Link',
    component: MegaMenuLink,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="mx-auto w-full max-w-sm p-6">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A responsive curated mega-menu link with safe URL, category, product and Content Asset destinations plus optional icon, description and badge.',
            },
        },
    },
    args: {
        label: 'New arrivals',
        description: 'The latest pieces for the season',
        badge: 'New',
        destinationType: 'category',
        category: 'new-arrivals',
        icon: 'sparkles',
        visualStyle: 'plain',
    },
    argTypes: {
        destinationType: { control: 'inline-radio', options: ['url', 'category', 'product', 'content'] },
        icon: { control: 'select', options: ['none', 'sparkles', 'gift', 'star', 'truck', 'tag'] },
        visualStyle: { control: 'inline-radio', options: ['plain', 'highlight', 'chip'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MegaMenuLink>;

export const Plain: Story = {};

export const Highlight: Story = {
    args: {
        label: 'The ceremony edit',
        description: 'Considered looks for celebrations and special occasions.',
        badge: 'Editor pick',
        destinationType: 'url',
        url: '/category/ceremony',
        icon: 'star',
        visualStyle: 'highlight',
    },
};

export const Chip: Story = {
    args: {
        label: 'Free delivery over €50',
        description: undefined,
        badge: undefined,
        destinationType: 'content',
        contentId: 'delivery-and-returns',
        icon: 'truck',
        visualStyle: 'chip',
    },
};

export const DestinationTypes: Story = {
    render: () => (
        <div className="grid gap-2">
            <MegaMenuLink label="Campaign landing page" url="/campaign/summer" icon="sparkles" />
            <MegaMenuLink
                label="Girls collection"
                destinationType="category"
                category="girls"
                icon="star"
                visualStyle="highlight"
            />
            <MegaMenuLink
                label="Featured linen dress"
                destinationType="product"
                product="linen-dress"
                icon="tag"
                visualStyle="chip"
            />
            <MegaMenuLink
                label="Holiday packing guide"
                destinationType="content"
                contentId="holiday-packing-guide"
                icon="gift"
            />
        </div>
    ),
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid gap-3">
            <MegaMenuLink label="Plain link" url="/plain" visualStyle="plain" />
            <MegaMenuLink
                label="Highlighted link"
                description="Supports a short explanatory line."
                url="/highlighted"
                badge="New"
                icon="sparkles"
                visualStyle="highlight"
            />
            <MegaMenuLink label="Compact chip" url="/chip" icon="tag" visualStyle="chip" />
        </div>
    ),
};
