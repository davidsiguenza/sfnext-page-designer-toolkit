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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import SFNextToolkitCategoryHero, { SFNextToolkitCategoryHeroMetadata } from './index';

const mockUseRouteLoaderData = vi.fn();

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router')>();
    return {
        ...actual,
        useRouteLoaderData: (...args: unknown[]) => mockUseRouteLoaderData(...args),
        useNavigation: () => ({ state: 'idle', location: undefined }),
        useLocation: () => ({ pathname: '/category/dresses', search: '' }),
    };
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { count?: number }) =>
            key === 'banner.productsAvailable' ? `${options?.count ?? 0} products available` : 'Counting products...',
    }),
}));

vi.mock('@salesforce/storefront-next-runtime/config', () => ({
    useConfig: () => ({ images: { host: 'https://images.example.com' } }),
}));

vi.mock('@/lib/images/dynamic-image', () => ({
    toImageUrl: ({ src }: { src?: string }) => src,
}));

describe('SFNext Toolkit category hero', () => {
    beforeEach(() => {
        mockUseRouteLoaderData.mockReturnValue({
            category: {
                id: 'dresses',
                name: 'Dresses',
                description: 'Looks for every celebration.',
                c_slotBannerImage: '/category-dresses.jpg',
                parentCategoryTree: [
                    { id: 'root', name: 'Root' },
                    { id: 'girls', name: 'Girls' },
                ],
            },
            searchResultCritical: { total: 48 },
        });
    });

    test('registers the isolated component and safe merchant controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitCategoryHeroMetadata)).toBe('SFNextToolkit.categoryHero');

        const { fields } = getAttributeDefinitions(SFNextToolkitCategoryHeroMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'image',
            'eyebrow',
            'title',
            'description',
            'productCountOverride',
            'semanticTitle',
            'showEyebrow',
            'showDescription',
            'showProductCount',
            'height',
            'alignment',
            'overlay',
        ]);
        expect(fields.overlay).toMatchObject({
            values: ['none', 'subtle', 'medium', 'strong'],
            defaultValue: 'strong',
        });
    });

    test('uses current category data as defaults', () => {
        render(<SFNextToolkitCategoryHero />);

        expect(screen.getByText('Dresses')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Dresses' })).not.toBeInTheDocument();
        expect(screen.getByText('Girls')).toBeInTheDocument();
        expect(screen.getByText('Looks for every celebration.')).toBeInTheDocument();
        expect(screen.getByText('48 products available')).toBeInTheDocument();
        expect(document.querySelector('[data-slot="category-banner-image"]')).toHaveAttribute(
            'src',
            '/category-dresses.jpg'
        );
    });

    test('honors editorial image, copy, count, and layout overrides', () => {
        const { container } = render(
            <SFNextToolkitCategoryHero
                image={{ path: '/campaign.jpg', focal_point: { x: 25, y: 75 } }}
                eyebrow="New collection"
                title="Ceremony edit"
                description="Selected for special days."
                productCountOverride={12.9}
                semanticTitle
                height="lg"
                alignment="center"
                overlay="medium"
            />
        );

        expect(screen.getByRole('heading', { name: 'Ceremony edit' })).toBeInTheDocument();
        expect(screen.getByText('New collection')).toBeInTheDocument();
        expect(screen.getByText('Selected for special days.')).toBeInTheDocument();
        expect(screen.getByText('12 products available')).toBeInTheDocument();
        const image = document.querySelector('[data-slot="category-banner-image"]');
        expect(image).toHaveAttribute('src', '/campaign.jpg');
        expect(image).toHaveStyle({ objectPosition: '25% 75%' });
        expect(container.querySelector('[data-slot="category-banner"]')).toHaveClass('h-[450px]');
        expect(container.querySelector('[data-slot="category-banner-title"]')?.parentElement).toHaveClass(
            'text-center'
        );
        expect(container.querySelector('[data-slot="category-banner-overlay"]')).toHaveClass('bg-foreground/40');
    });

    test('can hide optional category content', () => {
        render(<SFNextToolkitCategoryHero showEyebrow={false} showDescription={false} showProductCount={false} />);

        expect(screen.queryByText('Girls')).not.toBeInTheDocument();
        expect(screen.queryByText('Looks for every celebration.')).not.toBeInTheDocument();
        expect(screen.queryByText('48 products available')).not.toBeInTheDocument();
        expect(screen.getByText('Dresses')).toBeInTheDocument();
    });

    test('degrades to a neutral banner outside PLP and still renders overrides', () => {
        mockUseRouteLoaderData.mockReturnValue(undefined);
        const { container, rerender } = render(<SFNextToolkitCategoryHero />);

        expect(container.querySelector('[data-slot="category-banner-image-fallback"]')).toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();

        rerender(
            <SFNextToolkitCategoryHero
                title="Standalone landing"
                description="Editorial category content."
                semanticTitle
            />
        );
        expect(screen.getByRole('heading', { name: 'Standalone landing' })).toBeInTheDocument();
        expect(screen.getByText('Editorial category content.')).toBeInTheDocument();
    });
});
