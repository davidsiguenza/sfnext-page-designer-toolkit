# Storefront Next Page Designer Toolkit

`plugin_sfnext_page_designer` is a reusable Page Designer toolkit for Salesforce B2C Commerce and Storefront Next. It provides merchant-facing page types and components without brand assets, catalog IDs, credentials, or site-specific configuration.

The toolkit has two required parts:

1. This B2C cartridge registers the headless Page Designer metadata used by Business Manager.
2. The companion React implementation in `src/components/sfnext-toolkit` and `src/extensions/page-designer-toolkit` renders that metadata in the Managed Runtime application.

A B2C cartridge cannot execute React by itself. Install and deploy both parts to use the toolkit in another Storefront Next project.

## What is included

### Page types

| Type ID                                | Use case                                                                                    | Route or assignment                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `page.sfnextToolkitBlankPage`          | Build campaign and editorial landing pages from an unrestricted blank canvas.               | `/:siteId/:localeId/page/:pageId`                     |
| `page.sfnextToolkitProductListingPage` | Add managed content around the standard category experience and configure the product grid. | PLP aspect, `/:siteId/:localeId/category/:categoryId` |
| `page.sfnextToolkitProductDetailPage`  | Add promotional and engagement content before and after the standard product experience.    | PDP aspect, `/:siteId/:localeId/product/:productId`   |

The PLP and PDP page types use the standard `plp` and `pdp` aspect definitions from `app_storefrontnext_base` instead of duplicating them.

### Component types

| Type ID                                 | Best used for                                                                          | Data dependency        |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| `component.SFNextToolkit.section`       | Page sections with controlled width, spacing, surface, and a nested content region.    | None                   |
| `component.SFNextToolkit.richText`      | Headings, merchant-authored rich text, and an optional call to action.                 | None                   |
| `component.SFNextToolkit.mediaContent`  | Editorial image-and-copy layouts for campaigns, brand stories, and PDP storytelling.   | None                   |
| `component.SFNextToolkit.promoGrid`     | Responsive collections of promotional cards.                                           | None                   |
| `component.SFNextToolkit.promoCard`     | Image, copy, and CTA used inside a Promo Grid.                                         | None                   |
| `component.SFNextToolkit.trustBar`      | A responsive row of service and confidence messages.                                   | None                   |
| `component.SFNextToolkit.trustItem`     | One delivery, returns, payment, support, store, or gift message inside a Trust Bar.    | None                   |
| `component.SFNextToolkit.accordion`     | FAQ, delivery, returns, care, and long-form supporting information.                    | None                   |
| `component.SFNextToolkit.accordionItem` | One accessible disclosure inside an Accordion.                                         | None                   |
| `component.SFNextToolkit.categoryHero`  | A PLP hero that defaults to the current category and supports editorial overrides.     | Current category route |
| `component.SFNextToolkit.productList`   | PLP image view type, product fields, swatches, actions, and custom catalog attributes. | PLP search runtime     |

## Component guide

### Section

Use a Section as the outer building block of a blank page. It gives merchants controlled presets for maximum width, vertical spacing, background surface, alignment, and an optional anchor ID. Add other components to its `content` region.

Use Sections instead of spacer components or merchant-authored CSS. Sections can contain normal content, but recursive Section nesting is intentionally restricted to keep pages predictable and responsive.

### Rich Text

Use Rich Text for campaign introductions, SEO-supporting copy, delivery information, and editorial content. It supports an optional eyebrow, semantic heading, rich-text body, alignment, width, and CTA.

Use the `h1` option once when Rich Text supplies the primary title of a blank landing page. PLP and PDP routes already provide their own `h1`, so their managed content should start at `h2`. The body comes from the controlled Business Manager markup editor; the component does not expose arbitrary JavaScript or CSS.

### Media Content

Use Media Content when an image and copy belong together. Merchants can choose common image positions and responsive layout presets while the component reuses Storefront Next image optimization, focal points, semantic tokens, links, and buttons.

Typical examples include a brand story, campaign feature, material story, sustainability message, or editorial PDP content.

### Promo Grid and Promo Card

Add a Promo Grid, configure its responsive column preset, and then add up to six Promo Cards to its `items` region. That region accepts only `SFNextToolkit.promoCard`, preventing incompatible layouts.

Use this pair for campaign tiles, gender or age navigation, seasonal stories, or editorial category entry points. Promo Card reuses the Storefront Next Content Card implementation instead of maintaining a second card design. Mark an image as decorative when it repeats the adjacent card copy; otherwise provide meaningful alternative text.

### Trust Bar and Trust Item

Add a Trust Bar and then add two to five Trust Items to its `items` region. Each item uses a safe icon preset and merchant-authored title, supporting text, and optional link.

Common messages include free delivery, easy returns, secure payment, store pickup, customer support, warranty, or gift packaging.

Merchant-authored CTA destinations accept storefront-relative links plus `http`, `https`, `mailto`, and `tel`. Executable, data, filesystem, control-character, backslash, and protocol-relative destinations are rejected before they reach React Router.

### Accordion and Accordion Item

Add an Accordion and populate its `items` region with Accordion Items. Each item renders an accessible disclosure with a title, rich content, and an optional initially-open state.

Use this pair for FAQs, size and fit guidance, delivery and returns, materials, care, warranty, or long SEO copy. Core product purchase information should remain in the fixed PDP experience.

