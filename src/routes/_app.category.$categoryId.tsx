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
import { Suspense, use, useCallback, useEffect, useMemo, useRef, useTransition } from 'react';
import { redirect, useAsyncError, useLocation, useNavigation, useRouteLoaderData } from 'react-router';
import type { loader as rootLoader } from '@/root';
import type { Route } from './+types/_app.category.$categoryId';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';
import { fetchCategory } from '@/lib/api/categories.server';
import { fetchSearchProducts } from '@/lib/api/search.server';
import { fetchWishlistInitialState } from '@/lib/wishlist/fetch-initial-state.server';
import type { WishlistInitialState } from '@/lib/wishlist/state';
import { WishlistProvider } from '@/providers/wishlist';
import { getAllQueryParams, getQueryParam, PRODUCT_SEARCH_QUERY_PARAMS } from '@/lib/query-params';
import { getConfig, useConfig } from '@salesforce/storefront-next-runtime/config';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
import CategoryBreadcrumbs from '@/components/category-breadcrumbs';
import CategoryPagination from '@/components/category-pagination';
import ActiveFilters from '@/components/category-refinements/active-filters';
import FiltersButton from '@/components/category-refinements/filters-button';
import CategoryRefinements from '@/components/category-refinements';
import CategorySorting from '@/components/category-sorting';
import QuickFilters from '@/components/quick-filters';
import { useAnalytics } from '@/hooks/use-analytics';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { Region } from '@/components/region';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { ProductListSlot } from '@/components/product-list/slot';
import {
    getProductListConfigFromPage,
    getProductListConfigKey,
    getProductListSearchParameters,
} from '@/components/product-list/config';
import CategoryBanner from '@/components/category-banner';
import CategoryBannerSkeleton from '@/components/category-banner/skeleton';
import { JsonLd } from '@/components/json-ld';
import { SeoMeta } from '@/components/seo-meta';
import { useTranslation } from 'react-i18next';
import { UITarget } from '@/targets/ui-target';
import { generateCategorySchema } from '@/utils/category-schema';
import { getPublicOrigin } from '@/utils/schema-url';
import { buildCanonicalUrl } from '@/utils/canonical-url';
import {
    ACTION_PARAMS,
    FILTERS_QUERY_PARAM,
    getInitialFiltersOpen,
    getSearchWithoutClientOnlyParams,
    useFiltersPanelState,
} from '@/hooks/use-filters-panel-state';
import { getLogger } from '@/lib/logger.server';
import { uiConfig } from '@/lib/config.ui';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { CategoryLandingPage } from '@/extensions/page-designer-toolkit/category-landing/category-landing-page';
import { isCategoryLandingPage } from '@/extensions/page-designer-toolkit/category-landing/page-types';
import {
    getPLPMerchandisingGridConfigFromPage,
    getPLPMerchandisingGridConfigKey,
    PLP_VIEW_QUERY_PARAM,
    type PLPMerchandisingGridConfig,
} from '@/components/sfnext-toolkit/plp-merchandising-grid/config';
import { cn } from '@/lib/utils';

// Kept as a same-file literal because the cartridge generator statically reads
// decorator values without resolving imports.
const TOOLKIT_PAGE_REGION_EXCLUSIONS = [
    'SFNextToolkit.accordionItem',
    'SFNextToolkit.categoryCard',
    'SFNextToolkit.editorialCard',
    'SFNextToolkit.megaMenu',
    'SFNextToolkit.megaMenuFeature',
    'SFNextToolkit.megaMenuLink',
    'SFNextToolkit.megaMenuPanel',
    'SFNextToolkit.mixedMediaSlide',
    'SFNextToolkit.pdpLayout',
    'SFNextToolkit.plpMerchandisingGrid',
    'SFNextToolkit.promoCard',
    'SFNextToolkit.siteTheme',
    'SFNextToolkit.sizeGuide',
    'SFNextToolkit.trustItem',
];

