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
import type React from 'react';
import { vi, test, describe, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { ProductTile } from './index';
import { DEFAULT_PRODUCT_LIST_CONFIG, type ProductListConfig } from '@/components/product-list/config';
import type { ShopperProducts, ShopperSearch } from '@/scapi';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { masterProduct } from '@/components/__mocks__/master-variant-product';

// Mock only the network boundary. `useScapiFetcher` is what the CartItemModal
// uses to load product data after the user clicks quick-add; everything else
// renders for real.
const mockLoad = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/use-scapi-fetcher', () => ({
    useScapiFetcher: () => ({
        load: mockLoad,
        data: masterProduct,
        state: 'idle',
        success: true,
    }),
}));

// @sfdc-extension-block-start SFDC_EXT_RATINGS_REVIEWS
vi.mock('@/extensions/ratings-reviews/providers/product-reviews-context', () => ({
    ProductReviewsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useProductReviews: () => ({
        reviewsSummary: null,
        reviewsSummaryLoading: false,
        reviews: [],
        reviewsLoading: false,
        loadReviewsIfNeeded: () => {},
        aiSummary: '',
        addReviewOptimistic: () => {},
        removeReviewOptimistic: () => {},
        expandReviews: () => {},
        registerExpand: () => {},
        registerOnExpanded: () => {},
        triggerOnExpanded: () => {},
    }),
}));
// @sfdc-extension-block-end SFDC_EXT_RATINGS_REVIEWS

const mockMasterProduct: ShopperSearch.schemas['ProductSearchHit'] = {
    productId: masterProduct.id,
    productName: 'Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit',
    price: 299.99,
    productType: { master: true },
    representedProduct: { id: '750518699578M' },
    variants: [
        { productId: '750518699578M', variationValues: { color: 'CHARCWL', size: '036', width: 'S' } },
        { productId: '750518699585M', variationValues: { color: 'CHARCWL', size: '038', width: 'V' } },
    ],
    variationAttributes: masterProduct.variationAttributes as ShopperProducts.schemas['VariationAttribute'][],
    imageGroups: masterProduct.imageGroups,
};

const mockSingleVariantProduct: ShopperSearch.schemas['ProductSearchHit'] = {
    productId: 'simple-001',
    productName: 'Simple Test Product',
    price: 49.99,
    variationAttributes: [
        {
            id: 'color',
            name: 'Color',
            values: [
                { value: 'navy', name: 'Navy' },
                { value: 'red', name: 'Red' },
            ],
        },
    ],
    imageGroups: [
        {
            viewType: 'medium',
            images: [
                {
                    alt: 'Simple Test Product',
                    link: 'https://example.com/simple.jpg',
                    disBaseLink: 'https://example.com/simple.jpg',
                },
            ],
        },
    ],
};

const renderTile = (props: Partial<React.ComponentProps<typeof ProductTile>> = {}) => {
    const router = createMemoryRouter(
        [
            {
                path: '/test',
                element: (
                    <AllProvidersWrapper>
                        <ProductTile product={mockSingleVariantProduct} {...props} />
                    </AllProvidersWrapper>
                ),
            },
            { path: '*', element: <div>Navigated</div> },
        ],
        { initialEntries: ['/test'] }
    );
    return render(<RouterProvider router={router} />);
};

const createTilePresentation = (overrides: Partial<ProductListConfig> = {}): ProductListConfig => ({
    ...DEFAULT_PRODUCT_LIST_CONFIG,
    ...overrides,
});

