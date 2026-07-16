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
import { mockMasterProductHitWithMultipleVariants } from '@/components/__mocks__/product-search-hit-data';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import ProductCard, { ProductCardFallback } from '../index';

const productData = {
    status: 'ready' as const,
    product: {
        ...mockMasterProductHitWithMultipleVariants,
        brand: 'North & Pine',
        c_material: 'Organic cotton',
    },
    categoryName: 'New arrivals',
};

const meta: Meta<typeof ProductCard> = {
    title: 'SFNext Toolkit/Product/Product Card',
    component: ProductCard,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <AllProvidersWrapper currency="EUR">
                <div className={context.name === 'Auto Wide' ? 'mx-auto w-full max-w-4xl' : 'mx-auto w-full max-w-sm'}>
                    <Story />
                </div>
            </AllProvidersWrapper>
        ),
    ],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Standalone Page Designer product card backed by Shopper Products. It reuses the storefront ProductTile, supports catalog image view types and PLP field controls, and responds to the width of its Page Designer container.',
            },
        },
    },
    args: {
        data: productData,
        layout: 'auto',
        imageViewType: 'medium',
        imageRatio: 'auto',
        objectFit: 'cover',
        showBadges: true,
        showWishlist: true,
        showQuickAdd: true,
        showSwatches: true,
        showBrand: true,
        showCategory: true,
        showProductName: true,
        showSku: true,
        showRating: true,
        showPrice: true,
        showPromotions: true,
        maxSwatches: 3,
        additionalAttributes: 'material|Material',
        borderRadius: 'xl',
        boxShadow: 'sm',
        hoverEffect: 'default',
    },
    argTypes: {
        layout: { control: 'inline-radio', options: ['auto', 'vertical', 'horizontal'] },
        imageViewType: { control: 'select', options: ['hi-res', 'large', 'medium', 'small', 'swatch'] },
        imageRatio: { control: 'inline-radio', options: ['auto', 'square', 'portrait', 'landscape'] },
        objectFit: { control: 'select', options: ['cover', 'contain', 'fill', 'none', 'scale-down'] },
        borderRadius: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
        boxShadow: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'] },
        hoverEffect: { control: 'inline-radio', options: ['default', 'scale', 'shadow', 'lift'] },
        product: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};

export const AutoWide: Story = {
    name: 'Auto Wide',
};

export const Horizontal: Story = {
    args: { layout: 'horizontal', imageRatio: 'square' },
};

export const Minimal: Story = {
    args: {
        layout: 'vertical',
        showBadges: false,
        showWishlist: false,
        showQuickAdd: false,
        showSwatches: false,
        showBrand: false,
        showCategory: false,
        showSku: false,
        showRating: false,
        showPromotions: false,
        additionalAttributes: '',
        boxShadow: 'none',
    },
};

export const Loading: Story = {
    render: () => <ProductCardFallback />,
};
