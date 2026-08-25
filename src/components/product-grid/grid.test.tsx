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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';
import type { ShopperSearch } from '@/scapi';
import {
    DEFAULT_PRODUCT_LIST_CONFIG,
    ProductImageViewType,
    type ProductListConfig,
} from '@/components/product-list/config';
import { ConfigWrapper } from '@/test-utils/config';
import ProductGrid, { type ProductGridEditorialItem, type ProductGridPresentation } from './grid';

const { t } = getTranslation();
const productTilePresentationSpy = vi.fn();

// Render ProductTile as a minimal element that exposes all props under test as data attributes.
// This isolates the grid's own behaviour from ProductTile internals.
vi.mock('@/components/product-tile', () => ({
    ProductTile: ({
        product,
        topCategoryName,
        showPickupAvailable,
        handleProductClick,
        tilePresentation,
        className,
        style,
    }: {
        product: ShopperSearch.schemas['ProductSearchHit'];
        topCategoryName?: string;
        showPickupAvailable?: boolean;
        handleProductClick?: (p: ShopperSearch.schemas['ProductSearchHit']) => void;
        tilePresentation?: ProductListConfig;
        className?: string;
        style?: React.CSSProperties;
    }) => {
        productTilePresentationSpy(product.productId, tilePresentation);
        return (
            <div
                data-testid={`product-tile-${product.productId}`}
                data-top-category={topCategoryName ?? ''}
                data-pickup={String(showPickupAvailable ?? false)}
                className={className}
                style={style}>
                <button onClick={() => handleProductClick?.(product)}>{product.productName}</button>
            </div>
        );
    },
    ProductTileProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const dynamicImageValueSpy = vi.fn();

vi.mock('@/providers/dynamic-image', () => ({
    default: ({ children, value }: { children: React.ReactNode; value?: { widths?: string[] } }) => {
        dynamicImageValueSpy(value);
        return <>{children}</>;
    },
}));

vi.mock('@/components/category-skeleton', () => ({
    ProductTileSkeleton: () => <div data-testid="product-tile-skeleton" />,
}));

type ProductHit = ShopperSearch.schemas['ProductSearchHit'];

const makeProduct = (id: string, name: string): ProductHit => ({
    productId: id,
    productName: name,
    price: 99.99,
});

const p1 = makeProduct('p1', 'Product One');
const p2 = makeProduct('p2', 'Product Two');
const p3 = makeProduct('p3', 'Product Three');
const largeTilePresentation: ProductListConfig = {
    ...DEFAULT_PRODUCT_LIST_CONFIG,
    imageViewType: ProductImageViewType.LARGE,
};

interface RenderOptions {
    critical?: ProductHit[];
    nonCritical?: ProductHit[];
    hasRefinementsPanel?: boolean;
    handleProductClick?: (p: ProductHit) => void;
    topCategoryName?: string;
    tilePresentation?: ProductListConfig;
    gridPresentation?: ProductGridPresentation;
    editorialItems?: ProductGridEditorialItem[];
    isLoading?: boolean;
    skeletonCount?: number;
    // @sfdc-extension-line SFDC_EXT_BOPIS
    showPickupAvailable?: boolean;
}

const renderGrid = ({
    critical,
    nonCritical,
    hasRefinementsPanel,
    handleProductClick,
    topCategoryName,
    tilePresentation,
    gridPresentation,
    editorialItems,
    isLoading,
    skeletonCount,
    // @sfdc-extension-line SFDC_EXT_BOPIS
    showPickupAvailable,
}: RenderOptions = {}) => {
    return render(
        <MemoryRouter>
            <ConfigWrapper>
                <ProductGrid
                    critical={critical}
                    nonCritical={nonCritical}
                    hasRefinementsPanel={hasRefinementsPanel}
                    handleProductClick={handleProductClick}
                    topCategoryName={topCategoryName}
                    tilePresentation={tilePresentation}
                    gridPresentation={gridPresentation}
                    editorialItems={editorialItems}
                    isLoading={isLoading}
                    skeletonCount={skeletonCount}
                    // @sfdc-extension-line SFDC_EXT_BOPIS
                    showPickupAvailable={showPickupAvailable}
                />
            </ConfigWrapper>
        </MemoryRouter>
    );
};

describe('ProductGrid — critical products', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.clearAllMocks());

    test('renders all critical products', () => {
        renderGrid({ critical: [p1, p2, p3] });

        expect(screen.getByTestId('product-tile-p1')).toBeInTheDocument();
        expect(screen.getByTestId('product-tile-p2')).toBeInTheDocument();
        expect(screen.getByTestId('product-tile-p3')).toBeInTheDocument();
    });

    test('renders no tiles when critical is an empty array', () => {
        renderGrid({ critical: [] });

        expect(screen.queryByTestId(/^product-tile-p/)).not.toBeInTheDocument();
    });

    test('renders no tiles when critical is undefined', () => {
        renderGrid({ critical: undefined });

        expect(screen.queryByTestId(/^product-tile-p/)).not.toBeInTheDocument();
    });

    test('calls handleProductClick when a critical tile is clicked', async () => {
        const user = userEvent.setup();
        const handleProductClick = vi.fn();
        renderGrid({ critical: [p1, p2], handleProductClick });

        await user.click(screen.getByText('Product One'));

        expect(handleProductClick).toHaveBeenCalledOnce();
        expect(handleProductClick).toHaveBeenCalledWith(p1);
    });

    test('threads topCategoryName to every critical tile', () => {
        renderGrid({ critical: [p1, p2], topCategoryName: 'Women' });

        expect(screen.getByTestId('product-tile-p1')).toHaveAttribute('data-top-category', 'Women');
        expect(screen.getByTestId('product-tile-p2')).toHaveAttribute('data-top-category', 'Women');
    });

    test('passes empty topCategoryName when prop is omitted', () => {
        renderGrid({ critical: [p1] });

        expect(screen.getByTestId('product-tile-p1')).toHaveAttribute('data-top-category', '');
    });

    test('passes the same tile presentation to every critical tile', () => {
        renderGrid({ critical: [p1, p2], tilePresentation: largeTilePresentation });

        expect(productTilePresentationSpy).toHaveBeenCalledWith('p1', largeTilePresentation);
        expect(productTilePresentationSpy).toHaveBeenCalledWith('p2', largeTilePresentation);
    });
});

describe('ProductGrid — mixed critical and non-critical', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.clearAllMocks());

    test('renders critical products and non-critical products together', () => {
        renderGrid({ critical: [p1, p2], nonCritical: [p3] });

        expect(screen.getByTestId('product-tile-p1')).toBeInTheDocument();
        expect(screen.getByTestId('product-tile-p2')).toBeInTheDocument();
        expect(screen.getByTestId('product-tile-p3')).toBeInTheDocument();
    });

    test('does not show empty message when both critical and non-critical have products', () => {
        renderGrid({ critical: [p1], nonCritical: [p2] });

        expect(screen.queryByText(t('common:noProductsFound'))).not.toBeInTheDocument();
    });

    test('shows loading overlay while a refinement navigation is pending', () => {
        renderGrid({ critical: [p1, p2], isLoading: true });

        expect(screen.getByTestId('product-grid-loading-state')).toBeInTheDocument();
    });

    test('passes the same tile presentation to every non-critical tile', () => {
        renderGrid({ critical: [p1], nonCritical: [p2, p3], tilePresentation: largeTilePresentation });

        expect(productTilePresentationSpy).toHaveBeenCalledWith('p2', largeTilePresentation);
        expect(productTilePresentationSpy).toHaveBeenCalledWith('p3', largeTilePresentation);
    });

    test('interleaves editorial content without changing or duplicating product tiles', () => {
        renderGrid({
            critical: [p1, p2],
            nonCritical: [p3],
            gridPresentation: {
                desktopColumns: '3',
                density: 'comfortable',
                cardSurface: 'muted',
                cardView: 'editorial',
            },
            editorialItems: [
                {
                    key: 'editorial-card',
                    position: 2,
                    element: <article data-testid="editorial-card">Editorial</article>,
                },
            ],
        });

        expect(screen.getAllByTestId(/^product-tile-p/)).toHaveLength(3);
        const gridItems = Array.from(screen.getByTestId('editorial-card').parentElement?.children ?? []);
        expect(gridItems.map((item) => item.getAttribute('data-testid'))).toEqual([
            'product-tile-p1',
            'product-tile-p2',
            'editorial-card',
            'product-tile-p3',
        ]);
        expect(screen.getByTestId('editorial-card')).not.toHaveStyle({ order: 25 });

        const grid = screen.getByTestId('editorial-card').parentElement;
        expect(grid).toHaveClass('sm:grid-cols-3', 'gap-y-10');
        expect(screen.getByTestId('product-tile-p1')).toHaveClass('bg-muted', '[--ui-border-width:0px]');
    });

    test('holds out-of-range editorials until deferred product positions exist', () => {
        const editorialItems = [
            {
                key: 'late-editorial',
                position: 10,
                element: <article data-testid="late-editorial">Late editorial</article>,
            },
        ];
        const loadingView = renderGrid({ critical: [p1, p2], skeletonCount: 4, editorialItems });

        expect(screen.queryByTestId('late-editorial')).not.toBeInTheDocument();
        loadingView.unmount();

        const products = Array.from({ length: 12 }, (_, index) => makeProduct(`resolved-${index}`, `Product ${index}`));
        renderGrid({ critical: products.slice(0, 2), nonCritical: products.slice(2), editorialItems });

        expect(screen.getByTestId('late-editorial')).toBeInTheDocument();
    });

    test('prioritizes only critical product images, not interleaved editorial images', () => {
        renderGrid({
            critical: [p1, p2],
            editorialItems: [
                {
                    key: 'editorial-card',
                    position: 0,
                    element: <article data-testid="editorial-card">Editorial</article>,
                },
            ],
        });

        const prioritizedProviders = dynamicImageValueSpy.mock.calls.filter(
            ([value]) => typeof value?.hasSource === 'function'
        );
        expect(prioritizedProviders).toHaveLength(2);
    });
});

