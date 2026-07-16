# Storefront Next Page Designer Toolkit extension

This directory contains the Storefront Next side of the reusable Page Designer
toolkit. It registers the toolkit page types with the application and keeps the
hand-authored PLP, PDP, blank, blog-home, blog-post, and Branding Studio metadata sources that are copied into
`plugin_sfnext_page_designer` during generation. The public contract currently
contains 6 page types and 28 component types: 18 general-purpose root blocks, 7
nested contextual children, and the deliberately constrained **Mega Menu Enhancements**,
PDP **Size Guide**, and site-wide **Site Theme** components. Together with the
visual theme custom editor, they generate 35 JSON toolkit metadata definitions
(28 components, 6 pages, and 1 editor).

The complete merchant and developer guide lives in
[`cartridges/plugin_sfnext_page_designer/README.md`](../../../cartridges/plugin_sfnext_page_designer/README.md).
It documents every included page and component type, recommended use cases,
Business Manager authoring, installation in another project, deployment,
accessibility, troubleshooting, and safe removal.

## Architecture

- `src/components/sfnext-toolkit` owns the decorated React implementations.
- This extension owns the page-type sources and extension registration.
- `blog` contains the Content Asset adapter and the shared blog article renderer.
- `src/components/sfnext-toolkit/product-card` loads one merchant-selected product and adapts the shared Product
  Tile to its Page Designer container, selected catalog image type, and field set.
- `src/components/sfnext-toolkit/product-carousel` supports manual Product Cards/Product Tiles or 1–12 products
  from a category in catalog order, stable daily random order, or random-per-loader
  order. Design and preview modes intentionally keep random selection stable.
- `src/components/sfnext-toolkit/content-collection` loads exact Content Asset IDs in authored order or the latest
  N assets from a folder, filters blog/generic content, maps optional custom Content
  attributes, and renders a responsive grid or carousel.
- `src/components/sfnext-toolkit/size-guide` owns a versioned, fail-closed Mayoral
  child sizing engine and its PDP interaction. It accepts exact supported
  brand/size evidence, physical measurements, or low-confidence age orientation;
  reports disagreement, coverage gaps, and unavailable ideal sizes explicitly;
  and keeps shopper inputs in transient component state only. The PDP host adapter
  exposes it exclusively through the max-one `productTools` region inside the
  current Product provider.
- `src/components/sfnext-toolkit/site-theme` normalizes a versioned visual theme
  against an allowlist of Storefront Next source CSS variables and strict six-digit
  hex values. Edit/Preview renders only the staged/focused component's scoped sample;
  live `:root` declarations are projected from the embedded Header owner into the
  common application shell before standard, checkout, or authentication layouts.
  The Branding Studio page is an unpublished staging canvas, not a global-theme
  execution context. Its sanitized published projection uses a per-instance, site/locale
  30-second freshness cache with a one-second cold/expired caller ceiling and fail-closed
  code-palette fallback. A slightly late valid response may warm the cache in the background;
  after a five-second hard timeout a later request may safely supersede that generation.
  Edit/Preview bypasses the cache. `_app` streams the request-scoped raw Header owner for navigation, and a cold
  root request shares that raw promise rather than issuing a duplicate. Because the cache
  is deliberately not visitor-keyed, Site Theme must not use segmentation or personalized
  visibility rules. The allowlist
  covers Tailwind-bridged core, commerce, agentic, and brand-ramp colors except
  provider-owned PayPal/Venmo palettes; semantic aliases derive from their configured
  source token until explicitly overridden.
- `metadata/editors/SFNextToolkit` and the cartridge's matching static resources
  implement the `SFNextToolkit.themeEditor` Page Designer custom attribute editor.
  The editor groups visual color controls by source-token role and stores one
  versioned JSON value; generated Tailwind `--color-*` bridges and non-color or
  complex CSS values remain untouched.
