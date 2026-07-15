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
import type { ShopperSearch } from '@/scapi';
import type { ProductImageViewType } from '@/components/product-list/config';

type ProductSearchHit = ShopperSearch.schemas['ProductSearchHit'];
type Image = ShopperSearch.schemas['Image'];
type ImageGroup = ShopperSearch.schemas['ImageGroup'];

export type ProductImageSelectionStrategy =
    | 'selected-color-group'
    | 'unvaried-group'
    | 'product-image-fallback'
    | 'none';

export interface ProductImageSelection {
    images: Image[];
    group?: ImageGroup;
    strategy: ProductImageSelectionStrategy;
}

const hasImages = (group: ImageGroup): boolean => group.images.length > 0;

const matchesColor = (group: ImageGroup, selectedColorValue: string): boolean =>
    group.variationAttributes?.some(
        (attribute) => attribute.id === 'color' && attribute.values?.some(({ value }) => value === selectedColorValue)
    ) ?? false;

/**
 * Selects images without crossing catalog view types. `product.image` is used only for legacy
 * responses that contain no image groups at all; otherwise a missing requested type stays visible
 * as a missing type instead of silently looking like the default (normally medium) image.
 */
export function selectProductImages(
    product: ProductSearchHit,
    imageViewType: ProductImageViewType,
    selectedColorValue: string | null
): ProductImageSelection {
    const imageGroups = product.imageGroups ?? [];
    const requestedGroups = imageGroups.filter((group) => group.viewType === String(imageViewType) && hasImages(group));

    if (selectedColorValue) {
        const selectedColorGroup = requestedGroups.find((group) => matchesColor(group, selectedColorValue));
        if (selectedColorGroup) {
            return {
                images: selectedColorGroup.images,
                group: selectedColorGroup,
                strategy: 'selected-color-group',
            };
        }
    }

    const unvariedGroup = requestedGroups.find((group) => !group.variationAttributes?.length);
    if (unvariedGroup) {
        return {
            images: unvariedGroup.images,
            group: unvariedGroup,
            strategy: 'unvaried-group',
        };
    }

    if (imageGroups.length === 0 && product.image) {
        return {
            images: [product.image],
            strategy: 'product-image-fallback',
        };
    }

    return { images: [], strategy: 'none' };
}
