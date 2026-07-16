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
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import ResponsiveNavigationMenu from './index';
import type { ShopperProducts } from '@/scapi';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';

vi.mock('@/components/region/embedded-component-region', async () => {
    const { useMegaMenuNavigate } = await import('@/components/sfnext-toolkit/mega-menu/context');

    type MockComponent = {
        regions?: Array<{
            id?: string;
            components?: Array<{ id?: string; data?: { heading?: string; targetCategory?: string } }>;
        }>;
    };

    function MockEmbeddedComponentRegion({
        component,
        regionId,
    }: {
        component?: MockComponent | null;
        regionId: string;
    }) {
        const onNavigate = useMegaMenuNavigate();
        const panel = component?.regions?.find((region) => region.id === regionId)?.components?.[0];
        if (!panel) return null;
        return (
            <section data-testid="rendered-mega-panel" data-panel-id={panel.id}>
                <span>{panel.data?.heading}</span>
                <a
                    href="/editorial-link"
                    data-testid="mega-panel-link"
                    onClick={(event) => {
                        event.preventDefault();
                        onNavigate?.();
                    }}>
                    Custom editorial link
                </a>
                <a
                    href="/editorial-feature"
                    data-testid="mega-panel-feature"
                    onClick={(event) => {
                        event.preventDefault();
                        onNavigate?.();
                    }}>
                    Editorial feature
                </a>
                <button type="button" data-testid="mega-panel-action" onClick={onNavigate}>
                    Follow editorial link
                </button>
            </section>
        );
    }

    return { EmbeddedComponentRegion: MockEmbeddedComponentRegion };
});

const mockCategories: ShopperProducts.schemas['Category'] = {
    id: 'root',
    name: 'Root Category',
    categories: [
        {
            id: 'cat-1',
            name: 'Category 1',
            c_showInMenu: true,
            onlineSubCategoriesCount: 2,
            categories: [
                {
                    id: 'cat-1-1',
                    name: 'Subcategory 1.1',
                    c_showInMenu: true,
                    onlineSubCategoriesCount: 1,
                    categories: [{ id: 'cat-1-1-1', name: 'Nested Subcategory 1.1.1', c_showInMenu: true }],
                },
                { id: 'cat-1-2', name: 'Subcategory 1.2', c_showInMenu: true },
            ],
        },
        {
            id: 'cat-2',
            name: 'Category 2',
            c_showInMenu: true,
            onlineSubCategoriesCount: 1,
            categories: [{ id: 'cat-2-1', name: 'Subcategory 2.1', c_showInMenu: true }],
        },
        {
            id: 'cat-3',
            name: 'Category 3 (Leaf)',
            c_showInMenu: true,
            onlineSubCategoriesCount: 0,
        },
    ],
};

function makeMegaMenuComponent(
    targetCategory: string,
    overrides: { mobileEditorial?: boolean } = {}
): ComponentWithComponentData {
    return {
        id: 'sfnext-toolkit-mega-menu',
        typeId: 'SFNextToolkit.megaMenu',
        embedded: true,
        data: {
            enabled: true,
            mobileEditorial: overrides.mobileEditorial ?? true,
            defaultStandardBannerMode: 'fallback',
        },
        regions: [
            {
                id: 'panels',
                components: [
                    {
                        id: `panel-${targetCategory}`,
                        typeId: 'SFNextToolkit.megaMenuPanel',
                        data: {
                            targetCategory,
                            heading: `Editorial ${targetCategory}`,
                            showViewAll: false,
                            editorialWidth: 'standard',
                            standardBannerMode: 'inherit',
                        },
                        regions: [
                            { id: 'extraItems', components: [] },
                            { id: 'feature', components: [] },
                        ],
                    },
                ],
            },
        ],
        componentData: {},
    } as unknown as ComponentWithComponentData;
}

// Mock useNavigate before importing component
const mockNavigate = vi.fn();
vi.mock('@/hooks/use-navigate', () => ({
    useNavigate: () => mockNavigate,
}));

