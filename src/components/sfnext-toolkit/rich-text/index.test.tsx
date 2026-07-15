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
import { describe, expect, test } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { RichText, SFNextToolkitRichTextMetadata } from './index';

function renderRichText(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit rich text', () => {
    test('renders semantic authored content and rich markup', () => {
        renderRichText(
            <RichText
                eyebrow="Editorial"
                heading="A considered collection"
                headingLevel="h3"
                content="<p>Made for <strong>everyday life</strong>.</p>"
            />
        );

        expect(screen.getByText('Editorial')).toHaveAttribute('data-slot', 'sfnext-toolkit-rich-text-eyebrow');
        expect(screen.getByRole('heading', { level: 3, name: 'A considered collection' })).toBeInTheDocument();
        expect(screen.getByText('everyday life')).toHaveProperty('tagName', 'STRONG');
    });

    test('uses token-aligned layout variants and forwards native props', () => {
        renderRichText(
            <RichText
                heading="Centered copy"
                alignment="center"
                contentWidth="narrow"
                aria-label="Editorial introduction"
                className="custom-rich-text"
            />
        );

        expect(screen.getByLabelText('Editorial introduction')).toHaveClass(
            'items-center',
            'text-center',
            'max-w-3xl',
            'custom-rich-text'
        );
    });

    test('renders a CTA with a safe fallback label when only its URL is authored', () => {
        renderRichText(<RichText ctaUrl="/category/new" ctaStyle="outline" />);

        const link = screen.getByRole('link', { name: 'Learn more' });
        expect(link.getAttribute('href')).toContain('/category/new');
        expect(link).toHaveAttribute('data-variant', 'outline');
    });

    test('does not emit an empty component', () => {
        const { container } = renderRichText(<RichText heading="   " content="" />);
        expect(container).toBeEmptyDOMElement();
    });

    test('publishes merchant-friendly Page Designer metadata', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitRichTextMetadata)).toBe('SFNextToolkit.richText');

        const { fields } = getAttributeDefinitions(SFNextToolkitRichTextMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'eyebrow',
            'heading',
            'headingLevel',
            'content',
            'alignment',
            'contentWidth',
            'ctaLabel',
            'ctaUrl',
            'ctaStyle',
        ]);
        expect(fields.content).toMatchObject({ type: 'markup' });
        expect(fields.headingLevel).toMatchObject({
            type: 'enum',
            values: ['h1', 'h2', 'h3', 'h4'],
            defaultValue: 'h2',
        });
    });
});
