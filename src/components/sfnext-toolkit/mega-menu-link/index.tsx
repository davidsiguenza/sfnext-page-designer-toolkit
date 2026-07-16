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
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { ArrowRight, Gift, Sparkles, Star, Tag, Truck } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { useTranslation } from 'react-i18next';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { routes, routeHref } from '@/route-paths';
import { cn } from '@/lib/utils';
import { normalizeContentAssetId } from '../content-collection/content-model';
import { useMegaMenuNavigate } from '../mega-menu/context';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const DESTINATION_TYPES = ['url', 'category', 'product', 'content'] as const;
const LINK_STYLES = ['plain', 'highlight', 'chip'] as const;
const LINK_ICONS = ['none', 'sparkles', 'gift', 'star', 'truck', 'tag'] as const;

type LinkIcon = (typeof LINK_ICONS)[number];

const ICONS: Record<Exclude<LinkIcon, 'none'>, ElementType> = {
    sparkles: Sparkles,
    gift: Gift,
    star: Star,
    truck: Truck,
    tag: Tag,
};

// eslint-disable-next-line react-refresh/only-export-components -- shared by stories and future menu variants.
export const megaMenuLinkVariants = cva(
    'group flex w-full items-start gap-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    {
        variants: {
            visualStyle: {
                plain: 'px-2 py-2 hover:bg-accent hover:text-accent-foreground',
                highlight: 'border border-border bg-card p-3 text-card-foreground shadow-sm hover:bg-accent',
                chip: 'border border-border bg-muted px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground',
            },
        },
        defaultVariants: { visualStyle: 'plain' },
    }
);

function normalizeOption<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
    return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeId(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === 'string' ? id.trim() || undefined : undefined;
    }
    return undefined;
}

// eslint-disable-next-line react-refresh/only-export-components -- pure resolver shared with tests and stories.
export function resolveMegaMenuLinkDestination({
    destinationType,
    url,
    category,
    product,
    contentId,
    contentPathTemplate,
}: Pick<MegaMenuLinkProps, 'destinationType' | 'url' | 'category' | 'product' | 'contentId' | 'contentPathTemplate'>):
    | string
    | undefined {
    const resolvedType = normalizeOption(destinationType, DESTINATION_TYPES, 'url');

    if (resolvedType === 'category') {
        const categoryId = normalizeId(category);
        return categoryId ? routeHref(routes.category, { categoryId }) : undefined;
    }
    if (resolvedType === 'product') {
        const productId = normalizeId(product);
        return productId ? routeHref(routes.product, { productId }) : undefined;
    }
    if (resolvedType === 'content') {
        const resolvedContentId = normalizeContentAssetId(contentId);
        const template = normalizeSafeLinkUrl(contentPathTemplate?.trim() || '/blog/{id}');
        if (!resolvedContentId || !template?.includes('{id}')) return undefined;
        return normalizeSafeLinkUrl(template.replaceAll('{id}', encodeURIComponent(resolvedContentId)));
    }
    return normalizeSafeLinkUrl(url);
}

