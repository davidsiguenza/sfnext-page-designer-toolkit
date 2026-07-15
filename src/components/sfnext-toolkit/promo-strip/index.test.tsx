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
import PromoStrip, { PromoStripFallback, SFNextToolkitPromoStripMetadata } from './index';

const mockPageDesignerMode = vi.fn(() => ({ isDesignMode: false, isPreviewMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockPageDesignerMode(),
}));

function renderPromoStrip(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit promo strip', () => {
    beforeEach(() => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
    });

    test('renders a static message, allow-listed icon, and safe optional link', () => {
        const { container } = renderPromoStrip(
            <PromoStrip
                message="Free delivery on orders over €50"
                linkLabel="Delivery details"
                linkUrl="/page/delivery"
                icon="delivery"
                tone="secondary"
                size="lg"
                alignment="right"
                data-testid="promo-strip"
            />
        );

        const root = screen.getByTestId('promo-strip');
        expect(root).toHaveClass('bg-secondary', 'text-secondary-foreground', 'py-4', 'text-base');
        expect(root).not.toHaveAttribute('role');
        expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
        expect(container.querySelector('.lucide-truck')).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('[data-slot="promo-strip-content"]')).toHaveClass('justify-end', 'text-right');
        expect(screen.getByText('Free delivery on orders over €50')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Delivery details' }).getAttribute('href')).toContain('/page/delivery');
    });

    test('supports a text-only strip and falls back safely for unknown icon names', () => {
        const { container, rerender } = renderPromoStrip(<PromoStrip message="Members get early access" icon="none" />);
        expect(container.querySelector('svg')).not.toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PromoStrip message="Safe default" icon={'constructor' as 'megaphone'} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(container.querySelector('[data-slot="sfnext-toolkit-promo-strip"]')).toHaveAttribute(
            'data-icon',
            'megaphone'
        );
        expect(container.querySelector('.lucide-megaphone')).toBeInTheDocument();
    });

    test('hides incomplete and unsafe links', () => {
        const { rerender } = renderPromoStrip(
            <PromoStrip message="Campaign" linkLabel="Learn more" linkUrl="javascript:alert(1)" />
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <PromoStrip message="Campaign" linkUrl="/campaign" />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('does not emit an empty live component', () => {
        const { container } = renderPromoStrip(<PromoStrip />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders a useful empty state only in Page Designer design mode', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        renderPromoStrip(<PromoStrip />);

        const message = screen.getByText('Add an announcement message');
        const root = message.closest('[data-slot="sfnext-toolkit-promo-strip"]');
        expect(root).toHaveAttribute('data-authoring-empty', 'true');
        expect(root).toHaveClass('border-dashed');
    });

    test('publishes the literal Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitPromoStripMetadata)).toBe('SFNextToolkit.promoStrip');

        const { fields } = getAttributeDefinitions(SFNextToolkitPromoStripMetadata.prototype);
        expect(Object.keys(fields)).toEqual(['message', 'linkLabel', 'linkUrl', 'icon', 'tone', 'size', 'alignment']);
        expect(fields.message).toMatchObject({ type: 'string', required: true });
        expect(fields.linkUrl).toMatchObject({ type: 'url' });
        expect(fields.icon).toMatchObject({
            values: ['none', 'megaphone', 'sparkles', 'tag', 'delivery', 'gift', 'info'],
            defaultValue: 'megaphone',
        });
        expect(fields.tone).toMatchObject({
            values: ['primary', 'secondary', 'accent', 'muted'],
            defaultValue: 'primary',
        });
        expect(fields.size).toMatchObject({ values: ['sm', 'md', 'lg'], defaultValue: 'md' });
        expect(fields.alignment).toMatchObject({ values: ['left', 'center', 'right'], defaultValue: 'center' });
    });

    test('provides a stable registered fallback', () => {
        const { container } = render(<PromoStripFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-promo-strip-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    });
});
