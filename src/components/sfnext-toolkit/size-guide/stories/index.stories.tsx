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
import type { ShopperProducts } from '@/scapi';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import SizeGuide from '../index';

const clothingProduct = {
    id: 'mayoral-ceremony-dress',
    name: 'Vestido infantil de ceremonia',
    primaryCategoryId: 'girls-dresses',
    variationAttributes: [
        {
            id: 'size',
            name: 'Talla',
            values: ['2', '3', '4', '6', '8', '10', '12', '14', '16'].map((size) => ({
                name: size,
                value: size.padStart(3, '0'),
                orderable: size !== '14',
            })),
        },
    ],
} as ShopperProducts.schemas['Product'];

const footwearProduct = {
    id: 'mayoral-kids-shoe',
    name: 'Zapatilla infantil',
    primaryCategoryId: 'kids-footwear',
    variationAttributes: [
        {
            id: 'size',
            name: 'Talla',
            values: Array.from({ length: 19 }, (_, index) => String(index + 18)).map((size) => ({
                name: size,
                value: size,
                orderable: size !== '30',
            })),
        },
    ],
} as ShopperProducts.schemas['Product'];

const meta: Meta<typeof SizeGuide> = {
    title: 'SFNext Toolkit/Product/Mayoral Size Guide',
    component: SizeGuide,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MemoryRouter initialEntries={['/product/mayoral-ceremony-dress']}>
                <AllProvidersWrapper currency="EUR">
                    <div className="mx-auto w-full max-w-xl p-6">
                        <Story />
                    </div>
                </AllProvidersWrapper>
            </MemoryRouter>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'PDP fit finder backed by the reviewed Mayoral 2026-07-16 dataset. It can compare supported child sizes, use physical measurements, check catalog availability, and select the matching PDP variation.',
            },
        },
    },
    args: {
        product: clothingProduct,
        productKind: 'auto',
        audience: 'kids',
        sizeAttributeId: 'size',
        enableBrandComparison: true,
        enableMeasurements: true,
        enableAge: true,
    },
    argTypes: {
        productKind: { control: 'select', options: ['auto', 'clothing', 'tops', 'bottoms', 'footwear'] },
        audience: { control: 'inline-radio', options: ['kids', 'teen'] },
        product: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof SizeGuide>;

export const Clothing: Story = {};

export const Footwear: Story = {
    args: {
        product: footwearProduct,
        productKind: 'footwear',
        enableAge: false,
    },
};

export const MeasurementsOnly: Story = {
    args: {
        enableBrandComparison: false,
        enableAge: false,
    },
};
