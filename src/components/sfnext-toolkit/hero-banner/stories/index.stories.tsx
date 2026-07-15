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
import HeroBanner from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    desktopImage: { url: '/images/hero-01.webp', focalPoint: { x: 48, y: 48 } },
    mobileImage: { url: '/images/hero-02.webp', focalPoint: { x: 52, y: 40 } },
    decorativeImage: true,
    imageAlt: '',
    eyebrow: 'New collection',
    title: 'Made for every little adventure',
    body: 'Comfortable, considered styles for busy days, special moments, and everything in between.',
    headingLevel: 'h1' as const,
    visualSize: 'lg' as const,
    contentPosition: 'bottom-left' as const,
    height: 'lg' as const,
    overlay: 'strong' as const,
    primaryCtaLabel: 'Shop the collection',
    primaryCtaUrl: '/category/new-arrivals',
    secondaryCtaLabel: 'Explore the story',
    secondaryCtaUrl: '/page/our-story',
};

const meta: Meta<typeof HeroBanner> = {
    title: 'SFNext Toolkit/Hero Banner',
    component: HeroBanner,
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
                    'Responsive Page Designer campaign hero with desktop/mobile art direction, focal points, semantic heading control, semantic color tokens, and two validated CTAs.',
            },
        },
    },
    argTypes: {
        headingLevel: { control: 'inline-radio', options: ['h1', 'h2', 'h3'] },
        visualSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        contentPosition: {
            control: 'select',
            options: [
                'top-left',
                'top-center',
                'top-right',
                'middle-left',
                'middle-center',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
            ],
        },
        height: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
        overlay: { control: 'inline-radio', options: ['none', 'subtle', 'strong'] },
        desktopImage: { table: { disable: true } },
        mobileImage: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: DEFAULT_ARGS,
};

export default meta;
type Story = StoryObj<typeof HeroBanner>;

export const Default: Story = {};

export const MiddleCenter: Story = {
    args: {
        contentPosition: 'middle-center',
        visualSize: 'md',
        body: 'A centered treatment for concise, high-impact campaign messaging.',
    },
};

export const TopRight: Story = {
    args: {
        contentPosition: 'top-right',
        height: 'xl',
        overlay: 'subtle',
        visualSize: 'md',
    },
};

export const CompactWithoutImage: Story = {
    args: {
        desktopImage: undefined,
        mobileImage: undefined,
        height: 'sm',
        contentPosition: 'middle-left',
        overlay: 'none',
        headingLevel: 'h2',
        visualSize: 'sm',
        secondaryCtaLabel: undefined,
        secondaryCtaUrl: undefined,
    },
};

export const MobileArtDirection: Story = {
    args: {
        desktopImage: { url: '/images/hero-03.webp', focalPoint: { x: 35, y: 45 } },
        mobileImage: { url: '/images/hero-04.webp', focalPoint: { x: 62, y: 35 } },
        contentPosition: 'bottom-center',
        title: 'A dedicated crop for every screen',
    },
};

export const AuthoringEmpty: Story = {
    render: () => (
        <PageDesignerProvider
            clientId="sfnext-toolkit-hero-banner-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            <HeroBanner />
        </PageDesignerProvider>
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="hero-banner-story-snapshot" className="grid gap-8 bg-background py-6">
            <HeroBanner {...DEFAULT_ARGS} />
            <HeroBanner
                {...DEFAULT_ARGS}
                desktopImage={undefined}
                mobileImage={undefined}
                height="sm"
                overlay="none"
                headingLevel="h2"
                visualSize="sm"
            />
        </div>
    ),
};
