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
import { afterEach, describe, test, expect, vi, type Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ShopperSearch } from '@/scapi';
import { ProductImageViewType } from '@/components/product-list/config';
import { useDynamicImageContext } from '@/providers/dynamic-image';
import { ProductImageContainer } from './index';

vi.mock('@/components/link', () => ({
    Link: ({ children, to, ...props }: any) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/providers/dynamic-image', () => ({
    useDynamicImageContext: vi.fn().mockReturnValue(null),
}));

vi.mock('./product-image', () => ({
    ProductImage: ({ src, alt, imageProps }: any) =>
        src ? (
            <img src={src} alt={alt} data-testid="product-image" {...imageProps} />
        ) : (
            <div data-testid="product-image-placeholder">No image available</div>
        ),
}));

const mockProduct: ShopperSearch.schemas['ProductSearchHit'] = {
    productId: 'test-product',
    productName: 'Test Product',
    price: 99.99,
    variationAttributes: [
        {
            id: 'color',
            values: [
                { value: 'navy', name: 'Navy' },
                { value: 'red', name: 'Red' },
                { value: 'blue', name: 'Blue' },
                { value: 'black', name: 'Black' },
            ],
        },
    ],
    imageGroups: [
        {
            viewType: 'medium',
            images: [
                {
                    link: 'https://example.com/default-medium.jpg',
                    disBaseLink: 'https://example.com/default-medium-dis.jpg',
                    alt: 'Default medium image',
                },
            ],
        },
        {
            viewType: 'large',
            images: [
                {
                    link: 'https://example.com/default-large.jpg',
                    alt: 'Default large image',
                },
            ],
        },
        {
            viewType: 'large',
            variationAttributes: [{ id: 'color', values: [{ value: 'navy' }] }],
            images: [
                {
                    link: 'https://example.com/navy-large.jpg',
                    alt: 'Navy large image',
                },
            ],
        },
        {
            viewType: 'swatch',
            variationAttributes: [{ id: 'color', values: [{ value: 'navy' }] }],
            images: [
                {
                    link: 'https://example.com/navy-swatch.jpg',
                    alt: 'Navy swatch',
                },
            ],
        },
    ],
};