### Category Hero

Place Category Hero in `plpTopFullWidth`. By default it reads the active category name, hierarchy, image, description, and product count. Merchants can override the editorial image and copy without copying price, inventory, or other catalog-owned commerce data. Its visual title is decorative by default because the standard PLP renders the category as its page-level `h1`; enable **Expose title as H2** only when the surrounding page hierarchy genuinely needs it.

Outside a category route, Category Hero renders only when sufficient override content is configured. This makes authoring failures visible without breaking the live storefront.

### Configurable Product List

Place exactly one Product List in the PLP template's `plpProductList` region. Merchants can choose the catalog image view type (`hi-res`, `large`, `medium`, `small`, or `swatch`) and toggle badges, wishlist, quick add, swatches, brand, category, name, SKU, rating, price, and promotions.

`additionalAttributes` accepts up to five custom product attributes separated by commas or lines. Labels can be supplied with `material|Material` or `season=Season`; the `c_` prefix is optional.

## Build and validate

From the Storefront Next application root:

```bash
pnpm cartridge:generate
pnpm cartridge:validate
pnpm build
```

`cartridge:generate` discovers every decorated component under `src/components/sfnext-toolkit`, generates its metadata into this cartridge, copies the hand-authored page types, removes duplicate toolkit metadata from `app_storefrontnext_base`, and validates the resulting manifest.

`cartridge:validate` validates both the standard Storefront Next metadata and every file in this cartridge with the B2C tooling schema validator.

## Deploy

Deploy the B2C metadata separately from the Managed Runtime application:

```bash
pnpm cartridge:deploy:page-designer
pnpm build
pnpm push
```

Add `plugin_sfnext_page_designer` to the storefront site's cartridge path before `app_storefrontnext_base`:

```text
...:plugin_sfnext_page_designer:app_storefrontnext_base:...
```

The MRT environment must be linked to the same B2C Commerce instance and site so Business Manager can load the headless editor and preview URLs.

## Use in Business Manager

1. Open **Merchant Tools > Content > Page Designer** for the target site.
2. Create a page and choose one of the `SFNext Toolkit` page types, or open a PLP/PDP assignment using the matching aspect.
3. Drag components from the `SFNextToolkit` group into compatible regions.
4. Configure the component attributes and save.
5. Use Preview to verify desktop and mobile behavior.
6. Publish the page or assignment when it is ready.

Page Designer changes must be saved before the Storefront Next preview iframe refreshes. Unsaved property changes are not reflected live.

## Install in another Storefront Next project

Copy or merge these paths:

```text
cartridges/plugin_sfnext_page_designer
scripts/sync-page-designer-toolkit-cartridge.mjs
src/components/sfnext-toolkit
src/extensions/page-designer-toolkit
```

Then:

1. Register `SFDC_EXT_PAGE_DESIGNER_TOOLKIT` in `src/extensions/config.json`.
2. Add the `cartridge:generate`, `cartridge:validate`, and `cartridge:deploy:page-designer` scripts from this project to `package.json`.
3. Carry over the configurable PLP runtime in `src/components/product-list` and its category-route integration if the target Storefront Next version does not already include equivalent support.
4. Generate, validate, and deploy the cartridge.
5. Build and deploy the MRT application.
6. Add the cartridge to the target site's cartridge path.

The toolkit uses standard Storefront Next primitives and semantic theme tokens. It contains no brand-specific assets or IDs.

## Authoring and accessibility rules

- Component and attribute IDs are public contracts. Do not rename them after pages have been authored; add a versioned type for incompatible changes.
- Use enum presets backed by semantic tokens instead of arbitrary colors, CSS classes, or inline scripts.
- Use the content library image picker, meaningful alternative text, and decorative-image mode only when the image conveys no information.
- Keep one page-level `h1`. Use Rich Text's `h1` only on a blank page that does not already render one; start managed PLP and PDP content at `h2`.
- Parent component regions restrict their allowed child types.
- Interactive controls use native links, buttons, or accessible disclosure primitives.
- Loading fallbacks preserve approximate component dimensions to reduce layout shift.
- Commerce APIs run in MRT loaders, never directly in the browser.

## Troubleshooting

### Components do not appear

- Confirm that the cartridge is deployed to the active code version.
- Confirm that `plugin_sfnext_page_designer` is in the site's cartridge path before `app_storefrontnext_base`.
- Run `pnpm cartridge:validate` and fix every schema error.
- Rebuild the MRT application so the static component registry contains the same type IDs as Business Manager.
- Refresh Page Designer after the metadata cache has expired or reload the active code version in a non-production instance.

### The editor iframe is blank

- Confirm that exactly the intended MRT environment is linked to the B2C instance and site.
- Confirm that the page type `route` matches the Storefront Next route.
- Confirm that the MRT bundle and the cartridge were deployed from the same commit.

### A component is empty

- Save the component attributes before expecting the preview iframe to update.
- Check required images, links, product or category assignments.
- For Category Hero, verify that the page is previewed with a category aspect or configure editorial overrides.
- Check MRT logs for component loader errors.

## Removal

Take pages and aspect assignments that use `SFNextToolkit` types offline or migrate them before removing the cartridge. Removing the cartridge metadata does not remove the React code from an already-deployed MRT bundle, and deploying another MRT bundle still replaces the entire application bundle.

## License

The toolkit follows the license of the Storefront Next project in which it is distributed.
