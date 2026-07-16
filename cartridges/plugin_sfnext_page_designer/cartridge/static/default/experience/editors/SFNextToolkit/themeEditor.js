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
/* global document, window */
(function initializeThemeEditor(root) {
    'use strict';

    if (typeof root.subscribe !== 'function' || typeof root.emit !== 'function') return;

    var VERSION = 1;
    var HEX_COLOR = /^#[0-9a-f]{6}$/i;
    var BLACK = '#000000';
    var WHITE = '#FFFFFF';

    var GROUPS = [
        {
            id: 'core',
            label: 'Core surfaces',
            description: 'Page, card, popover, muted and focus surfaces.',
            tokens: [
                token('background', 'Page background', 'Main storefront canvas.', 'foreground'),
                token('foreground', 'Page text', 'Default text on the page background.'),
                token('card', 'Card background', 'Product tiles, panels and grouped content.', 'card-foreground'),
                token('card-foreground', 'Card text', 'Text displayed on card surfaces.'),
                token('popover', 'Popover background', 'Menus, dialogs and floating panels.', 'popover-foreground'),
                token('popover-foreground', 'Popover text', 'Text displayed on popovers.'),
                token('muted', 'Muted background', 'Quiet panels and disabled surfaces.', 'muted-foreground'),
                token('muted-foreground', 'Muted text', 'Secondary labels and helper copy.'),
                token('muted-hover', 'Muted hover', 'Hover treatment for quiet controls.'),
                token('accent', 'Accent background', 'Selected chips and highlighted surfaces.', 'accent-foreground'),
                token('accent-foreground', 'Accent text', 'Text displayed on accent surfaces.'),
                token('border', 'Border', 'Default dividers and component outlines.'),
                token('border-subtle', 'Subtle border', 'Low-emphasis card and field outlines.'),
                token('input', 'Input surface', 'Input borders and subtle field fills.'),
                token('ring', 'Focus ring', 'Keyboard focus indicator.'),
                token('separator', 'Separator', 'Quiet structural separators.'),
                token('separator-foreground', 'Separator detail', 'Icons and labels paired with separators.'),
            ],
        },
        {
            id: 'actions',
            label: 'Actions',
            description: 'Primary, secondary and tertiary action pairings.',
            tokens: [
                token('primary', 'Primary action', 'Main calls to action.', 'primary-foreground'),
                token('primary-foreground', 'Primary action text', 'Text and icons on primary actions.'),
                token('secondary', 'Secondary action', 'Alternative calls to action.', 'secondary-foreground'),
                token('secondary-foreground', 'Secondary action text', 'Text and icons on secondary actions.'),
                token('tertiary', 'Tertiary action', 'Positive or supporting calls to action.', 'tertiary-foreground'),
                token('tertiary-foreground', 'Tertiary action text', 'Text and icons on tertiary actions.'),
            ],
        },
        {
            id: 'commerce',
            label: 'Commerce aliases',
            description: 'Brand, account, swatch, filter, review and product-status colors.',
            tokens: [
                token('focus', 'Focus overlay', 'Legacy focus treatment; derives from Primary action.'),
                token(
                    'destructive-focus',
                    'Destructive focus',
                    'Solid destructive focus treatment; derives from Destructive.'
                ),
                token('bg-input-30', 'Input background 30', 'Light input helper; derives from Page background.'),
                token('bg-input-50', 'Input background 50', 'Muted input helper; derives from Muted background.'),
                token('bg-input-80', 'Input background 80', 'Strong input helper; derives from Input surface.'),
                token('brand-primary', 'Brand primary', 'Legacy branded actions; derives from Primary action.'),
                token(
                    'brand-primary-hover',
                    'Brand primary hover',
                    'Legacy branded action hover; derives from Primary action.'
                ),
                token(
                    'sidebar',
                    'Sidebar background',
                    'Account-sidebar surface; derives from Page background.',
                    'sidebar-foreground'
                ),
                token('sidebar-foreground', 'Sidebar text', 'Account-sidebar content; derives from Page text.'),
                token(
                    'sidebar-primary',
                    'Sidebar primary',
                    'Account-sidebar primary state; derives from Primary action.',
                    'sidebar-primary-foreground'
                ),
                token(
                    'sidebar-primary-foreground',
                    'Sidebar primary text',
                    'Content on the account-sidebar primary state; derives from Primary action text.'
                ),
                token(
                    'sidebar-accent',
                    'Sidebar accent',
                    'Account-sidebar hover and selected surface; derives from Accent background.',
                    'sidebar-accent-foreground'
                ),
                token(
                    'sidebar-accent-foreground',
                    'Sidebar accent text',
                    'Content on account-sidebar accent surfaces; derives from Accent text.'
                ),
                token('sidebar-border', 'Sidebar border', 'Account-sidebar dividers; derives from Border.'),
                token('sidebar-ring', 'Sidebar focus ring', 'Account-sidebar focus ring; derives from Primary action.'),
                token('swatch-group-bg', 'Swatch group background', 'Optional explicit surface behind swatch groups.'),
                token(
                    'swatch-bg',
                    'Swatch background',
                    'Unselected swatches; derives from Secondary action.',
                    'swatch-text'
                ),
                token(
                    'swatch-bg-selected',
                    'Selected swatch background',
                    'Selected size and variation swatches; derives from Primary action.',
                    'swatch-text-selected'
                ),
                token('swatch-border', 'Swatch border', 'Unselected swatch outline; derives from Input surface.'),
                token(
                    'swatch-border-selected',
                    'Selected swatch border',
                    'Selected swatch outline; derives from Primary action.'
                ),
                token('swatch-text', 'Swatch text', 'Unselected swatch label; derives from Secondary action text.'),
                token(
                    'swatch-text-selected',
                    'Selected swatch text',
                    'Selected swatch label; derives from Primary action text.'
                ),
                token(
                    'swatch-color-border-hover',
                    'Swatch hover border',
                    'Color and label swatch hover outline; derives from Primary action.'
                ),
                token(
                    'filter-selected',
                    'Selected filter',
                    'Selected refinement background; derives from Information text.'
                ),
                token(
                    'filter-selected-border',
                    'Selected filter border',
                    'Selected refinement border; derives from Information.'
                ),
                token(
                    'review-verified-bg',
                    'Verified review background',
                    'Verified-review badge surface; derives from Success text.',
                    'review-verified-text'
                ),
                token(
                    'review-verified-text',
                    'Verified review text',
                    'Verified-review badge content; derives from Success.'
                ),
                token(
                    'product-badge-promo-bg',
                    'Promotional product badge',
                    'Product promotion badge surface; derives from Primary action.',
                    'product-badge-promo-foreground'
                ),
                token(
                    'product-badge-promo-foreground',
                    'Promotional product badge text',
                    'Product promotion badge content; derives from Information text.'
                ),
                token(
                    'account-action-destructive',
                    'Account destructive action',
                    'Destructive account controls; derives from Destructive.',
                    'account-action-destructive-foreground'
                ),
                token(
                    'account-action-destructive-foreground',
                    'Account destructive text',
                    'Content on destructive account controls; derives from Destructive text.'
                ),
                token('status-positive', 'Positive status', 'Positive operational status; derives from Success.'),
            ],
        },
        {
            id: 'chrome',
            label: 'Header and footer',
            description: 'Global storefront chrome and navigation states.',
            tokens: [
                token('header-background', 'Header background', 'Main site header.', 'header-foreground'),
                token('header-foreground', 'Header text', 'Header links and icons.'),
                token('header-border', 'Header border', 'Outer header divider.'),
                token('header-divider', 'Header divider', 'Internal header separators.'),
                token(
                    'header-menu-background',
                    'Menu background',
                    'Desktop mega-menu and navigation panels.',
                    'header-menu-foreground'
                ),
                token('header-menu-foreground', 'Menu text', 'Navigation panel labels and links.'),
                token('header-menu-border', 'Menu border', 'Navigation panel outline.'),
                token(
                    'header-menu-hover-background',
                    'Menu hover background',
                    'Hovered navigation item.',
                    'header-menu-hover-foreground'
                ),
                token('header-menu-hover-foreground', 'Menu hover text', 'Text on hovered navigation items.'),
                token('header-menu-active-background', 'Menu active background', 'Selected navigation item.'),
                token('header-menu-icon', 'Menu icon', 'Navigation arrows and supporting icons.'),
                token('footer-background', 'Footer background', 'Global site footer.', 'footer-foreground'),
                token('footer-foreground', 'Footer text', 'Footer links and labels.'),
            ],
        },
        {
            id: 'status',
            label: 'Status and feedback',
            description: 'Success, warning, information and destructive states.',
            tokens: [
                token('destructive', 'Destructive', 'Errors and destructive actions.', 'destructive-foreground'),
                token('destructive-foreground', 'Destructive text', 'Content on destructive surfaces.'),
                token('success', 'Success', 'Positive confirmation and availability.', 'success-foreground'),
                token('success-foreground', 'Success text', 'Content on success surfaces.'),
                token('warning', 'Warning', 'Strong caution state.', 'warning-foreground'),
                token('warning-foreground', 'Warning text', 'Content on warning surfaces.'),
                token('warning-bg', 'Warning panel', 'Quiet warning background.'),
                token('warning-border', 'Warning border', 'Warning panel outline.'),
                token('info', 'Information', 'Informational actions and notices.', 'info-foreground'),
                token('info-foreground', 'Information text', 'Content on information surfaces.'),
                token('active-bg', 'Active background', 'Authorized or active badges.', 'active-foreground'),
                token('active-foreground', 'Active text', 'Content on active badges.'),
                token('status-warning', 'Status warning', 'Inventory and operational warnings.'),
                token('status-critical', 'Status critical', 'Critical inventory or operational state.'),
                token('status-critical-strong', 'Status critical strong', 'High-emphasis critical state.'),
                token(
                    'status-critical-bg',
                    'Critical panel',
                    'Quiet critical background.',
                    'status-critical-foreground'
                ),
                token('status-critical-foreground', 'Critical panel text', 'Content on critical panels.'),
                token('status-critical-border', 'Critical border', 'Critical panel outline.'),
                token('status-info', 'Status information', 'Operational informational state.'),
                token('rating', 'Rating', 'Stars and score highlights.', 'rating-foreground'),
                token('rating-foreground', 'Rating contrast', 'Content displayed on rating surfaces.'),
            ],
        },
        {
            id: 'agentic',
            label: 'Agentic experience',
            description: 'Agent surfaces, actions, messages, borders and muted states.',
            tokens: [
                token('agentic', 'Agent identity', 'Distinctive agent identity color.', 'agentic-foreground'),
                token('agentic-foreground', 'Agent identity text', 'Content paired with the agent identity color.'),
                token(
                    'agentic-primary',
                    'Agent primary',
                    'Agent primary action; derives from Primary action.',
                    'agentic-primary-foreground'
                ),
                token(
                    'agentic-primary-foreground',
                    'Agent primary text',
                    'Content on agent primary actions; derives from Primary action text.'
                ),
                token(
                    'agentic-accent',
                    'Agent accent',
                    'Agent highlighted surface; derives from Accent background.',
                    'agentic-accent-foreground'
                ),
                token(
                    'agentic-accent-foreground',
                    'Agent accent text',
                    'Content on agent accent surfaces; derives from Accent text.'
                ),
                token('agentic-border', 'Agent border', 'Agent component outlines; derives from Border.'),
                token(
                    'agentic-border-subtle',
                    'Agent subtle border',
                    'Quiet agent component outlines; derives from Subtle border.'
                ),
                token('agentic-ring', 'Agent focus ring', 'Agent keyboard focus indicator; derives from Focus ring.'),
                token(
                    'agentic-muted',
                    'Agent muted surface',
                    'Quiet agent panels; derives from Muted background.',
                    'agentic-muted-foreground'
                ),
                token(
                    'agentic-muted-foreground',
                    'Agent muted text',
                    'Secondary agent content; derives from Muted text.'
                ),
                token(
                    'agentic-message-output',
                    'Agent output message',
                    'Agent response content; derives from Page text.'
                ),
                token(
                    'agentic-message-input',
                    'Shopper input message',
                    'Shopper message surface; derives from Information text.'
                ),
            ],
        },
        {
            id: 'brandPrimitives',
            label: 'Brand primitives',
            description: 'Independent black, white and neutral ramps used by legacy brand-aware components.',
            tokens: [
                token('brand-black', 'Brand black', 'Strongest brand black.'),
                token('brand-black-off', 'Brand off-black', 'Softer brand black.'),
                token('brand-black-charcoal', 'Brand charcoal', 'Charcoal brand neutral.'),
                token('brand-white', 'Brand white', 'Strongest brand white.'),
                token('brand-white-bone', 'Brand bone', 'Warm off-white brand neutral.'),
                token('brand-white-ivory', 'Brand ivory', 'Cool off-white brand neutral.'),
                token('brand-gray-50', 'Brand gray 50', 'Lightest gray ramp step.'),
                token('brand-gray-100', 'Brand gray 100', 'Gray ramp step 100.'),
                token('brand-gray-200', 'Brand gray 200', 'Gray ramp step 200.'),
                token('brand-gray-300', 'Brand gray 300', 'Gray ramp step 300.'),
                token('brand-gray-400', 'Brand gray 400', 'Gray ramp step 400.'),
                token('brand-gray-500', 'Brand gray 500', 'Gray ramp midpoint.'),
                token('brand-gray-600', 'Brand gray 600', 'Gray ramp step 600.'),
                token('brand-gray-700', 'Brand gray 700', 'Gray ramp step 700.'),
                token('brand-gray-800', 'Brand gray 800', 'Gray ramp step 800.'),
                token('brand-gray-900', 'Brand gray 900', 'Darkest gray ramp step.'),
            ],
        },
    ];

    var DEFAULTS = {
        background: '#FFFFFF',
        foreground: '#17171B',
        card: '#FFFFFF',
        'card-foreground': '#3F3F46',
        popover: '#FFFFFF',
        'popover-foreground': '#3F3F46',
        muted: '#F9FAFB',
        'muted-foreground': '#35353B',
        'muted-hover': '#EBEBEB',
        accent: '#ECECEC',
        'accent-foreground': '#373737',
        border: '#9CA3AF',
        'border-subtle': '#D1D5DB',
        input: '#E8E8E8',
        ring: '#3B82F6',
        separator: '#EBEBEB',
        'separator-foreground': '#9E9E9E',
        primary: '#131315',
        'primary-foreground': '#FFFFFF',
        secondary: '#F8F8F8',
        'secondary-foreground': '#33373D',
        tertiary: '#1CB167',
        'tertiary-foreground': '#FFFFFF',
        focus: '#A3A3A3',
        'destructive-focus': '#DC2828',
        'bg-input-30': '#FFFFFF',
        'bg-input-50': '#FAFAFA',
        'bg-input-80': '#F4F4F5',
        'brand-primary': '#000000',
        'brand-primary-hover': '#333333',
        sidebar: '#FAFAFA',
        'sidebar-foreground': '#3F3F46',
        'sidebar-primary': '#3B82F6',
        'sidebar-primary-foreground': '#FFFFFF',
        'sidebar-accent': '#ECECEC',
        'sidebar-accent-foreground': '#1E3A8A',
        'sidebar-border': '#FAFAFA',
        'sidebar-ring': '#3D73F2',
        'swatch-group-bg': '#FFFFFF',
        'swatch-bg': '#F8F8F8',
        'swatch-bg-selected': '#131315',
        'swatch-border': '#E8E8E8',
        'swatch-border-selected': '#131315',
        'swatch-text': '#33373D',
        'swatch-text-selected': '#FFFFFF',
        'swatch-color-border-hover': '#000000',
        'filter-selected': '#DBEAFE',
        'filter-selected-border': '#0369A1',
        'review-verified-bg': '#CBEAD7',
        'review-verified-text': '#166534',
        'product-badge-promo-bg': '#131315',
        'product-badge-promo-foreground': '#DBEAFE',
        'account-action-destructive': '#B91C1C',
        'account-action-destructive-foreground': '#FFFFFF',
        'status-positive': '#166534',
        'header-background': '#18181B',
        'header-foreground': '#FFFFFF',
        'header-border': '#303034',
        'header-divider': '#303034',
        'header-menu-background': '#18181B',
        'header-menu-foreground': '#FFFFFF',
        'header-menu-border': '#303034',
        'header-menu-hover-background': '#FFFFFF',
        'header-menu-hover-foreground': '#000000',
        'header-menu-active-background': '#27272A',
        'header-menu-icon': '#BDBDC2',
        'footer-background': '#FFFFFF',
        'footer-foreground': '#000000',
        destructive: '#B91C1C',
        'destructive-foreground': '#FEE2E2',
        success: '#166534',
        'success-foreground': '#CBEAD7',
        warning: '#B45309',
        'warning-foreground': '#FEF9C3',
        'warning-bg': '#FFF7ED',
        'warning-border': '#FED7AA',
        info: '#0369A1',
        'info-foreground': '#DBEAFE',
        'active-bg': '#DCFCE7',
        'active-foreground': '#15803D',
        'status-warning': '#C2410C',
        'status-critical': '#DC2626',
        'status-critical-strong': '#DC2626',
        'status-critical-bg': '#FEF2F2',
        'status-critical-foreground': '#991B1B',
        'status-critical-border': '#FECACA',
        'status-info': '#2563EB',
        rating: '#FACC15',
        'rating-foreground': '#FFFFFF',
        agentic: '#8A38F5',
        'agentic-foreground': '#17171B',
        'agentic-primary': '#131315',
        'agentic-primary-foreground': '#FFFFFF',
        'agentic-accent': '#ECECEC',
        'agentic-accent-foreground': '#373737',
        'agentic-border': '#9CA3AF',
        'agentic-border-subtle': '#D1D5DB',
        'agentic-ring': '#3B82F6',
        'agentic-muted': '#F9FAFB',
        'agentic-muted-foreground': '#35353B',
        'agentic-message-output': '#171717',
        'agentic-message-input': '#DBEAFE',
        'brand-black': '#000000',
        'brand-black-off': '#121212',
        'brand-black-charcoal': '#242424',
        'brand-white': '#FFFFFF',
        'brand-white-bone': '#FAFAF9',
        'brand-white-ivory': '#FCFCFC',
        'brand-gray-50': '#FAFAFA',
        'brand-gray-100': '#F5F5F5',
        'brand-gray-200': '#EDEDED',
        'brand-gray-300': '#E5E5E5',
        'brand-gray-400': '#D4D4D4',
        'brand-gray-500': '#9E9E9E',
        'brand-gray-600': '#757575',
        'brand-gray-700': '#616161',
        'brand-gray-800': '#424242',
        'brand-gray-900': '#212121',
    };

    var PRESETS = {
        default: {},
        warmEditorial: {
            background: '#FFFDF9',
            foreground: '#211B18',
            card: '#FFFFFF',
            'card-foreground': '#211B18',
            primary: '#8A1538',
            'primary-foreground': '#FFFFFF',
            secondary: '#F4E8E2',
            'secondary-foreground': '#3B2529',
            tertiary: '#285C4D',
            'tertiary-foreground': '#FFFFFF',
            accent: '#F0D6C8',
            'accent-foreground': '#3B2529',
            'header-background': '#26141B',
            'header-foreground': '#FFFFFF',
            'header-menu-background': '#26141B',
            'header-menu-foreground': '#FFFFFF',
            'footer-background': '#F4E8E2',
            'footer-foreground': '#211B18',
        },
        midnight: {
            background: '#0D1321',
            foreground: '#F7F9FC',
            card: '#151E32',
            'card-foreground': '#F7F9FC',
            popover: '#151E32',
            'popover-foreground': '#F7F9FC',
            muted: '#202B43',
            'muted-foreground': '#C4CCDA',
            'muted-hover': '#2B3853',
            accent: '#334A70',
            'accent-foreground': '#F7F9FC',
            border: '#52617A',
            'border-subtle': '#384760',
            input: '#384760',
            ring: '#87BFFF',
            primary: '#87BFFF',
            'primary-foreground': '#0D1321',
            secondary: '#243653',
            'secondary-foreground': '#F7F9FC',
            tertiary: '#70D6B3',
            'tertiary-foreground': '#0D1321',
            'header-background': '#080D17',
            'header-foreground': '#F7F9FC',
            'header-menu-background': '#101827',
            'header-menu-foreground': '#F7F9FC',
            'header-menu-hover-background': '#87BFFF',
            'header-menu-hover-foreground': '#0D1321',
            'footer-background': '#080D17',
            'footer-foreground': '#F7F9FC',
        },
    };

    var DERIVED_ALIASES = {
        focus: 'primary',
        'destructive-focus': 'destructive',
        'bg-input-30': 'background',
        'bg-input-50': 'muted',
        'bg-input-80': 'input',
        'brand-primary': 'primary',
        'brand-primary-hover': 'primary',
        sidebar: 'background',
        'sidebar-foreground': 'foreground',
        'sidebar-primary': 'primary',
        'sidebar-primary-foreground': 'primary-foreground',
        'sidebar-accent': 'accent',
        'sidebar-accent-foreground': 'accent-foreground',
        'sidebar-border': 'border',
        'sidebar-ring': 'primary',
        'swatch-group-bg': 'background',
        'swatch-bg': 'secondary',
        'swatch-bg-selected': 'primary',
        'swatch-border': 'input',
        'swatch-border-selected': 'primary',
        'swatch-text': 'secondary-foreground',
        'swatch-text-selected': 'primary-foreground',
        'swatch-color-border-hover': 'primary',
        'filter-selected': 'info-foreground',
        'filter-selected-border': 'info',
        'review-verified-bg': 'success-foreground',
        'review-verified-text': 'success',
        'product-badge-promo-bg': 'primary',
        'product-badge-promo-foreground': 'info-foreground',
        'account-action-destructive': 'destructive',
        'account-action-destructive-foreground': 'destructive-foreground',
        'status-positive': 'success',
        'agentic-foreground': 'foreground',
        'agentic-primary': 'primary',
        'agentic-primary-foreground': 'primary-foreground',
        'agentic-accent': 'accent',
        'agentic-accent-foreground': 'accent-foreground',
        'agentic-border': 'border',
        'agentic-border-subtle': 'border-subtle',
        'agentic-ring': 'ring',
        'agentic-muted': 'muted',
        'agentic-muted-foreground': 'muted-foreground',
        'agentic-message-output': 'foreground',
        'agentic-message-input': 'info-foreground',
    };

    var ALLOWED_TOKENS = Object.create(null);
    var CONTRAST_PAIRS = Object.create(null);
    var TOKEN_DEFINITIONS = Object.create(null);
    GROUPS.forEach(function (group) {
        group.tokens.forEach(function (definition) {
            ALLOWED_TOKENS[definition.id] = true;
            TOKEN_DEFINITIONS[definition.id] = definition;
            if (definition.pair) CONTRAST_PAIRS[definition.id] = definition.pair;
        });
    });

    var state = {
        value: createDefaultValue(),
        disabled: false,
        required: false,
        draftInvalid: false,
        openGroups: { core: true, actions: true },
    };

    function token(id, label, description, pair) {
        return { id: id, label: label, description: description, pair: pair };
    }

    function createDefaultValue() {
        return { version: VERSION, preset: 'default', autoContrast: true, tokens: {} };
    }

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function parseIncomingValue(value) {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    function normalizeHex(value) {
        if (typeof value !== 'string') return null;
        var trimmed = value.trim();
        return HEX_COLOR.test(trimmed) ? trimmed.toUpperCase() : null;
    }

    function normalizeValue(rawValue) {
        var source = parseIncomingValue(rawValue);
        if (!isPlainObject(source) || source.version !== VERSION) return createDefaultValue();

        var tokens = {};
        if (isPlainObject(source.tokens)) {
            Object.keys(ALLOWED_TOKENS).forEach(function (id) {
                var color = normalizeHex(source.tokens[id]);
                if (color) tokens[id] = color;
            });
        }

        var preset =
            ['default', 'warmEditorial', 'midnight', 'custom'].indexOf(source.preset) >= 0 ? source.preset : 'custom';

        return {
            version: VERSION,
            preset: preset,
            autoContrast: source.autoContrast !== false,
            tokens: tokens,
        };
    }

    function effectiveTokens() {
        var tokens = Object.assign({}, DEFAULTS, state.value.tokens);
        Object.keys(DERIVED_ALIASES).forEach(function (alias) {
            var source = DERIVED_ALIASES[alias];
            var hasExplicitAlias = Object.prototype.hasOwnProperty.call(state.value.tokens, alias);
            var hasExplicitSource = Object.prototype.hasOwnProperty.call(state.value.tokens, source);
            if (!hasExplicitAlias && hasExplicitSource) tokens[alias] = state.value.tokens[source];
        });
        return tokens;
    }

    function createElement(tagName, className, text) {
        var node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function appendChildren(parent, children) {
        children.forEach(function (child) {
            if (child) parent.appendChild(child);
        });
        return parent;
    }

    function replaceBody(child) {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        document.body.appendChild(child);
    }

    function contrastRatio(first, second) {
        var firstLuminance = relativeLuminance(first);
        var secondLuminance = relativeLuminance(second);
        var lighter = Math.max(firstLuminance, secondLuminance);
        var darker = Math.min(firstLuminance, secondLuminance);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function relativeLuminance(hex) {
        var normalized = normalizeHex(hex) || BLACK;
        var channels = [
            parseInt(normalized.slice(1, 3), 16),
            parseInt(normalized.slice(3, 5), 16),
            parseInt(normalized.slice(5, 7), 16),
        ];
        return channels
            .map(function (channel) {
                var value = channel / 255;
                return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
            })
            .reduce(function (result, channel, index) {
                return result + channel * [0.2126, 0.7152, 0.0722][index];
            }, 0);
    }

    function accessibleForeground(background) {
        return contrastRatio(BLACK, background) >= contrastRatio(WHITE, background) ? BLACK : WHITE;
    }

    function contrastWarnings(tokens) {
        return Object.keys(CONTRAST_PAIRS).filter(function (background) {
            return contrastRatio(tokens[background], tokens[CONTRAST_PAIRS[background]]) < 4.5;
        });
    }

    function emitValidity(valid, message) {
        root.emit({
            type: 'sfcc:valid',
            payload: { valid: valid, message: message || '' },
        });
    }

    function publishValue() {
        state.draftInvalid = false;
        root.emit({ type: 'sfcc:interacted' });
        root.emit({ type: 'sfcc:value', payload: state.value });
        emitValidity(true, '');
    }

    function updateToken(id, value) {
        var color = normalizeHex(value);
        if (!ALLOWED_TOKENS[id] || !color) return;

        var tokens = Object.assign({}, state.value.tokens);
        tokens[id] = color;
        if (state.value.autoContrast && CONTRAST_PAIRS[id]) {
            tokens[CONTRAST_PAIRS[id]] = accessibleForeground(color);
        }

        state.value = {
            version: VERSION,
            preset: 'custom',
            autoContrast: state.value.autoContrast,
            tokens: tokens,
        };
        publishValue();
        refreshEditor();
    }

    function resetToken(id) {
        var tokens = Object.assign({}, state.value.tokens);
        delete tokens[id];
        state.value = {
            version: VERSION,
            preset: 'custom',
            autoContrast: state.value.autoContrast,
            tokens: tokens,
        };
        publishValue();
        refreshEditor();
    }

    function selectPreset(preset) {
        var presetTokens = PRESETS[preset];
        if (!presetTokens) return;
        state.value = {
            version: VERSION,
            preset: preset,
            autoContrast: state.value.autoContrast,
            tokens: Object.assign({}, presetTokens),
        };
        publishValue();
        refreshEditor();
    }

    function toggleAutoContrast(enabled) {
        state.value = {
            version: VERSION,
            preset: state.value.preset,
            autoContrast: enabled,
            tokens: Object.assign({}, state.value.tokens),
        };
        publishValue();
        refreshEditor();
    }

    function createToolbar(tokens) {
        var toolbar = createElement('div', 'theme-editor__toolbar');
        var presetField = createElement('div', 'theme-editor__field');
        var presetLabel = createElement('label', 'theme-editor__label', 'Preset');
        presetLabel.htmlFor = 'theme-editor-preset';
        var presetSelect = createElement('select', 'theme-editor__select');
        presetSelect.id = 'theme-editor-preset';
        presetSelect.disabled = state.disabled;
        [
            ['default', 'Storefront default'],
            ['warmEditorial', 'Warm editorial'],
            ['midnight', 'Midnight'],
            ['custom', 'Custom'],
        ].forEach(function (optionData) {
            var option = createElement('option', '', optionData[1]);
            option.value = optionData[0];
            option.selected = state.value.preset === optionData[0];
            option.disabled = optionData[0] === 'custom';
            presetSelect.appendChild(option);
        });
        presetSelect.addEventListener('change', function (event) {
            selectPreset(event.target.value);
        });
        appendChildren(presetField, [presetLabel, presetSelect]);

        var contrastField = createElement('label', 'theme-editor__toggle');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = state.value.autoContrast;
        checkbox.disabled = state.disabled;
        checkbox.addEventListener('change', function (event) {
            toggleAutoContrast(event.target.checked);
        });
        var toggleCopy = createElement('span', 'theme-editor__toggle-copy');
        appendChildren(toggleCopy, [
            createElement('strong', '', 'Automatic contrast'),
            createElement('small', '', 'Choose black or white when a surface changes.'),
        ]);
        appendChildren(contrastField, [checkbox, toggleCopy]);

        var warnings = contrastWarnings(tokens);
        var summary = createElement('div', 'theme-editor__summary');
        summary.setAttribute('role', 'status');
        var overrideCount = Object.keys(state.value.tokens).length;
        appendChildren(summary, [
            createElement('strong', '', overrideCount + (overrideCount === 1 ? ' override' : ' overrides')),
            createElement(
                'span',
                warnings.length ? 'theme-editor__summary-warning' : 'theme-editor__summary-pass',
                warnings.length
                    ? warnings.length + ' contrast warning' + (warnings.length === 1 ? '' : 's')
                    : 'AA pairs pass'
            ),
        ]);

        appendChildren(toolbar, [presetField, contrastField, summary]);
        return toolbar;
    }

    function createPreview(tokens) {
        var preview = createElement('section', 'theme-editor__preview');
        preview.setAttribute('aria-label', 'Theme preview');
        Object.keys(ALLOWED_TOKENS).forEach(function (id) {
            preview.style.setProperty('--' + id, tokens[id]);
        });

        var header = createElement('header', 'theme-preview__header');
        appendChildren(header, [
            createElement('strong', '', 'Storefront Next'),
            appendChildren(createElement('nav', 'theme-preview__nav'), [
                createElement('span', '', 'New'),
                createElement('span', '', 'Collections'),
                createElement('span', '', 'Stories'),
            ]),
        ]);

        var body = createElement('div', 'theme-preview__body');
        var content = createElement('div', 'theme-preview__content');
        appendChildren(content, [
            createElement('span', 'theme-preview__eyebrow', 'Live semantic preview'),
            createElement('h2', '', 'A coherent storefront palette'),
            createElement(
                'p',
                '',
                'Review actions, surfaces and feedback together before publishing the content block.'
            ),
        ]);

        var actions = createElement('div', 'theme-preview__actions');
        appendChildren(actions, [
            createElement('span', 'theme-preview__button theme-preview__button--primary', 'Primary'),
            createElement('span', 'theme-preview__button theme-preview__button--secondary', 'Secondary'),
            createElement('span', 'theme-preview__button theme-preview__button--tertiary', 'Tertiary'),
        ]);
        content.appendChild(actions);

        var statuses = createElement('div', 'theme-preview__statuses');
        appendChildren(statuses, [
            createElement('span', 'theme-preview__status theme-preview__status--success', 'Success'),
            createElement('span', 'theme-preview__status theme-preview__status--warning', 'Warning'),
            createElement('span', 'theme-preview__status theme-preview__status--info', 'Info'),
            createElement('span', 'theme-preview__status theme-preview__status--destructive', 'Error'),
        ]);
        content.appendChild(statuses);

        var card = createElement('aside', 'theme-preview__card');
        appendChildren(card, [
            createElement('strong', '', 'Product card'),
            createElement('p', '', 'Card and muted content pairings.'),
            appendChildren(createElement('div', 'theme-preview__swatches'), [
                createElement('span', 'theme-preview__swatch theme-preview__swatch--primary'),
                createElement('span', 'theme-preview__swatch theme-preview__swatch--secondary'),
                createElement('span', 'theme-preview__swatch theme-preview__swatch--accent'),
                createElement('span', 'theme-preview__swatch theme-preview__swatch--muted'),
            ]),
        ]);
        appendChildren(body, [content, card]);

        var footer = createElement('footer', 'theme-preview__footer');
        appendChildren(footer, [
            createElement('span', '', 'Header · content · feedback · footer'),
            createElement('span', '', state.value.autoContrast ? 'Auto contrast on' : 'Manual contrast'),
        ]);
        appendChildren(preview, [header, body, footer]);
        return preview;
    }

    function createTokenRow(definition, tokens) {
        var row = createElement('div', 'theme-editor__token');
        row.dataset.token = definition.id;
        var copy = createElement('div', 'theme-editor__token-copy');
        var label = createElement('label', 'theme-editor__token-label', definition.label);
        label.htmlFor = 'theme-token-' + definition.id;
        appendChildren(copy, [label, createElement('small', '', definition.description)]);

        var controls = createElement('div', 'theme-editor__token-controls');
        var picker = document.createElement('input');
        picker.type = 'color';
        picker.className = 'theme-editor__color';
        picker.value = tokens[definition.id];
        picker.disabled = state.disabled;
        picker.setAttribute('aria-label', definition.label + ' color picker');
        picker.addEventListener('input', function (event) {
            updateToken(definition.id, event.target.value);
        });

        var textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.id = 'theme-token-' + definition.id;
        textInput.className = 'theme-editor__hex';
        textInput.value = tokens[definition.id];
        textInput.placeholder = '#000000';
        textInput.pattern = '^#[0-9A-Fa-f]{6}$';
        textInput.maxLength = 7;
        textInput.disabled = state.disabled;
        textInput.setAttribute('aria-label', definition.label + ' hexadecimal color');
        textInput.addEventListener('input', function () {
            var valid = Boolean(normalizeHex(textInput.value));
            textInput.setAttribute('aria-invalid', valid ? 'false' : 'true');
            state.draftInvalid = !valid;
            emitValidity(valid, valid ? '' : 'Use a six-digit hexadecimal color such as #1A2B3C.');
        });
        textInput.addEventListener('change', function () {
            var color = normalizeHex(textInput.value);
            if (color) updateToken(definition.id, color);
        });

        var reset = createElement('button', 'theme-editor__reset', 'Reset');
        reset.type = 'button';
        reset.disabled = state.disabled || !Object.prototype.hasOwnProperty.call(state.value.tokens, definition.id);
        reset.setAttribute('aria-label', 'Reset ' + definition.label + ' to storefront default');
        reset.addEventListener('click', function () {
            resetToken(definition.id);
        });
        appendChildren(controls, [picker, textInput, reset]);

        if (definition.pair) {
            var ratio = contrastRatio(tokens[definition.id], tokens[definition.pair]);
            var passes = ratio >= 4.5;
            var contrast = createElement(
                'span',
                passes
                    ? 'theme-editor__contrast theme-editor__contrast--pass'
                    : 'theme-editor__contrast theme-editor__contrast--warn',
                ratio.toFixed(2) + ':1 ' + (passes ? 'AA' : 'Review')
            );
            contrast.title = definition.label + ' against ' + definition.pair;
            controls.appendChild(contrast);
        }

        appendChildren(row, [copy, controls]);
        return row;
    }

    function mountTokenRows(container, group, tokens) {
        if (container.dataset.mounted === 'true') return;

        var fragment = document.createDocumentFragment();
        group.tokens.forEach(function (definition) {
            fragment.appendChild(createTokenRow(definition, tokens));
        });
        container.appendChild(fragment);
        container.dataset.mounted = 'true';
    }

    function createTokenGroups(tokens) {
        var groups = createElement('div', 'theme-editor__groups');
        GROUPS.forEach(function (group) {
            var details = createElement('details', 'theme-editor__group');
            details.dataset.group = group.id;
            details.open = state.openGroups[group.id] === true;
            var summary = createElement('summary', 'theme-editor__group-summary');
            var summaryCopy = createElement('span', 'theme-editor__group-copy');
            appendChildren(summaryCopy, [
                createElement('strong', '', group.label),
                createElement('small', '', group.description),
            ]);
            var count = createElement('span', 'theme-editor__group-count', String(group.tokens.length));
            appendChildren(summary, [summaryCopy, count]);
            details.appendChild(summary);
            var rows = createElement('div', 'theme-editor__token-list');
            details.appendChild(rows);
            if (details.open) mountTokenRows(rows, group, tokens);
            details.addEventListener('toggle', function () {
                state.openGroups[group.id] = details.open;
                if (details.open) mountTokenRows(rows, group, effectiveTokens());
            });
            groups.appendChild(details);
        });
        return groups;
    }

    function refreshTokenRow(row, definition, tokens) {
        var picker = row.querySelector('.theme-editor__color');
        var textInput = row.querySelector('.theme-editor__hex');
        var reset = row.querySelector('.theme-editor__reset');
        var contrast = row.querySelector('.theme-editor__contrast');

        picker.value = tokens[definition.id];
        picker.disabled = state.disabled;
        if (!state.draftInvalid) {
            textInput.value = tokens[definition.id];
            textInput.setAttribute('aria-invalid', 'false');
        }
        textInput.disabled = state.disabled;
        reset.disabled = state.disabled || !Object.prototype.hasOwnProperty.call(state.value.tokens, definition.id);

        if (definition.pair && contrast) {
            var ratio = contrastRatio(tokens[definition.id], tokens[definition.pair]);
            var passes = ratio >= 4.5;
            contrast.className = passes
                ? 'theme-editor__contrast theme-editor__contrast--pass'
                : 'theme-editor__contrast theme-editor__contrast--warn';
            contrast.textContent = ratio.toFixed(2) + ':1 ' + (passes ? 'AA' : 'Review');
        }
    }

    function refreshEditor() {
        var shell = document.querySelector('.theme-editor');
        if (!shell) {
            render();
            return;
        }

        var tokens = effectiveTokens();
        shell.dataset.disabled = state.disabled ? 'true' : 'false';

        var disabledMessage = shell.querySelector('.theme-editor__disabled');
        disabledMessage.hidden = !state.disabled;

        var presetSelect = shell.querySelector('.theme-editor__select');
        presetSelect.value = state.value.preset;
        presetSelect.disabled = state.disabled;

        var contrastToggle = shell.querySelector('.theme-editor__toggle input');
        contrastToggle.checked = state.value.autoContrast;
        contrastToggle.disabled = state.disabled;

        var warnings = contrastWarnings(tokens);
        var summaryCount = shell.querySelector('.theme-editor__summary strong');
        var summaryStatus = shell.querySelector('.theme-editor__summary > span');
        var overrideCount = Object.keys(state.value.tokens).length;
        summaryCount.textContent = overrideCount + (overrideCount === 1 ? ' override' : ' overrides');
        summaryStatus.className = warnings.length ? 'theme-editor__summary-warning' : 'theme-editor__summary-pass';
        summaryStatus.textContent = warnings.length
            ? warnings.length + ' contrast warning' + (warnings.length === 1 ? '' : 's')
            : 'AA pairs pass';

        var preview = shell.querySelector('.theme-editor__preview');
        Object.keys(ALLOWED_TOKENS).forEach(function (id) {
            preview.style.setProperty('--' + id, tokens[id]);
        });
        var previewMode = shell.querySelector('.theme-preview__footer span:last-child');
        previewMode.textContent = state.value.autoContrast ? 'Auto contrast on' : 'Manual contrast';

        shell.querySelectorAll('.theme-editor__token').forEach(function (row) {
            var definition = TOKEN_DEFINITIONS[row.dataset.token];
            if (definition) refreshTokenRow(row, definition, tokens);
        });

        var validation = shell.querySelector('.theme-editor__validation');
        validation.textContent = state.draftInvalid ? 'Use a six-digit hexadecimal value.' : '';
    }

    function render() {
        var tokens = effectiveTokens();
        var shell = createElement('main', 'theme-editor');
        shell.dataset.disabled = state.disabled ? 'true' : 'false';

        var intro = createElement('header', 'theme-editor__intro');
        appendChildren(intro, [
            createElement('p', 'theme-editor__kicker', 'SFNext Toolkit'),
            createElement('h1', '', 'Theme Studio'),
            createElement(
                'p',
                '',
                'Configure source tokens visually. Tailwind utilities continue to resolve through the standard Storefront Next bridge.'
            ),
        ]);

        var disabledMessage = createElement(
            'p',
            'theme-editor__disabled',
            'This field is currently disabled. The saved palette is shown read-only.'
        );
        disabledMessage.setAttribute('role', 'status');
        disabledMessage.hidden = !state.disabled;

        var status = createElement('p', 'theme-editor__validation');
        status.id = 'theme-editor-validation';
        status.setAttribute('aria-live', 'polite');
        status.textContent = state.draftInvalid ? 'Use a six-digit hexadecimal value.' : '';

        appendChildren(shell, [
            intro,
            disabledMessage,
            createToolbar(tokens),
            createPreview(tokens),
            createTokenGroups(tokens),
            status,
        ]);
        replaceBody(shell);
    }

    root.subscribe('sfcc:ready', function (options) {
        var ready = options || {};
        state.value = normalizeValue(ready.value);
        state.disabled = Boolean(ready.isDisabled);
        state.required = Boolean(ready.isRequired);
        state.draftInvalid = false;
        render();
        emitValidity(true, '');
    });

    root.subscribe('sfcc:value', function (value) {
        state.value = normalizeValue(value);
        state.draftInvalid = false;
        refreshEditor();
    });

    root.subscribe('sfcc:disabled', function (disabled) {
        state.disabled = Boolean(disabled);
        refreshEditor();
    });

    root.subscribe('sfcc:required', function (required) {
        state.required = Boolean(required);
    });
})(window);
