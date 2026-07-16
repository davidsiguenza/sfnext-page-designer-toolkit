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
import MegaMenuPanel, { MegaMenuPanelFallback } from '../index';
import MegaMenuLink from '../../mega-menu-link';
import MegaMenuFeature from '../../mega-menu-feature';

const featureData = {
    status: 'ready' as const,
    item: {
        sourceType: 'category' as const,
        sourceId: 'girls',
        title: 'Ceremony collection',
        copy: 'Modern occasionwear designed for days worth remembering.',
        eyebrow: 'Curated edit',
        image: { src: '/images/hero-02.webp', alt: 'Children dressed for a celebration' },
        destination: '/category/girls-occasionwear',
    },
};

const ExtraLinks = () => (
    <div className="grid gap-1">
        <MegaMenuLink
            label="New arrivals"
            description="The latest pieces for the season"
            destinationType="category"
            category="girls-new-arrivals"
            icon="sparkles"
        />
        <MegaMenuLink
            label="Gifts under €40"
            destinationType="url"
            url="/category/gifts-under-40"
            icon="gift"
            visualStyle="highlight"
            badge="Gift edit"
        />
        <MegaMenuLink label="Size guide" destinationType="content" contentId="size-guide" visualStyle="chip" />
    </div>
);

const Feature = () => (
    <MegaMenuFeature sourceType="category" data={featureData} layout="stacked" imageRatio="landscape" />
);

const meta: Meta<typeof MegaMenuPanel> = {
    title: 'SFNext Toolkit/Navigation/Mega Menu/Panel',
    component: MegaMenuPanel,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="mx-auto w-full max-w-md p-6">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A targeted panel for one root catalog category. It combines up to eight curated links with one optional graphical feature and can place either content block first.',
            },
        },
    },
    args: {
        targetCategory: 'girls',
        heading: 'Discover girls',
        intro: 'Seasonal edits and useful shortcuts selected by the merchandising team.',
        extraItemsHeading: 'Highlights',
        showViewAll: true,
        viewAllLabel: 'Shop all girls',
        layout: 'links-first',
        surface: 'card',
        density: 'comfortable',
        editorialWidth: 'standard',
        standardBannerMode: 'inherit',
        extraItems: <ExtraLinks />,
        feature: <Feature />,
    },
    argTypes: {
        layout: { control: 'inline-radio', options: ['links-first', 'feature-first'] },
        surface: { control: 'select', options: ['transparent', 'card', 'muted', 'accent'] },
        density: { control: 'inline-radio', options: ['compact', 'comfortable'] },
        editorialWidth: { control: 'inline-radio', options: ['compact', 'standard', 'wide'] },
        standardBannerMode: {
            control: 'select',
            options: ['inherit', 'fallback', 'replace', 'alongside'],
        },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
        extraItems: { table: { disable: true } },
        feature: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MegaMenuPanel>;

export const LinksFirst: Story = {};

export const FeatureFirst: Story = {
    args: {
        layout: 'feature-first',
        surface: 'muted',
    },
};

export const CompactLinksOnly: Story = {
    args: {
        density: 'compact',
        surface: 'transparent',
        intro: undefined,
        showViewAll: false,
        feature: undefined,
    },
};

export const Loading: Story = {
    render: () => <MegaMenuPanelFallback />,
};

export const Snapshot: Story = {
    render: () => (
        <div className="grid gap-6">
            <MegaMenuPanel
                targetCategory="girls"
                heading="Links first"
                surface="card"
                extraItems={<ExtraLinks />}
                feature={<Feature />}
            />
            <MegaMenuPanel
                targetCategory="boys"
                heading="Feature first"
                layout="feature-first"
                surface="muted"
                extraItems={<ExtraLinks />}
                feature={<Feature />}
            />
        </div>
    ),
};