describe('ProductImageContainer Dynamic Image Context Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useDynamicImageContext as Mock).mockReturnValue(null);
        window.history.replaceState({}, '', '/');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.history.replaceState({}, '', '/');
    });

    test('defaults to the unvaried medium image and reports it to the dynamic image context', () => {
        const mockAddSource = vi.fn();
        (useDynamicImageContext as Mock).mockReturnValue({
            addSource: mockAddSource,
            hasSource: vi.fn(),
        });

        render(<ProductImageContainer product={mockProduct} />);

        expect(screen.getByTestId('product-image')).toHaveAttribute(
            'src',
            'https://example.com/default-medium-dis.jpg'
        );
        expect(mockAddSource).toHaveBeenCalledWith('https://example.com/default-medium-dis.jpg');
    });

    test('selects the requested view type and selected color before the unvaried group', () => {
        render(
            <ProductImageContainer
                product={mockProduct}
                selectedColorValue="navy"
                imageViewType={ProductImageViewType.LARGE}
            />
        );

        expect(screen.getByTestId('product-image')).toHaveAttribute('src', 'https://example.com/navy-large.jpg');
    });

    test('falls back to the unvaried group of the same view type when the color has no image', () => {
        render(
            <ProductImageContainer
                product={mockProduct}
                selectedColorValue="red"
                imageViewType={ProductImageViewType.LARGE}
            />
        );

        expect(screen.getByTestId('product-image')).toHaveAttribute('src', 'https://example.com/default-large.jpg');
    });

    test('does not fall back to product.image when another image-group type was returned', () => {
        const mockAddSource = vi.fn();
        (useDynamicImageContext as Mock).mockReturnValue({
            addSource: mockAddSource,
            hasSource: vi.fn(),
        });

        const productWithFallbackImage = {
            ...mockProduct,
            image: {
                link: 'https://example.com/fallback.jpg',
                disBaseLink: 'https://example.com/fallback-dis.jpg',
                alt: 'Fallback Image',
            },
        };

        render(
            <ProductImageContainer product={productWithFallbackImage} imageViewType={ProductImageViewType.HI_RES} />
        );

        expect(mockAddSource).not.toHaveBeenCalled();
        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
    });

    test('falls back to product.image for a legacy response without imageGroups', () => {
        const productWithFallbackImage = {
            ...mockProduct,
            imageGroups: [],
            image: {
                link: 'https://example.com/fallback.jpg',
                disBaseLink: 'https://example.com/fallback-dis.jpg',
                alt: 'Fallback Image',
            },
        };

        render(
            <ProductImageContainer product={productWithFallbackImage} imageViewType={ProductImageViewType.HI_RES} />
        );

        expect(screen.getByTestId('product-image')).toHaveAttribute('src', 'https://example.com/fallback-dis.jpg');
    });

    test('does not implicitly use a swatch image when another view type is requested', () => {
        const swatchOnlyProduct = {
            ...mockProduct,
            imageGroups: mockProduct.imageGroups?.filter(({ viewType }) => viewType === 'swatch'),
        };

        render(
            <ProductImageContainer
                product={swatchOnlyProduct}
                selectedColorValue="navy"
                imageViewType={ProductImageViewType.LARGE}
            />
        );

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
        expect(screen.queryByTestId('product-image')).not.toBeInTheDocument();
    });

    test('uses swatch images when the merchant explicitly selects the swatch view type', () => {
        render(
            <ProductImageContainer
                product={mockProduct}
                selectedColorValue="navy"
                imageViewType={ProductImageViewType.SWATCH}
            />
        );

        expect(screen.getByTestId('product-image')).toHaveAttribute('src', 'https://example.com/navy-swatch.jpg');
    });

    test('renders the placeholder and does not report a source when every fallback is empty', () => {
        const mockAddSource = vi.fn();
        (useDynamicImageContext as Mock).mockReturnValue({
            addSource: mockAddSource,
            hasSource: vi.fn(),
        });

        render(<ProductImageContainer product={{ ...mockProduct, imageGroups: [], image: undefined }} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
        expect(mockAddSource).not.toHaveBeenCalled();
    });

    test('logs requested, selected and rendered URLs only when debugPlpImages=1', async () => {
        window.history.replaceState({}, '', '/category/root?debugPlpImages=1');
        const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

        render(
            <ProductImageContainer
                product={mockProduct}
                selectedColorValue="navy"
                imageViewType={ProductImageViewType.LARGE}
            />
        );

        const image = screen.getByTestId('product-image');
        expect(image).toHaveAttribute('data-plp-image-view-type', 'large');
        expect(image).toHaveAttribute('data-plp-image-selection', 'selected-color-group');
        expect(image).toHaveAttribute('data-plp-image-source', 'https://example.com/navy-large.jpg');

        await waitFor(() =>
            expect(consoleInfo).toHaveBeenCalledWith(
                '[PLP image debug] resolved | type=large | url=https://example.com/navy-large.jpg',
                expect.objectContaining({
                    productId: 'test-product',
                    requestedViewType: 'large',
                    selectionStrategy: 'selected-color-group',
                    sourcePassedToDynamicImage: 'https://example.com/navy-large.jpg',
                })
            )
        );

        Object.defineProperties(image, {
            currentSrc: { configurable: true, value: 'https://cdn.example.com/navy-large.webp' },
            naturalWidth: { configurable: true, value: 800 },
            naturalHeight: { configurable: true, value: 800 },
        });
        fireEvent.load(image);

        expect(consoleInfo).toHaveBeenCalledWith(
            '[PLP image debug] loaded | type=large | url=https://cdn.example.com/navy-large.webp',
            expect.objectContaining({
                requestedViewType: 'large',
                renderedCurrentSrc: 'https://cdn.example.com/navy-large.webp',
                naturalWidth: 800,
                naturalHeight: 800,
            })
        );
    });

    test('does not log image diagnostics without the debug query parameter', () => {
        const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

        render(<ProductImageContainer product={mockProduct} />);
        fireEvent.load(screen.getByTestId('product-image'));

        expect(consoleInfo).not.toHaveBeenCalled();
    });
});
