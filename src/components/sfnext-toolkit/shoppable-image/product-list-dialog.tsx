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
import { useTranslation } from 'react-i18next';
import type { ShopperSearch } from '@/scapi';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import ProductPrice from '@/components/product-price';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createProductUrl } from '@/lib/product/product-utils';
import { cn } from '@/lib/utils';

type ProductHit = ShopperSearch.schemas['ProductSearchHit'];

const getProductImage = (product: ProductHit): string | undefined =>
    product.image?.disBaseLink ||
    product.image?.link ||
    product.imageGroups?.[0]?.images?.[0]?.disBaseLink ||
    product.imageGroups?.[0]?.images?.[0]?.link;

const isProductAvailable = (product: ProductHit): boolean => product.orderable !== false && product.inStock !== false;

export interface ShoppableProductListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: ProductHit[];
    currency?: string;
    title: string;
    onQuickView: (productId: string, returnFocusTarget: HTMLButtonElement) => void;
}

export default function ShoppableProductListDialog({
    open,
    onOpenChange,
    products,
    currency,
    title,
    onQuickView,
}: ShoppableProductListDialogProps) {
    const { t } = useTranslation('product');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{t('selectProduct')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2" data-slot="shoppable-image-product-list">
                    {products.map((product) => {
                        const image = getProductImage(product);
                        const available = isProductAvailable(product);

                        return (
                            <article
                                key={product.productId}
                                className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 rounded-ui border border-border bg-card p-3 text-card-foreground">
                                {image ? (
                                    <DynamicImage
                                        src={image}
                                        alt=""
                                        widths={[96]}
                                        loading="lazy"
                                        className="aspect-[4/5] w-full overflow-hidden rounded-sm [&_picture]:block [&_picture]:h-full"
                                        imageProps={{ className: 'h-full w-full object-cover' }}
                                    />
                                ) : (
                                    <div className="aspect-[4/5] rounded-sm bg-muted" aria-hidden="true" />
                                )}
                                <div className="flex min-w-0 flex-col items-start gap-2">
                                    <Link
                                        to={createProductUrl(product.productId)}
                                        className="line-clamp-2 text-sm font-semibold underline-offset-4 hover:underline">
                                        {product.productName}
                                    </Link>
                                    {currency ? (
                                        <ProductPrice
                                            product={product}
                                            currency={currency}
                                            hidePromo
                                            className="text-sm"
                                        />
                                    ) : null}
                                    <span
                                        className={cn(
                                            'text-xs font-medium',
                                            available ? 'text-success' : 'text-destructive'
                                        )}>
                                        {available ? t('inStock') : t('outOfStockLabel')}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-auto"
                                        onClick={(event) => onQuickView(product.productId, event.currentTarget)}>
                                        {t('quickAdd')}
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
