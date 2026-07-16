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
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions, getRegionDefinition } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { MegaMenuNavigateProvider } from '../mega-menu/context';
import MegaMenuPanel, { MegaMenuPanelFallback, SFNextToolkitMegaMenuPanelMetadata } from './index';

const designMode = vi.hoisted(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: designMode.isDesignMode, isPreviewMode: false }),
    };
});

vi.mock('@/components/region', () => ({
    Region: ({ regionId, className }: { regionId: string; className?: string }) => (
        <div data-testid={`region-${regionId}`} className={className} />
    ),
}));

vi.mock('@/components/link', () => ({
    Link: ({
        to,
        children,
        ...props
    }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; children: ReactNode }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

describe('SFNext Toolkit mega menu panel', () => {
    beforeEach(() => {
        designMode.isDesignMode = false;
    });

    test('publishes strict nested-region limits and panel controls', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitMegaMenuPanelMetadata)).toBe(
            'SFNextToolkit.megaMenuPanel'
        );
        expect(getRegionDefinition(SFNextToolkitMegaMenuPanelMetadata, 'extraItems')).toMatchObject({
            maxComponents: 8,
            componentTypeInclusions: ['SFNextToolkit.megaMenuLink'],
        });
        expect(getRegionDefinition(SFNextToolkitMegaMenuPanelMetadata, 'feature')).toMatchObject({
            maxComponents: 1,
            componentTypeInclusions: ['SFNextToolkit.megaMenuFeature'],
        });

        const { fields } = getAttributeDefinitions(SFNextToolkitMegaMenuPanelMetadata.prototype);
        expect(fields.targetCategory).toMatchObject({ type: 'category', required: true });
        expect(fields.editorialWidth).toMatchObject({
            values: ['compact', 'standard', 'wide'],
            defaultValue: 'standard',
        });
        expect(fields.standardBannerMode).toMatchObject({
            values: ['inherit', 'fallback', 'replace', 'alongside'],
            defaultValue: 'inherit',
        });
    });

    test('renders authored copy, standalone regions, and a normalized category link', async () => {
        const user = userEvent.setup();
        const onNavigate = vi.fn();
        render(
            <MegaMenuNavigateProvider onNavigate={onNavigate}>
                <MegaMenuPanel
                    targetCategory={{ id: ' girls ' }}
                    heading="Highlights"
                    intro="Curated for this season"
                    extraItemsHeading="Discover more"
                    viewAllLabel="Shop all girls"
                    extraItems={<span>Size guide</span>}
                    feature={<span>Campaign image</span>}
                />
            </MegaMenuNavigateProvider>
        );

        expect(screen.getByRole('heading', { name: 'Highlights' })).toBeInTheDocument();
        expect(screen.getByText('Curated for this season')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Discover more' })).toBeInTheDocument();
        expect(screen.getByText('Size guide')).toBeInTheDocument();
        expect(screen.getByText('Campaign image')).toBeInTheDocument();
        const viewAll = screen.getByRole('link', { name: 'Shop all girls' });
        expect(viewAll).toHaveAttribute('href', '/category/girls');

        await user.click(viewAll);
        expect(onNavigate).toHaveBeenCalledOnce();
    });

    test('renders the two Page Designer regions when an owner component is supplied', () => {
        render(
            <MegaMenuPanel
                targetCategory="girls"
                component={{ id: 'panel-1', typeId: 'SFNextToolkit.megaMenuPanel', regions: [] }}
                extraItems={<span>Fallback links</span>}
                feature={<span>Fallback feature</span>}
            />
        );

        expect(screen.getByTestId('region-extraItems')).toHaveClass('grid', 'gap-1');
        expect(screen.getByTestId('region-feature')).toHaveClass('w-full');
        expect(screen.queryByText('Fallback links')).not.toBeInTheDocument();
        expect(screen.queryByText('Fallback feature')).not.toBeInTheDocument();
    });

    test('applies feature-first order and token-based visual options', () => {
        const { container } = render(
            <MegaMenuPanel
                targetCategory="girls"
                showViewAll={false}
                layout="feature-first"
                surface="accent"
                density="compact"
                className="merchant-panel"
                extraItems={<span>Links</span>}
                feature={<span>Feature</span>}
            />
        );
        const root = container.querySelector('[data-slot="sfnext-toolkit-mega-menu-panel"]');

        expect(root).toHaveClass('bg-accent', 'text-accent-foreground', 'gap-3', 'p-3', 'merchant-panel');
        expect(container.querySelector('[data-slot="mega-menu-panel-extra-items"]')).toHaveClass('order-2');
        expect(container.querySelector('[data-slot="mega-menu-panel-feature"]')).toHaveClass('order-1');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('normalizes inherited-property and unknown visual values to safe defaults', () => {
        const { container } = render(
            <MegaMenuPanel
                targetCategory="girls"
                surface="__proto__"
                density="constructor"
                layout="toString"
                showViewAll={false}
                extraItems={<span>Links</span>}
                feature={<span>Feature</span>}
            />
        );
        const root = container.querySelector('[data-slot="sfnext-toolkit-mega-menu-panel"]');

        expect(root).toHaveClass('bg-transparent', 'gap-5', 'p-5');
        expect(container.querySelector('[data-slot="mega-menu-panel-extra-items"]')).not.toHaveClass('order-2');
        expect(container.querySelector('[data-slot="mega-menu-panel-feature"]')).not.toHaveClass('order-1');
    });

    test('fails closed without a category in live mode and guides authors in design mode', () => {
        const { container, rerender } = render(<MegaMenuPanel heading="Unassigned" />);
        expect(container).toBeEmptyDOMElement();

        designMode.isDesignMode = true;
        rerender(<MegaMenuPanel heading="Unassigned" />);
        expect(screen.getByText('Select the root category this panel should enhance')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('provides a stable non-interactive fallback', () => {
        const { container } = render(<MegaMenuPanelFallback />);
        expect(container.querySelector('[data-slot="sfnext-toolkit-mega-menu-panel-fallback"]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
        expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    });
});