describe('ProductTile — rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders product name as a heading linking to the PDP', () => {
        renderTile();
        const heading = screen.getByRole('heading', { name: 'Simple Test Product' });
        expect(heading).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Simple Test Product' })).toHaveAttribute(
            'href',
            '/global/en-GB/product/simple-001'
        );
    });

    test('renders the product price', () => {
        renderTile();
        expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    test('renders the product SKU', () => {
        renderTile();
        expect(screen.getByText(/simple-001/)).toBeInTheDocument();
    });

    test('renders sale badge when the product is on sale', () => {
        const productOnSale = {
            ...mockSingleVariantProduct,
            representedProduct: {
                id: 'v1',
                c_isSale: true,
            } as ShopperSearch.schemas['ProductSearchHit']['representedProduct'],
        };
        renderTile({ product: productOnSale });
        expect(screen.getByText('Sale')).toBeInTheDocument();
    });

    test('does not render a badge for a product without badge flags', () => {
        renderTile();
        expect(screen.queryByText('Sale')).not.toBeInTheDocument();
        expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    test('renders topCategoryName when provided', () => {
        renderTile({ topCategoryName: 'Women' });
        expect(screen.getByText('Women')).toBeInTheDocument();
    });

    test('renders the pickup-available tooltip when showPickupAvailable is true', () => {
        renderTile({ showPickupAvailable: true });
        expect(screen.getByText('Pickup Available')).toBeInTheDocument();
    });

    test('does not render the pickup tooltip by default', () => {
        renderTile();
        expect(screen.queryByText('Pickup Available')).not.toBeInTheDocument();
    });

    test('renders a quick-add button with the default label', () => {
        renderTile();
        expect(screen.getByRole('button', { name: /quick add/i })).toBeInTheDocument();
    });

    test('renders a quick-add button with a custom label', () => {
        renderTile({ quickAddLabel: 'Fast Add' });
        expect(screen.getByRole('button', { name: /fast add/i })).toBeInTheDocument();
    });

    test('renders the product brand when the search hit provides one', () => {
        renderTile({ product: { ...mockSingleVariantProduct, brand: 'Acme' } });
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.queryByText('Test Store')).not.toBeInTheDocument();
    });
});

describe('ProductTile — list-level presentation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('hides every optional tile element while retaining an sr-only PDP link', async () => {
        const product = {
            ...mockSingleVariantProduct,
            brand: 'Acme',
            representedProduct: {
                id: 'simple-001',
                c_isSale: true,
            },
        } as ShopperSearch.schemas['ProductSearchHit'];

        renderTile({
            product,
            topCategoryName: 'Women',
            tilePresentation: createTilePresentation({
                showBadges: false,
                showWishlist: false,
                showQuickAdd: false,
                showSwatches: false,
                showBrand: false,
                showCategory: false,
                showProductName: false,
                showSku: false,
                showRating: false,
                showPrice: false,
                showPromotions: false,
            }),
        });

        expect(screen.queryByText('Sale')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /wishlist/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /quick add/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: /available colou?rs/i })).not.toBeInTheDocument();
        expect(screen.queryByText('Acme')).not.toBeInTheDocument();
        expect(screen.queryByText('Women')).not.toBeInTheDocument();
        expect(screen.queryByTestId('product-tile-sku')).not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: /out of 5 stars/i })).not.toBeInTheDocument();
        expect(screen.queryByText('$49.99')).not.toBeInTheDocument();

        const productLink = screen.getByRole('link', { name: 'Simple Test Product' });
        expect(productLink).toHaveAttribute('href', '/global/en-GB/product/simple-001');
        expect(productLink.closest('h3')).toHaveClass('sr-only');

        // Lazy swatches never mount when the list-level switch is disabled.
        await Promise.resolve();
        expect(screen.queryByRole('group', { name: /available colou?rs/i })).not.toBeInTheDocument();
    });

    test('uses the list-level maximum number of swatches', async () => {
        renderTile({
            maxSwatches: 2,
            tilePresentation: createTilePresentation({ maxSwatches: 1 }),
        });

        const swatchRegion = await screen.findByRole('group', { name: /available colou?rs/i });
        expect(within(swatchRegion).getByRole('link', { name: /Navy/ })).toBeInTheDocument();
        expect(within(swatchRegion).queryByRole('link', { name: /Red/ })).not.toBeInTheDocument();
        expect(within(swatchRegion).getByRole('link', { name: /view all 2/i })).toBeInTheDocument();
    });

    test('can hide promotional messaging without hiding the product price', () => {
        const promotionProduct = {
            ...mockSingleVariantProduct,
            productPromotions: [
                {
                    promotionId: 'summer-offer',
                    calloutMsg: 'Summer offer',
                },
            ],
        } as ShopperSearch.schemas['ProductSearchHit'];

        const visible = renderTile({
            product: promotionProduct,
            tilePresentation: createTilePresentation({ showPromotions: true }),
        });
        expect(screen.getByText('Summer offer')).toBeInTheDocument();
        visible.unmount();

        renderTile({
            product: promotionProduct,
            tilePresentation: createTilePresentation({ showPromotions: false }),
        });
        expect(screen.getByText('$49.99')).toBeInTheDocument();
        expect(screen.queryByText('Summer offer')).not.toBeInTheDocument();
    });

    test('renders safe additional attributes in hit, represented variant, then legacy priority', () => {
        const configurableProduct = {
            ...mockMasterProduct,
            c_priority: 'Search hit value',
            c_boolean: false,
            c_unsafe: { nested: 'not displayable' },
            variants: mockMasterProduct.variants?.map((variant) =>
                variant.productId === mockMasterProduct.representedProduct?.id
                    ? {
                          ...variant,
                          c_priority: 'Represented variant value',
                          c_variantOnly: 'Variant value',
                      }
                    : variant
            ),
            representedProduct: {
                ...mockMasterProduct.representedProduct,
                c_priority: 'Legacy value',
                c_variantOnly: 'Legacy variant fallback',
                c_legacyOnly: 'Legacy value',
                c_materials: ['Cotton', 'Linen'],
            },
        } as unknown as ShopperSearch.schemas['ProductSearchHit'];

        renderTile({
            product: configurableProduct,
            tilePresentation: createTilePresentation({
                additionalAttributes: [
                    { id: 'c_priority', label: 'Priority' },
                    { id: 'c_variantOnly', label: 'Variant' },
                    { id: 'c_legacyOnly', label: 'Legacy' },
                    { id: 'c_materials', label: 'Materials' },
                    { id: 'c_boolean', label: 'Boolean' },
                    { id: 'c_unsafe', label: 'Unsafe' },
                ],
            }),
        });

        const attributes = screen.getByTestId('product-tile-additional-attributes');
        expect(within(attributes).getByText('Priority:')).toBeInTheDocument();
        expect(within(attributes).getByText('Search hit value')).toBeInTheDocument();
        expect(within(attributes).getByText('Variant value')).toBeInTheDocument();
        expect(within(attributes).getByText('Legacy value')).toBeInTheDocument();
        expect(within(attributes).getByText('Cotton, Linen')).toBeInTheDocument();
        expect(within(attributes).getByText('false')).toBeInTheDocument();
        expect(within(attributes).queryByText('Unsafe:')).not.toBeInTheDocument();
        expect(attributes).not.toHaveTextContent('[object Object]');
    });

    test('reads additional attributes from map and array customProperties responses', () => {
        const product = {
            ...mockSingleVariantProduct,
            customProperties: {
                c_material: 'Cotton',
                season: 'Summer',
            },
            representedProduct: {
                id: 'simple-001',
                customProperties: [{ id: 'c_fit', value: 'Regular' }],
            },
        } as unknown as ShopperSearch.schemas['ProductSearchHit'];

        renderTile({
            product,
            tilePresentation: createTilePresentation({
                additionalAttributes: [
                    { id: 'c_material', label: 'Material' },
                    { id: 'c_season', label: 'Season' },
                    { id: 'c_fit', label: 'Fit' },
                ],
            }),
        });

        const attributes = screen.getByTestId('product-tile-additional-attributes');
        expect(attributes).toHaveTextContent('Material:Cotton');
        expect(attributes).toHaveTextContent('Season:Summer');
        expect(attributes).toHaveTextContent('Fit:Regular');
    });
});

