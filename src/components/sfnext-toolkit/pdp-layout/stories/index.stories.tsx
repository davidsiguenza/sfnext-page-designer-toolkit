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
import { PageDesignerProvider } from '@salesforce/storefront-next-runtime/design/react/core';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import PdpLayout from '..';
import { PdpProductNavigation } from '../product-navigation';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

function AuthoringMode({ children }: { children: ReactNode }) {
    return (
        <PageDesignerProvider
            clientId="sfnext-toolkit-pdp-layout-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            {children}
        </PageDesignerProvider>
    );
}

const meta: Meta<typeof PdpLayout> = {
    title: 'SFNextToolkit/Product/PDP Layout',
    component: PdpLayout,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <StoryProviders>
                <Story />
            </StoryProviders>
        ),
    ],
    args: {
        desktopColumnRatio: '50-50',
        mediaSide: 'left',
        galleryPresentation: 'grid',
        stickyProductInfo: false,
        enableProductNavigation: false,
    },
    argTypes: {
        desktopColumnRatio: { control: 'select', options: ['50-50', '60-40', '65-35', '70-30'] },
        mediaSide: { control: 'inline-radio', options: ['left', 'right'] },
        galleryPresentation: { control: 'inline-radio', options: ['grid', 'strip', 'carousel'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof PdpLayout>;

export const Default: Story = {
    render: (args) => (
        <AuthoringMode>
            <PdpLayout {...args} />
        </AuthoringMode>
    ),
};

export const EditorialMediaRight: Story = {
    args: {
        desktopColumnRatio: '65-35',
        mediaSide: 'right',
        galleryPresentation: 'strip',
        stickyProductInfo: true,
        enableProductNavigation: true,
    },
    render: (args) => (
        <AuthoringMode>
            <PdpLayout {...args} />
        </AuthoringMode>
    ),
};

export const ProductNavigation: Story = {
    render: () => (
        <PdpProductNavigation
            previous={{ productId: 'previous-dress', productName: 'Floral ceremony dress' }}
            next={{ productId: 'next-jacket', productName: 'Lightweight linen jacket' }}
        />
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="pdp-layout-story-snapshot" className="space-y-8 bg-background p-6">
            <AuthoringMode>
                <PdpLayout
                    desktopColumnRatio="70-30"
                    mediaSide="right"
                    galleryPresentation="carousel"
                    stickyProductInfo
                    enableProductNavigation
                />
            </AuthoringMode>
            <PdpProductNavigation
                previous={{ productId: 'previous-dress', productName: 'Floral ceremony dress' }}
                next={{ productId: 'next-jacket', productName: 'Lightweight linen jacket' }}
            />
        </div>
    ),
};
