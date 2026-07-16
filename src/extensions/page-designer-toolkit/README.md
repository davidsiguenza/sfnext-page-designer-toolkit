# Storefront Next Page Designer Toolkit extension

This directory contains the Storefront Next side of the reusable Page Designer
toolkit. It registers the toolkit page types with the application and keeps the
hand-authored PLP, PDP, blank, blog-home, and blog-post metadata sources that are copied into
`plugin_sfnext_page_designer` during generation. The public contract currently
contains 5 page types and 22 component types: 18 complete root blocks and 4
contextual children restricted to their compatible parent regions.

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
pnpm cartridge:deploy:page-designer
pnpm push
```

The toolkit intentionally contains no brand assets, catalog IDs, credentials,
or other site-specific configuration.
