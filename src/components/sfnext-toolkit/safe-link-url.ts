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

const ALLOWED_LINK_PROTOCOLS = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * Normalizes merchant-authored destinations before they reach React Router.
 * Relative storefront URLs remain valid, while executable, data, filesystem,
 * protocol-relative, and control-character payloads fail closed.
 */
export function normalizeSafeLinkUrl(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    const hasControlCharacters = [...(trimmed ?? '')].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127;
    });

    // WHATWG URL parsing treats backslashes as path separators for special
    // schemes. Reject every occurrence so `/\\evil.example` cannot escape the
    // storefront origin after browser normalization.
    if (!trimmed || hasControlCharacters || trimmed.startsWith('//') || trimmed.includes('\\')) {
        return undefined;
    }

    const protocol = trimmed.match(/^([a-z][a-z\d+.-]*)\s*:/i)?.[1]?.toLowerCase();
    if (protocol && !ALLOWED_LINK_PROTOCOLS.has(protocol)) return undefined;

    return trimmed;
}
