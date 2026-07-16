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
import { isValidBlogPostId, normalizeBlogPost } from './content-model';

describe('blog Content Asset normalization', () => {
    test('normalizes the definitive SFNext blog attributes and SEO fallbacks', () => {
        const post = normalizeBlogPost({
            id: 'summer-edit',
            name: '<strong>Summer edit</strong>',
            description: '<p>Light looks for warm days.</p>',
            pageTitle: 'Summer edit | Journal',
            pageDescription: 'Discover the summer edit.',
            pageKeywords: 'summer, kids; fashion',
            c_sfnextBlogBody: { value: '<h2>New season</h2><p>Our edit.</p>' },
            c_sfnextBlogHeroImage: { value: { file: { absURL: '//cdn.example.com/summer.jpg' } } },
            c_sfnextBlogHeroAlt: '<em>Child wearing a summer outfit</em>',
            c_sfnextBlogAuthor: { text: 'Editorial team' },
            c_sfnextBlogPublishedAt: '2026-07-12T10:15:00.000Z',
            c_sfnextBlogCategory: 'Inspiration',
            c_sfnextBlogTags: ['Summer', 'Kids', 'summer'],
            c_sfnextBlogReadTime: '4 minutes',
            c_sfnextBlogFeatured: 'yes',
        });

        expect(post).toEqual({
            id: 'summer-edit',
            slug: 'summer-edit',
            title: 'Summer edit',
            excerpt: 'Light looks for warm days.',
            bodyHtml: '<h2>New season</h2><p>Our edit.</p>',
            author: 'Editorial team',
            publishedAt: '2026-07-12T10:15:00.000Z',
            updatedAt: undefined,
            heroImageUrl: 'https://cdn.example.com/summer.jpg',
            heroImageAlt: 'Child wearing a summer outfit',
            category: 'Inspiration',
            tags: ['Summer', 'Kids'],
            featured: true,
            readingTimeMinutes: 4,
            seoTitle: 'Summer edit | Journal',
            seoDescription: 'Discover the summer edit.',
            seoKeywords: ['summer', 'kids', 'fashion'],
            visible: true,
        });
    });

    test('estimates reading time, respects offline content and rejects unsafe media schemes', () => {
        const body = `<p>${Array.from({ length: 201 }, () => 'word').join(' ')}</p>`;
        const post = normalizeBlogPost({
            id: 'long-read',
            title: 'Long read',
            body,
            image: 'javascript:alert(1)',
            online: 'offline',
        });

        expect(post).toMatchObject({
            id: 'long-read',
            readingTimeMinutes: 2,
            visible: false,
        });
        expect(post?.heroImageUrl).toBeUndefined();
    });

    test('always uses the retrievable Content Asset ID as the public slug', () => {
        expect(normalizeBlogPost({ id: 'asset-id', c_blogSlug: 'unresolvable-alias' })?.slug).toBe('asset-id');
        expect(normalizeBlogPost({ id: 'asset-id', slug: '../unsafe' })?.slug).toBe('asset-id');
    });

    test('returns null only when no usable Content Asset ID exists', () => {
        expect(normalizeBlogPost(null)).toBeNull();
        expect(normalizeBlogPost({ name: 'No ID' })).toBeNull();
        expect(normalizeBlogPost({ id: 'fallback-title' })?.title).toBe('fallback-title');
    });

    test('validates IDs as one Unicode-safe URL segment', () => {
        expect(isValidBlogPostId('coleccion-niños_2026')).toBe(true);
        expect(isValidBlogPostId('../secret')).toBe(false);
        expect(isValidBlogPostId('two segments')).toBe(false);
        expect(isValidBlogPostId('')).toBe(false);
    });
});
