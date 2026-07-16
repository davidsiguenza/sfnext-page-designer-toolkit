# Storefront Next Page Designer Toolkit

A reusable Page Designer component and template library for Salesforce B2C Commerce Storefront Next, distributed as a clean fork of the official Storefront Next template.

The toolkit adds merchant-configurable PLP, PDP, blank, blog-home, blog-post, and Branding Studio page types together with reusable editorial, promotional, trust, FAQ, navigation, category, product, video, sizing, theme, and Content Asset components. It contains no brand assets, catalog IDs, credentials, or fixed site configuration. The optional Size Guide is the deliberate exception to brand-neutral content: it ships a versioned Mayoral reference dataset and clearly bounded comparison rules.

Start with the [complete cartridge and authoring guide](./cartridges/plugin_sfnext_page_designer/README.md), which documents every component, its use case, installation, Business Manager setup, deployment, accessibility guidance, and troubleshooting.

## Toolkit at a glance

- Page types: blank landing page, product listing page, product detail page, blog home, shared blog-post layout, and a safe Branding Studio workspace.
- Components: 28 reusable types, including Campaign Hero, Embedded Video, editorial layouts, a responsive single Product Card, curated or category-driven Product Carousel, configurable PLP grid, Blog Post Grid, Content Collection, PDP Size Guide, visual Site Theme, and the four-part Mega Menu enhancement.
- Delivery: 35 Page Designer metadata definitions in `plugin_sfnext_page_designer`—28 components, 6 pages, and 1 custom visual editor—and the matching React implementation for Managed Runtime.
- Safety: namespaced type IDs, restricted nested regions, safe merchant links, semantic design tokens, and accessible defaults.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 24+** — [Download](https://nodejs.org/)
- **pnpm** — Install via `npm install -g pnpm` or see [pnpm.io](https://pnpm.io/installation)

## Quick Start

```bash
# 1. Clone the toolkit
git clone https://github.com/davidsiguenza/sfnext-page-designer-toolkit.git
cd sfnext-page-designer-toolkit

# 2. Set up environment
cp .env.default .env
# Edit .env with your B2C Commerce credentials

# 3. Install and run
pnpm install
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your storefront.

## Getting Your Starting Point

### Option A: Use This Toolkit Repository (Recommended)

Click **"Use this template"** button → **"Create a new repository"** at the top of this page.

- ✅ Fresh repo with latest stable code
- ✅ Clean Git history
- ✅ Ready to customize

### Option B: Clone a Specific Version

Use a tagged release for version pinning:

```bash
# View available versions
git tag -l

# Clone specific version
git clone --branch v1.0.0 --depth 1 \
  https://github.com/SalesforceCommerceCloud/storefront-next-template my-storefront
```

Check **[Releases](../../releases)** for all versions.

### Template version & SDK compatibility

This template is dated by a **release stamp** (e.g. "June 2026"), recorded in `package.json` under `storefrontNext` (`templateRelease`, `templateVersion`, `minSdkVersion`). The Storefront Next **SDK** (`@salesforce/storefront-next-dev` / `-runtime`) versions separately, with SemVer. See the **[compatibility matrix](./docs/COMPATIBILITY.md)** for which SDK version each template release needs.

## Configuration

All settings are defined in `config.server.ts` and can be configured via environment variables—no code changes required.

### Setup

```bash
cp .env.default .env
# Edit .env with your B2C Commerce credentials
```

### Required Variables

```bash
PUBLIC__app__commerce__api__clientId=your-client-id
PUBLIC__app__commerce__api__organizationId=your-org-id
PUBLIC__app__commerce__api__shortCode=your-short-code
```

### How It Works

Use the `PUBLIC__` prefix with double underscores (`__`) to set any config path:

```bash
# Environment variable         →  Config path
PUBLIC__app__site__locale=en-GB   →  config.app.site.locale
PUBLIC__app__site__currency=EUR   →  config.app.site.currency
```

Values are automatically parsed (numbers, booleans, JSON arrays/objects).

See [Configuration Guide](./docs/README-CONFIG.md) for complete documentation.

Content Asset-backed components also require the Storefront Next SLAS client to include the `sfcc.shopper-experience.contents` scope. Content must be online and localized for the requested locale; folder-backed modes additionally require the configured folder assignment and an up-to-date site content search index. See the [complete cartridge and authoring guide](./cartridges/plugin_sfnext_page_designer/README.md#install-in-another-storefront-next-project) for the reusable installation sequence.

## Data-driven Page Designer components

- **Product Card** lets a merchant search for one catalog product, choose `hi-res`, `large`, `medium`, `small`, or `swatch` imagery, control the visible commerce fields and custom attributes, and use an automatic container-responsive layout.
- **Product Carousel** accepts manually ordered Product Cards/Product Tiles or loads up to 12 products from a category. Category mode supports catalog order, a stable daily random selection, or a new random selection on each server loader execution.
- **Content Collection** displays manually ordered Content Asset IDs or the latest _N_ online assets from a folder, filtered as blog, generic, or all content. Cards can render as a responsive grid or carousel and can map custom Content attribute IDs to title, summary, image, date, author, category, and destination.
- **Size Guide** sits in the PDP template's single `productTools` region and recommends a Mayoral child size from a supported known-brand size, physical measurements, or age. It checks the current product's available variation values and reports uncertainty instead of inventing a conversion.

Page Designer does not provide a native B2C Content Asset search attribute. Manual Content Collection authoring therefore uses Content Asset IDs, one per line or comma-separated; folder-backed mode avoids maintaining that list.

## PDP Size Guide

`SFNextToolkit.sizeGuide` is an opt-in PDP fit assistant, not a universal size converter. Its versioned Mayoral rules cover child clothing from the available height/chest/inseam references and child footwear from foot length. Cross-brand recommendations are made only for the exact Adidas, Nike, Vans, and New Balance rows present in the reviewed dataset; unknown labels ask for measurements. Age-only results are intentionally low confidence.

Measurements remain in transient component state and are not persisted, sent to a shopper API, or added to analytics by the toolkit. A physical value that falls strictly between two published Mayoral references displays both sizes, marks the upper one only as a conservative orientation, and disables the one-click size CTA until the shopper confirms the fit. The result also distinguishes an unavailable ideal size and data outside the covered range. See the [complete cartridge guide](./cartridges/plugin_sfnext_page_designer/README.md#size-guide) for the coverage table and authoring workflow.

Author the component only in the PDP region named **Product Tools**. `Promo Content` and `Engagement Content` intentionally reject `SFNextToolkit.sizeGuide` because they are outside the product context required by the recommendation engine. If an existing PDP does not show **Product Tools**, regenerate the metadata, deploy both `app_storefrontnext_base` and `plugin_sfnext_page_designer` with `pnpm cartridge:deploy:page-designer:install --reload`, deploy the matching MRT bundle, and reopen the Page Designer editing session. The region accepts exactly one Size Guide; the existing `pdp` page does not need to be recreated.

## Visual site branding

`SFNextToolkit.siteTheme` uses a Page Designer custom editor with visual color controls to configure Storefront Next **source CSS tokens** such as surfaces, actions, header/footer chrome, statuses, commerce aliases, the agentic palette, and legacy brand primitives. It covers the source variables exposed through Tailwind's color bridge while deliberately excluding PayPal/Venmo provider colors, generated `--color-*` variables, and non-color or complex CSS values. Semantic aliases such as selected swatches, account sidebars, product badges, and agentic actions follow their primary/accent/status source color unless a merchant overrides the alias explicitly.

The three `bg-input-*` color helpers are also editable because storefront components consume them directly. `focus` and `destructive-focus` have translucent code defaults; configuring either in Theme Studio intentionally replaces that RGBA default with the selected solid six-digit hex color.

Global application is deliberately fail-closed. Create an unpublished **SFNext Toolkit - Branding Studio** page, configure and preview one Site Theme, choose **Save as Content Block**, assign that block through **Set Site-Wide Region > Header > Site Theme**, and publish the content block. The application shell then applies the projected theme before the visible route across standard storefront, checkout, and authentication layouts. Edit/Preview suppresses that already-published global projection and shows only the staged/focused component's scoped sample; a draft block, an ordinary page, or even a mistakenly published Branding Studio page does not write global `:root` overrides. The published projection is cached per site and locale for a 30-second freshness window. A cold or expired request waits no more than one second for a fresh value and otherwise falls back to the code-defined palette instead of serving stale branding. A valid response that arrives slightly later may still warm the cache in the background; only a generation still pending after five seconds can be superseded by a later request. `_app` retains a streamed, request-scoped raw Header owner for announcement and Mega Menu data. Publication, unpublication, and rollback become eligible on the first request after the current freshness window; successful refresh then applies the change to that request or a following request when it completes after the one-second caller budget. Site Theme is one global palette and must not use customer-group, personalization, campaign, or other visitor-segment visibility rules. See the [complete cartridge guide](./cartridges/plugin_sfnext_page_designer/README.md#site-theme-and-branding-studio) for installation and publishing details.

## Mega Menu enhancement

The toolkit Mega Menu augments the standard Storefront Next catalog navigation instead of replacing it. The inherited category hierarchy, keyboard behavior, mobile disclosure, catalog links, and category banners continue to work when no Page Designer enhancement exists or when the enhancement is disabled.

The `Mega Menu Enhancements` content block contains up to 12 `Mega Menu Panel` children. Author at most one panel for each root navigation category; that panel can add up to eight curated `Mega Menu Link` items and at most one `Mega Menu Feature`. A feature can be driven by a category, product, B2C Content Asset, Salesforce CMS record, or custom editorial content. Custom mode can optionally start from a CMS record before applying overrides; product mode includes a selectable catalog image view type, and every source supports safe editorial copy/link overrides.

Authoring uses Salesforce's [Site-Wide Regions for Content Blocks](https://developer.salesforce.com/docs/commerce/sfra/guide/sfnext-page-designer-content-blocks.html), which is currently **Beta**. Enable **Administration > Feature Switches > Enable Embedded Content Blocks**, create a temporary unpublished Blank Page, drag `Mega Menu Enhancements` to its root region, configure its nested panels, choose **Save as Content Block**, and then use **Set Site-Wide Region > Header > Mega Menu Enhancements**. `Layout.header` is the only fixed embedded owner; the enhancement itself is an ordinary content block used by that header region, not a second menu.

The initial toolkit install must deploy both the updated `app_storefrontnext_base` header definition and `plugin_sfnext_page_designer`: run `pnpm cartridge:deploy:page-designer:install --reload`. The plugin-only deploy command is for later metadata-only updates that do not change the host Header contract.

Catalog banners and Page Designer features can coexist predictably: **Fallback** uses the inherited category banner only when no feature is available, **Replace** gives the Page Designer feature its place, and **Alongside** displays both. Each panel can inherit or override the global mode. See the [cartridge guide](./cartridges/plugin_sfnext_page_designer/README.md#mega-menu-enhancements-mega-menu-panel-mega-menu-link-and-mega-menu-feature) for authoring and cross-environment installation details.

## Deployment

Deploy your storefront to Salesforce B2C Commerce's Managed Runtime:

```bash
pnpm build
pnpm push
```

See the [Deployment Guide](https://www.npmjs.com/package/@salesforce/storefront-next-dev?activeTab=readme) for all options and configuration.

## B2C CLI

The [Salesforce B2C CLI](https://www.npmjs.com/package/@salesforce/b2c-cli) is included as a dev dependency for managing Commerce Cloud resources — environments, code deployments, cartridges, and more.

```bash
pnpm b2c --help       # See all available commands
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build

# Commerce Cloud
pnpm b2c              # B2C CLI (environments, deployments, cartridges)

# Testing & Quality
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm typecheck        # Check TypeScript

# Storybook
pnpm storybook        # Component explorer
```

## Project Structure

```
src/
├── components/       # React components
├── routes/           # Page routes (file-based routing)
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
└── providers/        # React context providers
```

## Features

- ⚡ **SSR** — Server-side rendering with React 19
- 🛤️ **React Router 7** — File-based routing
- 🛒 **Commerce Cloud** — Full SCAPI integration
- 🎨 **Tailwind CSS 4** — Utility-first styling
- 🧪 **Vitest** — Fast unit testing
- 📚 **Storybook** — Component development
- 🌍 **i18n** — Multi-language support
- 🔍 **TypeScript** — Full type safety

## Documentation

- 📊 [Data Retrieval](./README-DATA.md)
- 🔐 [Authentication & Session Management](./README-AUTH.md)
- 🌍 [Internationalization (i18n)](./README-I18N.md)
- 🧪 [Tests & Coverage](./README-TESTS.md)
- 🔍 [ESLint Configuration & TypeScript Enforcement](./README-ESLINT.md)
- 🖼️ [Images](./docs/README-IMAGES.md)
- ⚡ [Performance Best Practices](./docs/README-PERFORMANCE.md)
- 📈 [Performance Metrics](./docs/README-PERFORMANCE-METRICS.md)
- 🔎 [SEO (Hreflang, Canonical URLs, and Meta Tags)](./docs/README-SEO.md)
- 🎨 [UI and Styling](./docs/README-UI-STYLING.md)
- 🔌 [Adapter Pattern Implementation Guide](./docs/README-ADAPTER-PATTERN-GUIDE.md)
- 🔧 [SCAPI Client Overrides and Custom APIs](./docs/README-SCAPI.md)
- 📖 [Story Coverage & Code Quality Enforcement](./docs/README-STORY-COVERAGE.md)
- 🚀 [Migrating to React Router 7.18](./docs/migrations/react-router-7.18/README.md)

## Contributing

This project extends the official [Storefront Next template](https://github.com/SalesforceCommerceCloud/storefront-next-template). Keep Salesforce's repository configured as an upstream remote when bringing a newer Storefront Next release into a toolkit-based project, then regenerate and validate the cartridge before deploying.

Changes to the toolkit belong in this repository. Changes to the Storefront Next platform itself should be proposed in the [Storefront Next monorepo](https://github.com/SalesforceCommerceCloud/storefront-next).

## Support

- 📖 [Documentation](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-get-started.html)
- 🐛 [Report Issues](https://github.com/SalesforceCommerceCloud/storefront-next/issues)

## License

See [LICENSE](./LICENSE) for details.
