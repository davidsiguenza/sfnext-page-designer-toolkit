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
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { useTranslation } from 'react-i18next';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

export const MEGA_MENU_PANELS_REGION_ID = 'panels';

/* v8 ignore start - decorators are covered by generated metadata validation. */
@Component('megaMenu', {
    name: 'Mega Menu Enhancements',
    description:
        'Global Page Designer enhancement for the standard catalog navigation. Add one targeted panel per root category.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        // Keep this literal in sync with MEGA_MENU_PANELS_REGION_ID.
        id: 'panels',
        name: 'Submenu panels',
        description:
            'Add up to 12 Mega Menu Panels. Each panel targets one root navigation category and augments its standard submenu.',
        maxComponents: 12,
        componentTypeInclusions: ['SFNextToolkit.megaMenuPanel'],
    },
])
export class SFNextToolkitMegaMenuMetadata {
    @AttributeDefinition({
        id: 'enabled',
        name: 'Enabled',
        description: 'Disable the Page Designer enhancements while preserving all authored panels.',
        type: 'boolean',
        defaultValue: true,
    })
    enabled?: boolean;

    @AttributeDefinition({
        id: 'mobileEditorial',
        name: 'Show editorial content on mobile',
        description: 'Includes panel links and the graphical feature inside expanded mobile categories.',
        type: 'boolean',
        defaultValue: true,
    })
    mobileEditorial?: boolean;

    @AttributeDefinition({
        id: 'defaultStandardBannerMode',
        name: 'Default catalog banner behavior',
        description:
            'Fallback shows the existing category banner only when a Page Designer feature is absent. Panels can override this value.',
        type: 'enum',
        values: ['fallback', 'replace', 'alongside'],
        defaultValue: 'fallback',
    })
    defaultStandardBannerMode?: string;
}
/* v8 ignore stop */

export interface MegaMenuProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    enabled?: boolean;
    mobileEditorial?: boolean;
    defaultStandardBannerMode?: string;
    children?: ReactNode;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
    regionId?: string;
}

/**
 * Authoring/preview renderer for the Header-assigned content block. The storefront header
 * renders its `panels` region contextually, so this component does not replace the
 * standard navigation and remains safe when the toolkit is removed.
 */
export default function MegaMenu({
    enabled = true,
    children,
    component,
    className,
    mobileEditorial: _mobileEditorial,
    defaultStandardBannerMode: _defaultStandardBannerMode,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    regionId: _regionId,
    ...props
}: MegaMenuProps) {
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const { t } = useTranslation('extPageDesignerToolkit');

    // This root renderer exists only as the temporary authoring canvas used to
    // create the Header content block. The live Header consumes the same
    // component tree contextually through editorial-slot.tsx, so fail closed if
    // a merchant accidentally publishes the temporary staging page.
    if (!isDesignMode && (!isPreviewMode || !enabled)) return null;

    return (
        <div
            data-slot="sfnext-toolkit-mega-menu"
            data-enabled={enabled ? 'true' : 'false'}
            className={cn('w-full space-y-6 bg-background text-foreground', className)}
            {...props}>
            {!enabled && isDesignMode && (
                <div
                    role="status"
                    data-authoring-disabled="true"
                    className="rounded-ui border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
                    {t(
                        'megaMenu.disabledAuthoring',
                        'Mega Menu enhancements are disabled. Authored panels remain available below.'
                    )}
                </div>
            )}
            {component ? (
                <Region component={component} regionId={MEGA_MENU_PANELS_REGION_ID} errorElement={children ?? null} />
            ) : (
                children
            )}
        </div>
    );
}

export function MegaMenuFallback() {
    return (
        <div data-slot="sfnext-toolkit-mega-menu-fallback" aria-hidden="true" className="space-y-4">
            <Skeleton className="h-7 w-2/5" />
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { MegaMenuFallback as fallback };
