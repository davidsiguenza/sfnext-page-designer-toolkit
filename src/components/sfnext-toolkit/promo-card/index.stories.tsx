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
import PromoCard, { PromoCardFallback } from './index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    eyebrow: 'New season',
    title: 'Everyday adventures',
    description: 'Versatile layers designed for busy mornings, afternoons outside and everything in between.',
    imageUrl: { url: '/images/hero-01.webp', focalPoint: { x: 50, y: 45 } },
    imageAlt: 'Child wearing a colourful new-season outfit',
    decorativeImage: false,
    buttonText: 'Shop the edit',
    buttonLink: '/category/new-arrivals',
    showBackground: true,
    showBorder: true,
    layout: 'stacked' as const,
    aspectRatio: 'landscape' as const,
    ctaStyle: 'primary' as const,
    hoverEffect: 'lift' as const,
};

const meta: Meta<typeof PromoCard> = {
    title: 'SFNext Toolkit/Promo/Promo Card',
    component: PromoCard,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <StoryProviders>
                <div className={context.name === 'Snapshot' ? 'mx-auto w-full max-w-6xl' : 'mx-auto w-full max-w-sm'}>
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
                    'Editorial Page Designer card with stacked and overlay layouts, DIS-ready focal-point imagery, accessible motion, decorative-image handling and safe token-based calls to action.',
            },
        },
    },
    args: DEFAULT_ARGS,
    argTypes: {
        layout: { control: 'inline-radio', options: ['stacked', 'overlay'] },
        aspectRatio: { control: 'inline-radio', options: ['landscape', 'square', 'portrait'] },
        ctaStyle: { control: 'select', options: ['primary', 'secondary', 'outline', 'link'] },
        hoverEffect: { control: 'inline-radio', options: ['none', 'lift', 'zoom'] },
        imageUrl: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof PromoCard>;

export const Default: Story = {};

export const Overlay: Story = {
    args: {
        layout: 'overlay',
        aspectRatio: 'portrait',
        ctaStyle: 'outline',
        hoverEffect: 'zoom',
        imageUrl: { url: '/images/hero-02.webp', focalPoint: { x: 52, y: 38 } },
    },
};

export const Portrait: Story = {
    args: {
        aspectRatio: 'portrait',
        ctaStyle: 'secondary',
        imageUrl: { url: '/images/hero-03.webp', focalPoint: { x: 55, y: 35 } },
    },
};

export const TextOnly: Story = {
    args: {
        eyebrow: 'Members first',
        title: 'Early access event',
        description: 'Sign in to discover the collection before anyone else.',
        imageUrl: undefined,
        imageAlt: undefined,
        buttonText: 'Explore benefits',
        buttonLink: '/page/member-benefits',
        ctaStyle: 'link',
        hoverEffect: 'none',
    },
};

export const DecorativeImage: Story = {
    args: {
        decorativeImage: true,
        imageAlt: '',
        showBorder: false,
    },
};

export const Loading: Story = {
    render: () => <PromoCardFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div data-slot="promo-card-story-snapshot" className="grid gap-6 bg-background p-6 md:grid-cols-3">
            <PromoCard {...DEFAULT_ARGS} />
            <PromoCard
                {...DEFAULT_ARGS}
                title="Holiday favourites"
                imageUrl={{ url: '/images/hero-02.webp', focalPoint: { x: 50, y: 40 } }}
                layout="overlay"
                aspectRatio="portrait"
                ctaStyle="outline"
                hoverEffect="zoom"
            />
            <PromoCard
                eyebrow="Members first"
                title="Early access event"
                description="Sign in to discover the collection before anyone else."
                buttonText="Explore benefits"
                buttonLink="/page/member-benefits"
                ctaStyle="link"
                hoverEffect="none"
            />
        </div>
    ),
};
