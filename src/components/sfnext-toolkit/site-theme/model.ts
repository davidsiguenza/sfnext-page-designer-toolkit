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

/**
 * Only source tokens are configurable. Tailwind's generated `--color-*`
 * bridge variables intentionally stay out of this contract so aliases and
 * utilities continue to resolve through the Storefront Next token graph.
 */
export const SITE_THEME_TOKEN_GROUPS = {
    core: [
        'background',
        'foreground',
        'card',
        'card-foreground',
        'popover',
        'popover-foreground',
        'muted',
        'muted-foreground',
        'muted-hover',
        'accent',
        'accent-foreground',
        'border',
        'border-subtle',
        'input',
        'ring',
        'separator',
        'separator-foreground',
    ],
    actions: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'tertiary', 'tertiary-foreground'],
    commerce: [
        'focus',
        'destructive-focus',
        'bg-input-30',
        'bg-input-50',
        'bg-input-80',
        'brand-primary',
        'brand-primary-hover',
        'sidebar',
        'sidebar-foreground',
        'sidebar-primary',
        'sidebar-primary-foreground',
        'sidebar-accent',
        'sidebar-accent-foreground',
        'sidebar-border',
        'sidebar-ring',
        'swatch-group-bg',
        'swatch-bg',
        'swatch-bg-selected',
        'swatch-border',
        'swatch-border-selected',
        'swatch-text',
        'swatch-text-selected',
        'swatch-color-border-hover',
        'filter-selected',
        'filter-selected-border',
        'review-verified-bg',
        'review-verified-text',
        'product-badge-promo-bg',
        'product-badge-promo-foreground',
        'account-action-destructive',
        'account-action-destructive-foreground',
        'status-positive',
    ],
    chrome: [
        'header-background',
        'header-foreground',
        'header-border',
        'header-divider',
        'header-menu-background',
        'header-menu-foreground',
        'header-menu-border',
        'header-menu-hover-background',
        'header-menu-hover-foreground',
        'header-menu-active-background',
        'header-menu-icon',
        'footer-background',
        'footer-foreground',
    ],
    status: [
        'destructive',
        'destructive-foreground',
        'success',
        'success-foreground',
        'warning',
        'warning-foreground',
        'warning-bg',
        'warning-border',
        'info',
        'info-foreground',
        'active-bg',
        'active-foreground',
        'status-warning',
        'status-critical',
        'status-critical-strong',
        'status-critical-bg',
        'status-critical-foreground',
        'status-critical-border',
        'status-info',
        'rating',
        'rating-foreground',
    ],
    agentic: [
        'agentic',
        'agentic-foreground',
        'agentic-primary',
        'agentic-primary-foreground',
        'agentic-accent',
        'agentic-accent-foreground',
        'agentic-border',
        'agentic-border-subtle',
        'agentic-ring',
        'agentic-muted',
        'agentic-muted-foreground',
        'agentic-message-output',
        'agentic-message-input',
    ],
    brandPrimitives: [
        'brand-black',
        'brand-black-off',
        'brand-black-charcoal',
        'brand-white',
        'brand-white-bone',
        'brand-white-ivory',
        'brand-gray-50',
        'brand-gray-100',
        'brand-gray-200',
        'brand-gray-300',
        'brand-gray-400',
        'brand-gray-500',
        'brand-gray-600',
        'brand-gray-700',
        'brand-gray-800',
        'brand-gray-900',
    ],
} as const;

type TokenGroups = typeof SITE_THEME_TOKEN_GROUPS;
type TokenGroupName = keyof TokenGroups;

export type SiteThemeToken = TokenGroups[TokenGroupName][number];
export type SiteThemePreset = 'default' | 'warmEditorial' | 'midnight' | 'custom';

/**
 * Storefront aliases that otherwise keep their code-defined brand values when
 * a merchant changes the corresponding semantic source token. Explicit alias
 * values always take precedence over these one-way derivations.
 */
