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
import EmbeddedVideo from '../index';

function StoryProviders({ children }: { children: ReactNode }) {
    const content = <AllProvidersWrapper>{children}</AllProvidersWrapper>;
    return useInRouterContext() ? content : <MemoryRouter>{content}</MemoryRouter>;
}

const DEFAULT_ARGS = {
    videoUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    videoTitle: 'The story behind our new collection',
    posterImage: { url: '/images/hero-01.webp' },
    caption: 'Discover the people, details, and ideas behind the collection.',
    transcriptUrl: '/page/campaign-transcript',
    transcriptLabel: 'Read the transcript',
    aspectRatio: 'widescreen' as const,
    maxWidth: 'wide' as const,
    clickToPlay: true,
    startAtSeconds: 0,
    autoplay: false,
    muted: false,
    loop: false,
    preload: 'metadata' as const,
    allowFullscreen: true,
};

const DIRECT_VIDEO_FIXTURE = '/videos/sfnext-toolkit-campaign.mp4';

const meta: Meta<typeof EmbeddedVideo> = {
    title: 'SFNext Toolkit/Embedded Video',
    component: EmbeddedVideo,
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
                    'Privacy-conscious Page Designer video for allow-listed YouTube and Vimeo embeds or secure direct media. It includes click-to-play, reduced-motion-aware autoplay, responsive ratios, WebVTT captions, and a transcript link.',
            },
        },
    },
    argTypes: {
        aspectRatio: {
            control: 'select',
            options: ['widescreen', 'cinematic', 'standard', 'square', 'portrait'],
        },
        maxWidth: { control: 'inline-radio', options: ['full', 'wide', 'narrow'] },
        preload: { control: 'inline-radio', options: ['none', 'metadata'] },
        posterImage: { table: { disable: true } },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: DEFAULT_ARGS,
};

export default meta;
type Story = StoryObj<typeof EmbeddedVideo>;

export const YouTube: Story = {};

export const Vimeo: Story = {
    args: {
        videoUrl: 'https://vimeo.com/76979871',
        videoTitle: 'A film from our design studio',
        posterImage: { url: '/images/hero-02.webp' },
        aspectRatio: 'cinematic',
        startAtSeconds: 12,
    },
};

export const DirectVideo: Story = {
    args: {
        videoUrl: DIRECT_VIDEO_FIXTURE,
        videoTitle: 'Campaign film with captions',
        posterImage: { url: '/images/hero-03.webp' },
        captionsUrl: '/captions/sfnext-toolkit-campaign-en.vtt',
        captionsLanguage: 'en',
        captionsLabel: 'English',
        clickToPlay: false,
        transcriptUrl: '/page/campaign-transcript',
    },
};

export const Portrait: Story = {
    args: {
        videoUrl: DIRECT_VIDEO_FIXTURE,
        videoTitle: 'Portrait social story',
        posterImage: { url: '/images/hero-04.webp' },
        aspectRatio: 'portrait',
        maxWidth: 'narrow',
        clickToPlay: false,
        caption: 'A vertical treatment for portrait campaign films.',
    },
};

export const AuthoringEmpty: Story = {
    render: () => (
        <PageDesignerProvider
            clientId="sfnext-toolkit-embedded-video-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            <EmbeddedVideo />
        </PageDesignerProvider>
    ),
};

export const AuthoringProvider: Story = {
    render: () => (
        <PageDesignerProvider
            clientId="sfnext-toolkit-embedded-video-provider-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            <EmbeddedVideo
                videoUrl="https://www.youtube.com/watch?v=M7lc1UVf-VE"
                videoTitle="Third-party video stays unloaded in EDIT mode"
            />
        </PageDesignerProvider>
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="embedded-video-story-snapshot" className="grid gap-8 bg-background p-6">
            <EmbeddedVideo {...DEFAULT_ARGS} />
            <EmbeddedVideo
                {...DEFAULT_ARGS}
                videoUrl="https://vimeo.com/76979871"
                videoTitle="Vimeo campaign"
                posterImage={{ url: '/images/hero-02.webp' }}
                aspectRatio="cinematic"
                maxWidth="narrow"
            />
            <EmbeddedVideo
                {...DEFAULT_ARGS}
                videoUrl={DIRECT_VIDEO_FIXTURE}
                videoTitle="Direct campaign video"
                posterImage={{ url: '/images/hero-03.webp' }}
                clickToPlay={false}
            />
        </div>
    ),
};
