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
import TrustItem from '@/components/sfnext-toolkit/trust-item';
import TrustBar, { TrustBarFallback } from './index';

const trustItems = [
    { icon: 'delivery', title: 'Free delivery', description: 'On qualifying orders.' },
    { icon: 'returns', title: 'Easy returns', description: 'Simple online returns.' },
    { icon: 'payment', title: 'Secure payment', description: 'Protected checkout.' },
    { icon: 'support', title: 'Personal support', description: 'We are happy to help.' },
] as const;

const meta: Meta<typeof TrustBar> = {
    title: 'SFNext Toolkit/Trust/Trust Bar',
    component: TrustBar,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Responsive parent component for up to five SFNextToolkit.trustItem children. Useful on home, PLP, PDP and editorial pages.',
            },
        },
    },
    args: {
        title: 'Shop with confidence',
        columns: '4',
        density: 'comfortable',
        surface: 'muted',
    },
    argTypes: {
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: (args) => (
        <TrustBar {...args}>
            {trustItems.map((item) => (
                <TrustItem key={item.icon} {...item} />
            ))}
        </TrustBar>
    ),
};

export default meta;
type Story = StoryObj<typeof TrustBar>;

export const Default: Story = {};

export const CompactCard: Story = {
    args: { density: 'compact', surface: 'card' },
};

export const Loading: Story = {
    render: () => <TrustBarFallback />,
};

export const Snapshot: Story = {
    args: { title: undefined, surface: 'transparent' },
};
