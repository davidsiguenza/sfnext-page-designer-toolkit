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
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, test } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import TrustItem, { TrustItemFallback, TrustItemMetadata } from './index';

describe('SFNext Toolkit trust item', () => {
    test('registers the safe icon allow-list', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, TrustItemMetadata)).toBe('SFNextToolkit.trustItem');

        const { fields } = getAttributeDefinitions(TrustItemMetadata.prototype);
        expect(fields.icon).toMatchObject({
            type: 'enum',
            values: ['delivery', 'returns', 'security', 'payment', 'support', 'store', 'package', 'gift'],
            defaultValue: 'delivery',
        });
        expect(fields.linkUrl).toMatchObject({ type: 'url' });
    });

    test('renders semantic copy and the selected predefined icon', () => {
        const { container } = render(
            <TrustItem icon="returns" title="Free returns" description="Within 30 days" className="merchant-item" />
        );
        const item = container.querySelector('[data-slot="sfnext-toolkit-trust-item"]');

        expect(item).toHaveAttribute('data-icon', 'returns');
        expect(item).toHaveClass('merchant-item');
        expect(screen.getByText('Free returns')).toHaveProperty('tagName', 'P');
        expect(screen.getByText('Within 30 days')).toBeInTheDocument();
        expect(item?.querySelector('.lucide-rotate-ccw')).toBeInTheDocument();
        expect(item?.querySelector('[data-slot="trust-item-icon"]')).toHaveAttribute('aria-hidden', 'true');
    });

    test.each(['remote-icon.js', '__proto__', 'constructor', 'toString'])(
        'rejects unsafe icon name %s and falls back to delivery',
        (icon) => {
            const { container } = render(<TrustItem icon={icon} title="Safe" />);
            expect(container.querySelector('[data-slot="sfnext-toolkit-trust-item"]')).toHaveAttribute(
                'data-icon',
                'delivery'
            );
            expect(container.querySelector('.lucide-truck')).toBeInTheDocument();
        }
    );

    test('renders the optional link only when label and safe destination are present', () => {
        const router = createMemoryRouter(
            [
                {
                    path: '*',
                    element: (
                        <AllProvidersWrapper>
                            <TrustItem
                                icon="returns"
                                title="Easy returns"
                                linkLabel="Return policy"
                                linkUrl="/page/returns"
                            />
                        </AllProvidersWrapper>
                    ),
                },
            ],
            { initialEntries: ['/'] }
        );
        render(<RouterProvider router={router} />);

        const link = screen.getByRole('link', { name: 'Return policy' });
        expect(link).toHaveAttribute('href', '/global/en-GB/page/returns');
        expect(link).toHaveAttribute('data-slot', 'trust-item-link');
        expect(link).toHaveClass('focus-visible:ring-ring');
    });

    test('hides incomplete and unsafe links', () => {
        const { rerender } = render(<TrustItem title="Safe" linkLabel="Read more" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();

        rerender(<TrustItem title="Safe" linkLabel="Read more" linkUrl="javascript:alert(1)" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();

        rerender(<TrustItem title="Safe" linkLabel="Read more" linkUrl="file:///etc/passwd" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('provides a stable fallback', () => {
        const { container } = render(<TrustItemFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-trust-item-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    });
});
