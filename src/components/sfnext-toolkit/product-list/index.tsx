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
import BaseProductList from '@/components/product-list';
import type { ProductListComponentAttributes } from '@/components/product-list/config';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';

/**
 * Portable Page Designer metadata for the configurable PLP product grid.
 *
 * The rendering and SCAPI configuration stay in the Storefront Next base
 * implementation; this thin adapter gives the reusable cartridge an isolated,
 * collision-resistant component type ID.
 */
@Component('productList', {
    name: 'Configurable Product List',
    description: 'Controls the catalog image type and product information displayed by the PLP grid.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitProductListMetadata {
    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Catalog image type',
        description: 'Catalog view type used as the primary image for each product.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({
        id: 'showBadges',
        name: 'Show badges',
        description: 'Shows product badges such as new or sale.',
        type: 'boolean',
        defaultValue: true,
    })
    showBadges?: boolean;

    @AttributeDefinition({
        id: 'showWishlist',
        name: 'Show wishlist action',
        description: 'Shows the action used to add a product to the wishlist.',
        type: 'boolean',
        defaultValue: true,
    })
    showWishlist?: boolean;

    @AttributeDefinition({
        id: 'showQuickAdd',
        name: 'Show quick add',
        description: 'Shows the quick-add action when the shopper interacts with a product.',
        type: 'boolean',
        defaultValue: true,
    })
    showQuickAdd?: boolean;

    @AttributeDefinition({
        id: 'showSwatches',
        name: 'Show color swatches',
        description: 'Shows color variations using swatch images when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showSwatches?: boolean;

    @AttributeDefinition({
        id: 'showBrand',
        name: 'Show brand',
        description: 'Shows the configured product or storefront brand.',
        type: 'boolean',
        defaultValue: true,
    })
    showBrand?: boolean;

    @AttributeDefinition({
        id: 'showCategory',
        name: 'Show category',
        description: 'Shows the primary category above the product name.',
        type: 'boolean',
        defaultValue: true,
    })
    showCategory?: boolean;

    @AttributeDefinition({
        id: 'showProductName',
        name: 'Show product name',
        description: 'Shows the product name and link.',
        type: 'boolean',
        defaultValue: true,
    })
    showProductName?: boolean;

    @AttributeDefinition({
        id: 'showSku',
        name: 'Show SKU',
        description: 'Shows the product identifier.',
        type: 'boolean',
        defaultValue: true,
    })
    showSku?: boolean;

    @AttributeDefinition({
        id: 'showRating',
        name: 'Show rating',
        description: 'Shows the product rating and review count.',
        type: 'boolean',
        defaultValue: true,
    })
    showRating?: boolean;

    @AttributeDefinition({
        id: 'showPrice',
        name: 'Show price',
        description: 'Shows the current price and, when available, the previous price.',
        type: 'boolean',
        defaultValue: true,
    })
    showPrice?: boolean;

    @AttributeDefinition({
        id: 'showPromotions',
        name: 'Show promotions',
        description: 'Shows promotional messages associated with the product price.',
        type: 'boolean',
        defaultValue: true,
    })
    showPromotions?: boolean;

    @AttributeDefinition({
        id: 'maxSwatches',
        name: 'Maximum swatches',
        description: 'Maximum number of visible color swatches per product (between 1 and 12).',
        type: 'integer',
        defaultValue: 3,
    })
    maxSwatches?: number;

    @AttributeDefinition({
        id: 'additionalAttributes',
        name: 'Additional attributes',
        description:
            'Up to 5 custom attributes separated by lines or commas. Use material|Material or season=Season. The c_ prefix is optional.',
        type: 'text',
        defaultValue: '',
    })
    additionalAttributes?: string;
}

export default function SFNextToolkitProductList(attributes: ProductListComponentAttributes) {
    return <BaseProductList {...attributes} />;
}
