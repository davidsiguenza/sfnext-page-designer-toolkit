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
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { ShopperProducts } from '@/scapi';
import type { ComponentType } from '@/components/region';
import { getAttributeDefinitions, getRegionDefinition } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import CategoryCarousel, { CategoryCarouselFallback, CategoryCarouselMetadata } from './index';

const pageDesignerMode = vi.hoisted(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: pageDesignerMode.isDesignMode, isPreviewMode: false }),
    };
});

vi.mock('@/components/carousel-section', () => ({
    CarouselSection: ({
        children,
        title,
        subtitle,
        shopAllUrl,
        shopAllText,
    }: {
        children: ReactNode;
        title?: string;
        subtitle?: string;
        shopAllUrl?: string;
        shopAllText?: string;
    }) => (
        <div data-testid="carousel-section" data-shop-all-url={shopAllUrl} data-shop-all-text={shopAllText}>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
            {children}
        </div>
    ),
}));

vi.mock('@/components/ui/carousel', () => ({
    CarouselItem: ({ children, className }: { children: ReactNode; className?: string }) => (
        <div data-testid="carousel-item" className={className}>
            {children}
        </div>
    ),
}));

vi.mock('@/components/sfnext-toolkit/category-card', () => ({
    default: ({ category }: { category: ShopperProducts.schemas['Category'] }) => (
        <article data-testid="automatic-category-card">{category.name}</article>
    ),
}));

vi.mock('@/components/region/component', () => ({
    Component: ({ component }: { component: ComponentType }) => (
        <article data-testid="manual-category-card">{component.id}</article>
    ),
}));

const category: ShopperProducts.schemas['Category'] = { id: 'girls', name: 'Girls' };

describe('SFNext Toolkit category carousel', () => {
    test('publishes automatic controls and a category-card-only manual region', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, CategoryCarouselMetadata)).toBe('SFNextToolkit.categoryCarousel');
        expect(getRegionDefinition(CategoryCarouselMetadata, 'cards')).toMatchObject({
            maxComponents: 12,
            componentTypeInclusions: ['SFNextToolkit.categoryCard'],
        });

        const { fields } = getAttributeDefinitions(CategoryCarouselMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'parentCategory',
            'title',
            'subtitle',
            'shopAllText',
            'shopAllUrl',
            'tone',
        ]);
        expect(fields.tone).toMatchObject({ values: ['default', 'muted'], defaultValue: 'default' });
    });

    test('prioritizes automatically loaded child categories over manual region cards', () => {
        const component = {
            id: 'carousel-1',
            typeId: 'SFNextToolkit.categoryCarousel',
            regions: [{ id: 'cards', components: [{ id: 'manual-1', typeId: 'SFNextToolkit.categoryCard' }] }],
        } as unknown as ComponentType;

        render(
            <CategoryCarousel parentCategory="root" data={[category]} component={component} title="Shop by category" />
        );

        expect(screen.getByText('Girls')).toBeInTheDocument();
        expect(screen.getByTestId('automatic-category-card')).toBeInTheDocument();
        expect(screen.queryByTestId('manual-category-card')).not.toBeInTheDocument();
    });

    test('renders the manual Page Designer region when no parent category is selected', () => {
        const component = {
            id: 'carousel-1',
            typeId: 'SFNextToolkit.categoryCarousel',
            regions: [{ id: 'cards', components: [{ id: 'manual-1', typeId: 'SFNextToolkit.categoryCard' }] }],
        } as unknown as ComponentType;

        render(<CategoryCarousel component={component} title="Manual categories" />);
        expect(screen.getByText('manual-1')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-item')).toHaveLength(1);
    });

    test('uses muted tone and the parent category as the safe default shop-all destination', () => {
        const { container } = render(
            <CategoryCarousel
                parentCategory="girls"
                data={[category]}
                title="Girls"
                subtitle="Explore the collection"
                shopAllText="Shop all"
                shopAllUrl="javascript:alert(1)"
                tone="muted"
            />
        );

        expect(container.querySelector('[data-slot="sfnext-toolkit-category-carousel"]')).toHaveClass('bg-muted');
        expect(screen.getByTestId('carousel-section')).toHaveAttribute('data-shop-all-url', '/category/girls');
        expect(screen.getByTestId('carousel-section')).toHaveAttribute('data-shop-all-text', 'Shop all');
    });

    test('shows its empty instruction only in Page Designer design mode', () => {
        pageDesignerMode.isDesignMode = false;
        const { container, rerender } = render(<CategoryCarousel />);
        expect(container.firstChild).toBeNull();

        pageDesignerMode.isDesignMode = true;
        rerender(<CategoryCarousel />);
        expect(screen.getByRole('status')).toHaveTextContent('Select a parent category');
        pageDesignerMode.isDesignMode = false;
    });

    test('provides a stable four-card loading state', () => {
        const { container } = render(<CategoryCarouselFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-category-carousel-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
    });
});
