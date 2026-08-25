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
import type { ImgHTMLAttributes, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperSearch } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import ShoppableImage, { SFNextToolkitShoppableImageMetadata, ShoppableImageFallback } from './index';
import type { ShoppableImageLoaderData } from './loaders';

const mocks = vi.hoisted(() => ({
    isDesignMode: false,
    modalProps: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => ({ isDesignMode: mocks.isDesignMode, isPreviewMode: false }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) =>
            ({
                inStock: 'In stock',
                outOfStockLabel: 'Out of stock',
                quickAdd: 'Quick Add',
                selectProduct: 'Select a product',
            })[key] ?? key,
    }),
}));

vi.mock('@/components/product-price', () => ({
    default: ({ product, currency }: { product: ShopperSearch.schemas['ProductSearchHit']; currency: string }) => (
        <span>{`${product.price} ${currency}`}</span>
    ),
}));

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: ({
        src,
        alt,
        imageProps,
        className,
        loading,
    }: {
        src: string;
        alt?: string;
        imageProps?: ImgHTMLAttributes<HTMLImageElement>;
        className?: string;
        loading?: HTMLImageElement['loading'];
    }) => (
        <span data-testid="dynamic-image" className={className}>
            <img src={src} alt={alt} loading={loading} {...imageProps} />
        </span>
    ),
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/hooks/use-navigate', () => ({
    useNavigate: () => mocks.navigate,
}));

vi.mock('@/components/cart-item-modal', () => ({
    CartItemModal: (props: Record<string, unknown>) => {
        mocks.modalProps(props);
        return props.open ? (
            <div data-testid="quick-view">
                Quick view {String(props.productId)}
                <button type="button" onClick={() => (props.onOpenChange as (open: boolean) => void)(false)}>
                    Close test quick view
                </button>
            </div>
        ) : null;
    },
}));

const products = [
    {
        productId: 'sku-hat',
        productName: 'Knitted hat',
        price: 19.95,
        currency: 'EUR',
        orderable: true,
        inStock: true,
        image: { link: '/hat.jpg' },
    },
    {
        productId: 'sku-dress',
        productName: 'Printed dress',
        price: 49.95,
        currency: 'EUR',
        orderable: false,
        inStock: false,
        image: { link: '/dress.jpg' },
    },
] as ShopperSearch.schemas['ProductSearchHit'][];

const baseData: ShoppableImageLoaderData = {
    status: 'ready',
    currency: 'EUR',
    config: {
        version: 1,
        sourceMode: 'manual',
        hotspots: [
            { id: 'hat', productId: 'sku-hat', x: 22, y: 14, mobileX: 30, mobileY: 18 },
            { id: 'dress', productId: 'sku-dress', x: 52, y: 50 },
        ],
    },
    hotspots: [
        { id: 'hat', productId: 'sku-hat', x: 22, y: 14, mobileX: 30, mobileY: 18, product: products[0] },
        { id: 'dress', productId: 'sku-dress', x: 52, y: 50, product: products[1] },
    ],
    products,
    invalidProductIds: [],
};

function renderComponent(node: ReactNode) {
    return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('SFNext Toolkit shoppable image metadata', () => {
    test('publishes the native image, visual editor and presentation contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitShoppableImageMetadata)).toBe(
            'SFNextToolkit.shoppableImage'
        );
        const { fields } = getAttributeDefinitions(SFNextToolkitShoppableImageMetadata.prototype);
        expect(fields.desktopImage).toMatchObject({ id: 'desktopImage', type: 'image', required: true });
        expect(fields.mobileImage).toMatchObject({ id: 'mobileImage', type: 'image' });
        expect(fields.hotspotConfig).toMatchObject({
            id: 'hotspotConfig',
            type: 'custom',
            required: true,
            editorDefinition: {
                type: 'SFNextToolkit.shoppableHotspots',
                configuration: {
                    schemaVersion: 1,
                    maxHotspots: 12,
                },
            },
        });
        expect(fields.hotspotTheme.values).toEqual(['light', 'dark', 'brand']);
        expect(fields.revealHotspotsOnInteraction).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.showContentPanel).toMatchObject({ type: 'boolean', defaultValue: true });
        expect(fields.showViewAllButton).toMatchObject({ type: 'boolean', defaultValue: true });
    });
});

