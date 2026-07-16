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
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import { HeaderSiteTheme } from './header-site-theme';
import { extractSiteThemeFromHeader, projectSiteThemeHeaderOwner } from './header-site-theme-model';

const mockMode = vi.hoisted(() => vi.fn(() => ({ isDesignMode: false, isPreviewMode: false })));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockMode(),
    EmbeddedSubtreeProvider: ({ embedded, children }: { embedded: boolean; children: React.ReactNode }) => (
        <div data-testid="embedded-provider" data-embedded={String(embedded)}>
            {children}
        </div>
    ),
}));

vi.mock('./index', () => ({
    default: ({ enabled, theme, component }: { enabled?: boolean; theme?: unknown; component?: { id?: string } }) => (
        <div
            data-testid="site-theme"
            data-enabled={String(enabled)}
            data-component-id={component?.id}
            data-primary={(theme as { tokens?: { primary?: string } } | undefined)?.tokens?.primary}
        />
    ),
}));

function headerWithTheme(overrides: Record<string, unknown> = {}): ComponentWithComponentData {
    return {
        id: 'header',
        typeId: 'Layout.header',
        embedded: true,
        regions: [
            {
                id: 'siteTheme',
                components: [
                    {
                        id: 'theme-1',
                        typeId: 'SFNextToolkit.siteTheme',
                        visible: true,
                        data: {
                            enabled: false,
                            theme: { version: 1, tokens: { primary: '#8A1538' } },
                        },
                        ...overrides,
                    },
                ],
            },
        ],
    } as unknown as ComponentWithComponentData;
}

describe('Header Site Theme projection', () => {
    beforeEach(() => {
        mockMode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
    });

    test('extracts and renders the complete child synchronously inside the embedded subtree', () => {
        const header = headerWithTheme();
        const extracted = extractSiteThemeFromHeader(header);
        const projected = projectSiteThemeHeaderOwner(header);

        expect(extracted).toMatchObject({ id: 'theme-1', visible: true });
        expect(projected).toMatchObject({
            id: 'header',
            embedded: true,
            regions: [{ id: 'siteTheme', components: [{ id: 'theme-1' }] }],
        });
        expect(projected?.regions).toHaveLength(1);
        render(<HeaderSiteTheme header={header} />);

        expect(screen.getByTestId('embedded-provider')).toHaveAttribute('data-embedded', 'true');
        expect(screen.getByTestId('site-theme')).toHaveAttribute('data-enabled', 'false');
        expect(screen.getByTestId('site-theme')).toHaveAttribute('data-component-id', 'theme-1');
        expect(screen.getByTestId('site-theme')).toHaveAttribute('data-primary', '#8A1538');
    });

    test.each([
        ['missing owner', null],
        ['missing region', { ...headerWithTheme(), regions: [] }],
        ['wrong child type', headerWithTheme({ typeId: 'SFNextToolkit.promoCard' })],
        ['malformed child without id', headerWithTheme({ id: undefined })],
    ])('fails closed for %s', (_label, header) => {
        const { container } = render(<HeaderSiteTheme header={header} />);
        expect(container).toBeEmptyDOMElement();
    });

    test.each([
        ['EDIT', { isDesignMode: true, isPreviewMode: false }],
        ['PREVIEW', { isDesignMode: false, isPreviewMode: true }],
    ])('suppresses the published global projection in %s mode', (_label, mode) => {
        mockMode.mockReturnValue(mode);
        const { container } = render(<HeaderSiteTheme header={headerWithTheme()} />);
        expect(container).toBeEmptyDOMElement();
    });
});
