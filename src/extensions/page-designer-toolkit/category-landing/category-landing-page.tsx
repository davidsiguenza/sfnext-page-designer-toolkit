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
import type { ShopperProducts } from '@/scapi';
import CategoryBanner from '@/components/category-banner';
import CategoryBannerSkeleton from '@/components/category-banner/skeleton';
import CategoryBreadcrumbs from '@/components/category-breadcrumbs';
import { Region } from '@/components/region';
import { SeoMeta } from '@/components/seo-meta';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { clpHeroOwnsPageHeading } from './page-types';

export interface CategoryLandingPageProps {
    category: ShopperProducts.schemas['Category'];
    page: PageWithComponentData;
    pageUrl: string;
}

/** Renders the six merchant-owned CLP regions in their storefront order. */
export function CategoryLandingPage({ category, page, pageUrl }: CategoryLandingPageProps) {
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const title = category.name || category.id;
    const seoTitle = page.pageTitle || page.name || title;
    const seoDescription = page.pageDescription || page.description || category.pageDescription || category.description;
    const heroOwnsPageHeading = clpHeroOwnsPageHeading(page);

    return (
        <>
            <SeoMeta
                title={seoTitle}
                description={seoDescription}
                noIndex={isDesignMode || isPreviewMode}
                openGraph={{ type: 'website', url: pageUrl }}
            />
            <div data-slot="sfnext-toolkit-category-landing-page" className="-mt-8 pb-16">
                {!heroOwnsPageHeading && <h1 className="sr-only">{title}</h1>}
                <Region
                    page={page}
                    regionId="clpHero"
                    fallbackElement={<CategoryBannerSkeleton />}
                    errorElement={<CategoryBanner showProductCount={false} />}
                />

                <div className="section-container pt-6">
                    <CategoryBreadcrumbs category={category} />
                </div>

                <Region page={page} regionId="clpQuickLinks" />

                <div data-slot="clp-editorial-regions" className="space-y-8 md:space-y-12">
                    <Region page={page} regionId="clpMain" />
                    <Region page={page} regionId="clpShoppable" />
                    <Region page={page} regionId="clpSocial" />
                    <Region page={page} regionId="clpBottom" />
                </div>
            </div>
        </>
    );
}
