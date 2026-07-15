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
import { MediaContent, SFNextToolkitMediaContentMetadata } from './index';

function renderMediaContent(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit media content', () => {
    test('renders responsive media, semantic copy, and rich markup', () => {
        renderMediaContent(
            <MediaContent
                imageUrl={{ url: 'https://example.com/editorial.jpg', focalPoint: { x: 25, y: 75 } }}
                imageAlt="Children exploring outdoors"
                eyebrow="Our story"
                heading="Made for discovery"
                headingLevel="h3"
                content="<p>Comfort for <strong>every adventure</strong>.</p>"
            />
        );

        const image = screen.getByRole('img', { name: 'Children exploring outdoors' });
        expect(image).toHaveAttribute('loading', 'lazy');
        expect(image).toHaveStyle({ objectPosition: '25% 75%' });
        expect(screen.getByRole('heading', { level: 3, name: 'Made for discovery' })).toBeInTheDocument();
        expect(screen.getByText('every adventure')).toHaveProperty('tagName', 'STRONG');
    });

    test('moves the image to the right on desktop and applies token variants', () => {
        renderMediaContent(
            <MediaContent
                imageUrl="/images/editorial.webp"
                imageAlt="Editorial"
                heading="Editorial content"
                mediaPosition="right"
                mediaRatio="square"
                surface="card"
                contentAlignment="end"
                contentSpacing="lg"
                data-testid="media-content"
            />
        );

        const root = screen.getByTestId('media-content');
        expect(root).toHaveClass('bg-card', 'text-card-foreground', 'border-border');
        expect(root.querySelector('[data-slot="sfnext-toolkit-media-content-media"]')).toHaveClass(
            'aspect-square',
            'md:order-2'
        );
        expect(root.querySelector('[data-slot="sfnext-toolkit-media-content-body"]')).toHaveClass(
            'justify-end',
            'p-8',
            'md:p-14',
            'md:order-1'
        );
    });

    test('falls back to a text-only layout and a default CTA label', () => {
        renderMediaContent(<MediaContent heading="No image required" ctaUrl="/about" ctaStyle="secondary" />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'No image required' })).toBeInTheDocument();
        const link = screen.getByRole('link', { name: 'Learn more' });
        expect(link.getAttribute('href')).toContain('/about');
        expect(link).toHaveAttribute('data-variant', 'secondary');
    });

    test('falls back to the heading for image alternative text', () => {
        renderMediaContent(<MediaContent imageUrl={{ path: '/images/library-image.webp' }} heading="Library image" />);
        expect(screen.getByRole('img', { name: 'Library image' })).toBeInTheDocument();
    });

    test('does not emit an empty component', () => {
        const { container } = renderMediaContent(<MediaContent />);
        expect(container).toBeEmptyDOMElement();
    });

    test('publishes the complete Page Designer metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitMediaContentMetadata)).toBe('SFNextToolkit.mediaContent');

        const { fields } = getAttributeDefinitions(SFNextToolkitMediaContentMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'imageUrl',
            'imageAlt',
            'imageTitle',
            'mediaPosition',
            'mediaRatio',
            'eyebrow',
            'heading',
            'headingLevel',
            'content',
            'ctaLabel',
            'ctaUrl',
            'ctaStyle',
            'surface',
            'contentAlignment',
            'contentSpacing',
        ]);
        expect(fields.imageUrl).toMatchObject({ type: 'image' });
        expect(fields.content).toMatchObject({ type: 'markup' });
        expect(fields.mediaPosition).toMatchObject({ values: ['left', 'right'], defaultValue: 'left' });
    });
});
