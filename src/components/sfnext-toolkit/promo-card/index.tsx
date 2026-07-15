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
import type { ComponentPropsWithoutRef } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import ContentCard from '@/components/content-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ComponentType } from '@/components/region';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const promoCardDefaults = {
    showBackground: true,
    showBorder: true,
} as const;

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('promoCard', {
    name: 'Promo Card',
    description:
        'Reusable promotional card with an optional image, supporting copy and call to action. Use it inside a Promo Grid.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class PromoCardMetadata {
    @AttributeDefinition({
        name: 'Title',
        description: 'Short promotional heading.',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Description',
        description: 'Supporting copy displayed with the promotional heading.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'imageUrl',
        name: 'Image',
        description: 'Promotional image selected from the content library.',
        type: 'image',
    })
    imageUrl?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Describe informative images. When empty, the card title is used as the alternative text.',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description: 'Enable when the image adds no information beyond the card title and copy.',
        type: 'boolean',
        defaultValue: false,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({
        id: 'buttonText',
        name: 'CTA label',
        description: 'Link label. The CTA is hidden until both a label and destination are provided.',
    })
    buttonText?: string;

    @AttributeDefinition({
        id: 'buttonLink',
        name: 'CTA destination',
        description: 'Internal or external destination for the call to action.',
        type: 'url',
    })
    buttonLink?: string;

    @AttributeDefinition({
        id: 'showBackground',
        name: 'Show background',
        description: 'Applies the storefront card surface behind the content.',
        type: 'boolean',
        defaultValue: promoCardDefaults.showBackground,
    })
    showBackground?: boolean;

    @AttributeDefinition({
        id: 'showBorder',
        name: 'Show border',
        description: 'Displays the semantic storefront border around the card.',
        type: 'boolean',
        defaultValue: promoCardDefaults.showBorder,
    })
    showBorder?: boolean;
}
/* v8 ignore stop */

export interface PromoCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    title?: string;
    description?: string;
    imageUrl?: Image | string;
    imageAlt?: string;
    decorativeImage?: boolean;
    buttonText?: string;
    buttonLink?: string;
    showBackground?: boolean;
    showBorder?: boolean;
    loading?: 'lazy' | 'eager';

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

/**
 * Thin Page Designer adapter around the storefront's existing ContentCard.
 * Keeping the visual implementation in one place makes the portable component
 * inherit future accessibility and design-system improvements automatically.
 */
export default function PromoCard({
    className,
    title,
    description,
    imageUrl,
    imageAlt,
    decorativeImage = false,
    buttonText,
    buttonLink,
    showBackground = promoCardDefaults.showBackground,
    showBorder = promoCardDefaults.showBorder,
    loading = 'lazy',
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: PromoCardProps) {
    const safeButtonLink = normalizeSafeLinkUrl(buttonLink);

    return (
        <ContentCard
            data-slot="sfnext-toolkit-promo-card"
            className={cn('h-full', className)}
            title={title}
            description={description}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            decorativeImage={decorativeImage}
            buttonText={buttonText}
            buttonLink={safeButtonLink}
            showBackground={showBackground}
            showBorder={showBorder}
            loading={loading}
            {...props}
        />
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function PromoCardFallback() {
    return (
        <div
            data-slot="sfnext-toolkit-promo-card-fallback"
            aria-hidden="true"
            className="h-full overflow-hidden rounded-ui border-ui border-border bg-card text-card-foreground">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div data-slot="promo-card-fallback-body" className="space-y-3 p-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { PromoCardFallback as fallback };
