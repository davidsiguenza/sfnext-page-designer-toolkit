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

import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';

export const HEADER_COMPONENT_ID = 'header';
export const HEADER_MEGA_MENU_REGION_ID = 'megaMenuEnhancements';
export const MEGA_MENU_TYPE_ID = 'SFNextToolkit.megaMenu';

/**
 * Projects the toolkit content block out of the standard embedded Header owner.
 * Loader promises live on the fetched owner, so they are deliberately forwarded
 * to the child consumed by the catalog navigation.
 */
export function extractMegaMenuFromHeader(
    header: ComponentWithComponentData | null
): ComponentWithComponentData | null {
    const component = header?.regions
        ?.find((region) => region.id === HEADER_MEGA_MENU_REGION_ID)
        ?.components?.find((child) => child.typeId === MEGA_MENU_TYPE_ID);

    if (!component) return null;
    return {
        ...component,
        // The content block is ordinary while staged on a temporary page, but
        // becomes a static embedded subtree when projected out of Header.
        embedded: header?.embedded === true,
        componentData: header?.componentData,
    } as ComponentWithComponentData;
}
