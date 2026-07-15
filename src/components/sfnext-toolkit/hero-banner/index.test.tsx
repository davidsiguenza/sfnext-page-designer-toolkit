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
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import HeroBanner, { HeroBannerFallback, SFNextToolkitHeroBannerMetadata } from './index';

const mockPageDesignerMode = vi.fn(() => ({ isDesignMode: false, isPreviewMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockPageDesignerMode(),
}));

function renderHeroBanner(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit hero banner', () => {
    beforeEach(() => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
    });

    test('renders responsive art direction, focal points, semantic copy, and two safe CTAs', () => {
        renderHeroBanner(
            <HeroBanner
                desktopImage={{ url: '/images/hero-desktop.webp', focalPoint: { x: 25, y: 70 } }}
                mobileImage={{ url: '/images/hero-mobile.webp', focalPoint: { x: 60, y: 35 } }}
                imageAlt="Children wearing the new collection"
                decorativeImage={false}
                eyebrow="New season"
                title="Ready for every adventure"
                body="Comfortable layers for changing days."
                headingLevel="h2"
                primaryCtaLabel="Shop girls"
                primaryCtaUrl="/category/girls"
                secondaryCtaLabel="Shop boys"
                secondaryCtaUrl="/category/boys"
            />
        );

        const images = screen.getAllByRole('img', { name: 'Children wearing the new collection' });
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveStyle({ objectPosition: '25% 70%' });
        expect(images[0].closest('div')).toHaveClass('hidden', 'md:block');
        expect(images[1]).toHaveStyle({ objectPosition: '60% 35%' });
        expect(images[1].closest('div')).toHaveClass('md:hidden');
        expect(screen.getByRole('heading', { level: 2, name: 'Ready for every adventure' })).toBeInTheDocument();
        expect(screen.getByText('Comfortable layers for changing days.')).toBeInTheDocument();

        const primaryLink = screen.getByRole('link', { name: 'Shop girls' });
        const secondaryLink = screen.getByRole('link', { name: 'Shop boys' });
        expect(primaryLink.getAttribute('href')).toContain('/category/girls');
        expect(primaryLink).toHaveAttribute('data-variant', 'default');
        expect(secondaryLink.getAttribute('href')).toContain('/category/boys');
        expect(secondaryLink).toHaveAttribute('data-variant', 'outline');
    });

    test('applies tokenized height, position, alignment, and overlay variants', () => {
        const { container } = renderHeroBanner(
            <HeroBanner
                desktopImage="/images/hero.webp"
                title="Right aligned campaign"
                height="sm"
                contentPosition="bottom-right"
                overlay="subtle"
                visualSize="sm"
                data-testid="hero"
            />
        );

        expect(screen.getByTestId('hero')).toHaveClass('h-[20rem]', 'md:h-[24rem]');
        expect(container.querySelector('[data-slot="hero-banner-content"]')).toHaveClass('items-end', 'justify-end');
        expect(container.querySelector('[data-slot="hero-banner-copy"]')).toHaveClass('items-end', 'text-right');
        expect(container.querySelector('[data-slot="hero-banner-overlay"]')).toHaveClass('bg-header-background/30');
        expect(screen.getByRole('heading', { name: 'Right aligned campaign' })).toHaveClass('text-3xl');
    });

    test('treats decorative imagery as presentational and does not invent informative alt text', () => {
        const { container } = renderHeroBanner(
            <HeroBanner desktopImage="/images/decorative.webp" title="Campaign title" decorativeImage />
        );

        const image = container.querySelector('img');
        expect(image).toHaveAttribute('alt', '');
        expect(image).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('fails closed for unsafe and incomplete CTA destinations', () => {
        renderHeroBanner(
            <HeroBanner
                title="Safe campaign"
                primaryCtaLabel="Browse"
                primaryCtaUrl="/category/new"
                secondaryCtaLabel="Unsafe"
                secondaryCtaUrl="javascript:alert(1)"
            />
        );

        expect(screen.getByRole('link', { name: 'Browse' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument();
    });

    test('does not emit an empty live component', () => {
        const { container } = renderHeroBanner(<HeroBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders a visible empty state in Page Designer design mode', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        renderHeroBanner(<HeroBanner />);

        const root = screen.getByText('Hero banner').closest('section');
        expect(root).toHaveAttribute('data-authoring-empty', 'true');
        expect(root).toHaveClass('border-dashed');
        expect(
            screen.getByText('Add campaign imagery, a page title and up to two calls to action.')
        ).toBeInTheDocument();
    });

    test('publishes the literal Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitHeroBannerMetadata)).toBe('SFNextToolkit.heroBanner');

        const { fields } = getAttributeDefinitions(SFNextToolkitHeroBannerMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'desktopImage',
            'mobileImage',
            'imageAlt',
            'decorativeImage',
            'eyebrow',
            'title',
            'body',
            'headingLevel',
            'visualSize',
            'contentPosition',
            'height',
            'overlay',
            'primaryCtaLabel',
            'primaryCtaUrl',
            'secondaryCtaLabel',
            'secondaryCtaUrl',
        ]);
        expect(fields.desktopImage).toMatchObject({ type: 'image' });
        expect(fields.decorativeImage).toMatchObject({ type: 'boolean', defaultValue: true });
        expect(fields.headingLevel).toMatchObject({ values: ['h1', 'h2', 'h3'], defaultValue: 'h1' });
        expect(fields.visualSize).toMatchObject({ values: ['sm', 'md', 'lg'], defaultValue: 'lg' });
        expect(fields.contentPosition).toMatchObject({
            values: [
                'top-left',
                'top-center',
                'top-right',
                'middle-left',
                'middle-center',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
            ],
            defaultValue: 'middle-left',
        });
        expect(fields.height).toMatchObject({ values: ['sm', 'md', 'lg', 'xl'], defaultValue: 'lg' });
        expect(fields.overlay).toMatchObject({ values: ['none', 'subtle', 'strong'], defaultValue: 'strong' });
        expect(fields.primaryCtaUrl).toMatchObject({ type: 'url' });
        expect(fields.secondaryCtaUrl).toMatchObject({ type: 'url' });
    });

    test('provides a stable registered fallback', () => {
        const { container } = render(<HeroBannerFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-hero-banner-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
    });
});
