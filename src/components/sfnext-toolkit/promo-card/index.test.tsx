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
import { describe, expect, test } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import PromoCard, { PromoCardFallback, PromoCardMetadata } from './index';

describe('SFNext Toolkit promo card', () => {
    test('registers an isolated type ID and the reusable card contract', () => {
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
        ]);
        expect(fields.imageUrl).toMatchObject({ type: 'image' });
        expect(fields.buttonLink).toMatchObject({ type: 'url' });
    });

    test('reuses ContentCard while exposing a toolkit data slot', () => {
        render(<PromoCard title="Summer edit" description="Selected looks" className="merchant-card" />);

        const card = screen.getByText('Summer edit').closest('[data-slot="sfnext-toolkit-promo-card"]');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('merchant-card', 'h-full');
        expect(screen.getByText('Selected looks')).toBeInTheDocument();
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
        render(
            <PromoCard
                title="Summer edit"
                imageUrl="https://example.com/summer.jpg"
                imageAlt="This text is intentionally ignored"
                decorativeImage
            />
        );

        expect(screen.getByRole('presentation')).toHaveAttribute('alt', '');
    });

    test.each(['javascript:alert(1)', 'data:text/html,boom', 'file:///etc/passwd', '//evil.example/path'])(
        'hides a CTA with unsafe destination %s',
        (buttonLink) => {
            render(<PromoCard title="Safe card" buttonText="Open" buttonLink={buttonLink} />);
            expect(screen.queryByRole('link', { name: 'Open' })).not.toBeInTheDocument();
        }
    );

    test('provides an accessible-hidden, stable fallback', () => {
        const { container } = render(<PromoCardFallback />);
        const fallback = container.querySelector('[data-slot="sfnext-toolkit-promo-card-fallback"]');

        expect(fallback).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
    });
});
