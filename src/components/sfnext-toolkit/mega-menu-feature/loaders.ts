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

import type { LoaderFunctionArgs } from 'react-router';
import { siteContext, type SiteContext } from '@salesforce/storefront-next-runtime/site-context';
import type { ShopperExperience } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { fetchCategoriesByIds } from '@/lib/api/categories.server';
import { fetchProductsByIds } from '@/lib/api/products.server';
import { getLogger } from '@/lib/logger.server';
import {
    fetchComponentWithComponentData,
    type ComponentWithComponentData,
} from '@/lib/page-designer/component-loader.server';
import { normalizeContentAssetId, normalizeContentCollectionItem } from '../content-collection/content-model';
import {
    emptyMegaMenuFeatureData,
    normalizeMegaMenuFeatureId,
    normalizeMegaMenuFeatureImage,
    normalizeMegaMenuFeatureImageViewType,
    normalizeMegaMenuFeatureSourceType,
    projectCategoryFeature,
    projectCmsFeature,
    projectContentFeature,
    projectProductFeature,
    MEGA_MENU_FEATURE_IMAGE_VIEW_TYPES,
    type MegaMenuFeatureConfiguration,
    type MegaMenuFeatureLoaderData,
} from './model';

export const MEGA_MENU_FEATURE_TYPE_ID = 'SFNextToolkit.megaMenuFeature';

type Component = ShopperExperience.schemas['Component'];
type UnknownRecord = Record<string, unknown>;

interface FeatureReference {
    id: string;
    config: MegaMenuFeatureConfiguration & UnknownRecord;
}

interface FamilyResult<T> {
    items: T[];
    failed: boolean;
}

function collectFeatureReferences(regions: Component['regions']): FeatureReference[] {
    const references: FeatureReference[] = [];

    const visit = (nestedRegions: Component['regions']) => {
        for (const region of nestedRegions ?? []) {
            for (const component of region.components ?? []) {
                if (component.typeId === MEGA_MENU_FEATURE_TYPE_ID && component.id) {
                    references.push({
                        id: component.id,
                        config: ((component.data ?? {}) as MegaMenuFeatureConfiguration & UnknownRecord) || {},
                    });
                }
                visit(component.regions);
            }
        }
    };

    visit(regions);
    return references;
}

