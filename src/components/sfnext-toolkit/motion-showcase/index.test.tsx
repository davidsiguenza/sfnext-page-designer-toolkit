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
import MotionShowcase, { SFNextToolkitMotionShowcaseMetadata } from './index';

const mockPageDesignerMode = vi.fn(() => ({ isDesignMode: false, isPreviewMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockPageDesignerMode(),
}));

function renderMotionShowcase(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit motion showcase', () => {
    beforeEach(() => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
    });

    test('composes Media Content and publishes only semantic motion IDs', () => {
        renderMotionShowcase(
            <MotionShowcase
                imageUrl={{ url: '/images/campaign.webp', focalPoint: { x: 35, y: 60 } }}
                imageAlt="Children wearing the campaign collection"
                eyebrow="Motion design system"
                heading="Animation managed from Page Designer"
                content="<p>Reusable motion tokens keep every experience consistent.</p>"
                ctaLabel="Explore"
                ctaUrl="/category/new-arrivals"
                motion={{
                    version: 1,
                    effect: 'slide_left',
                    duration: 'slow',
                    easing: 'emphasized',
                    delay: 'short',
                    sequence: 'stagger',
                    stagger: 'relaxed',
                    trigger: 'viewport',
                    replay: true,
                }}
            />
        );

        const root = screen.getByRole('article');
        expect(root).toHaveAttribute('data-slot', 'sfnext-toolkit-media-content');
        expect(root).toHaveAttribute('data-motion-showcase', '');
        expect(root).toHaveAttribute('data-motion-effect', 'slide_left');
        expect(root).toHaveAttribute('data-motion-duration', 'slow');
        expect(root).toHaveAttribute('data-motion-easing', 'emphasized');
        expect(root).toHaveAttribute('data-motion-replay', 'true');
        expect(screen.getByRole('heading', { name: 'Animation managed from Page Designer' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Children wearing the campaign collection' })).toHaveStyle({
            objectPosition: '35% 60%',
        });
        expect(screen.getByRole('link', { name: 'Explore' })).toBeInTheDocument();
    });

    test('keeps the authoring canvas visible while the separate editor previews motion', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        renderMotionShowcase(<MotionShowcase heading="Editable campaign" motion={null} />);

        const root = screen.getByRole('article');
        expect(root).toHaveAttribute('data-motion-authoring-disabled', 'true');
        expect(root).toHaveAttribute('data-motion-visible', 'true');
        expect(root).not.toHaveAttribute('data-motion-ready');
    });

    test('publishes the custom editor contract without a custom-attribute default', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitMotionShowcaseMetadata)).toBe(
            'SFNextToolkit.motionShowcase'
        );

        const { fields } = getAttributeDefinitions(SFNextToolkitMotionShowcaseMetadata.prototype);
        expect(fields.motion).toMatchObject({
            type: 'custom',
            editorDefinition: {
                type: 'SFNextToolkit.motionEditor',
                configuration: { schemaVersion: 1 },
            },
        });
        expect(fields.motion.defaultValue).toBeUndefined();
    });
});
