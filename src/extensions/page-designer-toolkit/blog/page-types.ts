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

export const BLOG_HOME_PAGE_TYPE_ID = 'sfnextToolkitBlogHomePage';
export const BLOG_POST_PAGE_TYPE_ID = 'sfnextToolkitBlogPostPage';
export const BLOG_HOME_PAGE_ID = 'blog';
export const BLOG_POST_LAYOUT_PAGE_ID = 'blog-post-layout';

/** Shopper Experience can return either the raw ID or its `page.`-qualified form. */
export function isPageType(typeId: string | undefined, expectedTypeId: string): boolean {
    return typeId === expectedTypeId || typeId === `page.${expectedTypeId}`;
}