function unique(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function fieldMapping(config: MegaMenuFeatureConfiguration) {
    const stringValue = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
    return {
        titleAttribute: stringValue(config.titleAttribute),
        excerptAttribute: stringValue(config.excerptAttribute),
        imageAttribute: stringValue(config.imageAttribute),
        imageAltAttribute: stringValue(config.imageAltAttribute),
        linkAttribute: stringValue(config.linkAttribute),
        eyebrowAttribute: stringValue(config.eyebrowAttribute),
    };
}

function hasManualContent(config: FeatureReference['config']): boolean {
    const hasString = (value: unknown) => typeof value === 'string' && Boolean(value.trim());
    // Match the live component's minimum rendering contract exactly. Supporting
    // labels and CTAs cannot form a visible card without title, copy, or image.
    return (
        hasString(config.title) ||
        hasString(config.copy) ||
        Boolean(normalizeMegaMenuFeatureImage(config.imageOverride))
    );
}

async function isolateFamily<T>(
    operation: () => Promise<T[]>,
    onFailure: (error: unknown) => void
): Promise<FamilyResult<T>> {
    try {
        return { items: await operation(), failed: false };
    } catch (error) {
        onFailure(error);
        return { items: [], failed: true };
    }
}

async function loadContentRecords(context: LoaderFunctionArgs['context'], ids: string[]): Promise<UnknownRecord[]> {
    if (!ids.length) return [];
    const clients = createApiClients(context);
    const response = await clients.shopperExperience.getMultipleContent({ params: { query: { ids } } });
    return Array.isArray(response.data?.data) ? (response.data.data as UnknownRecord[]) : [];
}

/**
 * Resolves every graphical feature in one bounded batch. There are no individual
 * feature loaders: a menu with twelve panels still performs at most one category,
 * one product and one B2C Content request family.
 */
export async function loadMegaMenuFeatureData(
    context: LoaderFunctionArgs['context'],
    references: FeatureReference[]
): Promise<Record<string, MegaMenuFeatureLoaderData>> {
    if (!references.length) return {};

    const logger = getLogger(context);
    const categoryIds = unique(
        references.map(({ config }) =>
            normalizeMegaMenuFeatureSourceType(config.sourceType) === 'category'
                ? normalizeMegaMenuFeatureId(config.category)
                : undefined
        )
    );
    const productIds = unique(
        references.map(({ config }) =>
            normalizeMegaMenuFeatureSourceType(config.sourceType) === 'product'
                ? normalizeMegaMenuFeatureId(config.product)
                : undefined
        )
    );
    const contentIds = unique(
        references.map(({ config }) =>
            normalizeMegaMenuFeatureSourceType(config.sourceType) === 'content'
                ? normalizeContentAssetId(config.contentId)
                : undefined
        )
    );
    const { currency } = context.get(siteContext) as SiteContext;

    const warn = (source: string, count: number, error: unknown) => {
        logger.warn('SFNext Toolkit mega menu feature source failed', {
            source,
            count,
            error: error instanceof Error ? error.name : 'UnknownError',
        });
    };

    const [categoryResult, productResult, contentResult] = await Promise.all([
        isolateFamily(
            () => (categoryIds.length ? fetchCategoriesByIds(context, categoryIds, 0) : Promise.resolve([])),
            (error) => warn('category', categoryIds.length, error)
        ),
        isolateFamily(
            () =>
                productIds.length
                    ? fetchProductsByIds(context, productIds, {
                          expand: ['images', 'prices', 'promotions'],
                          allImages: true,
                          // Fetch the complete supported fallback family in the same
                          // batched request. Otherwise a missing requested view type
                          // cannot fall back to an image SCAPI was never asked to return.
                          imgTypes: MEGA_MENU_FEATURE_IMAGE_VIEW_TYPES.join(','),
                          perPricebook: true,
                          ...(currency ? { currency } : {}),
                      })
                    : Promise.resolve([]),
            (error) => warn('product', productIds.length, error)
        ),
        isolateFamily(
            () => loadContentRecords(context, contentIds),
            (error) => warn('content', contentIds.length, error)
        ),
    ]);

    const categories = new Map(categoryResult.items.map((category) => [category.id, category]));
    const products = new Map(
        productResult.items.map((product) => [product.id || product.productId, product] as const).filter(([id]) => id)
    );
    const content = new Map(
        contentResult.items
            .map((record) => [normalizeContentAssetId(record.id), record] as const)
            .filter((entry): entry is [string, UnknownRecord] => Boolean(entry[0]))
    );

    return Object.fromEntries(
        references.map(({ id, config }) => {
            const sourceType = normalizeMegaMenuFeatureSourceType(config.sourceType);

            if (sourceType === 'category') {
                const sourceId = normalizeMegaMenuFeatureId(config.category);
                if (!sourceId) return [id, emptyMegaMenuFeatureData('unconfigured')];
                const category = categories.get(sourceId);
                return [
                    id,
                    category
                        ? { status: 'ready', item: projectCategoryFeature(category) }
                        : emptyMegaMenuFeatureData(categoryResult.failed ? 'error' : 'not-found'),
                ];
            }

            if (sourceType === 'product') {
                const sourceId = normalizeMegaMenuFeatureId(config.product);
                if (!sourceId) return [id, emptyMegaMenuFeatureData('unconfigured')];
                const product = products.get(sourceId);
                return [
                    id,
                    product
                        ? {
                              status: 'ready',
                              item: projectProductFeature(
                                  product,
                                  normalizeMegaMenuFeatureImageViewType(config.imageViewType),
                                  currency
                              ),
                          }
                        : emptyMegaMenuFeatureData(productResult.failed ? 'error' : 'not-found'),
                ];
            }

            if (sourceType === 'content') {
                const sourceId = normalizeContentAssetId(config.contentId);
                if (!sourceId) return [id, emptyMegaMenuFeatureData('unconfigured')];
                const record = content.get(sourceId);
                const item = record ? normalizeContentCollectionItem(record, fieldMapping(config)) : null;
                return [
                    id,
                    item
                        ? { status: 'ready', item: projectContentFeature(item) }
                        : emptyMegaMenuFeatureData(contentResult.failed ? 'error' : 'not-found'),
                ];
            }

            const cmsItem = projectCmsFeature(config.cmsRecord, fieldMapping(config));
            if (sourceType === 'cms') {
                return [id, cmsItem ? { status: 'ready', item: cmsItem } : emptyMegaMenuFeatureData('unconfigured')];
            }

            if (!cmsItem && !hasManualContent(config)) return [id, emptyMegaMenuFeatureData('unconfigured')];
            return [
                id,
                {
                    status: 'ready',
                    item: cmsItem ? { ...cmsItem, sourceType: 'custom' } : { sourceType: 'custom' },
                },
            ];
        })
    );
}

/**
 * Adds the shared batch promises to an existing page/component data map. This
 * keeps full-page authoring, focused component preview, and the embedded Header
 * path on the same bounded request model.
 */
export function attachMegaMenuFeatureData(
    context: LoaderFunctionArgs['context'],
    regions: Component['regions'],
    componentData: Record<string, Promise<unknown>>
): boolean {
    const references = collectFeatureReferences(regions);
    if (!references.length) return false;

    const batch = loadMegaMenuFeatureData(context, references);
    for (const { id } of references) {
        componentData[id] = batch.then((resolved) => resolved[id] ?? emptyMegaMenuFeatureData('error'));
    }
    return true;
}

/** Adds the shared Mega Menu batch to an already fetched component owner. */
export function withMegaMenuFeatureData(
    context: LoaderFunctionArgs['context'],
    component: ComponentWithComponentData | null
): ComponentWithComponentData | null {
    if (!component) return null;

    const componentData = { ...(component.componentData ?? {}) };
    if (!attachMegaMenuFeatureData(context, component.regions, componentData)) return component;

    return {
        ...component,
        componentData,
    };
}

/**
 * Fetches any component subtree and attaches one shared batch promise to every
 * Mega Menu Feature descendant. In the app shell the subtree is the standard
 * embedded Header owner; in focused authoring it can be the content block itself.
 */
export async function fetchComponentWithMegaMenuFeatureData(
    args: LoaderFunctionArgs,
    componentId: string
): Promise<ComponentWithComponentData | null> {
    const component = await fetchComponentWithComponentData(
        args,
        { componentId },
        {
            preserveRequestedComponentId: true,
            excludeDescendantLoaderTypeIds: [MEGA_MENU_FEATURE_TYPE_ID],
        }
    );
    return withMegaMenuFeatureData(args.context, component);
}

/** Individual loader used only when a feature itself is the focused preview root. */
export async function loader({
    componentData,
    context,
}: {
    componentData: unknown;
    context: LoaderFunctionArgs['context'];
}): Promise<MegaMenuFeatureLoaderData> {
    const component = componentData as Component;
    const id = component.id || '__mega_menu_feature_preview__';
    const resolved = await loadMegaMenuFeatureData(context, [
        {
            id,
            config: ((component.data ?? {}) as MegaMenuFeatureConfiguration & UnknownRecord) || {},
        },
    ]);
    return resolved[id] ?? emptyMegaMenuFeatureData('error');
}

export type { FeatureReference };
