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
import CategoryBanner, {
    type CategoryBannerAlignment,
    type CategoryBannerHeight,
    type CategoryBannerOverlay,
} from '@/components/category-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import type { Image } from '@/types';

/* v8 ignore start - decorator behavior is covered by metadata assertions */
@Component('categoryHero', {
    name: 'Category Hero',
    description:
        'Context-aware PLP hero that uses the current category by default and supports safe editorial overrides.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitCategoryHeroMetadata {
    @AttributeDefinition({
        id: 'image',
        name: 'Image override',
        description: 'Optional image. When empty, the current category banner image is used.',
        type: 'image',
    })
    image?: Image;

    @AttributeDefinition({
        id: 'eyebrow',
        name: 'Eyebrow override',
        description: 'Optional short label. When empty, the parent category name is used.',
        type: 'string',
    })
    eyebrow?: string;

    @AttributeDefinition({
        id: 'title',
        name: 'Title override',
        description: 'Optional title. When empty, the current category name is used.',
        type: 'string',
    })
    title?: string;

    @AttributeDefinition({
        id: 'description',
        name: 'Description override',
        description: 'Optional supporting copy. When empty, the current category description is used.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'productCountOverride',
        name: 'Product count override',
        description: 'Optional non-negative count. When empty, the live PLP result count is used.',
        type: 'integer',
    })
    productCountOverride?: number;

    @AttributeDefinition({
        id: 'semanticTitle',
        name: 'Expose title as H2',
        description:
            'Keep disabled on the standard PLP, whose product-list heading is the page H1. Enable only when this title belongs in the semantic heading hierarchy.',
        type: 'boolean',
        defaultValue: false,
    })
    semanticTitle?: boolean;

    @AttributeDefinition({
        id: 'showEyebrow',
        name: 'Show eyebrow',
        type: 'boolean',
        defaultValue: true,
    })
    showEyebrow?: boolean;

    @AttributeDefinition({
        id: 'showDescription',
        name: 'Show description',
        type: 'boolean',
        defaultValue: true,
    })
    showDescription?: boolean;

    @AttributeDefinition({
        id: 'showProductCount',
        name: 'Show product count',
        type: 'boolean',
        defaultValue: true,
    })
    showProductCount?: boolean;

    @AttributeDefinition({
        id: 'height',
        name: 'Height',
        description: 'Responsive height preset.',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'md',
    })
    height?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Content alignment',
        type: 'enum',
        values: ['left', 'center', 'right'],
        defaultValue: 'left',
    })
    alignment?: string;

    @AttributeDefinition({
        id: 'overlay',
        name: 'Image overlay',
        description: 'Uses theme-aware overlay presets to preserve text readability.',
        type: 'enum',
        values: ['none', 'subtle', 'medium', 'strong'],
        defaultValue: 'strong',
    })
    overlay?: string;
}
/* v8 ignore stop */

export interface SFNextToolkitCategoryHeroProps {
    image?: Image;
    eyebrow?: string;
    title?: string;
    description?: string;
    productCountOverride?: number;
    semanticTitle?: boolean;
    showEyebrow?: boolean;
    showDescription?: boolean;
    showProductCount?: boolean;
    height?: CategoryBannerHeight;
    alignment?: CategoryBannerAlignment;
    overlay?: CategoryBannerOverlay;
    className?: string;
    designMetadata?: unknown;
    component?: unknown;
    data?: unknown;
    regionId?: string;
}

/**
 * Contextual Page Designer category hero. The underlying CategoryBanner owns
 * category resolution, pending-count behavior, image fallback, and safe styles.
 */
export default function SFNextToolkitCategoryHero({
    image,
    eyebrow,
    title,
    description,
    productCountOverride,
    semanticTitle = false,
    showEyebrow = true,
    showDescription = true,
    showProductCount = true,
    height = 'md',
    alignment = 'left',
    overlay = 'strong',
    className,
    designMetadata: _designMetadata,
    component: _component,
    data: _data,
    regionId: _regionId,
}: SFNextToolkitCategoryHeroProps) {
    return (
        <CategoryBanner
            image={image}
            eyebrow={eyebrow}
            title={title}
            description={description}
            productCount={productCountOverride}
            showEyebrow={showEyebrow}
            showDescription={showDescription}
            showProductCount={showProductCount}
            height={height}
            alignment={alignment}
            overlay={overlay}
            decorativeText={!semanticTitle}
            className={className}
        />
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function CategoryHeroFallback() {
    return (
        <section
            data-slot="sfnext-category-hero-fallback"
            aria-hidden="true"
            className="relative h-[350px] w-full overflow-hidden bg-muted md:h-[450px] lg:h-[500px]">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            <div className="section-container relative flex h-full items-end pb-10">
                <div className="w-full max-w-2xl space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-3/5" />
                    <Skeleton className="h-5 w-4/5" />
                </div>
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { CategoryHeroFallback as fallback };
