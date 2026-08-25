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
import MixedMediaSlide from '@/components/sfnext-toolkit/mixed-media-slide';
import MixedMediaCarousel from '../index';

const slides = [
    <MixedMediaSlide
        key="image-one"
        desktopImage={{ path: '/images/hero-01.webp' }}
        imageAlt="Children exploring outdoors in the latest collection"
        eyebrow="New collection"
        title="Made for every adventure"
        body="Comfortable layers designed to keep up with them."
        ctaLabel="Shop new arrivals"
        ctaUrl="/category/new-arrivals"
        aspectRatio="cinematic"
        priorityImage
    />,
    <MixedMediaSlide
        key="video"
        mediaType="video"
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        videoTitle="Seasonal campaign film"
        posterImage={{ path: '/images/hero-03.webp' }}
        title="Behind the collection"
        body="Discover how the season came to life."
        contentPlacement="below"
        aspectRatio="cinematic"
    />,
    <MixedMediaSlide
        key="image-two"
        desktopImage={{ path: '/images/hero-04.webp' }}
        imageAlt="Special occasion childrenswear"
        eyebrow="Ceremony"
        title="For memorable moments"
        ctaLabel="Discover ceremony"
        ctaUrl="/category/ceremony"
        aspectRatio="cinematic"
        contentAlignment="center"
    />,
];

const meta: Meta<typeof MixedMediaCarousel> = {
    title: 'SFNext Toolkit/Media/Mixed Media Carousel',
    component: MixedMediaCarousel,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'CLP carousel that accepts only Mixed Media Slides in Page Designer and supports image/video sequencing without automatic playback.',
            },
        },
    },
    args: {
        title: 'Campaign stories',
        subtitle: 'Explore seasonal imagery and film in one accessible carousel.',
        surface: 'default',
        contentWidth: 'full',
        showNavigation: true,
        loop: false,
        children: slides,
    },
    argTypes: {
        surface: { control: 'inline-radio', options: ['default', 'muted'] },
        contentWidth: { control: 'inline-radio', options: ['full', 'contained'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MixedMediaCarousel>;

export const Default: Story = {};

export const ContainedMuted: Story = {
    args: { contentWidth: 'contained', surface: 'muted' },
};

export const WithoutNavigation: Story = {
    args: { showNavigation: false },
};

export const Snapshot: Story = {
    args: { contentWidth: 'contained', surface: 'muted' },
};
