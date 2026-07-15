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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { DEFAULT_PRODUCT_LIST_CONFIG, ProductImageViewType } from './config';
import ProductList, { ProductListMetadata } from './index';
import { ProductListRuntimeProvider } from './runtime-context';

const { deferredProductGridSpy } = vi.hoisted(() => ({
    deferredProductGridSpy: vi.fn(),
}));

vi.mock('@/components/product-grid', () => ({
    default: (props: unknown) => {
        deferredProductGridSpy(props);
        return <div data-testid="deferred-product-grid" />;
    },
}));

describe('ProductList Page Designer component', () => {
    beforeEach(() => {
        deferredProductGridSpy.mockClear();
    });

    test('exposes merchant-friendly metadata for all presentation controls', () => {
        const { fields } = getAttributeDefinitions(ProductListMetadata.prototype);

        expect(Object.keys(fields)).toEqual([
            'imageViewType',
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
        ]);
        expect(fields.imageViewType).toMatchObject({
            name: 'Tipo de imagen',
            type: 'enum',
            values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
            defaultValue: 'medium',
        });
        expect(fields.additionalAttributes.type).toBe('text');
    });

    test('renders an accessible preview placeholder when no PLP runtime is available', () => {
        render(<ProductList imageViewType="large" />);

        expect(screen.getByRole('status', { name: 'Vista previa de la lista de productos' })).toHaveTextContent(
            'productos y filtros de la categoría'
        );
        expect(screen.queryByTestId('deferred-product-grid')).not.toBeInTheDocument();
    });

    test('passes normalized Page Designer attributes to the runtime product grid', () => {
        const runtime = {
            critical: [],
            nonCritical: Promise.resolve([]),
            nonCriticalCount: 0,
            hasRefinementsPanel: false,
        };

        render(
            <ProductListRuntimeProvider value={runtime}>
                <ProductList
                    imageViewType="hi-res"
                    showWishlist="false"
                    showSwatches="0"
                    maxSwatches="8"
                    additionalAttributes="material|Material"
                />
            </ProductListRuntimeProvider>
        );

        expect(screen.getByTestId('deferred-product-grid')).toBeInTheDocument();
        expect(deferredProductGridSpy).toHaveBeenCalledWith({
            ...runtime,
            tilePresentation: {
                ...DEFAULT_PRODUCT_LIST_CONFIG,
                imageViewType: ProductImageViewType.HI_RES,
                showWishlist: false,
                showSwatches: false,
                maxSwatches: 8,
                additionalAttributes: [{ id: 'c_material', label: 'Material' }],
            },
        });
    });
});
