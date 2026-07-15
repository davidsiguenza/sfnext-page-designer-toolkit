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
import { type ComponentPropsWithoutRef, type ReactNode, useId } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

const COLUMN_CLASSES = {
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
} as const;

const DENSITY_CLASSES = {
    compact: 'gap-4 p-4 md:gap-5 md:p-5',
    comfortable: 'gap-6 p-6 md:gap-8 md:p-8',
} as const;

const SURFACE_CLASSES = {
    transparent: 'bg-transparent text-foreground',
    muted: 'bg-muted text-foreground',
    card: 'bg-card text-card-foreground border-ui border-border shadow-ui',
} as const;

type TrustBarColumns = keyof typeof COLUMN_CLASSES;
type TrustBarDensity = keyof typeof DENSITY_CLASSES;
type TrustBarSurface = keyof typeof SURFACE_CLASSES;

const trustBarDefaults = {
    columns: '4' as TrustBarColumns,
    density: 'comfortable' as TrustBarDensity,
    surface: 'muted' as TrustBarSurface,
} as const;

function normalizeOption<T extends string>(value: string | undefined, options: Record<T, string>, fallback: T): T {
    return value && Object.prototype.hasOwnProperty.call(options, value) ? (value as T) : fallback;
}

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('trustBar', {
    name: 'Trust Bar',
    description:
        'Responsive reassurance strip for delivery, returns, secure payment and service benefits. Accepts up to five Trust Items.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'items',
        name: 'Trust items',
        description: 'Add up to five concise service benefits. Only SFNext Toolkit Trust Items are accepted.',
        maxComponents: 5,
        componentTypeInclusions: ['SFNextToolkit.trustItem'],
    },
])
export class TrustBarMetadata {
    @AttributeDefinition({
        name: 'Accessible title',
        description:
            'Optional heading displayed above the benefits. If omitted, add an ARIA label when rendering the component outside Page Designer.',
    })
    title?: string;

    @AttributeDefinition({
        name: 'Desktop columns',
        description: 'Benefits stack on mobile, use two columns on tablet and this number on desktop.',
        type: 'enum',
        values: ['2', '3', '4', '5'],
        defaultValue: trustBarDefaults.columns,
    })
    columns?: string;

    @AttributeDefinition({
        name: 'Density',
        description: 'Controls semantic spacing around and between benefits.',
        type: 'enum',
        values: ['compact', 'comfortable'],
        defaultValue: trustBarDefaults.density,
    })
    density?: string;

    @AttributeDefinition({
        name: 'Surface',
        description: 'Semantic storefront surface applied to the complete trust bar.',
        type: 'enum',
        values: ['transparent', 'muted', 'card'],
        defaultValue: trustBarDefaults.surface,
    })
    surface?: string;
}
/* v8 ignore stop */

export interface TrustBarProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
    title?: string;
    columns?: string;
    density?: string;
    surface?: string;
    children?: ReactNode;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function TrustBar({
    title,
    columns,
    density,
    surface,
    children,
    className,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: TrustBarProps) {
    const headingId = useId();
    const resolvedColumns = normalizeOption(columns, COLUMN_CLASSES, trustBarDefaults.columns);
    const resolvedDensity = normalizeOption(density, DENSITY_CLASSES, trustBarDefaults.density);
    const resolvedSurface = normalizeOption(surface, SURFACE_CLASSES, trustBarDefaults.surface);
    const itemsClassName = cn('grid items-start', COLUMN_CLASSES[resolvedColumns], DENSITY_CLASSES[resolvedDensity]);

    const items = component ? (
        <Region
            component={component}
            regionId="items"
            data-slot="trust-bar-items"
            className={itemsClassName}
            errorElement={children ?? null}
        />
    ) : (
        <div data-slot="trust-bar-items" className={itemsClassName}>
            {children}
        </div>
    );

    return (
        <section
            data-slot="sfnext-toolkit-trust-bar"
            aria-labelledby={title ? headingId : undefined}
            className={cn('w-full overflow-hidden rounded-ui', SURFACE_CLASSES[resolvedSurface], className)}
            {...props}>
            {title && (
                <h2
                    id={headingId}
                    data-slot="trust-bar-title"
                    className="px-6 pt-6 text-xl font-semibold tracking-tight text-foreground md:px-8 md:pt-8">
                    {title}
                </h2>
            )}
            {items}
        </section>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function TrustBarFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-trust-bar-fallback"
            aria-hidden="true"
            className="w-full rounded-ui bg-muted p-6 md:p-8">
            <div data-slot="trust-bar-fallback-items" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Skeleton className="size-10 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2 pt-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { TrustBarFallback as fallback };
