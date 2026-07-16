# Storefront Next Page Designer Toolkit extension

This directory contains the Storefront Next side of the reusable Page Designer
toolkit. It registers the toolkit page types with the application and keeps the
hand-authored PLP, PDP, blank, blog-home, and blog-post metadata sources that are copied into
`plugin_sfnext_page_designer` during generation.

The complete merchant and developer guide lives in
[`cartridges/plugin_sfnext_page_designer/README.md`](../../../cartridges/plugin_sfnext_page_designer/README.md).
It documents every included page and component type, recommended use cases,
Business Manager authoring, installation in another project, deployment,
accessibility, troubleshooting, and safe removal.

## Architecture

- `src/components/sfnext-toolkit` owns the decorated React implementations.
- This extension owns the page-type sources and extension registration.
- `blog` contains the Content Asset adapter and the shared blog article renderer.
- `routes/_app.blog*` owns the public blog index, dynamic post, and Page Designer preview routes.
- `scripts/sync-page-designer-toolkit-cartridge.mjs` discovers the decorated
  components, generates their B2C metadata, and copies the page types.
- `cartridges/plugin_sfnext_page_designer` is the independently deployable B2C
  metadata cartridge.

Keep the B2C metadata and MRT application on the same commit: Business Manager
uses the cartridge definitions, while Storefront Next renders their matching
type IDs from the generated static registry.

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
