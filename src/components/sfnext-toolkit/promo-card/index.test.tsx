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
import type { ComponentPropsWithoutRef, ImgHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import PromoCard, { PromoCardFallback, PromoCardMetadata } from './index';

const { mockDesignMode } = vi.hoisted(() => ({
    mockDesignMode: vi.fn(() => ({ isDesignMode: false })),
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: mockDesignMode,
}));

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({
        src,
        alt,
        imageProps,
        className,
        loading,
    }: {
        src: string;
        alt?: string;
        imageProps?: ImgHTMLAttributes<HTMLImageElement>;
        className?: string;
        loading?: HTMLImageElement['loading'];
    }) => (
        <span data-testid="dynamic-image" className={className}>
            <img src={src} alt={alt} loading={loading} {...imageProps} />
        </span>
    ),
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, ...props }: ComponentPropsWithoutRef<'a'> & { to: string }) => <a href={to} {...props} />,
}));

describe('SFNext Toolkit promo card', () => {
    beforeEach(() => {
        mockDesignMode.mockReturnValue({ isDesignMode: false });
    });

    test('preserves the existing contract and appends editorial controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, PromoCardMetadata)).toBe('SFNextToolkit.promoCard');

        const { fields } = getAttributeDefinitions(PromoCardMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'title',
            'description',
            'imageUrl',
            'imageAlt',
            'decorativeImage',
            'buttonText',
            'buttonLink',
            'showBackground',
            'showBorder',
            'eyebrow',
            'layout',
            'aspectRatio',
            'ctaStyle',
            'hoverEffect',
        ]);
        expect(fields.imageUrl).toMatchObject({ type: 'image' });
        expect(fields.buttonLink).toMatchObject({ type: 'url' });
        expect(fields.layout).toMatchObject({
            type: 'enum',
            values: ['stacked', 'overlay'],
            defaultValue: 'stacked',
        });
        expect(fields.aspectRatio).toMatchObject({
            values: ['landscape', 'square', 'portrait'],
            defaultValue: 'landscape',
        });
        expect(fields.ctaStyle).toMatchObject({
            values: ['primary', 'secondary', 'outline', 'link'],
            defaultValue: 'primary',
        });
    });

    test('renders a stacked editorial card and respects the image focal point', () => {
        render(
            <PromoCard
                eyebrow="New season"
                title="Summer edit"
                description="Selected looks"
                imageUrl={{ url: '/summer.jpg', focalPoint: { x: 0.25, y: 75 } }}
                imageAlt="Child wearing a summer look"
                aspectRatio="square"
                hoverEffect="zoom"
                className="merchant-card"
            />
        );

        const card = screen.getByText('Summer edit').closest('[data-slot="sfnext-toolkit-promo-card"]');
        const media = card?.querySelector('[data-slot="promo-card-media"]');
        const image = screen.getByRole('img', { name: 'Child wearing a summer look' });

        expect(card).toHaveAttribute('data-layout', 'stacked');
        expect(card).toHaveClass('merchant-card', 'h-full', 'focus-within:ring-[3px]');
        expect(media).toHaveClass('aspect-square');
        expect(image).toHaveStyle({ objectPosition: '25% 75%' });
        expect(image).toHaveClass('motion-safe:group-hover:scale-105', 'motion-safe:group-focus-within:scale-105');
        expect(screen.getByText('New season')).toHaveAttribute('data-slot', 'promo-card-eyebrow');
        expect(screen.getByText('Selected looks')).toBeInTheDocument();
    });

    test('supports the overlay layout and token-based CTA variants', () => {
        render(
            <PromoCard
                title="Holiday edit"
                imageUrl="/holiday.jpg"
                layout="overlay"
                aspectRatio="portrait"
                buttonText="Explore"
                buttonLink="/category/holiday"
                ctaStyle="outline"
            />
        );

        const card = screen.getByText('Holiday edit').closest('[data-slot="sfnext-toolkit-promo-card"]');
        expect(card).toHaveAttribute('data-layout', 'overlay');
        expect(card?.querySelector('[data-slot="promo-card-media"]')).toHaveClass('absolute', 'aspect-[3/4]');
        expect(card?.querySelector('[data-slot="promo-card-body"]')).toHaveClass(
            'bg-background/90',
            'backdrop-blur-sm'
        );
        expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/category/holiday');
        expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('data-variant', 'outline');
    });

    test('does not leak Page Designer runtime props to the DOM', () => {
        const { container } = render(
            <PromoCard
                title="Portable"
                regionId="items"
                data={{ source: 'designer' }}
                componentData={{ item: Promise.resolve(null) }}
            />
        );

        const card = container.querySelector('[data-slot="sfnext-toolkit-promo-card"]');
        expect(card).not.toHaveAttribute('regionId');
        expect(card).not.toHaveAttribute('componentData');
        expect(card).not.toHaveAttribute('data', '[object Object]');
    });

    test('supports an explicitly decorative card image', () => {
        const { container } = render(
            <PromoCard
                title="Summer edit"
                imageUrl="https://example.com/summer.jpg"
                imageAlt="This text is intentionally ignored"
                decorativeImage
            />
        );

        const image = container.querySelector('img');
        expect(image).toHaveAttribute('alt', '');
        expect(image).toHaveAttribute('role', 'presentation');
        expect(image).toHaveAttribute('aria-hidden', 'true');
    });

    test.each(['javascript:alert(1)', 'data:text/html,boom', 'file:///etc/passwd', '//evil.example/path'])(
        'hides a CTA with unsafe destination %s',
        (buttonLink) => {
            render(<PromoCard title="Safe card" buttonText="Open" buttonLink={buttonLink} />);
            expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument();
        }
    );

    test('renders no empty card on the live storefront', () => {
        const { container } = render(<PromoCard />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders an attractive empty state only while authoring', () => {
        mockDesignMode.mockReturnValue({ isDesignMode: true });
        const { container } = render(<PromoCard />);

        const card = container.querySelector('[data-slot="sfnext-toolkit-promo-card"]');
        expect(card).toHaveAttribute('data-authoring-empty', 'true');
        expect(card).toHaveClass('border-dashed', 'bg-muted');
        expect(screen.getByRole('heading', { name: 'Promo card' })).toBeInTheDocument();
        expect(screen.getByText(/Add an image, message or call to action/)).toBeInTheDocument();
    });

    test('provides an accessible-hidden, stable fallback', () => {
        const { container } = render(<PromoCardFallback />);
        const fallback = container.querySelector('[data-slot="sfnext-toolkit-promo-card-fallback"]');

        expect(fallback).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
    });
});
