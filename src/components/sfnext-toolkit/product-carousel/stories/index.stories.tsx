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
import { MemoryRouter } from 'react-router';
import SFNextToolkitProductCarousel from '../index';

const products = Array.from({ length: 8 }, (_, index) => ({
    productId: `demo-product-${index + 1}`,
    productName: `Everyday style ${index + 1}`,
    price: 29 + index * 4,
    currency: 'EUR',
    image: {
        alt: `Everyday style ${index + 1}`,
        disBaseLink: '/images/hero-01.webp',
        link: '/images/hero-01.webp',
    },
}));

const meta: Meta<typeof SFNextToolkitProductCarousel> = {
    title: 'SFNext Toolkit/Featured Product Carousel',
    component: SFNextToolkitProductCarousel,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        ),
    ],
    parameters: { layout: 'fullscreen' },
    args: {
        title: 'New this week',
        subtitle: 'Fresh styles selected for the season',
        shopAllText: 'View all',
        shopAllUrl: '/category/new-arrivals',
        data: { hits: products },
    },
};

export default meta;
type Story = StoryObj<typeof SFNextToolkitProductCarousel>;

export const Default: Story = {};

export const EmptyAuthoringState: Story = { args: { data: null } };
