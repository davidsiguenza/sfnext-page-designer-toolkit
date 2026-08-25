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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';

export const CATEGORY_LANDING_PAGE_TYPE_ID = 'sfnextToolkitCategoryLandingPage';

/** Shopper Experience can return either the raw ID or its `page.`-qualified form. */
export function isCategoryLandingPage(typeId: string | undefined): boolean {
    return typeId === CATEGORY_LANDING_PAGE_TYPE_ID || typeId === `page.${CATEGORY_LANDING_PAGE_TYPE_ID}`;
}

/** True when the authored hero already provides the page H1. */
export function clpHeroOwnsPageHeading(page: PageWithComponentData): boolean {
    const hero = page.regions?.find((region) => region.id === 'clpHero')?.components?.[0];
    if (!hero?.typeId.endsWith('.heroBanner')) return false;

    const data = hero.data as { title?: unknown; headingLevel?: unknown } | undefined;
    const hasTitle = typeof data?.title === 'string' && data.title.trim().length > 0;
    const headingLevel = typeof data?.headingLevel === 'string' ? data.headingLevel : 'h1';
    return hasTitle && headingLevel === 'h1';
}