describe('ProductTile — PDP URL', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('standard product links to the product route without a pid', () => {
        renderTile();
        expect(screen.getByRole('link', { name: 'Simple Test Product' })).toHaveAttribute(
            'href',
            '/global/en-GB/product/simple-001'
        );
    });

    test('master product links to the product route with the represented variant pid', () => {
        renderTile({ product: mockMasterProduct });
        expect(screen.getByRole('link', { name: mockMasterProduct.productName as string })).toHaveAttribute(
            'href',
            `/global/en-GB/product/${mockMasterProduct.productId}?pid=750518699578M`
        );
    });

    test('bundle product links without a pid', () => {
        renderTile({ product: { ...mockMasterProduct, productType: { bundle: true } } });
        expect(screen.getByRole('link', { name: mockMasterProduct.productName as string })).toHaveAttribute(
            'href',
            `/global/en-GB/product/${mockMasterProduct.productId}`
        );
    });

    test('set product links without a pid', () => {
        renderTile({ product: { ...mockMasterProduct, productType: { set: true } } });
        expect(screen.getByRole('link', { name: mockMasterProduct.productName as string })).toHaveAttribute(
            'href',
            `/global/en-GB/product/${mockMasterProduct.productId}`
        );
    });

    test('calls handleProductClick when the product name link is clicked', async () => {
        const user = userEvent.setup();
        const handleProductClick = vi.fn();
        renderTile({ handleProductClick });

        await user.click(screen.getByRole('link', { name: 'Simple Test Product' }));

        expect(handleProductClick).toHaveBeenCalledWith(mockSingleVariantProduct);
    });
});

