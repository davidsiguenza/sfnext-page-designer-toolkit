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
import { describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import EditorialCard, { EditorialCardFallback, EditorialCardMetadata, normalizeEditorialCardPosition } from './index';

vi.mock('@/components/sfnext-toolkit/promo-card', () => ({
    default: ({ title, ...props }: React.ComponentPropsWithoutRef<'article'> & { title?: string }) => (
        <article {...props}>{title}</article>
    ),
    PromoCardFallback: () => <div data-testid="promo-card-fallback" />,
}));

describe('SFNext Toolkit editorial card', () => {
    test('registers the nested editorial-card contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, EditorialCardMetadata)).toBe('SFNextToolkit.editorialCard');
        const { fields } = getAttributeDefinitions(EditorialCardMetadata.prototype);

        expect(fields.position).toMatchObject({ type: 'integer', defaultValue: 4 });
        expect(fields.columnSpan).toMatchObject({ values: ['1', '2', 'full'], defaultValue: '2' });
        expect(fields.mobileColumnSpan).toMatchObject({ values: ['1', '2'], defaultValue: '2' });
        expect(fields.buttonLink.type).toBe('url');
    });

    test('places the card after the authored product and applies responsive spans', () => {
        render(
            <EditorialCard title="Complete the look" position={6} columnSpan="full" mobileColumnSpan="1" rowSpan="2" />
        );

        const card = screen.getByText('Complete the look');
        expect(card).toHaveAttribute('data-editorial-position', '6');
        expect(card).not.toHaveStyle({ order: 65 });
        expect(card).toHaveClass('col-span-1', 'sm:col-span-full', 'row-span-2');
    });

    test('keeps authored spans while the card component is loading', () => {
        const { container } = render(<EditorialCardFallback columnSpan="full" mobileColumnSpan="1" rowSpan="2" />);

        expect(container.firstChild).toHaveClass('col-span-1', 'sm:col-span-full', 'row-span-2');
        expect(screen.getByTestId('promo-card-fallback')).toBeInTheDocument();
    });

    test('clamps invalid positions and keeps product counts independent from editorial order', () => {
        expect(normalizeEditorialCardPosition(-3)).toBe(0);
        expect(normalizeEditorialCardPosition('12')).toBe(12);
        expect(normalizeEditorialCardPosition(500)).toBe(99);
    });
});
