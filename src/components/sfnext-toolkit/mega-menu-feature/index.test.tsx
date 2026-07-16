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

import type { ComponentProps, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperProducts } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { MegaMenuNavigateProvider } from '../mega-menu/context';
import MegaMenuFeature, {
    MegaMenuFeatureFallback,
    SFNextToolkitMegaMenuFeatureMetadata,
    type MegaMenuFeatureProps,
} from './index';

const mocks = vi.hoisted(() => ({
    isDesignMode: false,
    dynamicImage: vi.fn(),
    productPrice: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: mocks.isDesignMode }),
    };
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@/components/dynamic-image', () => ({
    DynamicImage: (props: {
        src: string;
        alt?: string;
        imageProps?: { className?: string; style?: Record<string, unknown> };
    }) => {
        mocks.dynamicImage(props);
        return <img data-testid="feature-image" src={props.src} alt={props.alt} style={props.imageProps?.style} />;
    },
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children, ...props }: { to: string; children: ReactNode } & ComponentProps<'a'>) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/product-price', () => ({
    default: (props: Record<string, unknown>) => {
        mocks.productPrice(props);
        return <span data-testid="product-price">€59.00</span>;
    },
}));

const product = {
    id: 'sku-1',
    name: 'Source product',
    price: 59,
    currency: 'EUR',
} as ShopperProducts.schemas['Product'];

const readyProductData = {
    status: 'ready',
    item: {
        sourceType: 'product',
        sourceId: 'sku-1',
        title: 'Source title',
        copy: 'Source copy',
        eyebrow: 'Source eyebrow',
        destination: '/product/sku-1',
        image: {
            src: '/source.jpg',
            alt: 'Source alt',
            requestedViewType: 'hi-res',
            resolvedViewType: 'large',
        },
        product,
        currency: 'EUR',
    },
} as const;

describe('SFNext Toolkit mega menu feature metadata', () => {
    test('publishes every supported source and the portable presentation contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitMegaMenuFeatureMetadata)).toBe(
            'SFNextToolkit.megaMenuFeature'
        );

        const { fields } = getAttributeDefinitions(SFNextToolkitMegaMenuFeatureMetadata.prototype);
        expect(Object.keys(fields)).toEqual([
            'sourceType',
            'category',
            'product',
            'contentId',
            'cmsRecord',
            'imageViewType',
            'eyebrow',
            'title',
            'copy',
            'imageOverride',
            'imageAlt',
            'decorativeImage',
            'badge',
            'ctaLabel',
            'ctaUrl',
            'openInNewWindow',
            'showProductPrice',
            'layout',
            'imageRatio',
            'objectFit',
            'tone',
            'titleAttribute',
            'excerptAttribute',
            'imageAttribute',
            'imageAltAttribute',
            'linkAttribute',
            'eyebrowAttribute',
        ]);
        expect(fields.sourceType).toMatchObject({
            type: 'enum',
            values: ['category', 'product', 'content', 'cms', 'custom'],
            defaultValue: 'custom',
        });
        expect(fields.category.type).toBe('category');
        expect(fields.product.type).toBe('product');
        expect(fields.cmsRecord.type).toBe('cms_record');
        expect(fields.imageOverride.type).toBe('image');
        expect(fields.decorativeImage).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.imageViewType).toMatchObject({
            values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
            defaultValue: 'medium',
        });
    });
});

