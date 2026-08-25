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
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import EditorialCard from './index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const meta: Meta<typeof EditorialCard> = {
    title: 'SFNext Toolkit/PLP/Editorial Card',
    component: EditorialCard,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoryProviders>
                <div className="grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
                    <Story />
                </div>
            </StoryProviders>
        ),
    ],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Editorial interlink authored inside a PLP Merchandising Grid. Position and spans participate in the same CSS grid as product cards without altering product pagination.',
            },
        },
    },
    args: {
        position: 4,
        columnSpan: '2',
        mobileColumnSpan: '2',
        rowSpan: '1',
        eyebrow: 'The seasonal edit',
        title: 'Looks for every adventure',
        description: 'Discover coordinated pieces selected for the new season.',
        imageUrl: { url: '/images/hero-02.webp', focalPoint: { x: 50, y: 40 } },
        imageAlt: 'Children wearing coordinated new-season outfits',
        buttonText: 'Explore the edit',
        buttonLink: '/category/new-arrivals',
        layout: 'overlay',
        ctaStyle: 'link',
    },
    argTypes: {
        position: { control: { type: 'number', min: 0, max: 99 } },
        columnSpan: { control: 'inline-radio', options: ['1', '2', 'full'] },
        mobileColumnSpan: { control: 'inline-radio', options: ['1', '2'] },
        rowSpan: { control: 'inline-radio', options: ['1', '2'] },
        imageUrl: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof EditorialCard>;

export const Default: Story = {};

export const FullWidth: Story = {
    args: {
        position: 8,
        columnSpan: 'full',
        title: 'Complete the look',
    },
};

export const Tall: Story = {
    args: {
        position: 6,
        columnSpan: '1',
        mobileColumnSpan: '1',
        rowSpan: '2',
        layout: 'stacked',
    },
};
