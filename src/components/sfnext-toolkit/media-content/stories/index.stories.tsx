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
import { MediaContent } from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    imageUrl: { url: '/images/hero-01.webp', focalPoint: { x: 50, y: 50 } },
    imageAlt: 'Family enjoying time together',
    eyebrow: 'Designed for real life',
    heading: 'Comfort, quality, and room to explore',
    headingLevel: 'h2' as const,
    content:
        '<p>Discover versatile pieces made to move through busy mornings, weekend plans, and every small adventure in between.</p>',
    ctaLabel: 'Discover the collection',
    ctaUrl: '/category/new-arrivals',
    ctaStyle: 'primary' as const,
    mediaPosition: 'left' as const,
    mediaRatio: 'landscape' as const,
    surface: 'card' as const,
    contentAlignment: 'center' as const,
    contentSpacing: 'md' as const,
};

const meta: Meta<typeof MediaContent> = {
    title: 'SFNext Toolkit/Media + Content',
    component: MediaContent,
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
                    'Responsive editorial split component for Page Designer. It combines DIS-ready imagery, focal-point support, formatted copy, semantic headings, and a token-based CTA.',
            },
        },
    },
    argTypes: {
        mediaPosition: { control: 'inline-radio', options: ['left', 'right'] },
        mediaRatio: { control: 'select', options: ['landscape', 'square', 'portrait', 'auto'] },
        surface: { control: 'select', options: ['transparent', 'background', 'muted', 'card', 'secondary'] },
        contentAlignment: { control: 'inline-radio', options: ['start', 'center', 'end'] },
        contentSpacing: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        headingLevel: { control: 'inline-radio', options: ['h2', 'h3', 'h4'] },
        ctaStyle: { control: 'select', options: ['primary', 'secondary', 'outline', 'link'] },
        imageUrl: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: DEFAULT_ARGS,
};

export default meta;
type Story = StoryObj<typeof MediaContent>;

export const Default: Story = {};

export const ImageRight: Story = {
    args: { mediaPosition: 'right', surface: 'muted', ctaStyle: 'outline' },
};

export const Portrait: Story = {
    args: { mediaRatio: 'portrait', surface: 'background', contentAlignment: 'end' },
};

export const TextOnly: Story = {
    args: { imageUrl: undefined, surface: 'secondary' },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="media-content-story-snapshot" className="grid gap-8 bg-background p-6">
            <MediaContent {...DEFAULT_ARGS} />
            <MediaContent {...DEFAULT_ARGS} mediaPosition="right" surface="muted" ctaStyle="outline" />
            <MediaContent {...DEFAULT_ARGS} imageUrl={undefined} surface="secondary" />
        </div>
    ),
};