describe('SFNext Toolkit mega menu feature rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isDesignMode = false;
    });

    test('applies authored overrides, focal point and responsive image settings ahead of source defaults', () => {
        const onNavigate = vi.fn();
        const { container } = render(
            <MegaMenuNavigateProvider onNavigate={onNavigate}>
                <MegaMenuFeature
                    sourceType="product"
                    data={readyProductData}
                    eyebrow=" Authored eyebrow "
                    title=" Authored title "
                    copy=" Authored copy "
                    imageOverride={{ url: '/override.jpg', focalPoint: { x: 0.2, y: 0.75 } }}
                    imageAlt="Authored alt"
                    badge="New"
                    ctaLabel="Shop now"
                    ctaUrl="/campaign"
                    openInNewWindow
                    layout="overlay"
                    imageRatio="portrait"
                    objectFit="contain"
                    tone="dark"
                    aria-label="Featured campaign"
                />
            </MegaMenuNavigateProvider>
        );

        expect(screen.getByText('Authored eyebrow')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Authored title' })).toBeInTheDocument();
        expect(screen.getByText('Authored copy')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Shop now')).toBeInTheDocument();
        expect(screen.queryByText('Source title')).not.toBeInTheDocument();
        expect(screen.getByTestId('feature-image')).toHaveAttribute('src', '/override.jpg');
        expect(screen.getByTestId('feature-image')).toHaveAttribute('alt', 'Authored alt');
        expect(screen.getByTestId('feature-image')).toHaveStyle({ objectPosition: '20% 75%' });
        expect(mocks.dynamicImage).toHaveBeenCalledWith(
            expect.objectContaining({
                src: '/override.jpg',
                alt: 'Authored alt',
                loading: 'lazy',
                widths: ['100vw', '50vw', '25vw', '20vw'],
                imageProps: expect.objectContaining({ className: expect.stringContaining('object-contain') }),
            })
        );

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', '/campaign');
        expect(links[0]).toHaveAttribute('target', '_blank');
        expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
        fireEvent.click(links[0]);
        expect(onNavigate).toHaveBeenCalledTimes(1);

        const article = container.querySelector('[data-slot="sfnext-toolkit-mega-menu-feature"]');
        expect(article).toHaveAttribute('aria-label', 'Featured campaign');
        expect(article).toHaveAttribute('data-source-type', 'product');
        expect(article).toHaveAttribute('data-requested-image-type', 'hi-res');
        expect(article).toHaveAttribute('data-resolved-image-type', 'large');
        expect(article?.querySelector('[data-slot="mega-menu-feature-media"]')).toHaveClass('aspect-[3/4]');
        expect(article?.querySelector('[data-slot="mega-menu-feature-card"]')).toHaveClass('bg-foreground');
    });

    test('renders source defaults, one focusable card link and the optional product price', () => {
        render(<MegaMenuFeature sourceType="product" data={readyProductData} />);

        expect(screen.getByRole('heading', { name: 'Source title' })).toBeInTheDocument();
        expect(screen.getByText('Source copy')).toBeInTheDocument();
        expect(screen.getByText('Discover')).toBeInTheDocument();
        expect(screen.getByTestId('product-price')).toBeInTheDocument();
        expect(mocks.productPrice).toHaveBeenCalledWith(
            expect.objectContaining({ product, currency: 'EUR', hidePromo: true })
        );
        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(screen.getByRole('link')).toHaveAttribute('href', '/product/sku-1');
    });

    test('supports an explicitly decorative image without removing the linked card accessible name', () => {
        render(<MegaMenuFeature sourceType="product" data={readyProductData} decorativeImage imageAlt="Ignored" />);

        expect(screen.getByTestId('feature-image')).toHaveAttribute('alt', '');
        expect(screen.getByRole('link')).toHaveAccessibleName(/source title/i);
    });

    test('does not render price when disabled and rejects an unsafe destination override', () => {
        const view = render(
            <MegaMenuFeature
                sourceType="product"
                data={readyProductData}
                showProductPrice={false}
                ctaUrl={'java\nscript:alert(1)'}
            />
        );

        expect(screen.queryByTestId('product-price')).not.toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/product/sku-1');
        view.unmount();

        render(
            <MegaMenuFeature
                sourceType="custom"
                title="Safe custom card"
                ctaUrl="data:text/html,bad"
                data={{ status: 'ready', item: { sourceType: 'custom' } }}
            />
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    });

    test.each(['unconfigured', 'not-found', 'error'] as const)(
        'stays invisible in the live storefront for the %s empty state',
        (status) => {
            const { container } = render(<MegaMenuFeature data={{ status }} />);
            expect(container).toBeEmptyDOMElement();
        }
    );

    test.each([
        ['unconfigured', 'Choose a source or add custom feature content'],
        ['not-found', 'Selected feature content is unavailable'],
        ['error', 'Feature content could not be loaded'],
    ] as const)('shows an authoring-only %s status with useful guidance', (status, message) => {
        mocks.isDesignMode = true;
        render(<MegaMenuFeature data={{ status }} />);

        expect(screen.getByRole('status')).toHaveAttribute('data-status', status);
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('normalizes invalid visual options and consumes Page Designer-only props', () => {
        const props: MegaMenuFeatureProps = {
            title: 'Portable card',
            layout: 'floating',
            imageRatio: 'cinema',
            objectFit: 'stretch',
            tone: 'neon',
            componentData: {},
            regionId: 'feature',
            designMetadata: { id: 'feature-1', isFragment: false, isVisible: true, isLocalized: true },
        };
        const { container } = render(<MegaMenuFeature {...props} />);
        const article = container.querySelector('[data-slot="sfnext-toolkit-mega-menu-feature"]');

        expect(article?.querySelector('[data-slot="mega-menu-feature-media"]')).toHaveClass('aspect-[4/3]');
        expect(article?.querySelector('[data-slot="mega-menu-feature-card"]')).toHaveClass('bg-card');
        expect(article).not.toHaveAttribute('componentData');
        expect(article).not.toHaveAttribute('regionId');
        expect(article).not.toHaveAttribute('designMetadata');
    });

    test('provides a stable ratio-aware loading fallback', () => {
        const { container } = render(<MegaMenuFeatureFallback imageRatio="square" />);
        const fallback = container.querySelector('[data-slot="sfnext-toolkit-mega-menu-feature-fallback"]');

        expect(fallback).toHaveAttribute('aria-hidden', 'true');
        expect(fallback?.querySelector('[data-slot="skeleton"]')).toHaveClass('aspect-square');
    });
});
