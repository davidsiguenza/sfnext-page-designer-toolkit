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
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperSearch } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import ProductCard, { ProductCardFallback, SFNextToolkitProductCardMetadata, type ProductCardProps } from './index';

const mocks = vi.hoisted(() => ({
    isDesignMode: false,
    productTile: vi.fn(),
    dynamicImageValue: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => ({ isDesignMode: mocks.isDesignMode }),
}));

vi.mock('@/components/product-tile', () => ({
    ProductTileProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    ProductTile: (props: Record<string, unknown>) => {
        mocks.productTile(props);
        return <div data-testid="shared-product-tile" className={props.className as string} />;
    },
}));

vi.mock('@/providers/dynamic-image', () => ({
    default: ({ children, value }: { children: ReactNode; value: unknown }) => {
        mocks.dynamicImageValue(value);
        return <>{children}</>;
    },
}));

const product = {
    productId: 'sku-1',
    productName: 'Selected product',
    price: 49,
    currency: 'EUR',
} as ShopperSearch.schemas['ProductSearchHit'];

const readyData = { status: 'ready', product, categoryName: 'Girls' } as const;

function lastTileProps() {
    return mocks.productTile.mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

describe('SFNext Toolkit product card metadata', () => {
    test('publishes an isolated product selector and the complete presentation contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitProductCardMetadata)).toBe('SFNextToolkit.productCard');

        const { fields } = getAttributeDefinitions(SFNextToolkitProductCardMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'productId',
            'layout',
            'imageViewType',
            'imageRatio',
            'objectFit',
            'showBadges',
            'showWishlist',
            'showQuickAdd',
            'showSwatches',
            'showBrand',
            'showCategory',
            'showProductName',
            'showSku',
            'showRating',
            'showPrice',
            'showPromotions',
            'maxSwatches',
            'additionalAttributes',
            'borderRadius',
            'boxShadow',
            'hoverEffect',
        ]);
        expect(fields.productId).toMatchObject({ type: 'product', required: true });
        expect(fields.layout).toMatchObject({
            type: 'enum',
            values: ['auto', 'vertical', 'horizontal'],
            defaultValue: 'auto',
        });
        expect(fields.imageViewType).toMatchObject({
            values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
            defaultValue: 'medium',
        });
        expect(fields.imageRatio.values).toEqual(['auto', 'square', 'portrait', 'landscape']);
    });
});

describe('SFNext Toolkit product card rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isDesignMode = false;
    });

    test('reuses ProductTile with normalized PLP fields, category, ratio and responsive DIS hints', () => {
        const { container } = render(
            <ProductCard
                data={readyData}
                layout="auto"
                imageViewType="large"
                imageRatio="portrait"
                objectFit="contain"
                showBadges={false}
                showWishlist={false}
                showQuickAdd={false}
                showSwatches={false}
                showBrand={false}
                showCategory
                showProductName
                showSku={false}
                showRating={false}
                showPrice
                showPromotions={false}
                maxSwatches={5}
                additionalAttributes="material|Material"
            />
        );

        expect(screen.getByTestId('shared-product-tile')).toBeInTheDocument();
        expect(lastTileProps()).toMatchObject({
            product,
            topCategoryName: 'Girls',
            imgAspectRatio: 0.8,
            objectFit: 'contain',
            borderRadius: 'xl',
            boxShadow: 'sm',
            hoverEffect: 'default',
            tilePresentation: {
                imageViewType: 'large',
                showBadges: false,
                showWishlist: false,
                showQuickAdd: false,
                showSwatches: false,
                showBrand: false,
                showCategory: true,
                showProductName: true,
                showSku: false,
                showRating: false,
                showPrice: true,
                showPromotions: false,
                maxSwatches: 5,
                additionalAttributes: [{ id: 'c_material', label: 'Material' }],
            },
        });
        expect(lastTileProps().className).toContain('@min-[40rem]/product-card:!grid');
        expect(container.querySelector('[data-slot="sfnext-toolkit-product-card"]')).toHaveAttribute(
            'data-layout',
            'auto'
        );
        expect(mocks.dynamicImageValue).toHaveBeenCalledWith({
            widths: ['100vw', '100vw', '50vw', '50vw', '40vw', '33vw'],
        });
    });

    test.each([
        ['vertical', undefined],
        ['horizontal', '!grid'],
        ['invalid', '@min-[40rem]/product-card:!grid'],
    ])('normalizes the %s layout without viewport-coupled rendering', (layout, expectedClass) => {
        const { unmount } = render(<ProductCard data={readyData} layout={layout} />);
        const tileClass = lastTileProps().className as string | undefined;

        if (expectedClass) expect(tileClass).toContain(expectedClass);
        else expect(tileClass).toBeUndefined();

        unmount();
    });

    test('normalizes invalid image and appearance options to safe defaults', () => {
        render(
            <ProductCard
                data={readyData}
                imageViewType="thumbnail"
                imageRatio="cinema"
                objectFit="invalid"
                borderRadius="circle"
                boxShadow="huge"
                hoverEffect="spin"
            />
        );

        expect(lastTileProps()).toMatchObject({
            imgAspectRatio: undefined,
            objectFit: 'cover',
            borderRadius: 'xl',
            boxShadow: 'sm',
            hoverEffect: 'default',
            tilePresentation: expect.objectContaining({ imageViewType: 'medium' }),
        });
    });

    test('renders no storefront markup without a product and a useful empty state only in design mode', () => {
        const live = render(<ProductCard data={{ status: 'unconfigured', product: null }} />);
        expect(live.container).toBeEmptyDOMElement();
        live.unmount();

        mocks.isDesignMode = true;
        const authoring = render(<ProductCard data={{ status: 'unconfigured', product: null }} />);
        expect(screen.getByRole('status')).toHaveAttribute('data-status', 'unconfigured');
        expect(screen.getByText('Select a product')).toBeInTheDocument();
        authoring.unmount();

        render(<ProductCard data={{ status: 'not-found', product: null }} />);
        expect(screen.getByRole('status')).toHaveAttribute('data-status', 'not-found');
        expect(screen.getByText('Product unavailable')).toBeInTheDocument();
    });

    test('supports direct product usage and consumes Page Designer props instead of leaking them to the DOM', () => {
        const props: ProductCardProps = {
            product,
            productId: 'sku-1',
            regionId: 'content',
            componentData: {},
            designMetadata: {
                id: 'component-1',
                isFragment: false,
                isVisible: true,
                isLocalized: true,
            },
            'aria-label': 'Featured product',
        };
        const { container } = render(<ProductCard {...props} />);

        const wrapper = container.querySelector('[data-slot="sfnext-toolkit-product-card"]');
        expect(wrapper).toHaveAttribute('aria-label', 'Featured product');
        expect(wrapper).not.toHaveAttribute('productId');
        expect(wrapper).not.toHaveAttribute('regionId');
    });

    test('provides a stable, ratio-aware fallback', () => {
        const { container } = render(<ProductCardFallback layout="horizontal" imageRatio="landscape" />);
        const fallback = container.querySelector('[data-slot="sfnext-toolkit-product-card-fallback"]');

        expect(fallback).toHaveAttribute('data-layout', 'horizontal');
        expect(fallback).toHaveClass('!grid');
        expect(fallback?.querySelector('[data-slot="skeleton"]')).toHaveClass('aspect-[4/3]');
    });
});
