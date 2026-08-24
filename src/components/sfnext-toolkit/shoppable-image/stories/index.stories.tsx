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
import type { ShopperSearch } from '@/scapi';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import ShoppableImage, { ShoppableImageFallback } from '../index';
import type { ShoppableImageLoaderData } from '../loaders';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper currency="EUR">{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const campaignImage = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <rect width="1400" height="900" fill="#eadfd6"/>
  <rect x="80" y="70" width="1240" height="760" rx="32" fill="#d8c2b2"/>
  <circle cx="700" cy="230" r="90" fill="#f2c6a0"/>
  <path d="M560 790 L625 390 L775 390 L850 790 Z" fill="#8a5a44"/>
  <path d="M520 430 Q700 320 880 430 L815 610 L585 610 Z" fill="#295b66"/>
  <rect x="510" y="610" width="140" height="180" rx="35" fill="#2b2a2a"/>
  <rect x="755" y="610" width="140" height="180" rx="35" fill="#2b2a2a"/>
  <text x="70" y="860" font-family="Arial" font-size="30" fill="#3c3029">Campaign image placeholder</text>
</svg>`)}`;

const products = [
    { productId: 'hat-1', productName: 'Knitted hat', price: 19.95, currency: 'EUR', orderable: true },
    { productId: 'dress-1', productName: 'Panelled dress', price: 49.95, currency: 'EUR', orderable: true },
    { productId: 'bag-1', productName: 'Mini bag', price: 24.95, currency: 'EUR', orderable: false },
    { productId: 'shoe-1', productName: 'Leather ankle boot', price: 59.95, currency: 'EUR', orderable: true },
] as ShopperSearch.schemas['ProductSearchHit'][];

const data: ShoppableImageLoaderData = {
    status: 'ready',
    currency: 'EUR',
    config: {
        version: 1,
        sourceMode: 'manual',
        hotspots: [
            { id: 'hat', productId: 'hat-1', label: 'Hat', x: 50, y: 16, mobileX: 48, mobileY: 14 },
            { id: 'dress', productId: 'dress-1', label: 'Dress', x: 57, y: 50, mobileX: 54, mobileY: 48 },
            { id: 'bag', productId: 'bag-1', label: 'Bag', x: 36, y: 58, mobileX: 33, mobileY: 58 },
            { id: 'shoes', productId: 'shoe-1', label: 'Shoes', x: 59, y: 84, mobileX: 58, mobileY: 86 },
        ],
    },
    hotspots: [
        { id: 'hat', productId: 'hat-1', label: 'Hat', x: 50, y: 16, mobileX: 48, mobileY: 14, product: products[0] },
        {
            id: 'dress',
            productId: 'dress-1',
            label: 'Dress',
            x: 57,
            y: 50,
            mobileX: 54,
            mobileY: 48,
            product: products[1],
        },
        { id: 'bag', productId: 'bag-1', label: 'Bag', x: 36, y: 58, mobileX: 33, mobileY: 58, product: products[2] },
        {
            id: 'shoes',
            productId: 'shoe-1',
            label: 'Shoes',
            x: 59,
            y: 84,
            mobileX: 58,
            mobileY: 86,
            product: products[3],
        },
    ],
    products,
    invalidProductIds: [],
};

const meta: Meta<typeof ShoppableImage> = {
    title: 'SFNext Toolkit/Commerce/Shoppable Image',
    component: ShoppableImage,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoryProviders>
                <div className="mx-auto w-full max-w-6xl p-4">
                    <Story />
                </div>
            </StoryProviders>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Hybrid Page Designer Shop the Look component. Merchants can place catalog-backed points freely or constrain them to a Product Set; each point opens the standard storefront Quick Add.',
            },
        },
    },
    args: {
        desktopImage: campaignImage,
        altText: 'Child wearing an autumn campaign outfit',
        heading: 'Shop the look',
        description: 'Select a hotspot to choose a size and add the item to the cart.',
        showContentPanel: true,
        showViewAllButton: true,
        hotspotTheme: 'light',
        showProductPreview: true,
        showHotspotNumbers: false,
        data,
    },
    argTypes: {
        hotspotTheme: { control: 'inline-radio', options: ['light', 'dark', 'brand'] },
        desktopImage: { table: { disable: true } },
        mobileImage: { table: { disable: true } },
        hotspotConfig: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof ShoppableImage>;

export const FreeSelection: Story = {};

export const NumberedBrandPoints: Story = {
    args: { hotspotTheme: 'brand', showHotspotNumbers: true },
};

export const ImageOnly: Story = {
    args: { showContentPanel: false },
};

export const ProductSet: Story = {
    args: {
        data: {
            ...data,
            productSetId: 'campaign-look-set',
            productSetName: 'Campaign Look Set',
            config: { ...data.config, sourceMode: 'productSet', productSetId: 'campaign-look-set' },
        },
    },
};

export const Loading: Story = {
    render: () => <ShoppableImageFallback />,
};
