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
import {
    CreditCard,
    Gift,
    Headphones,
    PackageCheck,
    RotateCcw,
    ShieldCheck,
    Store,
    Truck,
    type LucideIcon,
} from 'lucide-react';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

/**
 * Fixed allow-list: merchants select a symbolic value, never an icon module,
 * arbitrary HTML or a remote script.
 */
const TRUST_ICONS = {
    delivery: Truck,
    returns: RotateCcw,
    security: ShieldCheck,
    payment: CreditCard,
    support: Headphones,
    store: Store,
    package: PackageCheck,
    gift: Gift,
} satisfies Record<string, LucideIcon>;

export type TrustIconName = keyof typeof TRUST_ICONS;

const trustItemDefaults = {
    icon: 'delivery' as TrustIconName,
} as const;

function normalizeTrustIcon(value: string | undefined): TrustIconName {
    return value && Object.prototype.hasOwnProperty.call(TRUST_ICONS, value)
        ? (value as TrustIconName)
        : trustItemDefaults.icon;
}

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('trustItem', {
    name: 'Trust Item',
    description: 'A concise service or reassurance message with a safe, predefined icon. Use it inside a Trust Bar.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class TrustItemMetadata {
    @AttributeDefinition({
        name: 'Icon',
        description: 'Predefined storefront icon. Arbitrary SVG, HTML and scripts are intentionally not accepted.',
        type: 'enum',
        values: ['delivery', 'returns', 'security', 'payment', 'support', 'store', 'package', 'gift'],
        defaultValue: trustItemDefaults.icon,
    })
    icon?: string;

    @AttributeDefinition({
        name: 'Title',
        description: 'Short benefit or reassurance statement.',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Description',
        description: 'Optional detail such as a delivery threshold or return period.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'linkLabel',
        name: 'Link label',
        description: 'Optional descriptive link label. The link is hidden until a safe destination is also provided.',
    })
    linkLabel?: string;

    @AttributeDefinition({
        id: 'linkUrl',
        name: 'Link destination',
        description: 'Optional internal or external destination. Unsafe script and data protocols are rejected.',
        type: 'url',
    })
    linkUrl?: string;
}
/* v8 ignore stop */

export interface TrustItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
    icon?: string;
    title?: string;
    description?: string;
    linkLabel?: string;
    linkUrl?: string;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function TrustItem({
    icon,
    title,
    description,
    linkLabel,
    linkUrl,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: TrustItemProps) {
    const iconName = normalizeTrustIcon(icon);
    const Icon = TRUST_ICONS[iconName];
    const safeLinkUrl = normalizeSafeLinkUrl(linkUrl);
    const resolvedLinkLabel = linkLabel?.trim();
    const link = safeLinkUrl && resolvedLinkLabel ? { url: safeLinkUrl, label: resolvedLinkLabel } : null;

    return (
        <div
            data-slot="sfnext-toolkit-trust-item"
            data-icon={iconName}
            className={cn('flex h-full items-start gap-3 text-foreground', className)}
            {...props}>
            <span
                data-slot="trust-item-icon"
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" strokeWidth={1.75} />
            </span>
            {(title || description || link) && (
                <div data-slot="trust-item-content" className="min-w-0 space-y-1">
                    {title && <p className="text-sm font-semibold leading-5 text-foreground">{title}</p>}
                    {description && <p className="text-sm leading-5 text-muted-foreground">{description}</p>}
                    {link && (
                        <Link
                            data-slot="trust-item-link"
                            to={link.url}
                            className="inline-flex rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2">
                            {link.label}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function TrustItemFallback() {
    return (
        <div data-slot="sfnext-toolkit-trust-item-fallback" aria-hidden="true" className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div data-slot="trust-item-fallback-content" className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { TrustItemFallback as fallback };
