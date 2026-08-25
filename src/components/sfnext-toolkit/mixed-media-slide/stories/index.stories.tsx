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
import MixedMediaSlide from '../index';

const meta: Meta<typeof MixedMediaSlide> = {
    title: 'SFNext Toolkit/Media/Mixed Media Slide',
    component: MixedMediaSlide,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Nested slide for Mixed Media Carousel. Image mode supports responsive art direction; video mode delegates URL safety, captions, transcript and click-to-play to Embedded Video.',
            },
        },
    },
    args: {
        mediaType: 'image',
        desktopImage: { path: '/images/hero-01.webp', focal_point: { x: 50, y: 45 } },
        mobileImage: { path: '/images/hero-02.webp', focal_point: { x: 50, y: 35 } },
        imageAlt: 'Children wearing the latest collection',
        eyebrow: 'New collection',
        title: 'Stories made to move',
        body: 'Discover comfortable looks for every new adventure.',
        ctaLabel: 'Shop the collection',
        ctaUrl: '/category/new-arrivals',
        aspectRatio: 'cinematic',
        contentPlacement: 'overlay',
        contentAlignment: 'left',
    },
    argTypes: {
        mediaType: { control: 'inline-radio', options: ['image', 'video'] },
        aspectRatio: {
            control: 'select',
            options: ['widescreen', 'cinematic', 'standard', 'square', 'portrait'],
        },
        contentPlacement: { control: 'inline-radio', options: ['overlay', 'below'] },
        contentAlignment: { control: 'inline-radio', options: ['left', 'center', 'right'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MixedMediaSlide>;

export const ImageOverlay: Story = {};

export const ImageWithContentBelow: Story = {
    args: { contentPlacement: 'below', aspectRatio: 'widescreen' },
};

export const Video: Story = {
    args: {
        mediaType: 'video',
        desktopImage: undefined,
        mobileImage: undefined,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoTitle: 'Seasonal campaign film',
        posterImage: { path: '/images/hero-03.webp' },
        clickToPlay: true,
        contentPlacement: 'below',
        aspectRatio: 'widescreen',
        title: 'Behind the collection',
        body: 'Watch the campaign story.',
        ctaLabel: undefined,
        ctaUrl: undefined,
    },
};

export const Snapshot: Story = {
    args: { aspectRatio: 'widescreen', contentPlacement: 'overlay' },
};