describe('ResponsiveNavigationMenu Component', () => {
    const renderComponent = (props: Partial<React.ComponentProps<typeof ResponsiveNavigationMenu>> = {}) => {
        const router = createMemoryRouter(
            [
                {
                    path: '*',
                    element: (
                        <AllProvidersWrapper>
                            <ResponsiveNavigationMenu
                                resolve={Promise.resolve(mockCategories)}
                                defer={Promise.resolve([])}
                                {...props}
                            />
                        </AllProvidersWrapper>
                    ),
                },
                {
                    path: '/category/:id',
                    element: <div>Category Page</div>,
                },
            ],
            { initialEntries: ['/'] }
        );
        return render(<RouterProvider router={router} />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Basic Rendering', () => {
        it('should render component without errors', () => {
            const { container } = renderComponent();
            expect(container).toBeInTheDocument();
        });

        it('should render mobile hamburger button', async () => {
            const { getByRole } = renderComponent();

            await waitFor(() => {
                expect(getByRole('button', { name: /open menu/i })).toBeInTheDocument();
            });
        });

        it('should handle empty categories array', async () => {
            const { container } = renderComponent({
                resolve: Promise.resolve({ id: 'root', name: 'Root', categories: [] }),
            });

            await waitFor(() => {
                // Component should handle empty categories gracefully
                expect(container).toBeInTheDocument();
            });
        });

        it('preserves the standard catalog menu when no Page Designer mega menu is configured', async () => {
            const { getByRole, queryByTestId } = renderComponent({ megaMenuComponent: null });

            await waitFor(() => {
                expect(getByRole('button', { name: /^category 1$/i })).toHaveAttribute('data-has-submenu', 'true');
            });
            expect(getByRole('link', { name: /category 3 \(leaf\)/i })).toBeInTheDocument();
            expect(queryByTestId('rendered-mega-panel')).not.toBeInTheDocument();
        });
    });

    describe('Desktop Mega Menu', () => {
        it('renders the matching Page Designer panel beside inherited catalog links', async () => {
            const { getByRole, getAllByTestId, container } = renderComponent({
                megaMenuComponent: makeMegaMenuComponent('cat-1'),
            });

            const trigger = await waitFor(() => getByRole('button', { name: /^category 1$/i }));
            await act(async () => {
                fireEvent.click(trigger);
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(getAllByTestId('rendered-mega-panel').length).toBeGreaterThan(0);
            });
            expect(getAllByTestId('rendered-mega-panel')[0]).toHaveAttribute('data-panel-id', 'panel-cat-1');
            expect(container.querySelector('[data-slot="mega-menu-editorial-slot"]')).toHaveAttribute(
                'data-target-category',
                'cat-1'
            );
            expect(getByRole('link', { name: /^subcategory 1\.1$/i })).toBeInTheDocument();
        });

        it.each([
            ['custom editorial link', 'mega-panel-link'],
            ['editorial feature', 'mega-panel-feature'],
        ])('closes after navigating from the %s', async (_, actionTestId) => {
            const { getByRole, getAllByTestId } = renderComponent({
                megaMenuComponent: makeMegaMenuComponent('cat-1'),
            });

            const trigger = await waitFor(() => getByRole('button', { name: /^category 1$/i }));
            await act(async () => {
                fireEvent.click(trigger);
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(trigger).toHaveAttribute('data-state', 'open');
                expect(getAllByTestId('rendered-mega-panel').length).toBeGreaterThan(0);
            });

            fireEvent.click(getAllByTestId(actionTestId)[0]);

            await waitFor(() => {
                expect(trigger).toHaveAttribute('data-state', 'closed');
            });
        });

        it('does not create a standard banner column from the generic category image', async () => {
            const rootWithImageBanner: ShopperProducts.schemas['Category'] = {
                ...mockCategories,
                categories: mockCategories.categories?.map((category) =>
                    category.id === 'cat-1' ? { ...category, image: '/images/category-1.jpg' } : category
                ),
            };
            const { getByRole, container } = renderComponent({
                resolve: Promise.resolve(rootWithImageBanner),
                megaMenuComponent: null,
            });

            const trigger = await waitFor(() => getByRole('button', { name: /^category 1$/i }));
            await act(async () => {
                fireEvent.click(trigger);
                await Promise.resolve();
            });

            await waitFor(() => expect(getByRole('link', { name: /^subcategory 1\.1$/i })).toBeInTheDocument());
            expect(container.querySelector('[data-slot="standard-category-banner"]')).not.toBeInTheDocument();
        });

        it('preserves the stock header-menu banner contract and slot image precedence', async () => {
            const rootWithHtmlBanner: ShopperProducts.schemas['Category'] = {
                ...mockCategories,
                categories: mockCategories.categories?.map((category) =>
                    category.id === 'cat-1'
                        ? {
                              ...category,
                              image: '/images/generic-category.jpg',
                              c_slotBannerImage: '/images/header-slot.jpg',
                              c_headerMenuBanner: '<span>Campaign banner</span>',
                          }
                        : category
                ),
            };
            const { getByRole, container } = renderComponent({
                resolve: Promise.resolve(rootWithHtmlBanner),
                megaMenuComponent: null,
            });

            const trigger = await waitFor(() => getByRole('button', { name: /^category 1$/i }));
            await act(async () => {
                fireEvent.click(trigger);
                await Promise.resolve();
            });

            await waitFor(() => {
                expect(container.querySelector('[data-slot="standard-category-banner"]')).toBeInTheDocument();
            });
            const banner = container.querySelector('[data-slot="standard-category-banner"]');
            expect(banner).toBeInstanceOf(HTMLAnchorElement);
            expect(banner?.querySelector('img')).toHaveAttribute('src', expect.stringContaining('header-slot.jpg'));
            expect(banner?.querySelector('img')).toHaveAttribute('alt', 'Category 1');
            expect(container.querySelector('a a')).not.toBeInTheDocument();
        });

        it.each([
            ['vertical', undefined, 'md:grid-cols-[1fr_.3fr]'],
            ['horizontal', 'horizontal', 'md:grid-cols-[1fr_.6fr]'],
        ])(
            'preserves the stock %s banner grid when no editorial block is assigned',
            async (_, orientation, gridClass) => {
                const rootWithStandardBanner: ShopperProducts.schemas['Category'] = {
                    ...mockCategories,
                    categories: mockCategories.categories?.map((category) =>
                        category.id === 'cat-1'
                            ? {
                                  ...category,
                                  c_headerMenuOrientation: orientation,
                                  c_headerMenuBanner: '<span>Standard banner</span>',
                              }
                            : category
                    ),
                };
                const { getByRole, container } = renderComponent({
                    resolve: Promise.resolve(rootWithStandardBanner),
                    megaMenuComponent: null,
                });

                const trigger = await waitFor(() => getByRole('button', { name: /^category 1$/i }));
                await act(async () => {
                    fireEvent.click(trigger);
                    await Promise.resolve();
                });

                const content = await waitFor(() => {
                    const bannerSlot = container.querySelector('[data-slot="mega-menu-standard-banner"]');
                    expect(bannerSlot).toBeInTheDocument();
                    const containingContent = bannerSlot?.closest('[data-slot="navigation-menu-content"]');
                    expect(containingContent).toBeInTheDocument();
                    const contentLayout = containingContent?.firstElementChild;
                    expect(contentLayout).toBeInTheDocument();
                    return contentLayout;
                });
                expect(content).toHaveClass('grid', gridClass, 'items-start');
                expect(content).not.toHaveClass('flex');
                expect(container.querySelector('[data-slot="mega-menu-standard-banner"]')).toHaveClass('self-stretch');
                expect(container.querySelector('[data-slot="mega-menu-standard-banner"]')).not.toHaveClass('lg:w-80');
            }
        );
    });

    describe('Mobile Menu', () => {
        it('should render mobile menu structure', async () => {
            const { getByRole, container } = renderComponent();

            await waitFor(() => {
                expect(getByRole('button', { name: /open menu/i })).toBeInTheDocument();
            });

            const hamburgerButton = getByRole('button', { name: /open menu/i });

            // Open menu
            act(() => {
                fireEvent.click(hamburgerButton);
            });

            // Mobile navigation should be present
            await waitFor(() => {
                const mobileNav = container.querySelector('[aria-label="Mobile navigation menu"]');
                expect(mobileNav).toBeInTheDocument();
            });
        });

        it('should show all nested mobile menu descendants after expanding a root category', async () => {
            const rootWithDeferredChildren: ShopperProducts.schemas['Category'] = {
                id: 'root',
                name: 'Root Category',
                categories: [
                    {
                        id: 'cat-1',
                        name: 'Category 1',
                        c_showInMenu: true,
                        onlineSubCategoriesCount: 2,
                    },
                ],
            };
            const enrichedCategory: ShopperProducts.schemas['Category'] = mockCategories.categories?.[0] ?? {
                id: 'cat-1',
                name: 'Category 1',
                c_showInMenu: true,
                onlineSubCategoriesCount: 0,
            };
            const { getByRole } = renderComponent({
                resolve: Promise.resolve(rootWithDeferredChildren),
                defer: Promise.resolve([enrichedCategory]),
            });

            await waitFor(() => {
                expect(getByRole('button', { name: /open menu/i })).toBeInTheDocument();
            });

            act(() => {
                fireEvent.click(getByRole('button', { name: /open menu/i }));
            });

            await waitFor(() => {
                expect(getByRole('button', { name: /expand category 1/i })).toBeInTheDocument();
            });

            act(() => {
                fireEvent.click(getByRole('button', { name: /expand category 1/i }));
            });

            await waitFor(() => {
                expect(getByRole('link', { name: /^subcategory 1\.1$/i })).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(getByRole('link', { name: /^nested subcategory 1\.1\.1$/i })).toBeInTheDocument();
            });

            expect(() => getByRole('button', { name: /expand subcategory 1\.1/i })).toThrow();
        });

        it('turns a targeted catalog leaf into a disclosure, renders its panel, and closes after navigation', async () => {
            const { getByRole, container } = renderComponent({
                megaMenuComponent: makeMegaMenuComponent('cat-3'),
            });

            await waitFor(() => {
                expect(getByRole('button', { name: /open menu/i })).toBeInTheDocument();
            });
            act(() => {
                fireEvent.click(getByRole('button', { name: /open menu/i }));
            });

            await waitFor(() => {
                expect(container.querySelector('[aria-label="Mobile navigation menu"]')).toBeInTheDocument();
            });
            const mobileNav = container.querySelector<HTMLElement>('[aria-label="Mobile navigation menu"]');
            expect(mobileNav).not.toBeNull();
            const expandLeaf = within(mobileNav as HTMLElement).getByRole('button', {
                name: /expand category 3 \(leaf\)/i,
            });
            act(() => {
                fireEvent.click(expandLeaf);
            });

            await waitFor(() => {
                expect(within(mobileNav as HTMLElement).getByTestId('rendered-mega-panel')).toHaveAttribute(
                    'data-panel-id',
                    'panel-cat-3'
                );
            });

            act(() => {
                fireEvent.click(within(mobileNav as HTMLElement).getByTestId('mega-panel-action'));
            });
            await waitFor(() => {
                expect(container.querySelector('[aria-label="Mobile navigation menu"]')).not.toBeInTheDocument();
                expect(getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
            });
        });

        it('keeps the desktop enhancement but does not create a mobile disclosure when mobile editorial is disabled', async () => {
            const megaMenuComponent = makeMegaMenuComponent('cat-3', { mobileEditorial: false });
            const { getByRole, container } = renderComponent({ megaMenuComponent });

            await waitFor(() => {
                expect(getByRole('button', { name: /^category 3 \(leaf\)$/i })).toBeInTheDocument();
            });
            act(() => {
                fireEvent.click(getByRole('button', { name: /open menu/i }));
            });

            const mobileNav = await waitFor(() => {
                const navigation = container.querySelector<HTMLElement>('[aria-label="Mobile navigation menu"]');
                expect(navigation).not.toBeNull();
                return navigation;
            });
            expect(mobileNav).not.toBeNull();
            expect(
                within(mobileNav as HTMLElement).queryByRole('button', { name: /expand category 3 \(leaf\)/i })
            ).not.toBeInTheDocument();
            expect(
                within(mobileNav as HTMLElement).getByRole('link', { name: /^category 3 \(leaf\)$/i })
            ).toBeInTheDocument();
        });
    });

    describe('Hydration', () => {
        it('does not mount the subscribing category subtree while the menu is closed', async () => {
            const { getByRole, queryByRole, container } = renderComponent();

            await waitFor(() => {
                expect(getByRole('button', { name: /open menu/i })).toBeInTheDocument();
            });

            // While closed, the mobile category list must not be mounted. Each MobileMenuCategory subscribes to the
            // sub-category store via useSubCategory (useSyncExternalStore). If it stays mounted while hidden, the
            // post-hydration store update re-renders the header and cascades into a whole-page flicker. Mounting it
            // only on open keeps the subscribers out of the SSR/hydration tree.
            expect(container.querySelector('[aria-label="Mobile navigation menu"]')).not.toBeInTheDocument();
            expect(queryByRole('link', { name: /^category 1$/i })).not.toBeInTheDocument();

            // Opening the menu mounts the subscribing subtree on demand.
            act(() => {
                fireEvent.click(getByRole('button', { name: /open menu/i }));
            });

            await waitFor(() => {
                expect(container.querySelector('[aria-label="Mobile navigation menu"]')).toBeInTheDocument();
            });
            expect(getByRole('link', { name: /^category 1$/i })).toBeInTheDocument();
        });
    });

    describe('Keyboard Accessibility (Critical)', () => {
        it('should use onPointerDown for navigation, not onClick', () => {
            // This test verifies the fix for the accessibility issue where
            // onClick was preventing keyboard users from expanding dropdowns.
            // With onPointerDown + mouse guard, keyboard events (Enter/Space)
            // can expand dropdowns without triggering navigation.

            const { container } = renderComponent();

            // Component should render without throwing
            expect(container).toBeInTheDocument();

            // The actual behavior is tested in Storybook interaction tests,
            // as JSDOM doesn't fully support PointerEvent with pointerType.
            // This test documents the expected behavior.
        });

        it('should not call navigate on non-mouse pointer events', () => {
            const { container } = renderComponent();

            // The onPointerDown handler checks e.pointerType === 'mouse'
            // Touch and pen events should not trigger navigation
            // This preserves keyboard accessibility for dropdown expansion

            // Initial state: no navigation should have occurred
            expect(container).toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('Promise Handling', () => {
        it('should handle rejected resolve promise gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderComponent({
                resolve: Promise.reject(new Error('Failed to load categories')),
            });

            // Component should not crash
            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalled();
            });

            consoleSpy.mockRestore();
        });
    });
});