/* v8 ignore start - decorators are covered by generated metadata validation. */
@Component('megaMenuLink', {
    name: 'Mega Menu Link',
    description:
        'Curated submenu link with optional description, icon and badge. It can target a URL, category, product or B2C Content Asset.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitMegaMenuLinkMetadata {
    @AttributeDefinition({
        id: 'label',
        name: 'Label',
        description: 'Visible link label.',
        type: 'string',
        required: true,
    })
    label?: string;

    @AttributeDefinition({
        id: 'description',
        name: 'Description',
        description: 'Optional supporting text displayed beneath the label.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'badge',
        name: 'Badge',
        description: 'Optional short badge such as New, Sale or Guide.',
        type: 'string',
    })
    badge?: string;

    @AttributeDefinition({
        id: 'destinationType',
        name: 'Destination type',
        description: 'Select which destination field drives the link.',
        type: 'enum',
        values: ['url', 'category', 'product', 'content'],
        defaultValue: 'url',
    })
    destinationType?: string;

    @AttributeDefinition({
        id: 'url',
        name: 'URL',
        description: 'Safe relative or HTTP(S) URL used when Destination type is URL.',
        type: 'url',
    })
    url?: string;

    @AttributeDefinition({
        id: 'category',
        name: 'Category',
        description: 'Catalog category used when Destination type is Category.',
        type: 'category',
    })
    category?: string;

    @AttributeDefinition({
        id: 'product',
        name: 'Product',
        description: 'Catalog product used when Destination type is Product.',
        type: 'product',
    })
    product?: string;

    @AttributeDefinition({
        id: 'contentId',
        name: 'B2C Content Asset ID',
        description: 'Exact online Content Asset ID used when Destination type is Content.',
        type: 'string',
    })
    contentId?: string;

    @AttributeDefinition({
        id: 'contentPathTemplate',
        name: 'Content path template',
        description: 'Relative route containing {id}. The default matches the toolkit blog route.',
        type: 'string',
        defaultValue: '/blog/{id}',
    })
    contentPathTemplate?: string;

    @AttributeDefinition({
        id: 'icon',
        name: 'Icon',
        description: 'Optional predefined icon; no arbitrary SVG or script is accepted.',
        type: 'enum',
        values: ['none', 'sparkles', 'gift', 'star', 'truck', 'tag'],
        defaultValue: 'none',
    })
    icon?: string;

    @AttributeDefinition({
        id: 'visualStyle',
        name: 'Visual style',
        description: 'Plain link, highlighted card or compact chip.',
        type: 'enum',
        values: ['plain', 'highlight', 'chip'],
        defaultValue: 'plain',
    })
    visualStyle?: string;

    @AttributeDefinition({
        id: 'ariaLabel',
        name: 'Accessible label override',
        description: 'Optional screen-reader label when the visible label needs extra context.',
        type: 'string',
    })
    ariaLabel?: string;
}
/* v8 ignore stop */

export interface MegaMenuLinkProps
    extends Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children'>,
        Omit<VariantProps<typeof megaMenuLinkVariants>, 'visualStyle'> {
    label?: string;
    description?: string;
    badge?: string;
    destinationType?: string;
    url?: string;
    category?: string | { id?: string };
    product?: string | { id?: string };
    contentId?: string;
    contentPathTemplate?: string;
    icon?: string;
    visualStyle?: string;
    ariaLabel?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
    regionId?: string;
}

export default function MegaMenuLink({
    label,
    description,
    badge,
    destinationType,
    url,
    category,
    product,
    contentId,
    contentPathTemplate,
    icon,
    visualStyle,
    ariaLabel,
    className,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    regionId: _regionId,
    ...props
}: MegaMenuLinkProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t } = useTranslation('extPageDesignerToolkit');
    const onNavigate = useMegaMenuNavigate();
    const resolvedLabel = label?.trim();
    const resolvedDescription = description?.trim();
    const resolvedBadge = badge?.trim();
    const resolvedIcon = normalizeOption(icon, LINK_ICONS, 'none');
    const resolvedVisualStyle = normalizeOption(visualStyle, LINK_STYLES, 'plain');
    const destination = resolveMegaMenuLinkDestination({
        destinationType,
        url,
        category,
        product,
        contentId,
        contentPathTemplate,
    });

    if (!resolvedLabel || !destination) {
        if (!isDesignMode) return null;
        return (
            <div
                data-slot="sfnext-toolkit-mega-menu-link-unconfigured"
                className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                {t('megaMenu.configureLink', 'Add a label and valid destination')}
            </div>
        );
    }

    const Icon = resolvedIcon === 'none' ? undefined : ICONS[resolvedIcon];

    return (
        <Link
            {...props}
            data-slot="sfnext-toolkit-mega-menu-link"
            data-destination-type={normalizeOption(destinationType, DESTINATION_TYPES, 'url')}
            to={destination}
            onClick={(event) => {
                props.onClick?.(event);
                if (!event.defaultPrevented) onNavigate?.();
            }}
            aria-label={ariaLabel?.trim() || undefined}
            className={cn(megaMenuLinkVariants({ visualStyle: resolvedVisualStyle }), className)}>
            {Icon && <Icon data-slot="mega-menu-link-icon" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            <span data-slot="mega-menu-link-content" className="min-w-0 flex-1">
                <span data-slot="mega-menu-link-label-row" className="flex flex-wrap items-center gap-2">
                    <span data-slot="mega-menu-link-label" className="text-sm font-semibold">
                        {resolvedLabel}
                    </span>
                    {resolvedBadge && (
                        <span
                            data-slot="mega-menu-link-badge"
                            className="rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold leading-4 text-primary-foreground">
                            {resolvedBadge}
                        </span>
                    )}
                </span>
                {resolvedDescription && (
                    <span
                        data-slot="mega-menu-link-description"
                        className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {resolvedDescription}
                    </span>
                )}
            </span>
            <ArrowRight
                data-slot="mega-menu-link-arrow"
                className="mt-0.5 size-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
            />
        </Link>
    );
}
