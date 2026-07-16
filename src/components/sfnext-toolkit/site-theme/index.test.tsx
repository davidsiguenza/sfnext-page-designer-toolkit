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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ComponentType } from '@/components/region';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import SiteTheme, { SFNextToolkitSiteThemeMetadata, SiteThemeFallback } from './index';
import {
    countSiteThemeOverrides,
    getSiteThemePreviewStyle,
    normalizeSiteTheme,
    resolveSiteThemeTokens,
    sanitizeSiteThemeColor,
    serializeSiteThemeCss,
    SITE_THEME_ALIAS_DERIVATIONS,
    SITE_THEME_TOKEN_GROUPS,
    type SiteThemeValue,
} from './model';

const mockPageDesignerMode = vi.fn(() => ({ isDesignMode: false, isPreviewMode: false }));
const mockIsEmbedded = vi.fn(() => false);

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockPageDesignerMode(),
    useIsWithinEmbeddedSubtree: () => mockIsEmbedded(),
}));

const THEME: SiteThemeValue = {
    version: 1,
    preset: 'custom',
    autoContrast: true,
    tokens: {
        background: '#FDFCFB',
        foreground: '#151515',
        primary: '#8A1538',
        'primary-foreground': '#FFFFFF',
        'header-background': '#26141B',
        'header-foreground': '#FFFFFF',
    },
};

const COMPONENT = {
    id: 'site-theme-1',
    typeId: 'SFNextToolkit.siteTheme',
    visible: true,
} as ComponentType;