- `src/components/sfnext-toolkit/mega-menu*` defines the ordinary **Mega Menu
  Enhancements** content block, category-targeted panels, curated links, and one
  optional graphical feature per panel. The host navigation integration enriches
  the standard catalog menu rather than replacing its hierarchy, interaction
  model, or category banners.
- `Layout.header` is the only embedded owner. It has fixed `component_id: header`,
  a max-one `siteTheme` region for `SFNextToolkit.siteTheme`, and a max-one
  `megaMenuEnhancements` region for `SFNextToolkit.megaMenu`. The ordinary content
  blocks themselves are not embedded and have no fixed IDs.
- `Mega Menu Enhancements` remains available in page root palettes for Salesforce's
  Site-Wide Regions Beta workflow: enable Embedded Content Blocks, drag it onto a
  temporary unpublished Blank Page, configure its nested panels, choose **Save as
  Content Block**, and assign it through Header > Mega Menu Enhancements. Never publish that
  temporary component as ordinary page content. The three child types are excluded
  from loose page regions and remain available only inside compatible parent regions.
- `Site Theme` is available only in **SFNext Toolkit - Branding Studio** for the
  equivalent site-wide workflow: keep the Studio page unpublished, configure one
  component, save it as a content block, assign it through **Header > Site Theme**,
  and publish the block. Draft, preview, and ordinary-page rendering never applies
  its palette globally.
- The focused `mega-menu/index.tsx` content block is its own authoring canvas and
  renders the complete draft `panels` region. Live desktop/mobile navigation
  delegates to `mega-menu/editorial-slot.tsx`, which selects only the open root
  category's panel.
- Mega Menu feature data is resolved server-side in bounded category, product, and
  B2C Content request families rather than one call per panel. Salesforce CMS data
  is projected from `cms_record` component data; manual overrides are applied only
  after each source has been normalized to a small navigation-safe model.
- `src/routes/_app.tsx`, `src/components/header/index.tsx`, `src/components/navigation-menu-mega`,
  `src/components/navigation-menu/impl.tsx`, and the Page Designer component loader
  form the host adapter: they fetch the fixed embedded header once, preserve draft
  tokens, extract its optional enhancement child, batch feature data, and insert
  editorial slots into the inherited desktop/mobile navigation.
- `routes/_app.blog*` owns the public blog index, dynamic post, and Page Designer preview routes.
- `scripts/sync-page-designer-toolkit-cartridge.mjs` discovers the decorated
  components, generates their B2C metadata, and copies the page types plus custom
  editor metadata/server/static resources.
- `cartridges/plugin_sfnext_page_designer` is the independently deployable B2C
  metadata cartridge.

Keep the B2C metadata and MRT application on the same commit: Business Manager
uses the cartridge definitions, while Storefront Next renders their matching
type IDs from the generated static registry.

Content-backed loaders require the target SLAS client to retain its existing
scopes and include `sfcc.shopper-experience.contents`. Content Assets must be
online and localized, and folder-backed queries require a rebuilt content search
index. Page Designer has no native B2C Content Asset picker, so Content Collection
manual mode accepts exact IDs separated by lines or commas; `cms_record` is for
Salesforce CMS and is not interchangeable with a B2C Content Asset.

## Developer commands

```bash
pnpm cartridge:generate
pnpm cartridge:validate
pnpm build
pnpm cartridge:deploy:page-designer:install --reload
pnpm push
```

The install command deploys both the updated `app_storefrontnext_base` Header
metadata and the toolkit plugin. It is required when adding either the
`megaMenuEnhancements` or `siteTheme` Header region. Use
`pnpm cartridge:deploy:page-designer` only for later plugin metadata updates that
leave the Header region contract unchanged.

The toolkit intentionally contains no brand assets, catalog IDs, credentials,
or fixed site configuration. Its Size Guide is the documented exception to
brand-neutral data: it includes the versioned Mayoral comparison rules required
for that opt-in component.
