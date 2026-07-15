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
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { mockConfig } from '@/test-utils/config';
import SFNextToolkitAccordionItem, { SFNextToolkitAccordionItemMetadata } from './index';

vi.mock('@salesforce/storefront-next-runtime/config', () => ({
    useConfig: () => mockConfig,
}));

describe('SFNext Toolkit accordion item', () => {
    beforeEach(() => vi.clearAllMocks());

    test('registers the reusable type and rich-text contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitAccordionItemMetadata)).toBe(
            'SFNextToolkit.accordionItem'
        );

        const { fields } = getAttributeDefinitions(SFNextToolkitAccordionItemMetadata.prototype);
        expect(Object.keys(fields)).toEqual(['title', 'content', 'contentStyle', 'defaultOpen']);
        expect(fields.content).toMatchObject({ type: 'markup', required: true });
        expect(fields.defaultOpen).toMatchObject({ type: 'boolean', defaultValue: false });
    });

    test('uses an accessible native disclosure and reveals rich text', async () => {
        const { container } = render(
            <SFNextToolkitAccordionItem title="Delivery" content="<p>Delivered in two working days.</p>" />
        );

        const details = container.querySelector('details');
        expect(details).not.toHaveAttribute('open');
        expect(screen.getByText('Delivery')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(container.querySelector('summary') as HTMLElement);
            await Promise.resolve();
        });

        expect(details).toHaveAttribute('open');
        expect(screen.getByText('Delivered in two working days.')).toBeInTheDocument();
    });

    test('supports an open-by-default item and safe content styles', () => {
        const { container } = render(
            <SFNextToolkitAccordionItem
                title="Materials"
                content="<ul><li>Cotton</li></ul>"
                contentStyle="bulleted-list"
                defaultOpen
            />
        );

        expect(container.querySelector('details')).toHaveAttribute('open');
        expect(screen.getByTestId('html-fragment')).toHaveClass('[&_ul]:flex');
    });

    test('normalizes invalid content styles and supplies an empty-title fallback', () => {
        render(<SFNextToolkitAccordionItem title="  " content="Body" contentStyle="constructor" defaultOpen />);

        expect(screen.getByText('Accordion item')).toBeInTheDocument();
        expect(screen.getByTestId('html-fragment')).toHaveClass('leading-relaxed');
    });

    test('exposes a toolkit data slot and merges caller classes', () => {
        const { container } = render(
            <SFNextToolkitAccordionItem title="Returns" content="Body" className="custom-item" />
        );

        expect(container.querySelector('[data-slot="sfnext-accordion-item"]')).toHaveClass('custom-item');
    });
});
