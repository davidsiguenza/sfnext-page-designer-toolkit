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
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import type { ShopperOrders, ShopperProducts } from '@/scapi';
import { OrderDetails } from '../index';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';
import { ConfigWrapper, mockLocale, mockSiteObject } from '@/test-utils/config';
import { SiteProvider } from '@salesforce/storefront-next-runtime/site-context';

const { t } = getTranslation();

function productFixture(
    id: string,
    name: string,
    imageGroups: ShopperProducts.schemas['Product']['imageGroups'] = []
): ShopperProducts.schemas['Product'] {
    return {
        id,
        name,
        imageGroups,
        variationAttributes: [],
        variationValues: {},
    } as ShopperProducts.schemas['Product'];
}

const order: ShopperOrders.schemas['Order'] = {
    orderNo: 'INO001',
    status: 'new',
    orderTotal: 71.38,
    productSubTotal: 61.99,
    productTotal: 61.99,
    productItems: [
        {
            itemId: '0066d7441cdaf6f93a64ca7a74',
            productId: '701643108633M',
            productName: 'First Product',
            quantity: 1,
            basePrice: 61.99,
            price: 61.99,
            priceAfterItemDiscount: 61.99,
            shipmentId: 'me',
        },
    ],
    shipments: [
        {
            shipmentId: 'me',
            shipmentNo: '00002503',
            trackingNumber: '1234567890',
            shippingAddress: {
                address1: '2030 Market street 8th st',
                city: 'Seattle',
                countryCode: 'US',
                firstName: 'John',
                fullName: 'John Snow',
                lastName: 'Snow',
                postalCode: '98121',
                stateCode: 'WA',
            },
            shippingMethod: { id: '001', name: 'Ground', price: 5.99 },
        },
    ],
};

const productsById: Record<string, ShopperProducts.schemas['Product'] | undefined> = {
    '701643108633M': productFixture('701643108633M', 'First Product', [
        { viewType: 'small', images: [{ link: 'https://example.com/product.jpg', alt: 'First Product' }] },
    ]),
};

