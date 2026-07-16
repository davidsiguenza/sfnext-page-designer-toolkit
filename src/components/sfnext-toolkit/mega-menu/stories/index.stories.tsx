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
import MegaMenu, { MegaMenuFallback } from '../index';
import MegaMenuPanel from '../../mega-menu-panel';
import MegaMenuLink from '../../mega-menu-link';
import MegaMenuFeature from '../../mega-menu-feature';

const girlsFeature = {
    status: 'ready' as const,
    item: {
        sourceType: 'category' as const,
        sourceId: 'girls',
        title: 'Summer stories',
        copy: 'Light layers, bright colour and easy silhouettes for long days outside.',
        eyebrow: 'Girls',
        image: { src: '/images/hero-01.webp', alt: 'Children wearing colourful summer outfits' },
        destination: '/category/girls',
    },
};

const boysFeature = {
    status: 'ready' as const,
    item: {
        sourceType: 'content' as const,
        sourceId: 'holiday-packing-guide',
        title: 'The holiday packing guide',
        copy: 'A practical edit of the pieces worth making room for.',
        eyebrow: 'Journal',
        image: { src: '/images/hero-03.webp', alt: 'Children exploring outdoors' },
        destination: '/blog/holiday-packing-guide',
    },
};

function GirlsPanel() {
    return (
        <MegaMenuPanel
            targetCategory="girls"
            heading="Discover girls"
            intro="Standard category navigation stays intact; these links and the feature are additive."
            extraItemsHeading="Highlights"
            surface="card"
            extraItems={
                <div className="grid gap-1">
                    <MegaMenuLink label="New arrivals" category="girls-new-arrivals" destinationType="category" />
                    <MegaMenuLink
                        label="Occasionwear"
                        description="Looks for celebrations and special days"
                        category="girls-occasionwear"
                        destinationType="category"
                        icon="sparkles"
                        visualStyle="highlight"
                    />
                </div>
            }
            feature={<MegaMenuFeature sourceType="category" data={girlsFeature} badge="New" />}
        />
    );
}

function BoysPanel() {
    return (
        <MegaMenuPanel
            targetCategory="boys"
            heading="Explore boys"
            layout="feature-first"
            surface="muted"
            extraItems={
                <div className="grid gap-1">
                    <MegaMenuLink label="Holiday shop" url="/category/boys-holiday" icon="star" />
                    <MegaMenuLink label="Delivery & returns" url="/help/delivery" icon="truck" />
                </div>
            }
            feature={<MegaMenuFeature sourceType="content" data={boysFeature} layout="overlay" />}
        />
    );
}

const meta: Meta<typeof MegaMenu> = {
    title: 'SFNext Toolkit/Navigation/Mega Menu',
    component: MegaMenu,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="mx-auto w-full max-w-6xl p-6">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Embedded Page Designer owner for contextual mega-menu panels. The storefront keeps the standard catalog navigation and renders only the panel targeted at the open root category.',
            },
        },
    },
    args: {
        enabled: true,
        mobileEditorial: true,
        defaultStandardBannerMode: 'fallback',
    },
    argTypes: {
        defaultStandardBannerMode: {
            control: 'inline-radio',
            options: ['fallback', 'replace', 'alongside'],
        },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
        children: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof MegaMenu>;

/** Simulates the ordinary content block while both targeted panels are being authored before Header assignment. */
export const PanelsAuthoring: Story = {
    render: (args) => (
        <MegaMenu {...args}>
            <div className="grid gap-6 lg:grid-cols-2">
                <GirlsPanel />
                <BoysPanel />
            </div>
        </MegaMenu>
    ),
};

export const SinglePanelAuthoring: Story = {
    render: (args) => (
        <MegaMenu {...args}>
            <div className="max-w-md">
                <GirlsPanel />
            </div>
        </MegaMenu>
    ),
};

export const Loading: Story = {
    render: () => <MegaMenuFallback />,
};

export const Snapshot: Story = {
    render: (args) => (
        <MegaMenu {...args}>
            <div className="grid gap-6 lg:grid-cols-2">
                <GirlsPanel />
                <BoysPanel />
            </div>
        </MegaMenu>
    ),
};