describe('ProductGrid — empty state', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.clearAllMocks());

    test('shows empty message when critical is empty and nonCritical is not provided', () => {
        renderGrid({ critical: [] });
        expect(screen.getByText(t('common:noProductsFound'))).toBeInTheDocument();
    });

    test('shows empty message when both critical and non-critical are empty', () => {
        renderGrid({ critical: [], nonCritical: [] });
        expect(screen.getByText(t('common:noProductsFound'))).toBeInTheDocument();
    });

    test('hides empty message when critical has products', () => {
        renderGrid({ critical: [p1] });
        expect(screen.queryByText(t('common:noProductsFound'))).not.toBeInTheDocument();
    });

    test('hides empty message when non-critical has products and critical is empty', () => {
        renderGrid({ critical: [], nonCritical: [p1] });
        expect(screen.queryByText(t('common:noProductsFound'))).not.toBeInTheDocument();
    });

    test('hides empty message when critical has products even if non-critical is empty', () => {
        renderGrid({ critical: [p1], nonCritical: [] });
        expect(screen.queryByText(t('common:noProductsFound'))).not.toBeInTheDocument();
    });

    test('uses refinement-aware image widths when hasRefinementsPanel is true', () => {
        dynamicImageValueSpy.mockClear();
        renderGrid({ critical: [p1], hasRefinementsPanel: true });
        expect(dynamicImageValueSpy).toHaveBeenCalledWith(
            expect.objectContaining({ widths: ['40vw', '25vw', '18vw', '14vw', '16vw', '16vw'] })
        );
    });

    test('uses full-width image widths when hasRefinementsPanel is false', () => {
        dynamicImageValueSpy.mockClear();
        renderGrid({ critical: [p1], hasRefinementsPanel: false });
        expect(dynamicImageValueSpy).toHaveBeenCalledWith(
            expect.objectContaining({ widths: ['40vw', '25vw', '18vw', '18vw', '20vw', '20vw'] })
        );
    });
});

