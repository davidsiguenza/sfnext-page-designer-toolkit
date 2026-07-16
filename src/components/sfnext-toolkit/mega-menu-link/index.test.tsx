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
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import { MegaMenuNavigateProvider } from '../mega-menu/context';
import MegaMenuLink, { resolveMegaMenuLinkDestination, SFNextToolkitMegaMenuLinkMetadata } from './index';

const designMode = vi.hoisted(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => ({ isDesignMode: designMode.isDesignMode, isPreviewMode: false }),
    };
});

function renderLink(element: ReactElement) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>{element}</AllProvidersWrapper>
        </MemoryRouter>
    );
}

describe('SFNext Toolkit mega menu link destinations', () => {
    test('resolves URL, category, product and encoded content destinations', () => {
        expect(resolveMegaMenuLinkDestination({ destinationType: 'url', url: ' /campaign ' })).toBe('/campaign');
        expect(resolveMegaMenuLinkDestination({ destinationType: 'category', category: { id: ' girls ' } })).toBe(
            '/category/girls'
        );
        expect(resolveMegaMenuLinkDestination({ destinationType: 'product', product: 'sku-123' })).toBe(
            '/product/sku-123'
        );
        expect(
            resolveMegaMenuLinkDestination({
                destinationType: 'content',
                contentId: 'summer story',
                contentPathTemplate: '/stories/{id}',
            })
        ).toBe('/stories/summer%20story');
        expect(resolveMegaMenuLinkDestination({ destinationType: 'content', contentId: 'post-1' })).toBe(
            '/blog/post-1'
        );
    });

    test.each([
        'javascript:alert(1)',
        'data:text/html,unsafe',
        'file:///etc/passwd',
        '//evil.example/path',
        '\\evil.example\\path',
        '/safe\u0000unsafe',
    ])('rejects unsafe URL destinations: %s', (url) => {
        expect(resolveMegaMenuLinkDestination({ destinationType: 'url', url })).toBeUndefined();
    });

    test('rejects incomplete references and unsafe content templates', () => {
        expect(resolveMegaMenuLinkDestination({ destinationType: 'category', category: '  ' })).toBeUndefined();
        expect(resolveMegaMenuLinkDestination({ destinationType: 'product', product: {} })).toBeUndefined();
        expect(
            resolveMegaMenuLinkDestination({
                destinationType: 'content',
                contentId: 'post-1',
                contentPathTemplate: '/stories/static',
            })
        ).toBeUndefined();
        expect(
            resolveMegaMenuLinkDestination({
                destinationType: 'content',
                contentId: 'post-1',
                contentPathTemplate: 'javascript:{id}',
            })
        ).toBeUndefined();
    });
});

describe('SFNext Toolkit mega menu link', () => {
    beforeEach(() => {
        designMode.isDesignMode = false;
    });

    test('publishes the portable destination and visual metadata contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitMegaMenuLinkMetadata)).toBe('SFNextToolkit.megaMenuLink');

        const { fields } = getAttributeDefinitions(SFNextToolkitMegaMenuLinkMetadata.prototype);
        expect(fields.destinationType).toMatchObject({
            type: 'enum',
            values: ['url', 'category', 'product', 'content'],
            defaultValue: 'url',
        });
        expect(fields.icon).toMatchObject({
            values: ['none', 'sparkles', 'gift', 'star', 'truck', 'tag'],
            defaultValue: 'none',
        });
        expect(fields.visualStyle).toMatchObject({
            values: ['plain', 'highlight', 'chip'],
            defaultValue: 'plain',
        });
        expect(fields.contentPathTemplate).toMatchObject({ defaultValue: '/blog/{id}' });
    });

    test('renders one accessible link with optional editorial details and allow-listed icon', () => {
        const { container } = renderLink(
            <MegaMenuLink
                label="Gift guide"
                description="Ideas for every occasion"
                badge="New"
                icon="gift"
                visualStyle="highlight"
                url="/gift-guide"
                ariaLabel="Open the seasonal gift guide"
            />
        );

        const link = screen.getByRole('link', { name: 'Open the seasonal gift guide' });
        expect(link.getAttribute('href')).toContain('/gift-guide');
        expect(link).toHaveAttribute('data-slot', 'sfnext-toolkit-mega-menu-link');
        expect(link).toHaveClass('bg-card', 'border-border');
        expect(screen.getByText('Gift guide')).toBeInTheDocument();
        expect(screen.getByText('Ideas for every occasion')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(container.querySelector('.lucide-gift')).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelectorAll('a')).toHaveLength(1);
    });

    test('calls the host navigation callback only after a non-cancelled click', async () => {
        const user = userEvent.setup();
        const onNavigate = vi.fn();
        const onClick = vi.fn();
        const { rerender } = renderLink(
            <MegaMenuNavigateProvider onNavigate={onNavigate}>
                <MegaMenuLink label="Campaign" url="/campaign" onClick={onClick} />
            </MegaMenuNavigateProvider>
        );

        await user.click(screen.getByRole('link', { name: 'Campaign' }));
        expect(onClick).toHaveBeenCalledOnce();
        expect(onNavigate).toHaveBeenCalledOnce();

        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <MegaMenuNavigateProvider onNavigate={onNavigate}>
                        <MegaMenuLink
                            label="Cancelled campaign"
                            url="/campaign"
                            onClick={(event) => event.preventDefault()}
                        />
                    </MegaMenuNavigateProvider>
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        await user.click(screen.getByRole('link', { name: 'Cancelled campaign' }));
        expect(onNavigate).toHaveBeenCalledOnce();
    });

    test('fails closed in live mode and shows author guidance only in design mode', () => {
        const { container, rerender } = renderLink(<MegaMenuLink label="Unsafe" url="javascript:alert(1)" />);
        expect(container).toBeEmptyDOMElement();

        designMode.isDesignMode = true;
        rerender(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <MegaMenuLink label="Unsafe" url="javascript:alert(1)" />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(screen.getByText('Add a label and valid destination')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('normalizes unknown icon and visual style values without dynamic code execution', () => {
        const { container } = renderLink(
            <MegaMenuLink label="Safe" url="/safe" icon="constructor" visualStyle="__proto__" />
        );
        const link = screen.getByRole('link', { name: 'Safe' });

        expect(link).toHaveClass('px-2', 'py-2');
        expect(container.querySelector('[data-slot="mega-menu-link-icon"]')).not.toBeInTheDocument();
    });
});
