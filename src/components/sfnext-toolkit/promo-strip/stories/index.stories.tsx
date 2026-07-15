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
import { PageDesignerProvider } from '@salesforce/storefront-next-runtime/design/react/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, useInRouterContext } from 'react-router';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import PromoStrip from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    message: 'Free standard delivery on orders over €50',
    linkLabel: 'View delivery details',
    linkUrl: '/page/delivery',
    icon: 'delivery' as const,
    tone: 'primary' as const,
    size: 'md' as const,
    alignment: 'center' as const,
};

const meta: Meta<typeof PromoStrip> = {
    title: 'SFNext Toolkit/Promo Strip',
    component: PromoStrip,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoryProviders>
                <Story />
            </StoryProviders>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Static announcement strip for Page Designer. It uses paired semantic color tokens, allow-listed icons, responsive wrapping, and a validated optional destination.',
            },
        },
    },
    argTypes: {
        icon: {
            control: 'select',
            options: ['none', 'megaphone', 'sparkles', 'tag', 'delivery', 'gift', 'info'],
        },
        tone: { control: 'inline-radio', options: ['primary', 'secondary', 'accent', 'muted'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        alignment: { control: 'inline-radio', options: ['left', 'center', 'right'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: DEFAULT_ARGS,
};

export default meta;
type Story = StoryObj<typeof PromoStrip>;

export const Default: Story = {};

export const Secondary: Story = {
    args: {
        tone: 'secondary',
        icon: 'sparkles',
        message: 'Members get early access to the new collection',
        linkLabel: 'Sign in',
        linkUrl: '/login',
    },
};

export const AccentCompact: Story = {
    args: {
        tone: 'accent',
        size: 'sm',
        alignment: 'left',
        icon: 'tag',
        message: 'Mid-season styles now available',
        linkLabel: 'Shop offers',
        linkUrl: '/category/offers',
    },
};

export const MutedTextOnly: Story = {
    args: {
        tone: 'muted',
        size: 'lg',
        alignment: 'right',
        icon: 'none',
        message: 'Extended returns available during the holiday period',
        linkLabel: undefined,
        linkUrl: undefined,
    },
};

export const AuthoringEmpty: Story = {
    render: () => (
        <PageDesignerProvider
            clientId="sfnext-toolkit-promo-strip-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            <PromoStrip />
        </PageDesignerProvider>
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="promo-strip-story-snapshot" className="grid bg-background">
            <PromoStrip {...DEFAULT_ARGS} />
            <PromoStrip {...DEFAULT_ARGS} tone="secondary" icon="sparkles" message="Members get early access" />
            <PromoStrip {...DEFAULT_ARGS} tone="accent" size="sm" alignment="left" icon="tag" />
            <PromoStrip {...DEFAULT_ARGS} tone="muted" size="lg" alignment="right" icon="none" />
        </div>
    ),
};
