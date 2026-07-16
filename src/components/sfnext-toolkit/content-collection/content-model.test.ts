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
import {
    normalizeContentAssetId,
    normalizeContentCollectionItem,
    normalizeContentFolderId,
    parseSelectedContentIds,
} from './content-model';

describe('SFNext Toolkit content collection normalization', () => {
    test('normalizes a blog Content Asset without exposing rich body markup in the card model', () => {
        const item = normalizeContentCollectionItem({
            id: 'summer-edit',
            name: '<strong>Summer edit</strong>',
            description: '<p>Light looks for warm days.</p>',
            c_sfnextBlogBody: '<h2>Article body</h2>',
            c_sfnextBlogHeroImage: { value: { file: { absURL: '//cdn.example.com/summer.jpg' } } },
            c_sfnextBlogHeroAlt: '<em>Child wearing a summer outfit</em>',
            c_sfnextBlogAuthor: { text: 'Editorial team' },
            c_sfnextBlogPublishedAt: '2026-07-12T10:15:00.000Z',
            c_sfnextBlogCategory: 'Inspiration',
            c_sfnextBlogReadTime: '4 minutes',
        });

        expect(item).toEqual({
            id: 'summer-edit',
            kind: 'blog',
            title: 'Summer edit',
            excerpt: 'Light looks for warm days.',
            imageUrl: 'https://cdn.example.com/summer.jpg',
            imageAlt: 'Child wearing a summer outfit',
            author: 'Editorial team',
            publishedAt: '2026-07-12T10:15:00.000Z',
            updatedAt: undefined,
            category: 'Inspiration',
            readingTimeMinutes: 4,
            linkUrl: undefined,
        });
        expect(item).not.toHaveProperty('bodyHtml');
    });

    test('supports ordinary assets and safe custom field mappings with or without the c_ prefix', () => {
        const item = normalizeContentCollectionItem(
            {
                id: 'press.release 2026',
                name: 'Fallback title',
                c_cardTitle: '<b>Press release</b>',
                c_cardSummary: '<p>Company news.</p>',
                c_cardImage: { url: '/images/press.webp' },
                c_cardDate: '2026-05-03T00:00:00.000Z',
                c_cardLink: '/news/press-release',
            },
            {
                titleAttribute: 'cardTitle',
                excerptAttribute: 'c_cardSummary',
                imageAttribute: 'cardImage',
                dateAttribute: 'cardDate',
                linkAttribute: 'cardLink',
            }
        );

        expect(item).toMatchObject({
            id: 'press.release 2026',
            kind: 'generic',
            title: 'Press release',
            excerpt: 'Company news.',
            imageUrl: '/images/press.webp',
            publishedAt: '2026-05-03T00:00:00.000Z',
            linkUrl: '/news/press-release',
        });
    });

    test('fails closed for unsafe custom fields, media URLs and link protocols', () => {
        const item = normalizeContentCollectionItem(
            {
                id: 'safe-id',
                name: 'Safe fallback',
                image: 'data:image/svg+xml,bad',
                c_url: 'java\nscript:alert(1)',
            },
            { titleAttribute: 'constructor' }
        );

        expect(item).toMatchObject({ id: 'safe-id', title: 'Safe fallback' });
        expect(item?.imageUrl).toBeUndefined();
        expect(item?.linkUrl).toBeUndefined();
    });

    test('parses, de-duplicates and caps generic IDs without applying the blog slug regex', () => {
        const parsed = parseSelectedContentIds(
            `first\npress.release 2026, first\n${String.fromCharCode(0)}bad\nthird`,
            2
        );

        expect(parsed).toEqual({
            ids: ['first', 'press.release 2026'],
            invalidCount: 1,
            truncated: true,
        });
        expect(normalizeContentAssetId('press.release 2026')).toBe('press.release 2026');
        expect(normalizeContentAssetId('contains,comma')).toBeUndefined();
    });

    test('rejects offline content and folder refinement injection', () => {
        expect(normalizeContentCollectionItem({ id: 'offline', online: false, name: 'Hidden' })).toBeNull();
        expect(normalizeContentFolderId(' editorial-content ')).toBe('editorial-content');
        expect(normalizeContentFolderId('editorial|private')).toBeUndefined();
        expect(normalizeContentFolderId('folder=other')).toBeUndefined();
    });
});
