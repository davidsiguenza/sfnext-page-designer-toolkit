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
import page from './sfnextToolkitMerchandisingProductListingPage.json';

describe('Merchandising Product Listing Page metadata', () => {
    test('publishes the stable category route and compatible PLP regions', () => {
        expect(page).toMatchObject({
            name: 'SFNext Toolkit - Merchandising Product Listing',
            arch_type: 'headless',
            supported_aspect_types: ['plp'],
            route: '/:siteId/:localeId/category/:categoryId',
        });
        expect(page.region_definitions.map((region) => region.id)).toEqual([
            'plpTopFullWidth',
            'plpTopContent',
            'plpMerchandisingGrid',
            'plpBottom',
        ]);
    });

    test('allows exactly one merchandising grid and keeps editorials nested', () => {
        const grid = page.region_definitions.find((region) => region.id === 'plpMerchandisingGrid');
        expect(grid).toMatchObject({
            max_components: 1,
            component_type_inclusions: [{ type_id: 'SFNextToolkit.plpMerchandisingGrid' }],
        });

        for (const region of page.region_definitions.filter((candidate) => candidate.id !== 'plpMerchandisingGrid')) {
            expect(region.component_type_exclusions).toContainEqual({ type_id: 'SFNextToolkit.editorialCard' });
        }
    });
});
