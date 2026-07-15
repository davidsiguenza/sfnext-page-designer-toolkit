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
import type { ComponentPropsWithoutRef } from 'react';
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

vi.mock('@/components/link', () => ({
    Link: ({ to, ...props }: ComponentPropsWithoutRef<'a'> & { to: string }) => <a href={to} {...props} />,
}));

describe('SFNext Toolkit promo grid', () => {
    test('preserves the constrained promo-card region and appends editorial controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, PromoGridMetadata)).toBe('SFNextToolkit.promoGrid');
        expect(getRegionDefinition(PromoGridMetadata, 'items')).toMatchObject({
            maxComponents: 6,
            componentTypeInclusions: ['SFNextToolkit.promoCard'],
        });

        const { fields } = getAttributeDefinitions(PromoGridMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'title',
            'subtitle',
            'columns',
            'gap',
            'surface',
            'layout',
            'headerAlignment',
            'shopAllLabel',
            'shopAllUrl',
        ]);
        expect(fields.columns).toMatchObject({ type: 'enum', values: ['2', '3', '4'], defaultValue: '3' });
        expect(fields.layout).toMatchObject({
            type: 'enum',
            values: ['equal', 'featured-first'],
            defaultValue: 'equal',
        });
        expect(fields.headerAlignment).toMatchObject({
            values: ['left', 'center', 'right'],
            defaultValue: 'left',
        });
        expect(fields.shopAllUrl).toMatchObject({ type: 'url' });
    });

    test('renders an equal responsive grid with merchant content', () => {
        render(
            <PromoGrid title="Seasonal stories" subtitle="Discover the edit" columns="4" gap="lg" surface="card">
                <article>First promo</article>
                <article>Second promo</article>
            </PromoGrid>
        );

        const section = screen.getByRole('region', { name: 'Seasonal stories' });
        expect(section).toHaveAttribute('data-slot', 'sfnext-toolkit-promo-grid');
        expect(section).toHaveAttribute('data-layout', 'equal');
        expect(section).toHaveClass('bg-card', 'border-border');
        const items = section.querySelector('[data-slot="promo-grid-items"]');
        expect(items).toHaveClass(
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-4',
            'gap-6',
            'md:gap-8',
            '[&>*]:h-full'
        );
        expect(screen.getByText('First promo')).toBeInTheDocument();
    });

    test('supports featured-first hierarchy from tablet upwards', () => {
        render(
            <PromoGrid title="Featured collection" layout="featured-first" columns="3">
                <article>Campaign</article>
                <article>Story two</article>
                <article>Story three</article>
            </PromoGrid>
        );

        const section = screen.getByRole('region', { name: 'Featured collection' });
        const items = section.querySelector('[data-slot="promo-grid-items"]');
        expect(section).toHaveAttribute('data-layout', 'featured-first');
        expect(items).toHaveClass('grid-flow-row-dense', 'sm:[&>*:first-child]:col-span-2', 'lg:grid-cols-3');
    });

    test('aligns the header and renders a safe shop-all action', () => {
        render(
            <PromoGrid
                title="Shop by age"
                subtitle="Collections for every stage"
                headerAlignment="center"
                shopAllLabel="View every collection"
                shopAllUrl="/category/all"
            />
        );

        const header = screen.getByText('Shop by age').closest('[data-slot="promo-grid-header"]');
        const link = screen.getByRole('link', { name: 'View every collection' });
        expect(header).toHaveClass('mx-auto', 'items-center', 'text-center');
        expect(link).toHaveAttribute('href', '/category/all');
        expect(link).toHaveAttribute('data-variant', 'link');
    });

    test.each(['javascript:alert(1)', 'data:text/html,boom', 'file:///etc/passwd', '//evil.example/path'])(
        'hides a shop-all action with unsafe destination %s',
        (shopAllUrl) => {
            render(<PromoGrid title="Safe grid" shopAllLabel="Shop all" shopAllUrl={shopAllUrl} />);
            expect(screen.queryByRole('link', { name: 'Shop all' })).not.toBeInTheDocument();
        }
    );

    test('normalizes unknown visual options to safe defaults', () => {
        const { container } = render(
            <PromoGrid
                title="Defaults"
                columns="constructor"
                gap="toString"
                surface="__proto__"
                layout="valueOf"
                headerAlignment="hasOwnProperty"
            />
        );
        const section = container.querySelector('[data-slot="sfnext-toolkit-promo-grid"]');
        const items = container.querySelector('[data-slot="promo-grid-items"]');
        const header = container.querySelector('[data-slot="promo-grid-header"]');

        expect(section).toHaveClass('bg-transparent');
        expect(section).toHaveAttribute('data-layout', 'equal');
        expect(items).toHaveClass('lg:grid-cols-3', 'gap-4', 'md:gap-6');
        expect(header).toHaveClass('mr-auto', 'items-start', 'text-left');
    });

    test('renders the nested Page Designer region with featured styling', () => {
        const component = {
            id: 'promo-grid-1',
            typeId: 'SFNextToolkit.promoGrid',
            data: {},
            regions: [{ id: 'items', components: [] }],
        } as unknown as ComponentType;

        render(<PromoGrid component={component} layout="featured-first" />);
        expect(screen.getByTestId('region-items')).toHaveClass(
            'grid-flow-row-dense',
            'sm:[&>*:first-child]:col-span-2'
        );
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