const meta: Meta<typeof OrderDetails> = {
    title: 'ACCOUNT/Order Details',
    component: OrderDetails,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Order details: order number with a decorative `#` prefix, **order status** badge (`getOrderStatusConfig` / `data-testid="order-status-badge"`, unknown values as raw text in a neutral badge), per-shipment **shipping status** (`getShippingStatusConfig` / `data-testid="shipping-status-badge"`, same raw fallback when not in the SCAPI enum), shipment rows showing only the shipment label (recipient names appear in the shipping address card only), line items, tracking and address cards, optional **payment methods** in the summary column, and order totals. In the app, data is loaded via `fetchOrderWithProducts` (SCAPI getOrder + getProducts); stories use inline mock data with the same shape.',
            },
        },
    },
    tags: ['autodocs', 'interaction'],
    decorators: [
        (Story) => (
            <ConfigWrapper>
                <SiteProvider
                    site={mockSiteObject}
                    locale={mockLocale}
                    language={mockSiteObject.defaultLocale}
                    currency={mockSiteObject.defaultCurrency}>
                    <Story />
                </SiteProvider>
            </ConfigWrapper>
        ),
    ],
    argTypes: {
        order: { table: { disable: true } },
        productsById: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof OrderDetails>;

export const Default: Story = {
    args: {
        order,
        productsById,
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
        await expect(canvas.getByTestId('order-number')).toHaveTextContent('INO001');
        await expect(canvas.getByTestId('order-status-badge')).toHaveTextContent(t('account:orders.status.new'));
        await expect(canvas.queryByTestId('shipping-status-badge')).not.toBeInTheDocument();
        await expect(canvas.getByText('First Product')).toBeInTheDocument();
    },
};

const orderMultipleShipments: ShopperOrders.schemas['Order'] = {
    orderNo: 'INV002',
    status: 'new',
    orderTotal: 30,
    productSubTotal: 30,
    productTotal: 30,
    productItems: [
        {
            itemId: 'item-a1',
            productId: 'prod-a',
            productName: 'Product for Alice',
            quantity: 1,
            priceAfterItemDiscount: 10,
            shipmentId: 'ship-a',
        },
        {
            itemId: 'item-b1',
            productId: 'prod-b',
            productName: 'Product for Bob',
            quantity: 1,
            priceAfterItemDiscount: 20,
            shipmentId: 'ship-b',
        },
    ],
    shipments: [
        {
            shipmentId: 'ship-a',
            shipmentNo: '00002501',
            shippingAddress: { firstName: 'Alice', lastName: 'Smith', fullName: 'Alice Smith' },
        },
        {
            shipmentId: 'ship-b',
            shipmentNo: '00002502',
            shippingAddress: { firstName: 'Bob', lastName: 'Jones', fullName: 'Bob Jones' },
        },
    ],
};

const productsByIdMultiple: Record<string, ShopperProducts.schemas['Product'] | undefined> = {
    'prod-a': productFixture('prod-a', 'Product for Alice'),
    'prod-b': productFixture('prod-b', 'Product for Bob'),
};

export const MultipleShipments: Story = {
    args: {
        order: orderMultipleShipments,
        productsById: productsByIdMultiple,
    },
    parameters: {
        docs: {
            description: {
                story: 'Two shipments with different shipping addresses (Alice Smith, Bob Jones). Names appear only in each shipment’s **Shipping address** card, not on the shipment title row.',
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('order-status-badge')).toHaveTextContent(t('account:orders.status.new'));
        await expect(canvas.queryByTestId('shipping-status-badge')).not.toBeInTheDocument();
    },
};

export const CompletedStatus: Story = {
    args: {
        order: { ...order, status: 'completed' },
        productsById,
    },
    parameters: {
        docs: {
            description: {
                story: 'Order with status `completed` — **order status** badge uses success styling (green).',
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('order-status-badge')).toHaveTextContent(t('account:orders.status.completed'));
    },
};

export const ReplacedStatus: Story = {
    args: {
        order: { ...order, status: 'replaced' },
        productsById,
    },
    parameters: {
        docs: {
            description: {
                story: 'Order with status `replaced` — **order status** badge uses success styling (green).',
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('order-status-badge')).toHaveTextContent(t('account:orders.status.replaced'));
    },
};

export const WithShippingStatus: Story = {
    args: {
        order: {
            ...order,
            shipments: order.shipments?.map((s, i) => (i === 0 ? { ...s, shippingStatus: 'shipped' as const } : s)),
        },
        productsById,
    },
    parameters: {
        docs: {
            description: {
                story: 'First shipment has `shippingStatus: "shipped"` — **shipping status** badge on the shipment row (success / green). Order status badge unchanged.',
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('order-status-badge')).toHaveTextContent(t('account:orders.status.new'));
        await expect(canvas.getByTestId('shipping-status-badge')).toHaveTextContent(
            t('account:orders.shippingStatus.shipped')
        );
    },
};

const orderWithPayment: ShopperOrders.schemas['Order'] = {
    ...order,
    paymentInstruments: [
        {
            paymentInstrumentId: 'pay-story-1',
            paymentCard: { cardType: 'Visa', numberLastDigits: '4242' },
        },
    ],
};

export const WithPaymentMethod: Story = {
    args: {
        order: orderWithPayment,
        productsById,
    },
    parameters: {
        docs: {
            description: {
                story: 'Order summary column includes **Payment method** when `paymentInstruments` include card last digits.',
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByText(t('account:orders.paymentMethod'))).toBeInTheDocument();
        const expected = t('account:orders.paymentMethodEndingIn', {
            cardType: 'Visa',
            lastDigits: '4242',
        });
        await expect(canvas.getByText(expected)).toBeInTheDocument();
    },
};