@PageType({
    name: 'Product Listing Page',
    description: 'Product listing page with product listings and personalized content',
    supportedAspectTypes: ['plp'],
})
@RegionDefinition([
    {
        id: 'plpTopFullWidth',
        name: 'Top Full Width Region',
        description: 'Full screen width region at the top of the results',
        maxComponents: 5,
        componentTypeExclusions: TOOLKIT_PAGE_REGION_EXCLUSIONS,
    },
    {
        id: 'plpTopContent',
        name: 'Top Content Region',
        description: 'Content width region below sort/filter, above product grid',
        maxComponents: 5,
        componentTypeExclusions: TOOLKIT_PAGE_REGION_EXCLUSIONS,
    },
    {
        id: 'plpProductList',
        name: 'Configurable Product List',
        description: 'Controls the product attributes and catalog image type rendered in the product grid',
        maxComponents: 1,
        componentTypeInclusions: ['Layout.productList'],
    },
    {
        id: 'plpBottom',
        name: 'Bottom Region',
        description: 'Region at the bottom of search results after product grid',
        maxComponents: 5,
        componentTypeExclusions: TOOLKIT_PAGE_REGION_EXCLUSIONS,
    },
])
export class ProductListingPageMetadata {}

type CategoryPageDefinition = Awaited<ReturnType<typeof fetchPageWithComponentData>>;
type ResolvedCategoryPageDefinition = NonNullable<CategoryPageDefinition>;

type CategoryPageBaseData = {
    category: ShopperProducts.schemas['Category'];
    categoryId: string;
    pageUrl: string;
    currency: string;
    locale: string;
    wishlistInitialState: Promise<WishlistInitialState>;
};

type CategoryLandingPageData = CategoryPageBaseData & {
    pageKind: 'category-landing';
    page: ResolvedCategoryPageDefinition;
    searchResultCritical?: never;
    searchResultNonCritical?: never;
    productListConfigKey?: never;
    plpMerchandisingConfig?: never;
    refine?: never;
    initialFiltersOpen?: never;
    categorySchema?: never;
};

type ProductListingPageData = CategoryPageBaseData & {
    /** Optional only for backwards-compatible manually constructed route data; the loader always sets it. */
    pageKind?: 'product-listing';
    searchResultCritical: ShopperSearch.schemas['ProductSearchResult'];
    searchResultNonCritical: Promise<ShopperSearch.schemas['ProductSearchResult']>;
    page: CategoryPageDefinition;
    productListConfigKey: string;
    plpMerchandisingConfig?: PLPMerchandisingGridConfig | null;
    refine: string[];
    initialFiltersOpen?: boolean;
    categorySchema: Promise<ReturnType<typeof generateCategorySchema> | null>;
};

type CategoryPageData = CategoryLandingPageData | ProductListingPageData;

const CATEGORY_LANDING_CONTENT_QUERY_PARAMS = [
    'q',
    'offset',
    'sort',
    'refine',
    'pid',
    FILTERS_QUERY_PARAM,
    PLP_VIEW_QUERY_PARAM,
    ...ACTION_PARAMS,
] as const;

/** Removes product-list state that has no meaning on an editorial category landing page. */
export function getCategoryLandingCanonicalRedirect(requestUrl: URL): string | null {
    const cleanUrl = new URL(requestUrl);
    let removedContentState = false;

    for (const param of CATEGORY_LANDING_CONTENT_QUERY_PARAMS) {
        if (cleanUrl.searchParams.has(param)) {
            cleanUrl.searchParams.delete(param);
            removedContentState = true;
        }
    }

    return removedContentState ? `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}` : null;
}

/**
 * Server-side loader function that fetches category data and product search results.
 * This function runs on the server during SSR and prepares data for the category page.
 * @returns Object containing search results, category data, and page metadata
 */
