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
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { useIsWithinEmbeddedSubtree, usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import type { ComponentType } from '@/components/region';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import {
    countSiteThemeOverrides,
    getSiteThemePreviewStyle,
    normalizeSiteTheme,
    serializeSiteThemeCss,
    type SiteThemeValue,
} from './model';
import { HEADER_SITE_THEME_REGION_ID } from './header-site-theme-model';

/* v8 ignore start - decorator output is asserted through the metadata contract test. */
@Component('siteTheme', {
    name: 'Site Theme',
    description:
        'A visual, token-safe Storefront Next theme. Publish it through an embedded site-wide region to apply it.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitSiteThemeMetadata {
    @AttributeDefinition({
        id: 'enabled',
        name: 'Enabled',
        description: 'Disable the theme without losing the configured palette.',
        type: 'boolean',
        defaultValue: true,
    })
    enabled?: boolean;

    @AttributeDefinition({
        id: 'theme',
        name: 'Theme palette',
        description: 'Open the visual theme editor to configure semantic Storefront Next color tokens.',
        type: 'custom',
        required: false,
        editorDefinition: {
            type: 'SFNextToolkit.themeEditor',
            configuration: {
                schemaVersion: 1,
            },
        },
    })
    theme?: SiteThemeValue;
}
/* v8 ignore stop */

export interface SiteThemeProps extends Omit<ComponentPropsWithoutRef<'section'>, 'children'> {
    enabled?: boolean;
    theme?: SiteThemeValue | string | null;

    // Page Designer plumbing is consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

function SiteThemePreview({
    enabled,
    theme,
    mode,
    className,
    style,
    ...props
}: Omit<SiteThemeProps, 'component' | 'componentData' | 'designMetadata' | 'data' | 'regionId'> & {
    enabled: boolean;
    mode: 'EDIT' | 'PREVIEW';
}) {
    const normalizedTheme = normalizeSiteTheme(theme);
    const overrideCount = countSiteThemeOverrides(theme);
    const previewStyle = getSiteThemePreviewStyle(theme) as CSSProperties;

    return (
        <section
            {...props}
            aria-label="Site theme preview"
            data-slot="sfnext-toolkit-site-theme-preview"
            data-authoring-mode={mode}
            data-enabled={enabled ? 'true' : 'false'}
            data-theme-preset={normalizedTheme.preset}
            style={{ ...style, ...previewStyle }}
            className={cn(
                'mx-auto w-full max-w-5xl overflow-hidden rounded-ui border border-border bg-background text-foreground shadow-ui',
                !enabled && 'opacity-75',
                className
            )}>
            <div
                data-slot="site-theme-preview-header"
                className="flex flex-wrap items-center justify-between gap-3 bg-header-background px-5 py-4 text-header-foreground">
                <div data-slot="site-theme-preview-brand" className="space-y-0.5">
                    <p className="text-sm font-semibold tracking-wide">Storefront Next</p>
                    <p className="text-xs opacity-75">Theme Studio preview</p>
                </div>
                <div
                    data-slot="site-theme-preview-nav"
                    aria-label="Preview navigation"
                    className="flex items-center gap-4 text-xs font-medium">
                    <span>New</span>
                    <span>Collections</span>
                    <span>Stories</span>
                </div>
            </div>

            <div data-slot="site-theme-preview-body" className="grid gap-5 p-5 md:grid-cols-[1.3fr_0.7fr] md:p-7">
                <div data-slot="site-theme-preview-content" className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-ui bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                {normalizedTheme.preset}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {overrideCount} token {overrideCount === 1 ? 'override' : 'overrides'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">A consistent brand, everywhere</h2>
                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                            Semantic tokens update actions, surfaces, storefront chrome and feedback while components
                            keep their existing responsive behavior.
                        </p>
                    </div>

                    <div data-slot="site-theme-preview-actions" className="flex flex-wrap gap-2">
                        <span className="rounded-ui bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                            Primary action
                        </span>
                        <span className="rounded-ui bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                            Secondary
                        </span>
                        <span className="rounded-ui bg-tertiary px-4 py-2 text-sm font-semibold text-tertiary-foreground">
                            Tertiary
                        </span>
                    </div>

                    <div data-slot="site-theme-preview-statuses" className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-ui bg-success px-2.5 py-1.5 text-success-foreground">Success</span>
                        <span className="rounded-ui bg-warning px-2.5 py-1.5 text-warning-foreground">Warning</span>
                        <span className="rounded-ui bg-info px-2.5 py-1.5 text-info-foreground">Information</span>
                        <span className="rounded-ui bg-destructive px-2.5 py-1.5 text-destructive-foreground">
                            Destructive
                        </span>
                    </div>
                </div>

                <div
                    data-slot="site-theme-preview-card"
                    className="space-y-4 rounded-ui border border-border-subtle bg-card p-4 text-card-foreground shadow-ui">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Product card</p>
                        <p className="text-xs text-muted-foreground">Surfaces and content remain paired.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2" aria-label="Theme color samples">
                        <span className="aspect-square rounded-ui bg-primary" title="Primary" />
                        <span className="aspect-square rounded-ui bg-secondary" title="Secondary" />
                        <span className="aspect-square rounded-ui bg-accent" title="Accent" />
                        <span className="aspect-square rounded-ui bg-muted" title="Muted" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-ui bg-muted" aria-hidden="true">
                        <div className="h-full w-3/4 bg-primary" />
                    </div>
                </div>
            </div>

            {!enabled && (
                <p
                    role="status"
                    data-slot="site-theme-preview-disabled"
                    className="border-t border-border bg-muted px-5 py-3 text-sm text-muted-foreground">
                    The theme is disabled. Its saved palette is shown here for authoring only.
                </p>
            )}

            <div
                data-slot="site-theme-preview-footer"
                className="flex flex-wrap items-center justify-between gap-2 bg-footer-background px-5 py-3 text-xs text-footer-foreground">
                <span>Site-wide token preview</span>
                <span>{normalizedTheme.autoContrast ? 'Auto contrast on' : 'Manual contrast'}</span>
            </div>
        </section>
    );
}

export default function SiteTheme({
    enabled = true,
    theme,
    component,
    className,
    regionId,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: SiteThemeProps) {
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const isEmbedded = useIsWithinEmbeddedSubtree();

    if (isDesignMode || isPreviewMode) {
        return (
            <SiteThemePreview
                {...props}
                enabled={enabled}
                theme={theme}
                mode={isDesignMode ? 'EDIT' : 'PREVIEW'}
                className={className}
            />
        );
    }

    if (!enabled || !isEmbedded || regionId !== HEADER_SITE_THEME_REGION_ID || component?.visible === false)
        return null;

    const css = serializeSiteThemeCss(theme);
    if (!css) return null;

    return (
        <style
            data-slot="sfnext-toolkit-site-theme"
            data-theme-version="1"
            data-theme-preset={normalizeSiteTheme(theme).preset}>
            {css}
        </style>
    );
}

/** No visual fallback: a delayed global theme must not introduce layout. */
export function SiteThemeFallback() {
    return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export { SiteThemeFallback as fallback };
