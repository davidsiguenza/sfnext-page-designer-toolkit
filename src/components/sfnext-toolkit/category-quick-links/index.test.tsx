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
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperProducts } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import CategoryQuickLinks, { CategoryQuickLinksMetadata } from './index';

const pageDesignerMode = { isDesignMode: false };
const mockUseRouteLoaderData = vi.fn();

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => pageDesignerMode,
}));

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router')>();
    return {
        ...actual,
        useRouteLoaderData: (...args: unknown[]) => mockUseRouteLoaderData(...args),
    };
});

vi.mock('@/components/link', () => ({
    Link: ({
        to,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

const children: ShopperProducts.schemas['Category'][] = [
    { id: 'dresses', name: 'Dresses' },
    { id: 'coats', name: 'Coats' },
    { id: 'shoes', name: 'Shoes' },
];

describe('SFNext Toolkit category quick links', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
        mockUseRouteLoaderData.mockReturnValue({
            category: { id: 'girls', name: 'Girls', categories: children },
        });
    });

    test('publishes current-category, sticky, appearance, and limit controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, CategoryQuickLinksMetadata)).toBe('SFNextToolkit.categoryQuickLinks');

        const { fields } = getAttributeDefinitions(CategoryQuickLinksMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'sourceCategory',
            'title',
            'ariaLabel',
            'sticky',
            'tone',
            'alignment',
            'maxItems',
        ]);
        expect(fields.sourceCategory.type).toBe('category');
        expect(fields.sticky).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.maxItems).toMatchObject({ type: 'integer', defaultValue: 12 });
    });

    test('uses immediate children from the current category by default', () => {
        render(<CategoryQuickLinks title="Explore Girls" />);

        expect(screen.getByRole('navigation', { name: 'Explore Girls' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Dresses' })).toHaveAttribute('href', '/category/dresses');
        expect(screen.getByRole('link', { name: 'Coats' })).toBeInTheDocument();
    });

    test('uses loaded alternate-source children and marks the current route category', () => {
        mockUseRouteLoaderData.mockReturnValue({ category: { id: 'ceremony', name: 'Ceremony' } });
        const alternate: ShopperProducts.schemas['Category'] = {
            id: 'girls',
            name: 'Girls',
            categories: [
                { id: 'ceremony', name: 'Ceremony' },
                { id: 'casual', name: 'Casual' },
            ],
        };

        render(<CategoryQuickLinks sourceCategory="girls" data={alternate} />);

        expect(screen.getByRole('link', { name: 'Ceremony' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Casual' })).toBeInTheDocument();
    });

    test('clamps the authored item limit and applies sticky behavior below the header', () => {
        render(<CategoryQuickLinks sticky maxItems={2} tone="muted" alignment="center" />);

        const navigation = screen.getByRole('navigation', { name: 'Category quick links' });
        expect(screen.getAllByRole('link')).toHaveLength(2);
        expect(navigation).toHaveAttribute('data-sticky', 'true');
        expect(navigation).toHaveClass('sticky', 'bg-muted/95');
        expect(navigation).toHaveStyle({ top: 'var(--header-height, 0px)' });
    });

    test('disables sticky positioning and provides an empty authoring state in design mode', () => {
        pageDesignerMode.isDesignMode = true;
        mockUseRouteLoaderData.mockReturnValue({ category: { id: 'empty', name: 'Empty', categories: [] } });

        const { rerender } = render(<CategoryQuickLinks sticky />);
        expect(screen.getByRole('status')).toHaveTextContent('no child categories');

        mockUseRouteLoaderData.mockReturnValue({ category: { id: 'girls', categories: children } });
        rerender(<CategoryQuickLinks sticky />);
        expect(screen.getByRole('navigation')).not.toHaveClass('sticky');
    });

    test('renders nothing for an empty category outside design mode', () => {
        mockUseRouteLoaderData.mockReturnValue({ category: { id: 'empty', categories: [] } });
        const { container } = render(<CategoryQuickLinks />);
        expect(container.firstChild).toBeNull();
    });
});