export async function loader(args: Route.LoaderArgs): Promise<CategoryPageData> {
    const {
        context,
        request,
        params: { categoryId },
    } = args;
    const requestUrl = new URL(request.url);
    const { searchParams } = requestUrl;
    const logger = getLogger(context);
    logger.debug('Category: loader starting', {
        categoryId,
        offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    const offset = parseInt(getQueryParam(searchParams, PRODUCT_SEARCH_QUERY_PARAMS.OFFSET) || '0', 10);
    const sort = getQueryParam(searchParams, PRODUCT_SEARCH_QUERY_PARAMS.SORT);
    const refine = getAllQueryParams(searchParams, PRODUCT_SEARCH_QUERY_PARAMS.REFINE);
    const initialFiltersOpen = getInitialFiltersOpen(searchParams);

    // Get currency and locale for cache-busting the page key
    const config = getConfig(context);
    const siteCtx = context.get(siteContext);
    if (!siteCtx) {
        logger.error('Category: site context is not available');
        throw new Response('Site context is not available', { status: 500 });
    }
    const { currency } = siteCtx;
    const locale = siteCtx.locale.id;
    const limit = config.search.products.hits.limit;

    // Resolve the PLP definition alongside the category. Its product-list component controls
    // both the tile presentation and the image/custom-property fields requested from SCAPI.
    const pagePromise = fetchPageWithComponentData(args, {
        aspectType: 'plp',
        categoryId,
    });

    let categoryData: ShopperProducts.schemas['Category'] | undefined;
    try {
        categoryData = await fetchCategory(context, categoryId, 1);
    } catch (e) {
        if (e instanceof NormalizedApiError && e.status) {
            throw new Response(e.message, { status: e.status });
        }
        throw new Response('Internal Server Error', { status: 500 });
    }

    const page = await pagePromise;

    if (page && isCategoryLandingPage(page.typeId)) {
        const canonicalRedirect = getCategoryLandingCanonicalRedirect(requestUrl);
        if (canonicalRedirect) {
            throw redirect(canonicalRedirect);
        }

        return {
            pageKind: 'category-landing',
            category: categoryData,
            page,
            categoryId,
            pageUrl: buildCanonicalUrl(getPublicOrigin(request), requestUrl.pathname, ''),
            currency,
            locale,
            wishlistInitialState: fetchWishlistInitialState(context),
        };
    }

    const plpMerchandisingConfig = getPLPMerchandisingGridConfigFromPage(page);
    const productListConfig = plpMerchandisingConfig?.productList ?? getProductListConfigFromPage(page);
    const productListSearchParameters = getProductListSearchParameters(productListConfig);

    // Keep non-category refinements and apply exactly one category refinement.
    // If URL already contains a cgid refine (e.g. from quick filters), honor it.
    // Otherwise, default to the category id from the route path.
    const effectiveRefine = refine.filter((r) => !r.startsWith('cgid='));
    const selectedCgidRefine = refine.find((r) => r.startsWith('cgid='));
    effectiveRefine.push(selectedCgidRefine ?? `cgid=${categoryId}`);

    // Ensure criticalCount doesn't exceed limit to prevent negative non-critical limit
    const criticalCount = config.search.products.hits.critical ?? 4;
    const safeCriticalCount = Math.min(criticalCount, limit);
    const searchResultCritical = await fetchSearchProducts(context, {
        limit: safeCriticalCount,
        offset,
        sort,
        refine: effectiveRefine,
        currency,
        ...productListSearchParameters,
    });

    const effectiveCriticalCount = searchResultCritical.hits?.length ?? 0;
    const searchResultNonCritical = fetchSearchProducts(context, {
        limit: limit - effectiveCriticalCount,
        offset: offset + effectiveCriticalCount,
        sort,
        refine: effectiveRefine,
        currency,
        ...productListSearchParameters,
    });

    const pageUrl = buildCanonicalUrl(requestUrl.origin, requestUrl.pathname, requestUrl.search);

    // Generate category schema in loader (server-side) for SEO
    const categorySchemaPromise = searchResultNonCritical
        .then((searchResult: ShopperSearch.schemas['ProductSearchResult']) => {
            try {
                // Use public origin from request headers instead of request.url
                // to avoid exposing internal AWS Lambda URLs in schema
                const publicOrigin = getPublicOrigin(request);
                const url = new URL(request.url);
                const schemaPageUrl = `${publicOrigin}${url.pathname}${url.search}`;
                // Validate inputs before generating schema
                if (!categoryData || !searchResult) {
                    return null;
                }
                return generateCategorySchema({
                    category: categoryData,
                    searchResult: {
                        ...searchResult,
                        hits: [...(searchResultCritical.hits || []), ...(searchResult.hits || [])],
                    },
                    config,
                    pageUrl: schemaPageUrl,
                    defaultCurrency: currency,
                });
            } catch (error) {
                logger.error('Error generating category schema in loader', {
                    error,
                });
                return null;
            }
        })
        .catch((error) => {
            logger.error('Error in category schema promise chain', {
                error,
            });
            return null;
        });

    return {
        pageKind: 'product-listing',
        category: categoryData,
        searchResultCritical,
        searchResultNonCritical,
        page,
        productListConfigKey: plpMerchandisingConfig
            ? getPLPMerchandisingGridConfigKey(plpMerchandisingConfig)
            : getProductListConfigKey(productListConfig),
        plpMerchandisingConfig,
        categoryId,
        pageUrl,
        refine: effectiveRefine,
        currency,
        locale,
        initialFiltersOpen,
        categorySchema: categorySchemaPromise,
        wishlistInitialState: fetchWishlistInitialState(args.context),
    };
}

export { shouldRevalidate } from '@/lib/revalidation/routes/category';

/**
 * Category page component that displays a product category with filtering, sorting, and pagination.
 * This component uses the createPage factory to handle Suspense patterns.
 * @returns JSX element representing the category page
 */
function ProductGridError() {
    const rawError = useAsyncError();
    const error = rawError instanceof NormalizedApiError ? rawError : null;
    const { t } = useTranslation('common');
    return (
        <div role="alert" className="col-span-full py-8 text-center text-muted-foreground">
            <p>{t('productGrid.loadFailed')}</p>
            {import.meta.env.DEV && error && (
                <div className="mt-2 text-xs font-mono text-muted-foreground/70">
                    {error.status && <span>{error.status} </span>}
                    {error.message && <p>{error.message}</p>}
                </div>
            )}
        </div>
    );
}

/**
 * Component that renders JSON-LD schema when categorySchema promise resolves.
 * Must be inside Suspense boundary to ensure it streams correctly in SSR.
 */
function CategoryJsonLd({
    categorySchemaPromise,
}: {
    categorySchemaPromise: Promise<ReturnType<typeof generateCategorySchema> | null>;
}) {
    const categorySchema = use(categorySchemaPromise);
    const rootData = useRouteLoaderData<typeof rootLoader>('root');
    const nonce = rootData?.nonce ?? undefined;
    return categorySchema ? <JsonLd data={categorySchema} id="category-schema" nonce={nonce} /> : null;
}

function CategoryLandingViewAnalytics({
    category,
    analyticsKey,
}: {
    category: ShopperProducts.schemas['Category'];
    analyticsKey: string;
}) {
    const analytics = useAnalytics();
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const lastTrackedDataRef = useRef<string | null>(null);

    useEffect(() => {
        if (isDesignMode || isPreviewMode || !analytics || analyticsKey === lastTrackedDataRef.current) return;
        lastTrackedDataRef.current = analyticsKey;

        void analytics.trackViewCategory({
            category,
            searchResults: [],
            sort: '',
            refinements: {},
        });
    }, [analytics, analyticsKey, category, isDesignMode, isPreviewMode]);

    return null;
}

function CategoryLandingRoute({ loaderData }: { loaderData: CategoryLandingPageData }) {
    const analyticsKey = `${loaderData.categoryId}-${loaderData.currency}-${loaderData.locale}`;

    return (
        <WishlistProvider initialState={loaderData.wishlistInitialState}>
            <CategoryLandingViewAnalytics category={loaderData.category} analyticsKey={analyticsKey} />
            <CategoryLandingPage category={loaderData.category} page={loaderData.page} pageUrl={loaderData.pageUrl} />
        </WishlistProvider>
    );
}

export default function CategoryPage({ loaderData }: { loaderData: CategoryPageData }) {
    if (loaderData.pageKind === 'category-landing') {
        return <CategoryLandingRoute loaderData={loaderData} />;
    }

    return <ProductListingCategoryPage loaderData={loaderData} />;
}

function ProductListingCategoryPage({
    loaderData: {
        category,
        searchResultCritical,
        searchResultNonCritical,
        page,
        productListConfigKey,
        plpMerchandisingConfig,
        categoryId,
        pageUrl,
        refine,
        locale,
        currency,
        initialFiltersOpen,
        categorySchema,
        wishlistInitialState,
    },
}: {
    loaderData: ProductListingPageData;
}) {
    const config = useConfig();
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const stickyControls = Boolean(plpMerchandisingConfig?.stickyControls && !isDesignMode);
    const stickyFilters = Boolean(plpMerchandisingConfig?.stickyFilters && !isDesignMode);

    const [filtersOpen, toggleFiltersOpen] = useFiltersPanelState(initialFiltersOpen);
    const limit = config.search.products.hits.limit;

    // Determine the maximum number of skeletons to display in the product grid.
    // Out-of-the-box the idea is to not display more than 8 skeletons, i.e., two rows on a desktop device.
    // Wrap in Math.max(0, ...) to prevent negative values when criticalCount is high(er).
    const criticalCount = searchResultCritical.hits?.length ?? 0;
    const nonCriticalCount = Math.max(
        0,
        Math.min(8, limit, searchResultCritical.total - searchResultCritical.offset) - criticalCount
    );

    const analytics = useAnalytics();
    const lastTrackedDataRef = useRef<string | null>(null);

    const location = useLocation();
    const navigation = useNavigation();
    const searchWithoutClientOnlyParams = useMemo(
        () => getSearchWithoutClientOnlyParams(location.search),
        [location.search]
    );
    const pageIdentity = `${categoryId}-${currency}-${locale}`;
    const analyticsKey = `${pageIdentity}-${searchWithoutClientOnlyParams}-${location.hash}`;
    const productGridDataKey = `${pageIdentity}-${searchWithoutClientOnlyParams}-${productListConfigKey}`;
    const selectedFiltersCount = useMemo(
        () => new URLSearchParams(location.search).getAll('refine').length,
        [location.search]
    );

    // QuickFilters "Shop by {label}" header is opt-in per build target via
    // `uiConfig.pages.category.showCategoryLabel`. When on, derive the label from
    // the active `cgid` refinement and pass it down; when off, pass nothing so
    // QuickFilters renders the chips-only baseline. Keeping this in the (shared)
    // route means QuickFilters stays presentational and no vertical has to fork
    // either the component or this route. See @/lib/config.ui.
    const categoryLabel = uiConfig.pages.category.showCategoryLabel
        ? searchResultCritical.refinements?.find((r) => r.attributeId === 'cgid')?.label
        : undefined;
    const isProductGridLoading = useMemo(() => {
        if (navigation.state === 'idle' || !navigation.location) {
            return false;
        }
        const currentRefines = new URLSearchParams(location.search).getAll('refine');
        const nextRefines = new URLSearchParams(navigation.location.search).getAll('refine');
        return (
            currentRefines.length !== nextRefines.length ||
            currentRefines.some((currentRefine, index) => currentRefine !== nextRefines[index])
        );
    }, [location.search, navigation.location, navigation.state]);

    const nonCriticalPromise = useMemo(
        () => searchResultNonCritical.then((r) => r.hits ?? []),
        [searchResultNonCritical]
    );

    const [, startTransition] = useTransition();

    useEffect(() => {
        if (isDesignMode || isPreviewMode || analyticsKey === lastTrackedDataRef.current) return;
        lastTrackedDataRef.current = analyticsKey;

        startTransition(() => {
            void nonCriticalPromise
                .then((searchHitsData: ShopperSearch.schemas['ProductSearchHit'][]) => {
                    if (!analytics) return;

                    void analytics.trackViewCategory({
                        category,
                        searchResults: [...(searchResultCritical.hits ?? []), ...searchHitsData],
                        sort:
                            searchResultCritical.selectedSortingOption ||
                            searchResultCritical.sortingOptions?.[0]?.label ||
                            '',
                        refinements: searchResultCritical.selectedRefinements ?? {},
                    });
                })
                .catch(() => {
                    // Analytics must never block or fail category rendering.
                });
        });
    }, [
        analytics,
        analyticsKey,
        category,
        isDesignMode,
        isPreviewMode,
        nonCriticalPromise,
        searchResultCritical,
        startTransition,
    ]);

    const handleProductClick = useCallback(
        (product: ShopperSearch.schemas['ProductSearchHit']) => {
            if (isDesignMode || isPreviewMode || !analytics) return;

            void analytics.trackClickProductInCategory({
                category,
                product,
            });
        },
        [analytics, category, isDesignMode, isPreviewMode]
    );

    return (
        <WishlistProvider initialState={wishlistInitialState}>
            <SeoMeta
                title={category.name || category.id}
                description={category.pageDescription || category.description}
                noIndex={isDesignMode || isPreviewMode}
                openGraph={{
                    type: 'website',
                    url: pageUrl,
                }}
            />
            <div className="pb-16 -mt-8">
                {/* plpTopFullWidth — full-width banner region, flush to the header (mirrors homepage pattern) */}
                <Region
                    page={page}
                    regionId="plpTopFullWidth"
                    fallbackElement={<CategoryBannerSkeleton />}
                    errorElement={<CategoryBanner />}
                    fallbackOnEmpty
                />

                <div className="section-container pt-8">
                    <div className="mb-4">
                        <CategoryBreadcrumbs category={category} />
                    </div>

                    <div
                        className={cn(
                            'mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                            stickyControls &&
                                'sticky z-30 border-b border-border bg-background/95 py-4 backdrop-blur-sm'
                        )}
                        style={stickyControls ? { top: 'var(--header-height, 0px)' } : undefined}>
                        <h1 className="text-3xl font-bold leading-none tracking-[-0.75px] text-card-foreground">
                            {category?.name || category.id} ({searchResultCritical.total})
                        </h1>
                        <UITarget targetId="sfcc.plp.search.summary" />
                        {searchResultCritical?.sortingOptions && searchResultCritical.sortingOptions.length > 0 && (
                            <div className="flex-shrink-0">
                                <CategorySorting result={searchResultCritical} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-2">
                        {/* Filters toggle button + Quick Filters - mobile only (above panel) */}
                        <div className="lg:hidden mb-4 flex flex-col items-start gap-2" data-slot="filters-wrapper">
                            <FiltersButton
                                onClick={toggleFiltersOpen}
                                isActive={filtersOpen}
                                selectedFiltersCount={selectedFiltersCount}
                            />
                            <QuickFilters category={category} categoryLabel={categoryLabel} />
                        </div>

                        {/* Category Refinements - toggles visibility on left side */}
                        {filtersOpen && (
                            <div
                                className={cn(
                                    'w-full lg:w-64 lg:flex-shrink-0',
                                    stickyFilters && 'lg:sticky lg:self-start lg:overflow-y-auto'
                                )}
                                style={
                                    stickyFilters
                                        ? {
                                              top: stickyControls
                                                  ? 'calc(var(--header-height, 0px) + 5.5rem)'
                                                  : 'calc(var(--header-height, 0px) + 1rem)',
                                              maxHeight: 'calc(100vh - var(--header-height, 0px) - 6rem)',
                                          }
                                        : undefined
                                }>
                                <CategoryRefinements result={searchResultCritical} refine={refine} />
                            </div>
                        )}

                        <div className="flex-grow">
                            {/* Filters toggle button + Quick Filters - desktop only (inside content area) */}
                            <div className="mb-4 hidden lg:flex lg:items-center lg:gap-4" data-slot="filters-wrapper">
                                <FiltersButton
                                    onClick={toggleFiltersOpen}
                                    isActive={filtersOpen}
                                    selectedFiltersCount={selectedFiltersCount}
                                />
                                <QuickFilters category={category} categoryLabel={categoryLabel} />
                            </div>

                            <ActiveFilters result={searchResultCritical} />

                            {/* plpTopContent */}
                            <Region className="mb-8" page={page} regionId="plpTopContent" />

                            <UITarget targetId="sfcc.plp.agent.categoryHelper" />
                            <UITarget targetId="sfcc.plp.search.results">
                                <ProductListSlot
                                    key={productGridDataKey}
                                    page={page}
                                    runtime={{
                                        critical: searchResultCritical.hits ?? [],
                                        nonCritical: nonCriticalPromise,
                                        nonCriticalCount,
                                        hasRefinementsPanel: filtersOpen,
                                        isLoading: isProductGridLoading,
                                        handleProductClick,
                                        topCategoryName:
                                            category.parentCategoryTree?.find((p) => p.id !== 'root')?.name ??
                                            category.name,
                                        errorElement: <ProductGridError />,
                                    }}
                                />
                            </UITarget>

                            {searchResultCritical.total > 1 && (
                                <div className="mt-10">
                                    <CategoryPagination
                                        limit={limit}
                                        offset={searchResultCritical.offset}
                                        total={searchResultCritical.total}
                                    />
                                </div>
                            )}

                            {/* plpBottom */}
                            <Region className="mt-8" page={page} regionId="plpBottom" />
                        </div>
                    </div>
                </div>
            </div>
            <Suspense fallback={null}>
                <CategoryJsonLd categorySchemaPromise={categorySchema} />
            </Suspense>
        </WishlistProvider>
    );
}