describe('SFNext Toolkit shoppable image rendering', () => {
    beforeEach(() => {
        mocks.isDesignMode = false;
        mocks.modalProps.mockClear();
        mocks.navigate.mockClear();
    });

    test('renders normalized desktop/mobile positions and accessible 44px hotspot buttons', () => {
        const { container } = renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                mobileImage="/campaign-mobile.jpg"
                altText="Child wearing an autumn outfit"
                data={baseData}
            />
        );

        const campaignImages = screen.getAllByAltText('Child wearing an autumn outfit');
        expect(campaignImages[0]).toHaveAttribute('src', '/campaign.jpg');
        expect(campaignImages[1]).toHaveAttribute('src', '/campaign-mobile.jpg');
        const buttons = screen.getAllByRole('button', { name: /Quick Add:/ });
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveClass('size-11');
        expect(buttons[0].parentElement).toHaveClass('hover:z-30', 'focus-within:z-30');
        expect(buttons[0].parentElement?.style.getPropertyValue('--hotspot-x-desktop')).toBe('22%');
        expect(buttons[0].parentElement?.style.getPropertyValue('--hotspot-x-mobile')).toBe('30%');
        expect(buttons[1]).toHaveAccessibleName(/Printed dress. Out of stock/);
        expect(container.querySelector('[data-slot="shoppable-image-editorial-panel"]')).toHaveClass(
            'rounded-b-ui',
            'border-t'
        );
        expect(screen.getByRole('button', { name: 'View all products' })).toBeInTheDocument();

        const tooltips = screen.getAllByRole('tooltip');
        expect(tooltips[0]).toHaveAttribute('data-horizontal-placement', 'left');
        expect(tooltips[0]).toHaveAttribute('data-vertical-placement', 'below');
        expect(tooltips[1]).toHaveAttribute('data-horizontal-placement', 'center');
        expect(tooltips[1]).toHaveAttribute('data-vertical-placement', 'above');
        expect(container.querySelector('[data-slot="shoppable-image-media"]')).not.toHaveClass('overflow-hidden');
    });

    test('resolves native Page Designer image values', () => {
        renderComponent(
            <ShoppableImage
                desktopImage={{ url: '/content/campaign.jpg' }}
                mobileImage={{ path: '/content/campaign-mobile.jpg' }}
                altText="Campaign"
                data={baseData}
            />
        );

        const campaignImages = screen.getAllByAltText('Campaign');
        expect(campaignImages[0]).toHaveAttribute('src', '/content/campaign.jpg');
        expect(campaignImages[1]).toHaveAttribute('src', '/content/campaign-mobile.jpg');
    });

    test('never publishes authoring-only preview URLs as campaign media', () => {
        const { container } = renderComponent(
            <ShoppableImage
                data={{
                    ...baseData,
                    config: {
                        ...baseData.config,
                        desktopPreviewUrl: 'https://preview.example.test/campaign.jpg',
                    },
                }}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    test('keeps the campaign image and editorial copy visible while catalog data loads', () => {
        renderComponent(
            <ShoppableImageFallback
                desktopImage={{ url: '/content/campaign.jpg' }}
                mobileImage={{ path: '/content/campaign-mobile.jpg' }}
                altText="Autumn campaign"
                heading="Shop the look"
                description="Products are loading."
            />
        );

        const campaignImages = screen.getAllByAltText('Autumn campaign');
        expect(campaignImages[0]).toHaveAttribute('src', '/content/campaign.jpg');
        expect(campaignImages[1]).toHaveAttribute('src', '/content/campaign-mobile.jpg');
        expect(screen.getByRole('heading', { name: 'Shop the look' })).toBeInTheDocument();
        expect(screen.getByText('Products are loading.')).toBeInTheDocument();
        expect(document.querySelector('[data-slot="sfnext-toolkit-shoppable-image-fallback"]')).toHaveAttribute(
            'aria-busy',
            'true'
        );
        expect(document.querySelector('[data-slot="shoppable-image-editorial-panel"]')).toHaveClass(
            'rounded-b-ui',
            'border-t'
        );
    });

    test('can hide the complete editorial panel without removing image hotspots', () => {
        const { container } = renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                altText="Campaign"
                heading="Shop the look"
                description="Editorial description"
                showContentPanel={false}
                data={baseData}
            />
        );

        expect(screen.getByAltText('Campaign')).toHaveClass('rounded-ui');
        expect(screen.getAllByRole('button', { name: /Quick Add:/ })).toHaveLength(2);
        expect(container.querySelector('[data-slot="shoppable-image-editorial-panel"]')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Shop the look' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'View all products' })).not.toBeInTheDocument();
    });

    test('can keep editorial copy while hiding only the view-all action', () => {
        renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                heading="Shop the look"
                showViewAllButton={false}
                data={baseData}
            />
        );

        expect(screen.getByRole('heading', { name: 'Shop the look' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'View all products' })).not.toBeInTheDocument();
    });

    test('reveals clean-image hotspots on hover and through the touch-friendly indicator', async () => {
        const user = userEvent.setup();
        const { container } = renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                heading="Autumn look"
                revealHotspotsOnInteraction
                data={baseData}
            />
        );

        const media = container.querySelector('[data-slot="shoppable-image-media"]');
        const hotspotRegion = container.querySelector('[data-slot="shoppable-image-hotspots"]');
        const indicator = screen.getByRole('button', { name: 'Show 2 product hotspots' });

        expect(media).toHaveAttribute('data-hotspot-visibility', 'interaction');
        expect(hotspotRegion).toHaveAttribute('aria-hidden', 'true');
        expect(hotspotRegion).toHaveClass('pointer-events-none', 'opacity-0');
        expect(hotspotRegion?.querySelectorAll('button')[0]).toHaveAttribute('tabindex', '-1');
        expect(indicator).toHaveTextContent('Autumn look');
        expect(indicator).toHaveAttribute('aria-pressed', 'false');

        await user.hover(media as HTMLElement);
        expect(hotspotRegion).toHaveAttribute('aria-hidden', 'false');
        expect(hotspotRegion?.querySelectorAll('button')[0]).toHaveAttribute('tabindex', '0');

        await user.unhover(media as HTMLElement);
        expect(hotspotRegion).toHaveAttribute('aria-hidden', 'true');

        await user.click(indicator);
        expect(indicator).toHaveAttribute('aria-pressed', 'true');
        expect(hotspotRegion).toHaveAttribute('aria-hidden', 'false');

        await user.click(screen.getByRole('button', { name: /Knitted hat/ }));
        expect(await screen.findByTestId('quick-view')).toHaveTextContent('sku-hat');
    });

    test('reveals interaction-mode hotspots before they enter the keyboard tab order', async () => {
        const user = userEvent.setup();
        const { container } = renderComponent(
            <ShoppableImage desktopImage="/campaign.jpg" revealHotspotsOnInteraction data={baseData} />
        );

        const indicator = screen.getByRole('button', { name: 'Show 2 product hotspots' });
        const hotspotRegion = container.querySelector('[data-slot="shoppable-image-hotspots"]');

        await user.tab();
        expect(indicator).toHaveFocus();
        expect(hotspotRegion).toHaveAttribute('aria-hidden', 'false');

        await user.tab();
        expect(screen.getByRole('button', { name: /Knitted hat/ })).toHaveFocus();
    });

    test('opens the standard Quick Add from pointer or keyboard activation', async () => {
        const user = userEvent.setup();
        renderComponent(<ShoppableImage desktopImage="/campaign.jpg" data={baseData} />);

        const hotspot = screen.getByRole('button', { name: /Knitted hat/ });
        hotspot.focus();
        await user.keyboard('{Enter}');

        expect(await screen.findByTestId('quick-view')).toHaveTextContent('sku-hat');
        expect(mocks.modalProps).toHaveBeenLastCalledWith(
            expect.objectContaining({ productId: 'sku-hat', open: true })
        );

        await user.click(screen.getByRole('button', { name: 'Close test quick view' }));
        await waitFor(() => expect(hotspot).toHaveFocus());
    });

    test('opens an all-products dialog in free mode with current price and availability', async () => {
        const user = userEvent.setup();
        renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                heading="Autumn look"
                viewAllLabel="View garments"
                data={baseData}
            />
        );

        await user.click(screen.getByRole('button', { name: 'View garments' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Autumn look' })).toBeInTheDocument();
        expect(screen.getAllByText('19.95 EUR').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Out of stock').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: 'Quick Add' })).toHaveLength(2);
    });

    test('offers Product Set Quick Add and PDP navigation without losing individual hotspots', async () => {
        const user = userEvent.setup();
        const setData: ShoppableImageLoaderData = {
            ...baseData,
            productSetId: 'look-set',
            productSetName: 'Complete look',
            config: { ...baseData.config, sourceMode: 'productSet', productSetId: 'look-set' },
        };
        renderComponent(
            <ShoppableImage
                desktopImage="/campaign.jpg"
                shopSetLabel="Shop look"
                viewSetLabel="View look"
                data={setData}
            />
        );

        expect(screen.getAllByRole('button', { name: /Quick Add:/ })).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'View look' })).toHaveAttribute('href', '/product/look-set');
        await user.click(screen.getByRole('button', { name: 'Shop look' }));
        expect(await screen.findByTestId('quick-view')).toHaveTextContent('look-set');
    });

    test('fails closed live and gives actionable authoring feedback', () => {
        const live = renderComponent(<ShoppableImage data={baseData} />);
        expect(live.container).toBeEmptyDOMElement();
        live.unmount();

        mocks.isDesignMode = true;
        renderComponent(<ShoppableImage data={{ ...baseData, status: 'product-set-invalid' }} />);
        expect(screen.getByRole('status')).toHaveAttribute('data-status', 'missing-image');
        expect(screen.getByText('Select an image')).toBeInTheDocument();
    });
});
