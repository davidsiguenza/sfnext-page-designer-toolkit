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
import type { ShopperSearch } from '@/scapi';
import type { ComponentType } from '@/components/region';
import ProductCarousel from '@/components/product-carousel/carousel';
import ProductCarouselSkeleton from '@/components/product-carousel/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { normalizeSafeLinkUrl } from '../safe-link-url';

// Reuse the proven category-backed loader used by the native Storefront Next carousel.
// eslint-disable-next-line react-refresh/only-export-components
export { loader } from '@/components/product-carousel/loaders';

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('productCarousel', {
    name: 'Featured Product Carousel',
    description:
        'A polished, responsive product carousel populated from a category or with manually selected Product Tiles.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'products',
        name: 'Manual products',
        description: 'Optional Product Tiles. These are used when no category is selected.',
        maxComponents: 12,
        componentTypeInclusions: ['Content.productTile'],
    },
])
export class SFNextToolkitProductCarouselMetadata {
    @AttributeDefinition({
        name: 'Heading',
        description: 'Section heading shown above the products.',
        defaultValue: 'Featured products',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Supporting text',
        description: 'Optional short line shown below the heading.',
    })
    subtitle?: string;

    @AttributeDefinition({
        name: 'Category',
        description: 'Automatically populate the carousel with products from this category.',
        type: 'category',
    })
    categoryId?: string;

    @AttributeDefinition({
        name: 'Maximum products',
        description: 'Maximum number of category products loaded into the carousel.',
        type: 'integer',
        defaultValue: 12,
    })
    limit?: number;

    @AttributeDefinition({
        name: 'View-all label',
        description: 'Optional label displayed at the end of the heading row.',
        defaultValue: 'View all',
    })
    shopAllText?: string;

    @AttributeDefinition({
        name: 'View-all destination',
        description: 'Internal or external destination for the view-all link.',
        type: 'url',
    })
    shopAllUrl?: string;
}
/* v8 ignore stop */

export interface SFNextToolkitProductCarouselProps {
    title?: string;
    subtitle?: string;
    categoryId?: string;
    limit?: number;
    shopAllText?: string;
    shopAllUrl?: string;
    data?:
        | { hits?: ShopperSearch.schemas['ProductSearchHit'][] }
        | ShopperSearch.schemas['ProductSearchHit'][]
        | null;
    component?: ComponentType;
    className?: string;
}

/**
 * Namespaced Page Designer adapter around the storefront's production product carousel.
 * Keeping the product tile implementation shared preserves pricing, badges, analytics,
 * responsive imagery and accessibility behaviour from the host Storefront Next app.
 */
export default function SFNextToolkitProductCarousel({
    title = 'Featured products',
    subtitle,
    shopAllText = 'View all',
    shopAllUrl,
    data,
    component,
    className,
}: SFNextToolkitProductCarouselProps) {
    const products = Array.isArray(data) ? data : (data?.hits ?? []);

    return (
        <ProductCarousel
            products={products}
            title={title}
            subtitle={subtitle}
            shopAllText={shopAllText}
            shopAllUrl={normalizeSafeLinkUrl(shopAllUrl)}
            component={component}
            className={className}
        />
    );
}

export function SFNextToolkitProductCarouselFallback({ title = 'Featured products' }: { title?: string }) {
    return <ProductCarouselSkeleton title={title} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { SFNextToolkitProductCarouselFallback as fallback };
