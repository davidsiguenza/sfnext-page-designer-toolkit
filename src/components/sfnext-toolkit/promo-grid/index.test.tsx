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
import type { ComponentType } from '@/components/region';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { getRegionDefinition } from '@/lib/decorators/region-definition';
import PromoGrid, { PromoGridFallback, PromoGridMetadata } from './index';

vi.mock('@/components/region', () => ({
    Region: ({ regionId, className }: { regionId: string; className?: string }) => (
        <div data-testid={`region-${regionId}`} data-slot="promo-grid-items" className={className} />
    ),
}));

describe('SFNext Toolkit promo grid', () => {
    test('registers the region with only promo cards and a six-card limit', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, PromoGridMetadata)).toBe('SFNextToolkit.promoGrid');
        expect(getRegionDefinition(PromoGridMetadata, 'items')).toMatchObject({
            maxComponents: 6,
            componentTypeInclusions: ['SFNextToolkit.promoCard'],
        });

        const { fields } = getAttributeDefinitions(PromoGridMetadata.prototype);
        expect(fields.columns).toMatchObject({ type: 'enum', values: ['2', '3', '4'], defaultValue: '3' });
    });

    test('renders a responsive standalone grid with merchant content', () => {
        render(
            <PromoGrid title="Seasonal stories" subtitle="Discover the edit" columns="4" gap="lg" surface="card">
                <article>First promo</article>
                <article>Second promo</article>
            </PromoGrid>
        );

        const section = screen.getByRole('region', { name: 'Seasonal stories' });
        expect(section).toHaveAttribute('data-slot', 'sfnext-toolkit-promo-grid');
        expect(section).toHaveClass('bg-card', 'border-border');
        const items = section.querySelector('[data-slot="promo-grid-items"]');
        expect(items).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4', 'gap-6', 'md:gap-8');
        expect(screen.getByText('First promo')).toBeInTheDocument();
    });

    test('normalizes unknown visual options to safe defaults', () => {
        const { container } = render(<PromoGrid columns="constructor" gap="toString" surface="__proto__" />);
        const section = container.querySelector('[data-slot="sfnext-toolkit-promo-grid"]');
        const items = container.querySelector('[data-slot="promo-grid-items"]');

        expect(section).toHaveClass('bg-transparent');
        expect(items).toHaveClass('lg:grid-cols-3', 'gap-4', 'md:gap-6');
    });

    test('renders the nested Page Designer region', () => {
        const component = {
            id: 'promo-grid-1',
            typeId: 'SFNextToolkit.promoGrid',
            data: {},
            regions: [{ id: 'items', components: [] }],
        } as unknown as ComponentType;

        render(<PromoGrid component={component} />);
        expect(screen.getByTestId('region-items')).toBeInTheDocument();
    });

    test('provides a three-card fallback', () => {
        const { container } = render(<PromoGridFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-promo-grid-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(
            container.querySelectorAll('[data-slot="promo-grid-fallback-items"] > [data-slot="skeleton"]')
        ).toHaveLength(3);
    });
});
