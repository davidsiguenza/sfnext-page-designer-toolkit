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
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { getRegionDefinition } from '@/lib/decorators/region-definition';
import SFNextToolkitProductCarousel, { SFNextToolkitProductCarouselMetadata } from './index';

vi.mock('@/components/product-carousel/carousel', () => ({
    default: ({ products, title, shopAllUrl }: { products: unknown[]; title?: string; shopAllUrl?: string }) => (
        <div data-testid="product-carousel" data-count={products.length} data-url={shopAllUrl}>
            {title}
        </div>
    ),
}));

vi.mock('@/components/product-carousel/skeleton', () => ({
    default: ({ title }: { title?: string }) => <div>{title} loading</div>,
}));

describe('SFNext Toolkit product carousel', () => {
    test('registers category and manual authoring contracts', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitProductCarouselMetadata)).toBe(
            'SFNextToolkit.productCarousel'
        );
        expect(getRegionDefinition(SFNextToolkitProductCarouselMetadata, 'products')).toMatchObject({
            maxComponents: 12,
            componentTypeInclusions: ['Content.productTile'],
        });
        const { fields } = getAttributeDefinitions(SFNextToolkitProductCarouselMetadata.prototype);
        expect(fields.categoryId.type).toBe('category');
        expect(fields.limit.defaultValue).toBe(12);
    });

    test('passes loaded products and a safe view-all URL to the shared carousel', () => {
        render(
            <SFNextToolkitProductCarousel
                title="New arrivals"
                shopAllUrl="/category/new"
                data={{ hits: [{ productId: 'one' }, { productId: 'two' }] }}
            />
        );

        expect(screen.getByTestId('product-carousel')).toHaveAttribute('data-count', '2');
        expect(screen.getByTestId('product-carousel')).toHaveAttribute('data-url', '/category/new');
        expect(screen.getByText('New arrivals')).toBeInTheDocument();
    });

    test('drops unsafe view-all URLs', () => {
        render(<SFNextToolkitProductCarousel shopAllUrl="javascript:alert(1)" />);
        expect(screen.getByTestId('product-carousel')).not.toHaveAttribute('data-url');
    });
});
