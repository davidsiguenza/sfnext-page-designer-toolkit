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
import { RichText } from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const meta: Meta<typeof RichText> = {
    title: 'SFNext Toolkit/Rich Text',
    component: RichText,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoryProviders>
                <Story />
            </StoryProviders>
        ),
    ],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Accessible editorial copy for Page Designer. Merchants can author an eyebrow, semantic heading, formatted body, width, alignment, and token-based CTA style.',
            },
        },
    },
    argTypes: {
        headingLevel: { control: 'inline-radio', options: ['h2', 'h3', 'h4'] },
        alignment: { control: 'inline-radio', options: ['left', 'center', 'right'] },
        contentWidth: { control: 'inline-radio', options: ['full', 'wide', 'narrow'] },
        ctaStyle: { control: 'select', options: ['primary', 'secondary', 'outline', 'link'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: {
        eyebrow: 'New season',
        heading: 'Thoughtful essentials for every day',
        headingLevel: 'h2',
        content:
            '<p>Build a versatile wardrobe with comfortable pieces designed to be combined, shared, and worn again.</p>',
        alignment: 'left',
        contentWidth: 'wide',
        ctaLabel: 'Explore the collection',
        ctaUrl: '/category/new-arrivals',
        ctaStyle: 'primary',
    },
};

export default meta;
type Story = StoryObj<typeof RichText>;

export const Default: Story = {};

export const Centered: Story = {
    args: { alignment: 'center', contentWidth: 'narrow', ctaStyle: 'secondary' },
};

export const RightAligned: Story = {
    args: { alignment: 'right', ctaStyle: 'outline' },
};

export const CopyOnly: Story = {
    args: { eyebrow: undefined, heading: undefined, ctaUrl: undefined },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="rich-text-story-snapshot" className="grid gap-10 bg-background p-6">
            <RichText {...meta.args} alignment="left" ctaStyle="primary" />
            <RichText {...meta.args} alignment="center" contentWidth="narrow" ctaStyle="secondary" />
            <RichText {...meta.args} alignment="right" ctaStyle="outline" />
        </div>
    ),
};
