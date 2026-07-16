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

import { EmbeddedSubtreeProvider, usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import SiteTheme, { type SiteThemeProps } from './index';
import { extractSiteThemeFromHeader, HEADER_SITE_THEME_REGION_ID } from './header-site-theme-model';

/**
 * Renders the global theme through a static import so its CSS is part of the
 * first SSR shell rather than a later registry/Suspense chunk. Branding Studio
 * and focused Page Designer authoring continue to use the normal registry.
 */
export function HeaderSiteTheme({ header }: { header: ComponentWithComponentData | null | undefined }) {
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();
    const component = extractSiteThemeFromHeader(header);
    // The staged/focused Site Theme rendered by the registry owns authoring
    // preview. Suppress the already-published global projection in EDIT and
    // PREVIEW so every Page Designer canvas does not get a duplicate card.
    if (isDesignMode || isPreviewMode || !component) return null;

    const data = component.data && typeof component.data === 'object' ? component.data : {};
    const enabled = typeof data.enabled === 'boolean' ? data.enabled : undefined;
    const theme = data.theme as SiteThemeProps['theme'];

    return (
        <EmbeddedSubtreeProvider embedded={header?.embedded === true}>
            <SiteTheme enabled={enabled} theme={theme} component={component} regionId={HEADER_SITE_THEME_REGION_ID} />
        </EmbeddedSubtreeProvider>
    );
}
