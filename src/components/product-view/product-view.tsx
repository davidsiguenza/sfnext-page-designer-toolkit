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
import { type ReactElement, type ReactNode } from 'react';
import type { ShopperProducts } from '@/scapi';
import ImageGallery from '@/components/image-gallery';
import ProductInfo from './product-info';
import ProductCartActions from '@/components/product-cart-actions';
import ProductViewProvider from '@/providers/product-view';
import { useProductImages } from '@/hooks/product/use-product-images';
import { useSelectedVariations } from '@/hooks/product/use-selected-variations';
import { isProductSet, isProductBundle } from '@/lib/product/product-utils';
import CollapsibleHtmlSection from '@/components/collapsible-section/collapsible-html-section';
import { useTranslation } from 'react-i18next';
import { UITarget } from '@/targets/ui-target';
import {
    normalizePdpLayoutConfig,
    type PdpColumnRatio,
    type PdpLayoutComponentAttributes,
} from '@/components/sfnext-toolkit/pdp-layout/config';
import { cn } from '@/lib/utils';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';

interface ProductViewProps {
    product: ShopperProducts.schemas['Product'];
    mode?: 'add' | 'edit';
    /** Page Designer tools rendered beside the product selectors, before the cart actions. */
    productToolsSlot?: ReactNode;
    /** Normalized Page Designer layout controls. Missing or invalid values preserve the standard PDP. */
    layout?: PdpLayoutComponentAttributes;
}

const MEDIA_LEFT_GRID_CLASSES: Record<PdpColumnRatio, string> = {
    '50-50': 'lg:grid-cols-2',
    '60-40': 'lg:grid-cols-[3fr_2fr]',
    '65-35': 'lg:grid-cols-[13fr_7fr]',
    '70-30': 'lg:grid-cols-[7fr_3fr]',
};

const MEDIA_RIGHT_GRID_CLASSES: Record<PdpColumnRatio, string> = {
    '50-50': 'lg:grid-cols-2',
    '60-40': 'lg:grid-cols-[2fr_3fr]',
    '65-35': 'lg:grid-cols-[7fr_13fr]',
    '70-30': 'lg:grid-cols-[3fr_7fr]',
};

const GALLERY_WIDTHS: Record<PdpColumnRatio, { base: '100vw'; lg: string; '2xl': number }> = {
    '50-50': { base: '100vw', lg: '50vw', '2xl': 680 },
    '60-40': { base: '100vw', lg: '60vw', '2xl': 820 },
    '65-35': { base: '100vw', lg: '65vw', '2xl': 880 },
    '70-30': { base: '100vw', lg: '70vw', '2xl': 950 },
};

/**
 * ProductView component renders a complete product detail view with image gallery and product information.
 *
 * @param props - The component props
 * @param props.product - The product data from Salesforce Commerce Cloud containing all product details,
 *                        variants, pricing, and metadata
 *
 * @returns A React element containing the complete product view layout
 *
 * @example
 * ```tsx
 * <ProductView product={productData} />
 * ```
 */
export default function ProductView({ product, productToolsSlot, layout }: ProductViewProps): ReactElement {
    const { isDesignMode } = usePageDesignerMode();
    // Calculate directly without useMemo since these are simple operations
    const isProductASet = isProductSet(product);
    const isProductABundle = isProductBundle(product);

    // Get selected attributes from URL parameters for image gallery
    const selectedAttributes = useSelectedVariations({ product });
    const { galleryImages } = useProductImages({
        product,
        selectedAttributes,
    });

    const { t } = useTranslation('product');
    const resolvedLayout = normalizePdpLayoutConfig(layout);
    const mediaOnRight = resolvedLayout.mediaSide === 'right';
    const galleryUsesStrip = resolvedLayout.galleryPresentation === 'strip';
    const galleryUsesCarousel = resolvedLayout.galleryPresentation === 'carousel';
    const stickyProductInfo = resolvedLayout.stickyProductInfo && !isDesignMode;

    return (
        <ProductViewProvider product={product} mode="add">
            <div
                data-slot="product-view-layout"
                data-column-ratio={resolvedLayout.desktopColumnRatio}
                data-media-side={resolvedLayout.mediaSide}
                data-gallery-presentation={resolvedLayout.galleryPresentation}
                className={cn(
                    'grid grid-cols-1 gap-4 lg:gap-12',
                    (mediaOnRight ? MEDIA_RIGHT_GRID_CLASSES : MEDIA_LEFT_GRID_CLASSES)[
                        resolvedLayout.desktopColumnRatio
                    ]
                )}>
                {/* Left Column - Image Gallery + Description */}
                <div data-slot="product-view-media" className={cn('order-1', mediaOnRight && 'lg:order-2')}>
                    <ImageGallery
                        key={product.id}
                        images={galleryImages}
                        eager={!isProductASet && !isProductABundle}
                        showNavigationArrows
                        navigationArrowSize="lg"
                        horizontalThumbnails={galleryUsesStrip}
                        showThumbnails={!galleryUsesCarousel}
                        widths={
                            resolvedLayout.desktopColumnRatio === '50-50'
                                ? undefined
                                : { main: GALLERY_WIDTHS[resolvedLayout.desktopColumnRatio] }
                        }
                        productName={product.name}
                    />
                    <UITarget targetId="sfcc.pdp.agent.productHelper" />
                    {product.longDescription && product.longDescription !== product.shortDescription && (
                        <CollapsibleHtmlSection
                            label={`${t('description')}:`}
                            content={product.longDescription}
                            contentType="bulleted-list"
                            defaultOpen
                            className="mt-6"
                        />
                    )}
                </div>

                {/* Right Column - Product Info */}
                <div
                    data-slot="product-view-information"
                    className={cn(
                        'order-2',
                        mediaOnRight && 'lg:order-1',
                        stickyProductInfo && 'lg:sticky lg:self-start'
                    )}
                    style={stickyProductInfo ? { top: 'calc(var(--header-height, 0px) + 1rem)' } : undefined}>
                    <ProductInfo product={product} />
                    {productToolsSlot}
                    <ProductCartActions product={product} />
                    <UITarget targetId="sfcc.pdp.returnsWarranty" />
                    {/* @sfdc-extension-block-start SFDC_EXT_SHIPPING_DELIVERY */}
                    <UITarget targetId="sfcc.pdp.estimatedDelivery" />
                    {/* @sfdc-extension-block-end SFDC_EXT_SHIPPING_DELIVERY */}
                    <UITarget targetId="sfcc.pdp.collapsibles" />
                </div>
            </div>
        </ProductViewProvider>
    );
}
