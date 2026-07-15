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
import SFNextToolkitAccordion from '../index';
import SFNextToolkitAccordionItem from '../../accordion-item';

const meta: Meta<typeof SFNextToolkitAccordion> = {
    title: 'SFNext Toolkit/Accordion',
    component: SFNextToolkitAccordion,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SFNextToolkitAccordion>;

const Items = () => (
    <>
        <SFNextToolkitAccordionItem
            title="What delivery options are available?"
            content="<p>Standard and express delivery are available at checkout.</p>"
            defaultOpen
        />
        <SFNextToolkitAccordionItem
            title="Can I return my order?"
            content="<p>Unused products can be returned during the configured returns window.</p>"
        />
        <SFNextToolkitAccordionItem
            title="How can I contact support?"
            content="<p>Use the contact options displayed in the storefront footer.</p>"
        />
    </>
);

export const Default: Story = {
    render: () => (
        <SFNextToolkitAccordion
            heading="Frequently asked questions"
            intro="Reusable help content authored with Page Designer.">
            <Items />
        </SFNextToolkitAccordion>
    ),
};

export const MediumWidth: Story = {
    render: () => (
        <SFNextToolkitAccordion heading="Delivery and returns" maxWidth="medium">
            <Items />
        </SFNextToolkitAccordion>
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <div className="p-6">
            <SFNextToolkitAccordion heading="Frequently asked questions">
                <Items />
            </SFNextToolkitAccordion>
        </div>
    ),
};
