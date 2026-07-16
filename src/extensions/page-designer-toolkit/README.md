# Storefront Next Page Designer Toolkit extension

This directory contains the Storefront Next side of the reusable Page Designer
toolkit. It registers the toolkit page types with the application and keeps the
hand-authored PLP, PDP, blank, blog-home, and blog-post metadata sources that are copied into
`plugin_sfnext_page_designer` during generation. The public contract currently
contains 5 page types and 26 component types: 18 general-purpose root blocks, 7
contextual children restricted to their compatible parent regions, and the
site-wide **Mega Menu Enhancements** content block. Together they generate 31
toolkit metadata definitions.

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
- `src/components/sfnext-toolkit/mega-menu*` defines the ordinary **Mega Menu
  Enhancements** content block, category-targeted panels, curated links, and one
  optional graphical feature per panel. The host navigation integration enriches
  the standard catalog menu rather than replacing its hierarchy, interaction
  model, or category banners.
- `Layout.header` is the only embedded owner. It has fixed `component_id: header`
  and a max-one `megaMenuEnhancements` region for `SFNextToolkit.megaMenu`. The
  enhancement component itself is not embedded and has no fixed ID.
- `Mega Menu Enhancements` remains available in page root palettes for Salesforce's
  Site-Wide Regions Beta workflow: enable Embedded Content Blocks, drag it onto a
  temporary unpublished Blank Page, configure its nested panels, choose **Save as
  Content Block**, and assign it through Header > Mega Menu Enhancements. Never publish that
  temporary component as ordinary page content. The three child types are excluded
  from loose page regions and remain available only inside compatible parent regions.
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
  components, generates their B2C metadata, and copies the page types.
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
metadata and the toolkit plugin. Use `pnpm cartridge:deploy:page-designer` only
for later plugin metadata updates that leave the Header region contract unchanged.

The toolkit intentionally contains no brand assets, catalog IDs, credentials,
or other site-specific configuration.
