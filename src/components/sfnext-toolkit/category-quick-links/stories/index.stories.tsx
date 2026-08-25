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
import CategoryQuickLinks from '../index';

const sourceCategory: ShopperProducts.schemas['Category'] = {
    id: 'girls',
    name: 'Girls',
    categories: [
        { id: 'new-arrivals', name: 'New arrivals' },
        { id: 'dresses', name: 'Dresses' },
        { id: 'sets', name: 'Sets' },
        { id: 'coats', name: 'Coats & jackets' },
        { id: 'shoes', name: 'Shoes' },
        { id: 'accessories', name: 'Accessories' },
    ],
};

const meta: Meta<typeof CategoryQuickLinks> = {
    title: 'SFNext Toolkit/Category/Category Quick Links',
    component: CategoryQuickLinks,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Contextual child-category navigation for CLPs. With no source override it reads the active category; Page Designer can optionally select another catalog branch.',
            },
        },
    },
    args: {
        sourceCategory: 'girls',
        data: sourceCategory,
        title: 'Explore Girls',
        ariaLabel: 'Girls categories',
        sticky: false,
        tone: 'default',
        alignment: 'start',
        maxItems: 12,
    },
    argTypes: {
        tone: { control: 'inline-radio', options: ['default', 'muted'] },
        alignment: { control: 'inline-radio', options: ['start', 'center'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof CategoryQuickLinks>;

export const Default: Story = {};

export const StickyMuted: Story = {
    args: { sticky: true, tone: 'muted' },
    decorators: [
        (Story) => (
            <div style={{ ['--header-height' as never]: '64px' }} className="min-h-[40rem] pt-32">
                <Story />
            </div>
        ),
    ],
};

export const Centered: Story = {
    args: { alignment: 'center', title: undefined },
};

export const Snapshot: Story = {
    args: { tone: 'muted', maxItems: 5 },
};
