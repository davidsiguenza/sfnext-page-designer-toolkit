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
import ResponsiveColumns, { ResponsiveColumnsFallback } from '../index';

function StoryPanel({ title, copy }: { title: string; copy: string }) {
    return (
        <article className="h-full rounded-ui border border-border bg-card p-6 text-card-foreground">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
        </article>
    );
}

const meta: Meta<typeof ResponsiveColumns> = {
    title: 'SFNext Toolkit/Layout/Responsive Columns',
    component: ResponsiveColumns,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Two- or three-column Page Designer container. Columns stack on mobile, support proportional desktop widths, and reject nested Responsive Columns and Section components.',
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="section-container py-8">
                <Story />
            </div>
        ),
    ],
    args: {
        columns: '2',
        ratio: 'equal',
        gap: 'md',
        verticalAlign: 'stretch',
        mobileOrder: 'normal',
        column1: <StoryPanel title="Editorial story" copy="Use any compatible Page Designer component here." />,
        column2: <StoryPanel title="Campaign content" copy="Each column remains independently authorable." />,
    },
    argTypes: {
        columns: { control: 'inline-radio', options: ['2', '3'] },
        ratio: { control: 'inline-radio', options: ['equal', '2-1', '1-2'] },
        gap: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        verticalAlign: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
        mobileOrder: { control: 'inline-radio', options: ['normal', 'reverse'] },
        component: { table: { disable: true } },
        componentData: { table: { disable: true } },
        designMetadata: { table: { disable: true } },
        data: { table: { disable: true } },
        regionId: { table: { disable: true } },
    },
};

export default meta;
type Story = StoryObj<typeof ResponsiveColumns>;

export const TwoEqual: Story = {};

export const TwoToOne: Story = {
    args: { ratio: '2-1', verticalAlign: 'center' },
};

export const ThreeColumns: Story = {
    args: {
        columns: '3',
        column3: <StoryPanel title="Supporting content" copy="The third region appears only in this mode." />,
    },
};

export const MobileReverse: Story = {
    args: { mobileOrder: 'reverse' },
};

export const Loading: Story = {
    render: () => <ResponsiveColumnsFallback columns="3" />,
};

export const Snapshot: Story = {
    args: {
        columns: '3',
        ratio: '2-1',
        gap: 'sm',
        column3: <StoryPanel title="Third column" copy="Three-column snapshot coverage." />,
    },
};
