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
import { describe, expect, test } from 'vitest';
import page from './sfnextToolkitCategoryLandingPage.json';

describe('SFNext Toolkit Category Landing metadata', () => {
    test('publishes the stable category route, PLP aspect, and CLP region contract', () => {
        expect(page).toMatchObject({
            name: 'SFNext Toolkit - Category Landing',
            arch_type: 'headless',
            supported_aspect_types: ['plp'],
            route: '/:siteId/:localeId/category/:categoryId',
        });
        expect(page.region_definitions.map((region) => region.id)).toEqual([
            'clpHero',
            'clpQuickLinks',
            'clpMain',
            'clpShoppable',
            'clpSocial',
            'clpBottom',
        ]);
    });

    test('keeps contextual components in their intended authoring regions', () => {
        const hero = page.region_definitions.find((region) => region.id === 'clpHero');
        const quickLinks = page.region_definitions.find((region) => region.id === 'clpQuickLinks');
        const main = page.region_definitions.find((region) => region.id === 'clpMain');
        const shoppable = page.region_definitions.find((region) => region.id === 'clpShoppable');
        const social = page.region_definitions.find((region) => region.id === 'clpSocial');

        expect(hero?.component_type_inclusions).toEqual(
            expect.arrayContaining([
                { type_id: 'SFNextToolkit.heroBanner' },
                { type_id: 'SFNextToolkit.mixedMediaCarousel' },
            ])
        );
        expect(quickLinks).toMatchObject({
            max_components: 1,
            component_type_inclusions: [{ type_id: 'SFNextToolkit.categoryQuickLinks' }],
        });
        expect(main?.component_type_inclusions).toEqual(
            expect.arrayContaining([
                { type_id: 'SFNextToolkit.categoryCarousel' },
                { type_id: 'SFNextToolkit.mediaContent' },
                { type_id: 'SFNextToolkit.motionShowcase' },
                { type_id: 'SFNextToolkit.promoGrid' },
                { type_id: 'SFNextToolkit.responsiveColumns' },
            ])
        );
        expect(shoppable?.component_type_inclusions).toEqual(
            expect.arrayContaining([
                { type_id: 'SFNextToolkit.productCarousel' },
                { type_id: 'SFNextToolkit.productRecommendations' },
                { type_id: 'SFNextToolkit.shoppableImage' },
            ])
        );
        expect(social?.component_type_inclusions).toContainEqual({ type_id: 'SFNextToolkit.motionShowcase' });

        const topLevelTypes = page.region_definitions.flatMap((region) => region.component_type_inclusions);
        expect(topLevelTypes).not.toContainEqual({ type_id: 'SFNextToolkit.mixedMediaSlide' });
    });
});