describe('SFNext Toolkit site theme', () => {
    beforeEach(() => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
        mockIsEmbedded.mockReturnValue(false);
    });

    test('publishes the Page Designer custom-editor contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitSiteThemeMetadata)).toBe('SFNextToolkit.siteTheme');

        const { fields } = getAttributeDefinitions(SFNextToolkitSiteThemeMetadata.prototype);
        expect(fields.enabled).toMatchObject({
            id: 'enabled',
            type: 'boolean',
            defaultValue: true,
        });
        expect(fields.theme).toMatchObject({
            id: 'theme',
            type: 'custom',
            required: false,
            editorDefinition: {
                type: 'SFNextToolkit.themeEditor',
                configuration: { schemaVersion: 1 },
            },
        });
    });

    test('emits deterministic root token overrides only inside a live embedded subtree', () => {
        mockIsEmbedded.mockReturnValue(true);
        const { container } = render(<SiteTheme component={COMPONENT} regionId="siteTheme" theme={THEME} />);

        const style = container.querySelector('[data-slot="sfnext-toolkit-site-theme"]');
        expect(style).toHaveAttribute('data-theme-version', '1');
        expect(style).toHaveAttribute('data-theme-preset', 'custom');
        expect(style?.textContent).toBe(serializeSiteThemeCss(THEME));
        expect(style?.textContent).toContain('--brand-primary:#8A1538');
        expect(style?.textContent).toContain('--swatch-text-selected:#FFFFFF');
        expect(style?.textContent).toContain('--sidebar-primary:#8A1538');
        expect(style?.textContent).toContain('--agentic-primary:#8A1538');
    });

    test.each([
        ['ordinary page content', { embedded: false, enabled: true, visible: true, regionId: 'siteTheme' }],
        ['wrong embedded region', { embedded: true, enabled: true, visible: true, regionId: 'announcement' }],
        ['disabled content', { embedded: true, enabled: false, visible: true, regionId: 'siteTheme' }],
        ['offline content', { embedded: true, enabled: true, visible: false, regionId: 'siteTheme' }],
    ])('fails closed for %s', (_label, state) => {
        mockIsEmbedded.mockReturnValue(state.embedded);
        const component = { ...COMPONENT, visible: state.visible } as ComponentType;
        const { container } = render(
            <SiteTheme component={component} enabled={state.enabled} regionId={state.regionId} theme={THEME} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    test('renders an isolated design-mode preview without changing root variables', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        const { container } = render(<SiteTheme component={COMPONENT} theme={THEME} />);

        expect(container.querySelector('style')).not.toBeInTheDocument();
        const preview = screen.getByRole('region', { name: 'Site theme preview' });
        expect(preview).toHaveAttribute('data-authoring-mode', 'EDIT');
        expect(preview).toHaveAttribute('data-theme-preset', 'custom');
        expect(preview.getAttribute('style')).toContain('--primary: #8A1538');
        expect(screen.getByText('6 token overrides')).toBeInTheDocument();
        expect(screen.getByText('Primary action')).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    test('uses the same scoped preview in PREVIEW mode and preserves a disabled palette', () => {
        mockPageDesignerMode.mockReturnValue({ isDesignMode: false, isPreviewMode: true });
        mockIsEmbedded.mockReturnValue(true);
        const { container } = render(<SiteTheme component={COMPONENT} enabled={false} theme={THEME} />);

        expect(container.querySelector('style')).not.toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Site theme preview' })).toHaveAttribute(
            'data-authoring-mode',
            'PREVIEW'
        );
        expect(screen.getByRole('status')).toHaveTextContent('The theme is disabled');
    });

    test('uses a layout-free fallback', () => {
        const { container } = render(<SiteThemeFallback />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe('site theme model', () => {
    test('strictly sanitizes colors and ignores unknown, bridge, and malformed tokens', () => {
        const value = {
            version: 1,
            preset: 'custom',
            tokens: {
                primary: ' #0a7bc1 ',
                foreground: '#fff;}</style><script>alert(1)</script>',
                background: 'white',
                '--color-primary': '#123456',
                constructor: '#654321',
            },
        };

        expect(sanitizeSiteThemeColor('#aBc123')).toBe('#ABC123');
        expect(sanitizeSiteThemeColor('#fff')).toBeUndefined();
        expect(normalizeSiteTheme(value).tokens).toEqual({ primary: '#0A7BC1' });
        expect(serializeSiteThemeCss(value)).toContain('--brand-primary:#0A7BC1');
        expect(serializeSiteThemeCss(value, ':root[data-brand="mayoral"]')).toMatch(
            /^:root\[data-brand="mayoral"\]\{--primary:#0A7BC1;/
        );
        expect(getSiteThemePreviewStyle(value)).toMatchObject({
            '--primary': '#0A7BC1',
            '--brand-primary': '#0A7BC1',
            '--swatch-border-selected': '#0A7BC1',
            '--sidebar-primary': '#0A7BC1',
            '--agentic-primary': '#0A7BC1',
        });
        expect(countSiteThemeOverrides(value)).toBe(1);
    });

    test('derives semantic aliases one way and preserves every explicit alias override', () => {
        const tokens = resolveSiteThemeTokens({
            version: 1,
            preset: 'custom',
            tokens: {
                background: '#050505',
                foreground: '#060606',
                primary: '#111111',
                'primary-foreground': '#222222',
                secondary: '#333333',
                'secondary-foreground': '#444444',
                accent: '#555555',
                'accent-foreground': '#666666',
                input: '#777777',
                border: '#888888',
                'border-subtle': '#898989',
                ring: '#909090',
                info: '#AAAAAA',
                'info-foreground': '#BBBBBB',
                success: '#CCCCCC',
                'success-foreground': '#DDDDDD',
                destructive: '#E1E1E1',
                'destructive-foreground': '#E2E2E2',
                muted: '#E3E3E3',
                'muted-foreground': '#E4E4E4',
                'brand-primary': '#123456',
                'agentic-primary': '#654321',
            },
        });

        expect(tokens).toMatchObject({
            focus: '#111111',
            'destructive-focus': '#E1E1E1',
            'bg-input-30': '#050505',
            'bg-input-50': '#E3E3E3',
            'bg-input-80': '#777777',
            'brand-primary': '#123456',
            'brand-primary-hover': '#111111',
            sidebar: '#050505',
            'sidebar-foreground': '#060606',
            'sidebar-primary': '#111111',
            'sidebar-primary-foreground': '#222222',
            'sidebar-accent': '#555555',
            'sidebar-accent-foreground': '#666666',
            'sidebar-border': '#888888',
            'sidebar-ring': '#111111',
            'swatch-bg': '#333333',
            'swatch-bg-selected': '#111111',
            'swatch-border': '#777777',
            'swatch-text': '#444444',
            'swatch-text-selected': '#222222',
            'filter-selected': '#BBBBBB',
            'filter-selected-border': '#AAAAAA',
            'review-verified-bg': '#DDDDDD',
            'review-verified-text': '#CCCCCC',
            'product-badge-promo-bg': '#111111',
            'account-action-destructive': '#E1E1E1',
            'status-positive': '#CCCCCC',
            'agentic-primary': '#654321',
            'agentic-accent': '#555555',
            'agentic-ring': '#909090',
            'agentic-message-input': '#BBBBBB',
        });
        expect(tokens).not.toHaveProperty('brand-gray-500');
    });

    test('accepts serialized custom-editor data but rejects missing or future versions', () => {
        expect(
            normalizeSiteTheme(
                JSON.stringify({ version: 1, preset: 'midnight', autoContrast: false, tokens: { card: '#101010' } })
            )
        ).toEqual({
            version: 1,
            preset: 'midnight',
            autoContrast: false,
            tokens: { card: '#101010' },
        });
        expect(normalizeSiteTheme({ version: 2, tokens: { primary: '#123456' } }).tokens).toEqual({});
        expect(normalizeSiteTheme('{broken').tokens).toEqual({});
    });

    test('allow-lists every Tailwind color source except external payment palettes', () => {
        const tokens = Object.values(SITE_THEME_TOKEN_GROUPS).flat();
        const tailwindSource = readFileSync(resolve(process.cwd(), 'src/theme/tailwind.css'), 'utf8');
        const bridgedSources = [...tailwindSource.matchAll(/--color-[\w-]+:\s*var\(--([\w-]+)\)/g)].map(
            (match) => match[1]
        );
        const excludedPaymentTokens = new Set(['paypal-gold', 'venmo-blue']);
        const missingSources = bridgedSources.filter(
            (token) => !excludedPaymentTokens.has(token) && !tokens.includes(token as (typeof tokens)[number])
        );

        expect(new Set(tokens).size).toBe(tokens.length);
        expect(tokens.length).toBeGreaterThan(100);
        expect(tokens.every((token) => !token.startsWith('--') && !token.startsWith('color-'))).toBe(true);
        expect(missingSources).toEqual([]);
        expect(tokens).not.toEqual(expect.arrayContaining(['paypal-gold', 'venmo-blue']));
        expect(tokens).not.toEqual(
            expect.arrayContaining(['ui-radius', 'ui-shadow', 'opacity-50', 'swatch-color-shadow'])
        );
        expect(
            SITE_THEME_ALIAS_DERIVATIONS.every(([alias, source]) => tokens.includes(alias) && tokens.includes(source))
        ).toBe(true);
    });
});