describe('ProductTile — color swatches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders a swatch link for each color value', async () => {
        renderTile();
        // Locale-agnostic: query by ARIA role with a regex that matches both en-US ("colors") and en-GB ("colours").
        const swatchRegion = await screen.findByRole('group', { name: /available colou?rs/i });
        expect(within(swatchRegion).getByRole('link', { name: /Navy/ })).toBeInTheDocument();
        expect(within(swatchRegion).getByRole('link', { name: /Red/ })).toBeInTheDocument();
    });

    test('does not render a swatch region when the product has no variation attributes', async () => {
        const productWithoutVariations: ShopperSearch.schemas['ProductSearchHit'] = {
            productId: mockSingleVariantProduct.productId,
            productName: mockSingleVariantProduct.productName,
            price: mockSingleVariantProduct.price,
            imageGroups: mockSingleVariantProduct.imageGroups,
        };
        renderTile({ product: productWithoutVariations });
        // Wait a tick for any lazy suspense to settle before asserting absence.
        await Promise.resolve();
        expect(screen.queryByRole('group', { name: /available colou?rs/i })).not.toBeInTheDocument();
    });

    test('renders swatches synthesized from variants when variationAttributes is omitted', async () => {
        const productWithVariantsOnly: ShopperSearch.schemas['ProductSearchHit'] = {
            productId: 'master-001',
            productName: 'Trainer',
            price: 129.99,
            productType: { master: true },
            representedProduct: { id: 'master-001-red' },
            variants: [
                { productId: 'master-001-red', variationValues: { color: 'RED', size: '10' } },
                { productId: 'master-001-blu', variationValues: { color: 'BLU', size: '10' } },
            ],
            imageGroups: [
                {
                    viewType: 'swatch',
                    images: [
                        {
                            link: 'https://example.com/swatch-red.jpg',
                            disBaseLink: 'https://example.com/swatch-red.jpg',
                            alt: 'Red swatch',
                        },
                    ],
                    variationAttributes: [{ id: 'color', values: [{ value: 'RED' }] }],
                },
                {
                    viewType: 'swatch',
                    images: [
                        {
                            link: 'https://example.com/swatch-blu.jpg',
                            disBaseLink: 'https://example.com/swatch-blu.jpg',
                            alt: 'Blue swatch',
                        },
                    ],
                    variationAttributes: [{ id: 'color', values: [{ value: 'BLU' }] }],
                },
            ],
        };
        renderTile({ product: productWithVariantsOnly });

        const swatchRegion = await screen.findByRole('group', { name: /available colou?rs/i });
        const swatchLinks = within(swatchRegion).getAllByRole('link');
        expect(swatchLinks).toHaveLength(2);
        expect(swatchLinks[0]).toHaveAttribute('href', '/global/en-GB/product/master-001?color=RED');
        expect(swatchLinks[1]).toHaveAttribute('href', '/global/en-GB/product/master-001?color=BLU');
    });
});

