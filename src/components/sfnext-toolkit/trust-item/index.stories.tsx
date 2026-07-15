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
import TrustItem, { TrustItemFallback } from './index';

const meta: Meta<typeof TrustItem> = {
    title: 'SFNext Toolkit/Trust/Trust Item',
    component: TrustItem,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Concise reassurance message using an explicit allow-list of Lucide icons. Designed as a child of SFNextToolkit.trustBar.',
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="w-72">
                <Story />
            </div>
        ),
    ],
    args: {
        icon: 'delivery',
        title: 'Free delivery',
        description: 'On qualifying orders.',
        linkLabel: 'Delivery details',
        linkUrl: '/page/delivery',
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
type Story = StoryObj<typeof TrustItem>;

export const Default: Story = {};

export const SecurePayment: Story = {
    args: {
        icon: 'payment',
        title: 'Secure payment',
        description: 'Protected checkout.',
        linkLabel: 'Payment methods',
        linkUrl: '/page/payment-methods',
    },
};

export const Loading: Story = {
    render: () => <TrustItemFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid w-[40rem] max-w-full grid-cols-2 gap-6">
            {(['delivery', 'returns', 'security', 'payment', 'support', 'store', 'package', 'gift'] as const).map(
                (icon) => (
                    <TrustItem key={icon} icon={icon} title={icon} description="Example reassurance copy." />
                )
            )}
        </div>
    ),
};
