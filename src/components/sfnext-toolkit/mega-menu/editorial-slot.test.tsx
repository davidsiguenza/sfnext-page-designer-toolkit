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
import { act, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { ShopperExperience } from '@/scapi';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import {
    filterMegaMenuComponentToPanel,
    getMegaMenuPanelCategoryIds,
    MegaMenuEditorialSlot,
    megaMenuPanelHasContent,
    megaMenuPanelHasFeature,
    normalizeMegaMenuTargetCategory,
    selectMegaMenuPanel,
} from './editorial-slot';

vi.mock('@/components/region/embedded-component-region', () => ({
    EmbeddedComponentRegion: ({ component, regionId }: { component: ComponentWithComponentData; regionId: string }) => {
        const componentIds =
            component.regions
                ?.find((region) => region.id === regionId)
                ?.components?.map((child) => child.id)
                .join(',') ?? '';
        return <div data-testid="embedded-region">{componentIds}</div>;
    },
}));

type Component = ShopperExperience.schemas['Component'];

function panel({
    id,
    targetCategory,
    standardBannerMode,
    editorialWidth,
    withFeature = false,
    withExtraLink = false,
    data = {},
}: {
    id: string;
    targetCategory: string | { id: string };
    standardBannerMode?: string;
    editorialWidth?: string;
    withFeature?: boolean;
    withExtraLink?: boolean;
    data?: Record<string, unknown>;
}): Component {
    return {
        id,
        typeId: 'SFNextToolkit.megaMenuPanel',
        data: { targetCategory, standardBannerMode, editorialWidth, ...data },
        regions: [
            {
                id: 'extraItems',
                components: withExtraLink
                    ? [{ id: `${id}-link`, typeId: 'SFNextToolkit.megaMenuLink' } as Component]
                    : [],
            },
            {
                id: 'feature',
                components: withFeature
                    ? [{ id: `${id}-feature`, typeId: 'SFNextToolkit.megaMenuFeature' } as Component]
                    : [],
            },
        ],
    } as unknown as Component;
}

function owner(
    panels: Component[],
    data: Record<string, unknown> = {},
    extraRegions: ShopperExperience.schemas['Region'][] = []
): ComponentWithComponentData {
    return {
        id: 'sfnext-toolkit-mega-menu',
        typeId: 'SFNextToolkit.megaMenu',
        data,
        regions: [{ id: 'panels', components: panels }, ...extraRegions],
        componentData: { loaded: Promise.resolve('data') },
    } as unknown as ComponentWithComponentData;
}

describe('mega menu editorial slot selectors', () => {
    test('normalizes string and category-object targets while rejecting empty values', () => {
        expect(normalizeMegaMenuTargetCategory(' girls ')).toBe('girls');
        expect(normalizeMegaMenuTargetCategory({ id: ' boys ' })).toBe('boys');
        expect(normalizeMegaMenuTargetCategory('  ')).toBeUndefined();
        expect(normalizeMegaMenuTargetCategory({ id: 42 })).toBeUndefined();
        expect(normalizeMegaMenuTargetCategory(null)).toBeUndefined();
    });

    test('uses the first authored matching panel deterministically and reports unique targets', () => {
        const first = panel({ id: 'first', targetCategory: 'girls' });
        const duplicate = panel({ id: 'duplicate', targetCategory: { id: 'girls' } });
        const boys = panel({ id: 'boys', targetCategory: 'boys' });
        const component = owner([first, duplicate, boys]);

        expect(selectMegaMenuPanel(component, 'girls')).toBe(first);
        expect(selectMegaMenuPanel(component, 'missing')).toBeUndefined();
        expect([...getMegaMenuPanelCategoryIds(component)]).toEqual(['girls', 'boys']);
    });

    test('reports only renderable targets allowed by the owner for each responsive variant', () => {
        const configured = panel({ id: 'configured', targetCategory: 'girls', withExtraLink: true });
        const empty = panel({
            id: 'empty',
            targetCategory: 'boys',
            data: { showViewAll: false },
        });

        expect([...getMegaMenuPanelCategoryIds(owner([configured, empty]))]).toEqual(['girls']);
        expect([...getMegaMenuPanelCategoryIds(owner([configured], { mobileEditorial: false }), 'desktop')]).toEqual([
            'girls',
        ]);
        expect([...getMegaMenuPanelCategoryIds(owner([configured], { mobileEditorial: false }), 'mobile')]).toEqual([]);
        expect([...getMegaMenuPanelCategoryIds(owner([configured], { enabled: false }), 'desktop')]).toEqual([]);
    });

    test('filters only the panels region to the selected panel and preserves owner data', () => {
        const first = panel({ id: 'first', targetCategory: 'girls' });
        const second = panel({ id: 'second', targetCategory: 'boys' });
        const utility = { id: 'utility', components: [] } as ShopperExperience.schemas['Region'];
        const component = owner([first, second], { enabled: true }, [utility]);

        const filtered = filterMegaMenuComponentToPanel(component, second);

        expect(filtered).not.toBe(component);
        expect(filtered.data).toEqual({ enabled: true });
        expect(filtered.componentData).toBe(component.componentData);
        expect(filtered.regions?.find((region) => region.id === 'panels')?.components).toEqual([second]);
        expect(filtered.regions?.find((region) => region.id === 'utility')).toBe(utility);
        expect(component.regions?.find((region) => region.id === 'panels')?.components).toEqual([first, second]);
    });

    test('distinguishes feature content from other useful panel content', () => {
        const empty = panel({
            id: 'empty',
            targetCategory: 'girls',
            data: { showViewAll: false },
        });
        const linkOnly = panel({
            id: 'link-only',
            targetCategory: 'girls',
            withExtraLink: true,
            data: { showViewAll: false },
        });
        const featured = panel({ id: 'featured', targetCategory: 'girls', withFeature: true });

        expect(megaMenuPanelHasContent(empty)).toBe(false);
        expect(megaMenuPanelHasContent(linkOnly)).toBe(true);
        expect(megaMenuPanelHasFeature(linkOnly)).toBe(false);
        expect(megaMenuPanelHasFeature(featured)).toBe(true);
    });
});

describe('mega menu editorial slot banner modes', () => {
    const fallback = <div>Standard catalog banner</div>;

    test('uses the catalog banner as a fallback until a renderable authored feature exists', () => {
        const withoutFeature = owner([
            panel({ id: 'girls-links', targetCategory: 'girls', withExtraLink: true, standardBannerMode: 'fallback' }),
        ]);
        const renderableFeaturePanel = panel({
            id: 'girls-feature',
            targetCategory: 'girls',
            withFeature: true,
            standardBannerMode: 'fallback',
        });
        const feature = renderableFeaturePanel.regions?.find((region) => region.id === 'feature')?.components?.[0];
        if (!feature) throw new Error('Expected feature fixture');
        (feature as unknown as { data?: Record<string, unknown> }).data = { title: 'Manual feature' };
        const withFeature = owner([renderableFeaturePanel]);

        const { rerender } = render(
            <MegaMenuEditorialSlot component={withoutFeature} targetCategoryId="girls" fallback={fallback} />
        );
        expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
        expect(screen.getByTestId('embedded-region')).toHaveTextContent('girls-links');

        rerender(<MegaMenuEditorialSlot component={withFeature} targetCategoryId="girls" fallback={fallback} />);
        expect(screen.queryByText('Standard catalog banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('embedded-region')).toHaveTextContent('girls-feature');
    });

    test.each(['unconfigured', 'not-found', 'error'])(
        'keeps the fallback banner when the authored feature resolves %s',
        async (status) => {
            const featurePanel = panel({
                id: `girls-${status}`,
                targetCategory: 'girls',
                withFeature: true,
                standardBannerMode: 'fallback',
            });
            const featureId = featurePanel.regions?.find((region) => region.id === 'feature')?.components?.[0]?.id;
            const component = owner([featurePanel]);
            component.componentData = {
                [featureId as string]: Promise.resolve({ status }),
            };

            render(<MegaMenuEditorialSlot component={component} targetCategoryId="girls" fallback={fallback} />);
            await act(async () => Promise.resolve());

            expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
            expect(screen.getByTestId('embedded-region')).toHaveTextContent(`girls-${status}`);
        }
    );

    test('hides the fallback banner when the feature loader resolves ready', async () => {
        const featurePanel = panel({
            id: 'girls-ready',
            targetCategory: 'girls',
            withFeature: true,
            standardBannerMode: 'fallback',
        });
        const featureId = featurePanel.regions?.find((region) => region.id === 'feature')?.components?.[0]?.id;
        const component = owner([featurePanel]);
        component.componentData = {
            [featureId as string]: Promise.resolve({ status: 'ready' }),
        };

        render(<MegaMenuEditorialSlot component={component} targetCategoryId="girls" fallback={fallback} />);
        await act(async () => Promise.resolve());

        expect(screen.queryByText('Standard catalog banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('embedded-region')).toHaveTextContent('girls-ready');
    });

    test.each([{ title: 'Manual title' }, { copy: 'Manual copy' }, { imageOverride: { url: '/manual-feature.jpg' } }])(
        'manual renderable overrides hide the fallback even when source data fails: %j',
        async (featureData) => {
            const featurePanel = panel({
                id: 'girls-manual',
                targetCategory: 'girls',
                withFeature: true,
                standardBannerMode: 'fallback',
            });
            const feature = featurePanel.regions?.find((region) => region.id === 'feature')?.components?.[0];
            if (!feature) throw new Error('Expected feature fixture');
            (feature as unknown as { data?: Record<string, unknown> }).data = featureData;
            const component = owner([featurePanel]);
            component.componentData = {
                [feature.id]: Promise.resolve({ status: 'error' }),
            };

            render(<MegaMenuEditorialSlot component={component} targetCategoryId="girls" fallback={fallback} />);
            await act(async () => Promise.resolve());

            expect(screen.queryByText('Standard catalog banner')).not.toBeInTheDocument();
            expect(screen.getByTestId('embedded-region')).toHaveTextContent('girls-manual');
        }
    );

    test('replace suppresses the catalog banner and alongside renders both sources', () => {
        const replace = owner([
            panel({ id: 'replace', targetCategory: 'girls', withExtraLink: true, standardBannerMode: 'replace' }),
        ]);
        const alongside = owner([
            panel({ id: 'alongside', targetCategory: 'girls', withFeature: true, standardBannerMode: 'alongside' }),
        ]);

        const { rerender } = render(
            <MegaMenuEditorialSlot component={replace} targetCategoryId="girls" fallback={fallback} />
        );
        expect(screen.queryByText('Standard catalog banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('embedded-region')).toHaveTextContent('replace');
        expect(screen.getByTestId('embedded-region').closest('aside')).toHaveAttribute('data-banner-mode', 'replace');

        rerender(<MegaMenuEditorialSlot component={alongside} targetCategoryId="girls" fallback={fallback} />);
        expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
        expect(screen.getByTestId('embedded-region')).toHaveTextContent('alongside');
        expect(screen.getByTestId('embedded-region').closest('aside')).toHaveAttribute('data-banner-mode', 'alongside');
    });

    test('inherit follows the global default and unknown values fail closed to fallback', () => {
        const inherited = panel({
            id: 'inherited',
            targetCategory: 'girls',
            withFeature: true,
            standardBannerMode: 'inherit',
        });
        const inheritedFeature = inherited.regions?.find((region) => region.id === 'feature')?.components?.[0];
        if (!inheritedFeature) throw new Error('Expected feature fixture');
        (inheritedFeature as unknown as { data?: Record<string, unknown> }).data = {
            title: 'Renderable feature',
        };
        const globalAlongside = owner([inherited], { defaultStandardBannerMode: 'alongside' });
        const invalidGlobal = owner([inherited], { defaultStandardBannerMode: '__proto__' });

        const { rerender } = render(
            <MegaMenuEditorialSlot component={globalAlongside} targetCategoryId="girls" fallback={fallback} />
        );
        expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
        expect(screen.getByTestId('embedded-region').closest('aside')).toHaveAttribute('data-banner-mode', 'alongside');

        rerender(<MegaMenuEditorialSlot component={invalidGlobal} targetCategoryId="girls" fallback={fallback} />);
        expect(screen.queryByText('Standard catalog banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('embedded-region').closest('aside')).toHaveAttribute('data-banner-mode', 'fallback');
    });

    test('keeps the standard desktop menu when the owner or matching panel is unavailable', () => {
        const component = owner([panel({ id: 'boys', targetCategory: 'boys' })]);
        const { rerender } = render(
            <MegaMenuEditorialSlot component={null} targetCategoryId="girls" fallback={fallback} />
        );
        expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
        expect(screen.queryByTestId('embedded-region')).not.toBeInTheDocument();

        rerender(<MegaMenuEditorialSlot component={component} targetCategoryId="girls" fallback={fallback} />);
        expect(screen.getByText('Standard catalog banner')).toBeInTheDocument();
        expect(screen.queryByTestId('embedded-region')).not.toBeInTheDocument();
    });

    test('renders no editorial or desktop fallback when mobile editorial content is disabled', () => {
        const component = owner([panel({ id: 'girls', targetCategory: 'girls', withFeature: true })], {
            mobileEditorial: false,
        });
        const { container } = render(
            <MegaMenuEditorialSlot
                component={component}
                targetCategoryId="girls"
                fallback={fallback}
                variant="mobile"
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
