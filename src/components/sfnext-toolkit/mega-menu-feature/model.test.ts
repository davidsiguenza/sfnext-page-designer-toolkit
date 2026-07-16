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
import type { ShopperProducts } from '@/scapi';
import {
    emptyMegaMenuFeatureData,
    normalizeMegaMenuFeatureId,
    normalizeMegaMenuFeatureImage,
    normalizeMegaMenuFeatureImageViewType,
    normalizeMegaMenuFeatureSourceType,
    projectCategoryFeature,
    projectCmsFeature,
    projectContentFeature,
    projectProductFeature,
} from './model';

type Product = ShopperProducts.schemas['Product'];
type Category = ShopperProducts.schemas['Category'];

describe('SFNext Toolkit mega menu feature model', () => {
    test('normalizes source selectors, wrapped IDs and image types with closed defaults', () => {
        expect(normalizeMegaMenuFeatureId('  girls  ')).toBe('girls');
        expect(normalizeMegaMenuFeatureId({ id: ' category-id ' })).toBe('category-id');
        expect(normalizeMegaMenuFeatureId({ value: { source: ' sku-1 ' } })).toBe('sku-1');
        expect(normalizeMegaMenuFeatureId({ value: '   ' })).toBeUndefined();
        expect(normalizeMegaMenuFeatureId(42)).toBeUndefined();

        expect(normalizeMegaMenuFeatureSourceType('category')).toBe('category');
        expect(normalizeMegaMenuFeatureSourceType('product')).toBe('product');
        expect(normalizeMegaMenuFeatureSourceType('content')).toBe('content');
        expect(normalizeMegaMenuFeatureSourceType('cms')).toBe('cms');
        expect(normalizeMegaMenuFeatureSourceType('custom')).toBe('custom');
        expect(normalizeMegaMenuFeatureSourceType('remote-script')).toBe('custom');
        expect(normalizeMegaMenuFeatureImageViewType('hi-res')).toBe('hi-res');
        expect(normalizeMegaMenuFeatureImageViewType('swatch')).toBe('swatch');
        expect(normalizeMegaMenuFeatureImageViewType('thumbnail')).toBe('medium');
    });

    test('normalizes safe media URLs and preserves Page Designer focal points', () => {
        expect(
            normalizeMegaMenuFeatureImage({
                url: '//cdn.example.test/campaign.jpg',
                focalPoint: { x: '23%', y: 0.75 },
            })
        ).toEqual({
            src: 'https://cdn.example.test/campaign.jpg',
            focalPoint: { x: '23%', y: 0.75 },
        });
        expect(normalizeMegaMenuFeatureImage('/images/local.jpg')).toEqual({ src: '/images/local.jpg' });
        expect(normalizeMegaMenuFeatureImage('/\\evil.example/campaign.jpg')).toBeUndefined();
        expect(normalizeMegaMenuFeatureImage('https:\\evil.example/campaign.jpg')).toBeUndefined();
        expect(normalizeMegaMenuFeatureImage('http://cdn.example.test/campaign.jpg')).toBeUndefined();
        expect(normalizeMegaMenuFeatureImage('javascript:alert(1)')).toBeUndefined();
        expect(normalizeMegaMenuFeatureImage('data:image/svg+xml,bad')).toBeUndefined();
    });

    test('projects a category using its standard menu image and storefront destination', () => {
        const category = {
            id: ' girls ',
            name: ' Girls ',
            pageDescription: ' New season ',
            image: '//cdn.example.test/girls.jpg',
            c_slotBannerImage: '/ignored-slot.jpg',
        } as Category;

        expect(projectCategoryFeature(category)).toEqual({
            sourceType: 'category',
            sourceId: 'girls',
            title: 'Girls',
            copy: 'New season',
            image: { src: 'https://cdn.example.test/girls.jpg', alt: 'Girls' },
            destination: '/category/girls',
        });
    });

    test('uses the exact requested product image view type when it exists', () => {
        const product = {
            id: 'sku-1',
            name: 'Occasion dress',
            shortDescription: 'A special look',
            currency: 'EUR',
            imageGroups: [
                { viewType: 'medium', images: [{ link: 'https://cdn.example.test/medium.jpg' }] },
                { viewType: 'hi-res', images: [{ disBaseLink: 'https://cdn.example.test/hi-res.jpg' }] },
            ],
        } as unknown as Product;

        expect(projectProductFeature(product, 'hi-res', 'USD')).toMatchObject({
            sourceType: 'product',
            sourceId: 'sku-1',
            title: 'Occasion dress',
            copy: 'A special look',
            currency: 'EUR',
            destination: '/product/sku-1',
            image: {
                src: 'https://cdn.example.test/hi-res.jpg',
                alt: 'Occasion dress',
                requestedViewType: 'hi-res',
                resolvedViewType: 'hi-res',
            },
        });
    });

    test('falls back deterministically to medium when the requested product image type is unavailable', () => {
        const product = {
            productId: 'sku-fallback',
            productName: 'Fallback product',
            brand: 'Example Brand',
            imageGroups: [
                { viewType: 'large', images: [{ link: 'https://cdn.example.test/large.jpg' }] },
                { viewType: 'medium', images: [{ link: 'https://cdn.example.test/medium.jpg' }] },
            ],
        } as unknown as Product;

        expect(projectProductFeature(product, 'swatch', 'EUR')).toMatchObject({
            copy: 'Example Brand',
            currency: 'EUR',
            image: {
                src: 'https://cdn.example.test/medium.jpg',
                requestedViewType: 'swatch',
                resolvedViewType: 'medium',
            },
        });
    });

    test('projects generic and blog Content Assets without accepting unsafe destinations', () => {
        expect(
            projectContentFeature({
                id: 'summer edit',
                kind: 'blog',
                title: 'Summer edit',
                excerpt: 'Ideas for warm days',
                imageUrl: '/images/summer.jpg',
                imageAlt: 'Summer outfit',
                category: 'Inspiration',
            })
        ).toEqual({
            sourceType: 'content',
            sourceId: 'summer edit',
            title: 'Summer edit',
            copy: 'Ideas for warm days',
            eyebrow: 'Inspiration',
            image: { src: '/images/summer.jpg', alt: 'Summer outfit' },
            destination: '/blog/summer%20edit',
        });

        expect(
            projectContentFeature({
                id: 'ordinary',
                kind: 'generic',
                title: 'Ordinary content',
                linkUrl: 'javascript:alert(1)',
            }).destination
        ).toBeUndefined();
    });

    test('maps a Salesforce CMS record, strips markup and retains its image focal point', () => {
        const projected = projectCmsFeature(
            {
                id: 'cms-hero',
                attributes: {
                    c_cardTitle: '<strong>Editorial pick</strong>',
                    c_cardCopy: '<p>A hand-picked story.</p>',
                    c_cardImage: {
                        url: '/cms/editorial.jpg',
                        focal_point: { x: 0.2, y: '70%' },
                    },
                    c_cardAlt: '<em>Children outdoors</em>',
                    c_cardLink: '/stories/editorial-pick',
                    c_cardEyebrow: '<span>Stories</span>',
                },
            },
            {
                titleAttribute: 'cardTitle',
                excerptAttribute: 'cardCopy',
                imageAttribute: 'cardImage',
                imageAltAttribute: 'cardAlt',
                linkAttribute: 'cardLink',
                eyebrowAttribute: 'cardEyebrow',
            }
        );

        expect(projected).toEqual({
            sourceType: 'cms',
            sourceId: 'cms-hero',
            title: 'Editorial pick',
            copy: 'A hand-picked story.',
            eyebrow: 'Stories',
            image: {
                src: '/cms/editorial.jpg',
                alt: 'Children outdoors',
                focalPoint: { x: 0.2, y: '70%' },
            },
            destination: '/stories/editorial-pick',
        });
    });

    test('fails closed for unsafe CMS links and empty records', () => {
        expect(
            projectCmsFeature({
                id: 'unsafe',
                attributes: { title: 'Safe title', link: 'java\nscript:alert(1)', image: 'data:image/svg+xml,bad' },
            })
        ).toMatchObject({ title: 'Safe title', destination: undefined, image: undefined });
        expect(projectCmsFeature({ id: 'empty', attributes: {} })).toBeUndefined();
        expect(emptyMegaMenuFeatureData('error')).toEqual({ status: 'error' });
    });
});
