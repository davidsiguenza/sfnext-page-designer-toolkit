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
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import type { ShopperProducts } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import CategoryCard, { CategoryCardFallback, CategoryCardMetadata } from './index';

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({
        src,
        alt,
        imageProps,
    }: {
        src: string;
        alt?: string;
        imageProps?: { className?: string; style?: CSSProperties };
    }) => <img src={src} alt={alt} className={imageProps?.className} style={imageProps?.style} />,
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
        <a href={to} className={className}>
            {children}
        </a>
    ),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: () => 'Shop now' }),
}));

const category: ShopperProducts.schemas['Category'] = {
    id: 'girls',
    name: 'Girls',
    pageDescription: 'New-season looks for every day.',
    image: '/catalog/girls.jpg',
};

function renderCard(element: ReactElement) {
    return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('SFNext Toolkit category card', () => {
    test('publishes catalog, override, layout, and ratio controls as literal metadata', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, CategoryCardMetadata)).toBe('SFNextToolkit.categoryCard');

        const { fields } = getAttributeDefinitions(CategoryCardMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'category',
            'image',
            'title',
            'copy',
            'ctaLabel',
            'ctaUrl',
            'layout',
            'ratio',
        ]);
        expect(fields.layout).toMatchObject({ values: ['overlay', 'stacked'], defaultValue: 'overlay' });
        expect(fields.ratio).toMatchObject({ values: ['square', 'landscape', 'portrait'], defaultValue: 'square' });
    });

    test('uses selected category content, image, and destination by default', () => {
        renderCard(<CategoryCard data={category} />);

        expect(screen.getByText('Girls')).toBeInTheDocument();
        expect(screen.getByText('New-season looks for every day.')).toBeInTheDocument();
        expect(screen.getByText('Shop now')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Girls' })).toHaveAttribute('src', '/catalog/girls.jpg');
        expect(screen.getByRole('link')).toHaveAttribute('href', '/category/girls');
    });

    test('honors editorial overrides and Page Designer focal point in stacked portrait mode', () => {
        const { container } = renderCard(
            <CategoryCard
                data={category}
                image={{ path: '/library/ceremony.jpg', focal_point: { x: 0.25, y: 0.8 } }}
                title="Ceremony"
                copy="Selected for special days."
                ctaLabel="Discover"
                ctaUrl="/category/ceremony"
                layout="stacked"
                ratio="portrait"
            />
        );

        expect(screen.getByText('Ceremony')).toBeInTheDocument();
        expect(screen.getByText('Selected for special days.')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/category/ceremony');
        expect(screen.getByRole('img')).toHaveAttribute('src', '/library/ceremony.jpg');
        expect(screen.getByRole('img')).toHaveStyle({ objectPosition: '25% 80%' });
        expect(container.querySelector('[data-slot="category-card-media"]')).toHaveClass('aspect-[3/4]');
        expect(container.querySelector('[data-slot="category-card-stacked-layout"]')).toBeInTheDocument();
    });

    test('rejects an unsafe override and falls back to the catalog category URL', () => {
        renderCard(<CategoryCard data={category} ctaUrl="javascript:alert(1)" />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/category/girls');
        expect(link).not.toHaveAttribute('href', expect.stringContaining('javascript'));
    });

    test('does not render a misleading CTA without a safe destination', () => {
        renderCard(<CategoryCard title="Editorial card" ctaLabel="Open" ctaUrl="javascript:alert(1)" />);
        expect(screen.queryByText('Open')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('uses a neutral token placeholder and never injects a demo fallback image', () => {
        const categoryWithoutImage = { ...category, image: undefined, c_slotBannerImage: undefined };
        const { container } = renderCard(<CategoryCard data={categoryWithoutImage} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(container.querySelector('[data-slot="category-card-image-placeholder"]')).toHaveClass('bg-muted');
    });

    test('renders nothing without catalog or editorial content and provides a stable fallback', () => {
        const { container, rerender } = renderCard(<CategoryCard />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-category-card"]')).not.toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <CategoryCardFallback />
            </MemoryRouter>
        );
        expect(container.querySelector('[data-slot="sfnext-toolkit-category-card-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });
});
