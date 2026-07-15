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
import { Section } from '../index';

const meta: Meta<typeof Section> = {
    title: 'SFNext Toolkit/Section',
    component: Section,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Page Designer layout container with one nested `content` region. It provides token-based surfaces, responsive vertical spacing, safe content widths, text alignment, and an optional anchor ID.',
            },
        },
    },
    argTypes: {
        surface: {
            control: 'select',
            options: ['transparent', 'background', 'muted', 'card', 'primary', 'secondary', 'accent'],
        },
        spacing: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl'] },
        contentWidth: { control: 'inline-radio', options: ['full', 'contained', 'narrow'] },
        alignment: { control: 'inline-radio', options: ['left', 'center', 'right'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
    args: {
        surface: 'transparent',
        spacing: 'md',
        contentWidth: 'contained',
        alignment: 'left',
        anchorId: 'example-section',
    },
    render: (args) => (
        <Section {...args}>
            <div
                data-slot="section-story-content"
                className="rounded-ui border border-border bg-card p-6 text-card-foreground">
                <h2 className="text-2xl font-semibold">Composable content region</h2>
                <p className="mt-2 text-muted-foreground">
                    In Page Designer, merchants drag compatible components into this area.
                </p>
            </div>
        </Section>
    ),
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {};

export const Muted: Story = {
    args: { surface: 'muted', spacing: 'lg' },
};

export const Primary: Story = {
    args: { surface: 'primary', spacing: 'lg', alignment: 'center' },
};

export const Narrow: Story = {
    args: { surface: 'background', contentWidth: 'narrow' },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div data-slot="section-story-snapshot" className="bg-background">
            {(['background', 'muted', 'primary', 'secondary', 'accent'] as const).map((surface) => (
                <Section key={surface} surface={surface} spacing="sm" contentWidth="narrow">
                    <p className="font-medium">{surface} surface</p>
                </Section>
            ))}
        </div>
    ),
};
