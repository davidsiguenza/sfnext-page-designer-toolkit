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

import type { ComponentType } from '@/components/region';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';

export const HEADER_SITE_THEME_REGION_ID = 'siteTheme';
export const SITE_THEME_TYPE_ID = 'SFNextToolkit.siteTheme';

/** Returns only a valid Site Theme child from the fixed Header owner. */
export function extractSiteThemeFromHeader(
    header: ComponentWithComponentData | null | undefined
): ComponentType | null {
    const component = header?.regions
        ?.find((region) => region.id === HEADER_SITE_THEME_REGION_ID)
        ?.components?.find((child) => child.typeId === SITE_THEME_TYPE_ID && Boolean(child.id));

    return component ? (component as ComponentType) : null;
}

/** Keeps the root loader payload limited to the theme child, not the full Header/menu tree. */
export function projectSiteThemeHeaderOwner(
    header: ComponentWithComponentData | null | undefined
): ComponentWithComponentData | null {
    const component = extractSiteThemeFromHeader(header);
    if (!header || !component) return null;

    return {
        id: header.id,
        typeId: header.typeId,
        embedded: header.embedded,
        regions: [{ id: HEADER_SITE_THEME_REGION_ID, components: [component] }],
    } as ComponentWithComponentData;
}
