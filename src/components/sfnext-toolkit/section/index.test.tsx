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
import { getAttributeDefinitions, getRegionDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { TOOLKIT_CONTEXTUAL_COMPONENT_TYPE_EXCLUSIONS } from '@/components/sfnext-toolkit/authoring-constraints';
import { Section, SFNextToolkitSectionMetadata } from './index';

vi.mock('@/components/region', () => ({
    Region: ({ regionId }: { regionId: string }) => <div data-testid={`region-${regionId}`} />,
}));

describe('SFNext Toolkit section', () => {
    test('renders standalone children with semantic slots and native props', () => {
        render(
            <Section anchorId="featured" aria-label="Featured content" className="custom-section">
                <p>Reusable content</p>
            </Section>
        );

        const section = screen.getByRole('region', { name: 'Featured content' });
        expect(section).toHaveAttribute('id', 'featured');
        expect(section).toHaveAttribute('data-slot', 'sfnext-toolkit-section');
        expect(section).toHaveClass('bg-transparent', 'py-8', 'custom-section');
        expect(screen.getByText('Reusable content')).toBeInTheDocument();
        expect(section.querySelector('[data-slot="sfnext-toolkit-section-content"]')).toHaveClass(
            'max-w-7xl',
            'text-left'
        );
    });

    test('applies token surfaces, responsive spacing, width, and alignment', () => {
        render(
            <Section surface="primary" spacing="xl" contentWidth="narrow" alignment="center" data-testid="section">
                Content
            </Section>
        );

        const section = screen.getByTestId('section');
        expect(section).toHaveClass('bg-primary', 'text-primary-foreground', 'py-16', 'md:py-24');
        expect(section.firstElementChild).toHaveClass('max-w-4xl', 'text-center');
    });

    test('ignores malformed merchant anchor IDs', () => {
        render(<Section anchorId="not a safe anchor" id="section-fallback" data-testid="section" />);
        expect(screen.getByTestId('section')).toHaveAttribute('id', 'section-fallback');
    });

    test('renders the nested Page Designer content region when component data is present', () => {
        const component = { id: 'section-1', typeId: 'SFNextToolkit.section', regions: [] };
        render(<Section component={component}>Standalone fallback</Section>);

        expect(screen.getByTestId('region-content')).toBeInTheDocument();
        expect(screen.queryByText('Standalone fallback')).not.toBeInTheDocument();
    });

    test('publishes the portable metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitSectionMetadata)).toBe('SFNextToolkit.section');

        const { fields } = getAttributeDefinitions(SFNextToolkitSectionMetadata.prototype);
        expect(Object.keys(fields)).toEqual(['anchorId', 'surface', 'spacing', 'contentWidth', 'alignment']);
        expect(fields.surface).toMatchObject({
            type: 'enum',
            defaultValue: 'transparent',
            values: ['transparent', 'background', 'muted', 'card', 'primary', 'secondary', 'accent'],
        });
        expect(getRegionDefinitions(SFNextToolkitSectionMetadata)).toEqual([
            expect.objectContaining({
                id: 'content',
                name: 'Content',
                componentTypeExclusions: [...TOOLKIT_CONTEXTUAL_COMPONENT_TYPE_EXCLUSIONS, 'SFNextToolkit.section'],
            }),
        ]);
    });
});
