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
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import type { ComponentType } from '@/components/region';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizePdpLayoutConfig, type PdpLayoutComponentAttributes } from './config';

/* v8 ignore start - decorator output is asserted through the metadata contract test. */
@Component('pdpLayout', {
    name: 'PDP Layout Configuration',
    description:
        'Controls the product media/content columns, gallery presentation, sticky information, and product navigation.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitPdpLayoutMetadata {
    @AttributeDefinition({
        id: 'desktopColumnRatio',
        name: 'Desktop column ratio',
        description: 'Width allocated to product media and product information on desktop.',
        type: 'enum',
        values: ['50-50', '60-40', '65-35', '70-30'],
        defaultValue: '50-50',
    })
    desktopColumnRatio?: string;

    @AttributeDefinition({
        id: 'mediaSide',
        name: 'Media side',
        description: 'Places product media on the left or right on desktop. Mobile always shows media first.',
        type: 'enum',
        values: ['left', 'right'],
        defaultValue: 'left',
    })
    mediaSide?: string;

    @AttributeDefinition({
        id: 'galleryPresentation',
        name: 'Gallery presentation',
        description: 'Shows grid thumbnails, a horizontal thumbnail strip, or carousel controls only.',
        type: 'enum',
        values: ['grid', 'strip', 'carousel'],
        defaultValue: 'grid',
    })
    galleryPresentation?: string;

    @AttributeDefinition({
        id: 'stickyProductInfo',
        name: 'Sticky product information',
        description: 'Keeps the purchase column visible while the shopper scrolls product media on desktop.',
        type: 'boolean',
        defaultValue: false,
    })
    stickyProductInfo?: boolean;

    @AttributeDefinition({
        id: 'enableProductNavigation',
        name: 'Enable previous/next products',
        description:
            'Shows links to adjacent products when the current item is available in the bounded primary-category navigation window.',
        type: 'boolean',
        defaultValue: false,
    })
    enableProductNavigation?: boolean;
}
/* v8 ignore stop */

export interface PdpLayoutProps
    extends Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
        PdpLayoutComponentAttributes {
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function PdpLayout({
    desktopColumnRatio,
    mediaSide,
    galleryPresentation,
    stickyProductInfo,
    enableProductNavigation,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: PdpLayoutProps) {
    const { isDesignMode } = usePageDesignerMode();
    if (!isDesignMode) return null;

    const config = normalizePdpLayoutConfig({
        desktopColumnRatio,
        mediaSide,
        galleryPresentation,
        stickyProductInfo,
        enableProductNavigation,
    });

    return (
        <section
            {...props}
            aria-label="PDP layout configuration"
            data-slot="sfnext-toolkit-pdp-layout"
            className={cn('rounded-ui border border-border bg-card p-5 text-card-foreground shadow-ui', className)}>
            <div data-slot="pdp-layout-heading" className="space-y-1">
                <h2 className="text-base font-semibold">PDP layout configuration</h2>
                <p className="text-sm text-muted-foreground">
                    This authoring card controls the standard product view and is hidden on the storefront.
                </p>
            </div>
            <dl data-slot="pdp-layout-summary" className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div>
                    <dt className="text-muted-foreground">Columns</dt>
                    <dd className="font-medium">{config.desktopColumnRatio}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Media</dt>
                    <dd className="font-medium">{config.mediaSide}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Gallery</dt>
                    <dd className="font-medium">{config.galleryPresentation}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Product information</dt>
                    <dd className="font-medium">{config.stickyProductInfo ? 'Sticky' : 'Normal'}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Product navigation</dt>
                    <dd className="font-medium">{config.enableProductNavigation ? 'Enabled' : 'Disabled'}</dd>
                </div>
            </dl>
        </section>
    );
}

export function PdpLayoutFallback() {
    return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export { PdpLayoutFallback as fallback };
