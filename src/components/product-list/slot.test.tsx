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
import { DEFAULT_PRODUCT_LIST_CONFIG } from './config';
import { ProductListSlot } from './slot';

const { deferredProductGridSpy, regionSpy } = vi.hoisted(() => ({
    deferredProductGridSpy: vi.fn(),
    regionSpy: vi.fn(),
}));

vi.mock('@/components/product-grid', () => ({
    default: (props: unknown) => {
        deferredProductGridSpy(props);
        return <div data-testid="legacy-product-grid" />;
    },
}));

vi.mock('@/components/region', () => ({
    Region: (props: { errorElement?: React.ReactNode }) => {
        regionSpy(props);
        return props.errorElement;
    },
}));

describe('ProductListSlot', () => {
    beforeEach(() => {
        deferredProductGridSpy.mockClear();
        regionSpy.mockClear();
    });

    test('provides the legacy grid as the region fallback with current presentation defaults', () => {
        const runtime = {
            critical: [],
            nonCritical: Promise.resolve([]),
            nonCriticalCount: 0,
        };

        render(<ProductListSlot page={null} runtime={runtime} />);

        expect(screen.getByTestId('legacy-product-grid')).toBeInTheDocument();
        expect(deferredProductGridSpy).toHaveBeenCalledWith({
            ...runtime,
            tilePresentation: DEFAULT_PRODUCT_LIST_CONFIG,
        });
        expect(regionSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                page: null,
                regionId: 'plpProductList',
            })
        );
    });
});