export const SITE_THEME_ALIAS_DERIVATIONS = [
    ['focus', 'primary'],
    ['destructive-focus', 'destructive'],
    ['bg-input-30', 'background'],
    ['bg-input-50', 'muted'],
    ['bg-input-80', 'input'],
    ['brand-primary', 'primary'],
    ['brand-primary-hover', 'primary'],
    ['sidebar', 'background'],
    ['sidebar-foreground', 'foreground'],
    ['sidebar-primary', 'primary'],
    ['sidebar-primary-foreground', 'primary-foreground'],
    ['sidebar-accent', 'accent'],
    ['sidebar-accent-foreground', 'accent-foreground'],
    ['sidebar-border', 'border'],
    ['sidebar-ring', 'primary'],
    ['swatch-group-bg', 'background'],
    ['swatch-bg', 'secondary'],
    ['swatch-bg-selected', 'primary'],
    ['swatch-border', 'input'],
    ['swatch-border-selected', 'primary'],
    ['swatch-text', 'secondary-foreground'],
    ['swatch-text-selected', 'primary-foreground'],
    ['swatch-color-border-hover', 'primary'],
    ['filter-selected', 'info-foreground'],
    ['filter-selected-border', 'info'],
    ['review-verified-bg', 'success-foreground'],
    ['review-verified-text', 'success'],
    ['product-badge-promo-bg', 'primary'],
    ['product-badge-promo-foreground', 'info-foreground'],
    ['account-action-destructive', 'destructive'],
    ['account-action-destructive-foreground', 'destructive-foreground'],
    ['status-positive', 'success'],
    ['agentic-foreground', 'foreground'],
    ['agentic-primary', 'primary'],
    ['agentic-primary-foreground', 'primary-foreground'],
    ['agentic-accent', 'accent'],
    ['agentic-accent-foreground', 'accent-foreground'],
    ['agentic-border', 'border'],
    ['agentic-border-subtle', 'border-subtle'],
    ['agentic-ring', 'ring'],
    ['agentic-muted', 'muted'],
    ['agentic-muted-foreground', 'muted-foreground'],
    ['agentic-message-output', 'foreground'],
    ['agentic-message-input', 'info-foreground'],
] as const satisfies readonly (readonly [SiteThemeToken, SiteThemeToken])[];

export interface SiteThemeValue {
    version: 1;
    preset?: SiteThemePreset;
    autoContrast?: boolean;
    tokens?: Partial<Record<SiteThemeToken, string>>;
}

export interface NormalizedSiteTheme {
    version: 1;
    preset: SiteThemePreset;
    autoContrast: boolean;
    tokens: Partial<Record<SiteThemeToken, string>>;
}

const SITE_THEME_PRESETS = new Set<SiteThemePreset>(['default', 'warmEditorial', 'midnight', 'custom']);
const SITE_THEME_TOKENS = Object.values(SITE_THEME_TOKEN_GROUPS).flat();
const STRICT_HEX_COLOR = /^#[0-9a-f]{6}$/i;

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function parseThemeValue(value: unknown): Record<string, unknown> | undefined {
    if (typeof value !== 'string') return asRecord(value);

    try {
        return asRecord(JSON.parse(value));
    } catch {
        return undefined;
    }
}

/** Accepts one canonical, injection-safe CSS color representation. */
export function sanitizeSiteThemeColor(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const color = value.trim();
    return STRICT_HEX_COLOR.test(color) ? color.toUpperCase() : undefined;
}

/** Normalizes untrusted Page Designer JSON against the versioned allow-list. */
export function normalizeSiteTheme(value: unknown): NormalizedSiteTheme {
    const source = parseThemeValue(value);
    if (!source || source.version !== 1) {
        return { version: 1, preset: 'default', autoContrast: true, tokens: {} };
    }

    const tokenSource = asRecord(source.tokens);
    const tokens: Partial<Record<SiteThemeToken, string>> = {};

    if (tokenSource) {
        for (const token of SITE_THEME_TOKENS) {
            const color = sanitizeSiteThemeColor(tokenSource[token]);
            if (color) tokens[token] = color;
        }
    }

    const preset =
        typeof source.preset === 'string' && SITE_THEME_PRESETS.has(source.preset as SiteThemePreset)
            ? (source.preset as SiteThemePreset)
            : 'custom';

    return {
        version: 1,
        preset,
        autoContrast: source.autoContrast !== false,
        tokens,
    };
}

/** Resolves one-way commerce aliases without replacing explicit merchant values. */
export function resolveSiteThemeTokens(value: unknown): NormalizedSiteTheme['tokens'] {
    const explicitTokens = normalizeSiteTheme(value).tokens;
    const resolvedTokens = { ...explicitTokens };

    for (const [alias, source] of SITE_THEME_ALIAS_DERIVATIONS) {
        if (resolvedTokens[alias] === undefined && explicitTokens[source] !== undefined) {
            resolvedTokens[alias] = explicitTokens[source];
        }
    }

    return resolvedTokens;
}

/** Deterministic declarations used by both SSR and hydration. */
export function serializeSiteThemeCss(value: unknown, selector = ':root,:root[data-brand]'): string | undefined {
    const tokens = resolveSiteThemeTokens(value);
    const declarations = SITE_THEME_TOKENS.flatMap((token) => {
        const color = tokens[token];
        return color ? [`--${token}:${color}`] : [];
    });

    return declarations.length ? `${selector}{${declarations.join(';')}}` : undefined;
}

/** Scoped variables for the authoring preview; these never target `:root`. */
export function getSiteThemePreviewStyle(value: unknown): Record<`--${string}`, string> {
    const tokens = resolveSiteThemeTokens(value);
    return Object.fromEntries(
        SITE_THEME_TOKENS.flatMap((token) => {
            const color = tokens[token];
            return color ? [[`--${token}`, color]] : [];
        })
    ) as Record<`--${string}`, string>;
}

export function countSiteThemeOverrides(value: unknown): number {
    return Object.keys(normalizeSiteTheme(value).tokens).length;
}
