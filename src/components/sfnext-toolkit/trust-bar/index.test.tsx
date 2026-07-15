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
import TrustBar, { TrustBarFallback, TrustBarMetadata } from './index';

vi.mock('@/components/region', () => ({
    Region: ({ regionId, className }: { regionId: string; className?: string }) => (
        <div data-testid={`region-${regionId}`} data-slot="trust-bar-items" className={className} />
    ),
}));

describe('SFNext Toolkit trust bar', () => {
    test('registers the region with only trust items and a five-item limit', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, TrustBarMetadata)).toBe('SFNextToolkit.trustBar');
        expect(getRegionDefinition(TrustBarMetadata, 'items')).toMatchObject({
            maxComponents: 5,
            componentTypeInclusions: ['SFNextToolkit.trustItem'],
        });

        const { fields } = getAttributeDefinitions(TrustBarMetadata.prototype);
        expect(fields.columns).toMatchObject({ type: 'enum', values: ['2', '3', '4', '5'], defaultValue: '4' });
    });

    test('renders a responsive standalone trust bar', () => {
        render(
            <TrustBar title="Why shop with us" columns="5" density="compact" surface="card">
                <div>Secure checkout</div>
            </TrustBar>
        );

        const section = screen.getByRole('region', { name: 'Why shop with us' });
        expect(section).toHaveAttribute('data-slot', 'sfnext-toolkit-trust-bar');
        expect(section).toHaveClass('bg-card', 'border-border');
        const items = section.querySelector('[data-slot="trust-bar-items"]');
        expect(items).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-5', 'gap-4', 'p-4');
        expect(screen.getByText('Secure checkout')).toBeInTheDocument();
    });

    test('normalizes unknown visual options to safe defaults', () => {
        const { container } = render(<TrustBar columns="constructor" density="toString" surface="__proto__" />);
        const section = container.querySelector('[data-slot="sfnext-toolkit-trust-bar"]');
        const items = container.querySelector('[data-slot="trust-bar-items"]');

        expect(section).toHaveClass('bg-muted');
        expect(items).toHaveClass('lg:grid-cols-4', 'gap-6', 'p-6');
    });

    test('renders the nested Page Designer region', () => {
        const component = {
            id: 'trust-bar-1',
            typeId: 'SFNextToolkit.trustBar',
            data: {},
            regions: [{ id: 'items', components: [] }],
        } as unknown as ComponentType;

        render(<TrustBar component={component} />);
        expect(screen.getByTestId('region-items')).toBeInTheDocument();
    });

    test('provides a four-item fallback', () => {
        const { container } = render(<TrustBarFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-trust-bar-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="trust-bar-fallback-items"] > div')).toHaveLength(4);
    });
});
