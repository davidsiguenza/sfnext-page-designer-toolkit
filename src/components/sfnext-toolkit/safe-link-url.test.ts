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
import { describe, expect, test } from 'vitest';
import { normalizeSafeLinkUrl } from './safe-link-url';

describe('normalizeSafeLinkUrl', () => {
    test.each([
        '/page/returns',
        'category/new',
        '#details',
        '?campaign=summer',
        'https://example.com/help',
        'http://example.com/help',
        'mailto:help@example.com',
        'tel:+34900123456',
    ])('allows storefront and approved external destination %s', (value) => {
        expect(normalizeSafeLinkUrl(`  ${value}  `)).toBe(value);
    });

    test.each([
        undefined,
        '',
        '//evil.example/path',
        '\\evil.example/path',
        'javascript:alert(1)',
        'javascript :alert(1)',
        'data:text/html,boom',
        'file:///etc/passwd',
        'vbscript:msgbox(1)',
        '/safe\njavascript:alert(1)',
    ])('rejects unsafe destination %s', (value) => {
        expect(normalizeSafeLinkUrl(value)).toBeUndefined();
    });
});
