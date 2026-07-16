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
import MegaMenuFeature, { MegaMenuFeatureFallback } from '../index';
import type { MegaMenuFeatureLoaderData } from '../model';

const featuredProduct = {
    id: 'linen-dress-001',
    name: 'Embroidered linen dress',
    price: 49.95,
    currency: 'EUR',
    type: { item: true },
    inventory: { ats: 24, orderable: true, stockLevel: 24 },
} as ShopperProducts.schemas['Product'];

const categoryData: MegaMenuFeatureLoaderData = {
    status: 'ready',
    item: {
        sourceType: 'category',
        sourceId: 'girls',
        title: 'Girls summer collection',
        copy: 'Fresh colour, easy silhouettes and lightweight layers made for sunny days.',
        eyebrow: 'Category',
        image: { src: '/images/hero-01.webp', alt: 'Children wearing colourful summer outfits' },
        destination: '/category/girls',
    },
};

const productData: MegaMenuFeatureLoaderData = {
    status: 'ready',
    item: {
        sourceType: 'product',
        sourceId: 'linen-dress-001',
        title: 'Embroidered linen dress',
        copy: 'A lightweight favourite with delicate floral details.',
        eyebrow: 'Featured product',
        image: {
            src: '/images/hero-02.webp',
            alt: 'Embroidered linen dress',
            requestedViewType: 'hi-res',
            resolvedViewType: 'hi-res',
        },
        destination: '/product/linen-dress-001',
        product: featuredProduct,
        currency: 'EUR',
    },
};

const contentData: MegaMenuFeatureLoaderData = {
    status: 'ready',
    item: {
        sourceType: 'content',
        sourceId: 'holiday-packing-guide',
        title: 'The holiday packing guide',
        copy: 'A practical checklist for a lighter suitcase and easy outfit planning.',
        eyebrow: 'Style journal',
        image: { src: '/images/hero-03.webp', alt: 'A family preparing for a summer holiday' },
        destination: '/blog/holiday-packing-guide',
    },
};

const cmsData: MegaMenuFeatureLoaderData = {
    status: 'ready',
    item: {
        sourceType: 'cms',
        sourceId: 'summer-campaign',
        title: 'Made for summer',
        copy: 'A Salesforce CMS campaign card projected into a safe navigation model.',
        eyebrow: 'CMS campaign',
        image: { src: '/images/hero-04.webp', alt: 'Children enjoying a sunny day outdoors' },
        destination: '/campaign/summer',
    },
};

const meta: Meta<typeof MegaMenuFeature> = {
    title: 'SFNext Toolkit/Navigation/Mega Menu/Feature',
    component: MegaMenuFeature,
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
                    'A lightweight graphical mega-menu card. Loader data can come from a catalog category, product, B2C Content Asset or Salesforce CMS record; manual overrides always win.',
            },
        },
    },
    args: {
        sourceType: 'category',
        data: categoryData,
        showProductPrice: true,
        layout: 'stacked',
        imageRatio: 'landscape',
        objectFit: 'cover',
        tone: 'default',
    },
    argTypes: {
        sourceType: { control: 'select', options: ['category', 'product', 'content', 'cms', 'custom'] },
        imageViewType: { control: 'select', options: ['hi-res', 'large', 'medium', 'small', 'swatch'] },
        layout: { control: 'inline-radio', options: ['stacked', 'overlay'] },
        imageRatio: { control: 'inline-radio', options: ['landscape', 'square', 'portrait'] },
        objectFit: { control: 'inline-radio', options: ['cover', 'contain'] },
        tone: { control: 'select', options: ['default', 'muted', 'accent', 'dark'] },
        category: { table: { disable: true } },
        product: { table: { disable: true } },
        cmsRecord: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MegaMenuFeature>;

export const Category: Story = {};

export const Product: Story = {
    args: {
        sourceType: 'product',
        data: productData,
        badge: 'Bestseller',
        imageViewType: 'hi-res',
        imageRatio: 'portrait',
        tone: 'muted',
    },
};

export const Content: Story = {
    args: {
        sourceType: 'content',
        data: contentData,
        layout: 'overlay',
        imageRatio: 'portrait',
        ctaLabel: 'Read the guide',
    },
};

export const SalesforceCms: Story = {
    name: 'Salesforce CMS',
    args: {
        sourceType: 'cms',
        data: cmsData,
        badge: 'Campaign',
        tone: 'accent',
    },
};

export const CustomEditorial: Story = {
    args: {
        sourceType: 'custom',
        data: { status: 'ready', item: { sourceType: 'custom' } },
        eyebrow: 'Store services',
        title: 'Find your nearest store',
        copy: 'Discover collections in person and get help from our local teams.',
        imageOverride: { path: '/images/hero-02.webp', focal_point: { x: 0.42, y: 0.5 } },
        imageAlt: 'A welcoming childrenswear store',
        ctaLabel: 'Find a store',
        ctaUrl: '/stores',
        badge: undefined,
        tone: 'dark',
    },
};

export const Loading: Story = {
    render: () => <MegaMenuFeatureFallback imageRatio="landscape" />,
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
            <MegaMenuFeature sourceType="category" data={categoryData} />
            <MegaMenuFeature sourceType="product" data={productData} badge="Bestseller" imageRatio="portrait" />
            <MegaMenuFeature sourceType="content" data={contentData} layout="overlay" />
            <MegaMenuFeature sourceType="cms" data={cmsData} tone="accent" />
        </div>
    ),
};
