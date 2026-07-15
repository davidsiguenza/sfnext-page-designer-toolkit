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
import { type ImgHTMLAttributes, type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/components/link';
import type { ShopperSearch } from '@/scapi';
import { createProductUrl } from '@/lib/product/product-utils';
import { ProductImageViewType } from '@/components/product-list/config';
import { useDynamicImageContext } from '@/providers/dynamic-image';
import { ProductImage } from './product-image';
import ImageNavArrows from '@/components/image-nav-arrows';
import { useTranslation } from 'react-i18next';
import { logPlpImageDebug } from './debug.client';
import { selectProductImages } from './selection';

interface ProductImageContainerProps {
    product: ShopperSearch.schemas['ProductSearchHit'];
    selectedColorValue?: string | null;
    className?: string;
    handleProductClick?: (product: ShopperSearch.schemas['ProductSearchHit']) => void;
    /** Image aspect ratio (width/height). If provided, calculates height based on viewport width. Defaults to 1 (square) */
    imgAspectRatio?: number;
    /** Show prev/next navigation arrows when multiple images are available */
    showNavigationArrows?: boolean;
    /** Catalog image view type to use. Falls back within this type only. */
    imageViewType?: ProductImageViewType;
}

const ProductImageContainer = ({
    product,
    selectedColorValue = null,
    className,
    handleProductClick,
    imgAspectRatio = 1,
    showNavigationArrows = false,
    imageViewType = ProductImageViewType.MEDIUM,
}: ProductImageContainerProps) => {
    const { t } = useTranslation('product');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const selection = useMemo(
        () => selectProductImages(product, imageViewType, selectedColorValue),
        [imageViewType, product, selectedColorValue]
    );
    const allImages = selection.images;
    const currentImage = allImages[selectedImageIndex] ?? allImages[0];
    const currentImageUrl = currentImage?.disBaseLink || currentImage?.link;
    const imageAltFallback = product.productName || t('imageAlt') || 'Product Image';

    const debugPayload = useMemo(
        () => ({
            productId: product.productId,
            productName: product.productName,
            requestedViewType: String(imageViewType),
            selectedColorValue,
            availableGroups: (product.imageGroups ?? []).map((group) => ({
                viewType: group.viewType,
                colors:
                    group.variationAttributes?.find(({ id }) => id === 'color')?.values?.map(({ value }) => value) ??
                    [],
                imageCount: group.images.length,
                firstImageUrl: group.images[0]?.disBaseLink || group.images[0]?.link,
            })),
            selectionStrategy: selection.strategy,
            selectedGroupViewType: selection.group?.viewType,
            selectedImageIndex,
            rawLink: currentImage?.link,
            rawDisBaseLink: currentImage?.disBaseLink,
            sourcePassedToDynamicImage: currentImageUrl,
        }),
        [
            currentImage?.disBaseLink,
            currentImage?.link,
            currentImageUrl,
            imageViewType,
            product.imageGroups,
            product.productId,
            product.productName,
            selectedColorValue,
            selectedImageIndex,
            selection.group?.viewType,
            selection.strategy,
        ]
    );

    useEffect(() => {
        logPlpImageDebug('resolved', debugPayload);
    }, [debugPayload]);

    const logRenderedImage = useCallback(
        (eventName: 'loaded' | 'error', event: SyntheticEvent<HTMLImageElement>) => {
            const image = event.currentTarget;
            logPlpImageDebug(eventName, {
                ...debugPayload,
                renderedSrc: image.src,
                renderedCurrentSrc: image.currentSrc,
                renderedSrcSet: image.srcset,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
            });
        },
        [debugPayload]
    );

    const handleImageLoad = useCallback(
        (event: SyntheticEvent<HTMLImageElement>) => logRenderedImage('loaded', event),
        [logRenderedImage]
    );
    const handleImageError = useCallback(
        (event: SyntheticEvent<HTMLImageElement>) => logRenderedImage('error', event),
        [logRenderedImage]
    );

    // Report the image URL to the dynamic image context, if available
    const imageContext = useDynamicImageContext();
    currentImageUrl && imageContext?.addSource(currentImageUrl);

    const handleClick = useCallback(() => {
        handleProductClick?.(product);
    }, [handleProductClick, product]);

    // When a non-square aspect ratio is requested, apply it via the native CSS
    // `aspect-ratio` property. The legacy padding-bottom percentage trick is not
    // used here because it conflicts with the native property and collapses the
    // image height to zero.
    const heightStyle = imgAspectRatio !== 1 ? { aspectRatio: `${imgAspectRatio}` } : {};

    return (
        <div
            className={`${showNavigationArrows ? 'group/image ' : ''}relative overflow-hidden bg-secondary/20 flex flex-col ${
                imgAspectRatio === 1 ? 'aspect-square' : ''
            } ${className || ''}`}
            style={heightStyle}>
            {/* Product Image */}
            <Link
                to={createProductUrl(product.productId, selectedColorValue)}
                onClick={handleClick}
                className="block w-full h-full flex-1"
                aria-label={t('viewProductAriaLabel', { productName: imageAltFallback }) || imageAltFallback}>
                <ProductImage
                    src={currentImageUrl || ''}
                    alt={currentImage?.alt || imageAltFallback}
                    className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                    widths={imageContext?.widths}
                    imageProps={
                        {
                            onLoad: handleImageLoad,
                            onError: handleImageError,
                            'data-plp-image-view-type': String(imageViewType),
                            'data-plp-image-selection': selection.strategy,
                            'data-plp-image-source': currentImageUrl,
                        } as ImgHTMLAttributes<HTMLImageElement>
                    }
                />
            </Link>
            {/* Navigation Arrows - visible on hover */}
            {showNavigationArrows && allImages.length > 1 && (
                <ImageNavArrows
                    imageCount={allImages.length}
                    onIndexChange={setSelectedImageIndex}
                    className="opacity-0 group-hover/image:opacity-100 transition-opacity"
                />
            )}
        </div>
    );
};

export { ProductImageContainer };
