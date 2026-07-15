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
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { getRegionDefinitions } from '@/lib/decorators/region-definition';
import SFNextToolkitAccordion, { SFNextToolkitAccordionMetadata } from './index';

vi.mock('@/components/region', () => ({
    Region: ({ regionId }: { regionId: string }) => <div data-testid="region">{regionId}</div>,
}));

describe('SFNext Toolkit accordion', () => {
    test('registers an items region restricted to toolkit accordion items', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitAccordionMetadata)).toBe('SFNextToolkit.accordion');
        expect(getRegionDefinitions(SFNextToolkitAccordionMetadata)).toEqual([
            expect.objectContaining({
                id: 'items',
                maxComponents: 12,
                componentTypeInclusions: ['SFNextToolkit.accordionItem'],
            }),
        ]);
    });

    test('exposes safe layout attributes', () => {
        const { fields } = getAttributeDefinitions(SFNextToolkitAccordionMetadata.prototype);

        expect(Object.keys(fields)).toEqual(['heading', 'intro', 'maxWidth']);
        expect(fields.maxWidth).toMatchObject({
            type: 'enum',
            values: ['full', 'large', 'medium'],
            defaultValue: 'large',
        });
    });

    test('renders heading, intro, and standalone children', () => {
        render(
            <SFNextToolkitAccordion heading="Frequently asked questions" intro="Everything shoppers need to know.">
                <div>First answer</div>
            </SFNextToolkitAccordion>
        );

        expect(screen.getByRole('heading', { name: 'Frequently asked questions' })).toBeInTheDocument();
        expect(screen.getByText('Everything shoppers need to know.')).toBeInTheDocument();
        expect(screen.getByText('First answer')).toBeInTheDocument();
    });

    test('renders the nested Page Designer region when component data is present', () => {
        render(
            <SFNextToolkitAccordion
                component={{ id: 'accordion-1', typeId: 'SFNextToolkit.accordion', data: {}, regions: [] }}
            />
        );

        expect(screen.getByTestId('region')).toHaveTextContent('items');
    });

    test('normalizes an unknown width and merges custom classes last', () => {
        const { container } = render(<SFNextToolkitAccordion maxWidth="unsafe" className="max-w-xl" />);
        const root = container.querySelector('[data-slot="sfnext-accordion"]');

        expect(root).not.toHaveClass('max-w-4xl');
        expect(root).toHaveClass('max-w-xl');
    });

    test('rejects inherited object keys as width values', () => {
        const { container } = render(<SFNextToolkitAccordion maxWidth="constructor" />);
        expect(container.querySelector('[data-slot="sfnext-accordion"]')).toHaveClass('max-w-4xl');
    });
});
