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
import SFNextToolkitAccordionItem from '../index';

const meta: Meta<typeof SFNextToolkitAccordionItem> = {
    title: 'SFNext Toolkit/Accordion Item',
    component: SFNextToolkitAccordionItem,
    tags: ['autodocs'],
    args: {
        title: 'What delivery options are available?',
        content: '<p>Standard and express delivery are available at checkout.</p>',
        contentStyle: 'text',
        defaultOpen: false,
    },
};

export default meta;
type Story = StoryObj<typeof SFNextToolkitAccordionItem>;

export const Default: Story = {};

export const OpenByDefault: Story = {
    args: { defaultOpen: true },
};

export const BulletedList: Story = {
    args: {
        title: 'Care instructions',
        content: '<ul><li>Wash at 30°C</li><li>Do not tumble dry</li><li>Iron at low temperature</li></ul>',
        contentStyle: 'bulleted-list',
        defaultOpen: true,
    },
};

export const Snapshot: Story = {
    name: 'Snapshot',
    args: { defaultOpen: true },
};
