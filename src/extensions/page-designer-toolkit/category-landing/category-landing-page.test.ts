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
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { CATEGORY_LANDING_PAGE_TYPE_ID, clpHeroOwnsPageHeading, isCategoryLandingPage } from './page-types';

function createPage(typeId: string, data: Record<string, unknown>): PageWithComponentData {
    return {
        id: 'category-landing-page',
        typeId: 'sfnextToolkitCategoryLandingPage',
        regions: [{ id: 'clpHero', components: [{ id: 'hero', typeId, data }] }],
    } as unknown as PageWithComponentData;
}

describe('category landing heading ownership', () => {
    test('recognizes raw and page-qualified Page Designer type IDs', () => {
        expect(isCategoryLandingPage(CATEGORY_LANDING_PAGE_TYPE_ID)).toBe(true);
        expect(isCategoryLandingPage(`page.${CATEGORY_LANDING_PAGE_TYPE_ID}`)).toBe(true);
        expect(isCategoryLandingPage('sfnextToolkitProductListingPage')).toBe(false);
        expect(isCategoryLandingPage(undefined)).toBe(false);
    });

    test('uses an authored Hero Banner H1 as the page heading', () => {
        expect(
            clpHeroOwnsPageHeading(createPage('SFNextToolkit.heroBanner', { title: 'Girls', headingLevel: 'h1' }))
        ).toBe(true);
        expect(clpHeroOwnsPageHeading(createPage('SFNextToolkit.heroBanner', { title: 'Girls' }))).toBe(true);
    });

    test('keeps the contextual category H1 for other or incomplete heroes', () => {
        expect(
            clpHeroOwnsPageHeading(createPage('SFNextToolkit.heroBanner', { title: 'Girls', headingLevel: 'h2' }))
        ).toBe(false);
        expect(clpHeroOwnsPageHeading(createPage('SFNextToolkit.categoryHero', { semanticTitle: true }))).toBe(false);
        expect(clpHeroOwnsPageHeading(createPage('SFNextToolkit.heroBanner', { title: '   ' }))).toBe(false);
    });
});
