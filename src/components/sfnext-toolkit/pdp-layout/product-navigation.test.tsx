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
import { PdpProductNavigation } from './product-navigation';

vi.mock('@/components/link', () => ({
    Link: ({ to, ...props }: { to: string } & ComponentPropsWithoutRef<'a'>) => <a href={to} {...props} />,
}));

describe('PDP product navigation', () => {
    test('renders accessible real links for both adjacent products', () => {
        render(
            <PdpProductNavigation
                previous={{ productId: 'previous-id', productName: 'Previous dress' }}
                next={{ productId: 'next-id', productName: 'Next jacket' }}
            />
        );

        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /previous.*previous dress/i })).toHaveAttribute(
            'href',
            '/product/previous-id'
        );
        expect(screen.getByRole('link', { name: /next.*next jacket/i })).toHaveAttribute('href', '/product/next-id');
    });

    test('renders nothing when neither adjacent product exists', () => {
        const { container } = render(<PdpProductNavigation />);
        expect(container).toBeEmptyDOMElement();
    });
});
