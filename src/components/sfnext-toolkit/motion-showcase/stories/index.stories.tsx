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
import MotionShowcase from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    imageUrl: { url: '/images/hero-01.webp', focalPoint: { x: 50, y: 50 } },
    imageAlt: 'Family enjoying the new collection',
    eyebrow: 'Reusable motion tokens',
    heading: 'Motion managed from Page Designer',
    content: '<p>Effect, duration, curve, delay and sequence are selected in the merchant UX without writing CSS.</p>',
    ctaLabel: 'Discover the collection',
    ctaUrl: '/category/new-arrivals',
    surface: 'card' as const,
    motion: {
        version: 1 as const,
        effect: 'fade_up' as const,
        duration: 'standard' as const,
        easing: 'enter' as const,
        delay: 'none' as const,
        sequence: 'stagger' as const,
        stagger: 'standard' as const,
        trigger: 'load' as const,
        replay: false,
    },
};

const meta: Meta<typeof MotionShowcase> = {
    title: 'SFNext Toolkit/Motion Showcase',
    component: MotionShowcase,
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
                    'Page Designer editorial component that resolves semantic animation choices through centrally managed motion tokens.',
            },
        },
    },
    args: DEFAULT_ARGS,
};

export default meta;
type Story = StoryObj<typeof MotionShowcase>;

export const FadeUp: Story = {};

export const SlideFromLeft: Story = {
    args: {
        mediaPosition: 'right',
        motion: { ...DEFAULT_ARGS.motion, effect: 'slide_left', duration: 'slow', easing: 'emphasized' },
    },
};

export const ScaleTogether: Story = {
    args: {
        motion: { ...DEFAULT_ARGS.motion, effect: 'scale', sequence: 'together', delay: 'short' },
    },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="motion-showcase-story-snapshot" className="grid gap-8 bg-background p-6">
            <MotionShowcase {...DEFAULT_ARGS} motion={{ ...DEFAULT_ARGS.motion, effect: 'none' }} />
            <MotionShowcase
                {...DEFAULT_ARGS}
                mediaPosition="right"
                surface="muted"
                motion={{ ...DEFAULT_ARGS.motion, effect: 'none' }}
            />
        </div>
    ),
};
