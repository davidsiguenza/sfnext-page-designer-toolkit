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
import { getAttributeDefinitions, getRegionDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import ResponsiveColumns, { ResponsiveColumnsFallback, ResponsiveColumnsMetadata } from './index';

vi.mock('@/components/region', () => ({
    Region: ({ regionId, className }: { regionId: string; className?: string }) => (
        <div data-testid={`region-${regionId}`} className={className} />
    ),
}));

describe('SFNext Toolkit responsive columns', () => {
    test('publishes literal options and excludes nested layout containers from every region', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, ResponsiveColumnsMetadata)).toBe('SFNextToolkit.responsiveColumns');

        const { fields } = getAttributeDefinitions(ResponsiveColumnsMetadata.prototype);
        expect(fields.columns).toMatchObject({ values: ['2', '3'], defaultValue: '2' });
        expect(fields.ratio).toMatchObject({ values: ['equal', '2-1', '1-2'], defaultValue: 'equal' });
        expect(fields.mobileOrder).toMatchObject({ values: ['normal', 'reverse'], defaultValue: 'normal' });
        expect(getRegionDefinitions(ResponsiveColumnsMetadata)).toEqual(
            ['column1', 'column2', 'column3'].map((id) =>
                expect.objectContaining({
                    id,
                    componentTypeExclusions: [
                        'SFNextToolkit.responsiveColumns',
                        'SFNextToolkit.section',
                        'SFNextToolkit.accordionItem',
                        'SFNextToolkit.categoryCard',
                        'SFNextToolkit.promoCard',
                        'SFNextToolkit.trustItem',
                    ],
                })
            )
        );
    });

    test('renders two standalone columns and never renders the third in two-column mode', () => {
        const { container } = render(
            <ResponsiveColumns
                ratio="2-1"
                gap="lg"
                verticalAlign="center"
                column1={<p>First column</p>}
                column2={<p>Second column</p>}
                column3={<p>Hidden column</p>}
            />
        );

        const root = container.querySelector('[data-slot="sfnext-toolkit-responsive-columns"]');
        expect(root).toHaveClass('lg:grid-cols-[2fr_1fr]', 'gap-6', 'md:gap-8', 'items-center');
        expect(screen.getByText('First column')).toBeInTheDocument();
        expect(screen.getByText('Second column')).toBeInTheDocument();
        expect(screen.queryByText('Hidden column')).not.toBeInTheDocument();
        expect(container.querySelector('[data-slot="responsive-columns-column3"]')).not.toBeInTheDocument();
    });

    test('renders all three Page Designer regions and reverses only their mobile order', () => {
        const component = {
            id: 'columns-1',
            typeId: 'SFNextToolkit.responsiveColumns',
            data: {},
            regions: [],
        } as unknown as ComponentType;

        const { container } = render(
            <ResponsiveColumns columns="3" ratio="1-2" mobileOrder="reverse" component={component} />
        );

        expect(container.firstElementChild).toHaveClass('lg:grid-cols-[1fr_2fr_1fr]');
        expect(screen.getByTestId('region-column1')).toHaveClass('order-3', 'lg:order-1');
        expect(screen.getByTestId('region-column2')).toHaveClass('order-2', 'lg:order-2');
        expect(screen.getByTestId('region-column3')).toHaveClass('order-1', 'lg:order-3');
    });

    test('normalizes unknown options to safe defaults', () => {
        const { container } = render(
            <ResponsiveColumns columns="constructor" ratio="__proto__" gap="toString" verticalAlign="unknown" />
        );

        expect(container.firstElementChild).toHaveClass('lg:grid-cols-2', 'gap-4', 'md:gap-6', 'items-stretch');
        expect(container.querySelector('[data-slot="responsive-columns-column3"]')).not.toBeInTheDocument();
    });

    test('matches the authored column count in its loading state', () => {
        const { container } = render(<ResponsiveColumnsFallback columns="3" />);
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
        expect(container.firstElementChild).toHaveClass('lg:grid-cols-3');
    });
});