describe('ProductTile — swatch hover preview', () => {
    let originalMatchMedia: typeof globalThis.matchMedia;

    beforeEach(() => {
        vi.clearAllMocks();
        originalMatchMedia = globalThis.matchMedia;
    });

    afterEach(() => {
        globalThis.matchMedia = originalMatchMedia;
    });

    const mockDesktop = (matches: boolean) => {
        globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    };

    test('previews the hovered colour on desktop viewports', async () => {
        mockDesktop(true);
        const user = userEvent.setup();
        renderTile();

        const swatchRegion = await screen.findByRole('group', { name: /available colou?rs/i });
        const navy = within(swatchRegion).getByRole('link', { name: /Navy/ });
        expect(navy).not.toHaveAttribute('aria-current');

        await user.hover(navy);

        // Hover selects the colour on desktop, marking the swatch as current.
        expect(within(swatchRegion).getByRole('link', { name: /Navy/ })).toHaveAttribute('aria-current', 'true');
    });

    test('does not preview on hover on mobile viewports', async () => {
        mockDesktop(false);
        const user = userEvent.setup();
        renderTile();

        const swatchRegion = await screen.findByRole('group', { name: /available colou?rs/i });
        const navy = within(swatchRegion).getByRole('link', { name: /Navy/ });

        await user.hover(navy);

        // Below the desktop breakpoint, hover is inert — the preview only changes on click/navigation.
        expect(within(swatchRegion).getByRole('link', { name: /Navy/ })).not.toHaveAttribute('aria-current');
    });
});

describe('ProductTile — quick-add pre-selection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('opens the quick-add modal pre-seeded with every axis from the represented variant', async () => {
        const user = userEvent.setup();
        renderTile({ product: mockMasterProduct });

        await user.click(screen.getByRole('button', { name: /quick add/i }));

        const dialog = await screen.findByRole('dialog');
        // Each variation group renders its selected value in the header as "<label>:<displayName>".
        // Represented variant is { color: 'CHARCWL', size: '036', width: 'S' },
        // which maps to display names "Charcoal", "36", "Short".
        expect(within(dialog).getByRole('radiogroup', { name: /color/i })).toHaveTextContent(/Color:.*Charcoal/);
        expect(within(dialog).getByRole('radiogroup', { name: /size/i })).toHaveTextContent(/Size:.*36/);
        expect(within(dialog).getByRole('radiogroup', { name: /width/i })).toHaveTextContent(/Width:.*Short/);
    });

    test('marks the represented variant swatches as selected inside the modal', async () => {
        const user = userEvent.setup();
        renderTile({ product: mockMasterProduct });

        await user.click(screen.getByRole('button', { name: /quick add/i }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByRole('radio', { name: /Charcoal/ })).toBeChecked();
        expect(within(dialog).getByRole('radio', { name: /^36$/ })).toBeChecked();
        expect(within(dialog).getByRole('radio', { name: /Short/ })).toBeChecked();
    });
});
