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
import SFNextToolkitCategoryHero from '../index';

const PLP_ROUTE_ID = 'routes/_app.category.$categoryId';

const meta: Meta<typeof SFNextToolkitCategoryHero> = {
    title: 'SFNext Toolkit/Category Hero',
    component: SFNextToolkitCategoryHero,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SFNextToolkitCategoryHero>;

export const CategoryDefaults: Story = {
    parameters: {
        routeLoaderData: {
            [PLP_ROUTE_ID]: {
                category: {
                    id: 'girls-dresses',
                    name: 'Dresses',
                    description: 'Looks designed for celebrations and special days.',
                    parentCategoryTree: [
                        { id: 'root', name: 'Root' },
                        { id: 'girls', name: 'Girls' },
                    ],
                },
                searchResultCritical: { total: 48 },
            },
        },
    },
};

export const EditorialOverride: Story = {
    args: {
        eyebrow: 'New collection',
        title: 'Ceremony edit',
        description: 'Selected looks for moments worth remembering.',
        productCountOverride: 24,
        height: 'lg',
        alignment: 'center',
        overlay: 'medium',
    },
};

export const CompactWithoutCount: Story = {
    args: {
        eyebrow: 'Explore',
        title: 'Everyday essentials',
        description: 'Versatile styles for every day.',
        showProductCount: false,
        height: 'sm',
        alignment: 'left',
        overlay: 'subtle',
    },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    args: {
        eyebrow: 'New collection',
        title: 'Ceremony edit',
        description: 'Selected looks for moments worth remembering.',
        productCountOverride: 24,
        height: 'md',
        alignment: 'center',
        overlay: 'strong',
    },
};