describe('ProductGrid — skeleton placeholders', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.clearAllMocks());

    test('renders trailing skeletons when skeletonCount is provided', () => {
        renderGrid({ critical: [p1], skeletonCount: 4 });

        expect(screen.getByTestId('product-tile-p1')).toBeInTheDocument();
        expect(screen.getAllByTestId('product-tile-skeleton')).toHaveLength(4);
    });

    test('does not render skeletons when skeletonCount is 0', () => {
        renderGrid({ critical: [p1], skeletonCount: 0 });

        expect(screen.getByTestId('product-tile-p1')).toBeInTheDocument();
        expect(screen.queryByTestId('product-tile-skeleton')).not.toBeInTheDocument();
    });

    test('does not show empty message when skeletonCount is provided', () => {
        renderGrid({ critical: [], skeletonCount: 4 });

        expect(screen.queryByText(t('common:noProductsFound'))).not.toBeInTheDocument();
    });
});

// @sfdc-extension-block-start SFDC_EXT_BOPIS
describe('ProductGrid — BOPIS showPickupAvailable', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.clearAllMocks());

    test('passes showPickupAvailable=false to tiles by default', () => {
        renderGrid({ critical: [p1, p2], showPickupAvailable: false });

        expect(screen.getByTestId('product-tile-p1')).toHaveAttribute('data-pickup', 'false');
        expect(screen.getByTestId('product-tile-p2')).toHaveAttribute('data-pickup', 'false');
    });

    test('passes showPickupAvailable=true to critical tiles', () => {
        renderGrid({ critical: [p1, p2], showPickupAvailable: true });

        expect(screen.getByTestId('product-tile-p1')).toHaveAttribute('data-pickup', 'true');
        expect(screen.getByTestId('product-tile-p2')).toHaveAttribute('data-pickup', 'true');
    });

    test('passes showPickupAvailable=true to non-critical tiles', () => {
        renderGrid({
            critical: [],
            nonCritical: [p1, p2],
            showPickupAvailable: true,
        });

        expect(screen.getByTestId('product-tile-p1')).toHaveAttribute('data-pickup', 'true');
        expect(screen.getByTestId('product-tile-p2')).toHaveAttribute('data-pickup', 'true');
    });
});
// @sfdc-extension-block-end SFDC_EXT_BOPIS
