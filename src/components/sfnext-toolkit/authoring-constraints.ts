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

/**
 * Nested and site-contextual toolkit types that must not appear in ordinary
 * page regions. Parent/page inclusions expose them only where their runtime
 * context exists (for example Size Guide in PDP Product Tools).
 */
export const TOOLKIT_CONTEXTUAL_COMPONENT_TYPE_EXCLUSIONS = [
    'SFNextToolkit.accordionItem',
    'SFNextToolkit.categoryCard',
    'SFNextToolkit.megaMenu',
    'SFNextToolkit.megaMenuFeature',
    'SFNextToolkit.megaMenuLink',
    'SFNextToolkit.megaMenuPanel',
    'SFNextToolkit.promoCard',
    'SFNextToolkit.siteTheme',
    'SFNextToolkit.sizeGuide',
    'SFNextToolkit.trustItem',
] satisfies string[];
