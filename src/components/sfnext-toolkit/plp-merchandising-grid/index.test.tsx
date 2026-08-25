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
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ProductListRuntimeProvider } from '@/components/product-list/runtime-context';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { getRegionDefinition } from '@/lib/decorators/region-definition';
import PLPMerchandisingGrid, { PLPMerchandisingGridMetadata } from './index';

const { deferredGridSpy, pageDesignerMode } = vi.hoisted(() => ({
    deferredGridSpy: vi.fn(),
    pageDesignerMode: { isDesignMode: false },
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: pageDesignerMode.isDesignMode, isPreviewMode: false }),
    };
});

vi.mock('@/components/product-grid', () => ({
    default: (props: { editorialItems?: Array<{ element: React.ReactNode }> }) => {
        deferredGridSpy(props);
        return <div data-testid="deferred-grid">{props.editorialItems?.map(({ element }) => element)}</div>;
    },
}));

vi.mock('@/components/region', () => ({
    Region: ({ regionId }: { regionId: string }) => <div data-testid={`region-${regionId}`} />,
}));

vi.mock('@/components/region/component', () => ({
    Component: ({ component }: { component: { id: string } }) => <article data-testid={`editorial-${component.id}`} />,
}));

vi.mock('@/hooks/use-navigate', () => ({
    useNavigate: () => vi.fn(),
}));

describe('SFNext Toolkit PLP merchandising grid', () => {
    beforeEach(() => {
        deferredGridSpy.mockClear();
        pageDesignerMode.isDesignMode = false;
    });

    test('registers layout attributes and a region restricted to editorial cards', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, PLPMerchandisingGridMetadata)).toBe(
            'SFNextToolkit.plpMerchandisingGrid'
        );
        expect(getRegionDefinition(PLPMerchandisingGridMetadata, 'editorialCards')).toMatchObject({
            maxComponents: 12,
            componentTypeInclusions: ['SFNextToolkit.editorialCard'],
        });

        const { fields } = getAttributeDefinitions(PLPMerchandisingGridMetadata.prototype);
        expect(fields.stickyControls.defaultValue).toBe(false);
        expect(fields.stickyFilters.defaultValue).toBe(false);
        expect(fields.defaultCardView.values).toEqual(['standard', 'editorial', 'compact']);
        expect(fields.allowedCardViews.values).toEqual([
            'standard-only',
            'standard-editorial',
            'standard-compact',
            'all',
        ]);
        expect(fields.cardSurface.values).toEqual(['card', 'muted', 'transparent']);
        expect(fields.desktopColumns.values).toEqual(['3', '4', '5']);
    });

    test('combines runtime products with the URL-selected card view and nested editorials', () => {
        const runtime = {
            critical: [],
            nonCritical: Promise.resolve([]),
            nonCriticalCount: 0,
        };

        render(
            <MemoryRouter initialEntries={['/category/girls?plpView=compact']}>
                <ProductListRuntimeProvider value={runtime}>
                    <PLPMerchandisingGrid
                        allowedCardViews="all"
                        defaultCardView="standard"
                        desktopColumns="3"
                        gridDensity="comfortable"
                        cardSurface="muted"
                        showSku={false}
                        component={
                            {
                                id: 'grid',
                                typeId: 'SFNextToolkit.plpMerchandisingGrid',
                                regions: [
                                    {
                                        id: 'editorialCards',
                                        components: [
                                            {
                                                id: 'look-card',
                                                typeId: 'SFNextToolkit.editorialCard',
                                                data: { position: 2 },
                                            },
                                        ],
                                    },
                                ],
                            } as never
                        }
                    />
                </ProductListRuntimeProvider>
            </MemoryRouter>
        );

        expect(screen.getByTestId('deferred-grid')).toBeInTheDocument();
        expect(screen.queryByTestId('region-editorialCards')).not.toBeInTheDocument();
        expect(deferredGridSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                ...runtime,
                tilePresentation: expect.objectContaining({ showSku: false }),
                gridPresentation: {
                    desktopColumns: '3',
                    density: 'comfortable',
                    cardSurface: 'muted',
                    cardView: 'compact',
                },
                editorialItems: [
                    expect.objectContaining({
                        key: 'look-card',
                        position: 2,
                        element: expect.anything(),
                    }),
                ],
            })
        );
        expect(screen.getByTestId('editorial-look-card')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('exposes the real editorial region only in Page Designer design mode', () => {
        pageDesignerMode.isDesignMode = true;
        const runtime = { critical: [], nonCritical: Promise.resolve([]), nonCriticalCount: 0 };

        render(
            <MemoryRouter>
                <ProductListRuntimeProvider value={runtime}>
                    <PLPMerchandisingGrid
                        component={
                            {
                                id: 'grid',
                                typeId: 'SFNextToolkit.plpMerchandisingGrid',
                                regions: [{ id: 'editorialCards', components: [] }],
                            } as never
                        }
                    />
                </ProductListRuntimeProvider>
            </MemoryRouter>
        );

        expect(screen.getByTestId('region-editorialCards')).toBeInTheDocument();
        expect(deferredGridSpy).toHaveBeenCalledWith(expect.objectContaining({ editorialItems: [] }));
    });

    test('renders an authoring explanation when used outside a category runtime', () => {
        pageDesignerMode.isDesignMode = true;
        render(
            <MemoryRouter>
                <PLPMerchandisingGrid />
            </MemoryRouter>
        );

        expect(screen.getByRole('status', { name: 'PLP merchandising grid preview' })).toBeInTheDocument();
        expect(deferredGridSpy).not.toHaveBeenCalled();
    });

    test('does not expose authoring instructions to shoppers outside a category runtime', () => {
        const { container } = render(
            <MemoryRouter>
                <PLPMerchandisingGrid />
            </MemoryRouter>
        );

        expect(container.firstChild).toBeNull();
        expect(deferredGridSpy).not.toHaveBeenCalled();
    });
});
