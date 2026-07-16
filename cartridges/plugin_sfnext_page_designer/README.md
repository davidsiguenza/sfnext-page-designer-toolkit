# Storefront Next Page Designer Toolkit

`plugin_sfnext_page_designer` is a reusable Page Designer toolkit for Salesforce B2C Commerce and Storefront Next. It provides 5 merchant-facing page types and 22 component types without brand assets, catalog IDs, credentials, or site-specific configuration.

The toolkit has two required parts:

1. This B2C cartridge registers the headless Page Designer metadata used by Business Manager.
2. The companion React implementation in `src/components/sfnext-toolkit` and `src/extensions/page-designer-toolkit` renders that metadata in the Managed Runtime application.

A B2C cartridge cannot execute React by itself. Install and deploy both parts to use the toolkit in another Storefront Next project.

## What is included

### Page types

| Type ID                                | Use case                                                                                    | Route or assignment                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `page.sfnextToolkitBlankPage`          | Build campaign and editorial landing pages from a flexible blank canvas.                    | `/:siteId/:localeId/page/:pageId`                     |
| `page.sfnextToolkitProductListingPage` | Add managed content around the standard category experience and configure the product grid. | PLP aspect, `/:siteId/:localeId/category/:categoryId` |
| `page.sfnextToolkitProductDetailPage`  | Add promotional and engagement content before and after the standard product experience.    | PDP aspect, `/:siteId/:localeId/product/:productId`   |
| `page.sfnextToolkitBlogHomePage`       | Compose an editorial blog landing page around an automatically populated post grid.         | `/:siteId/:localeId/blog`                             |
| `page.sfnextToolkitBlogPostPage`       | Define the reusable before/after-article layout shared by every blog post.                  | `/:siteId/:localeId/blog/preview`                     |

The PLP and PDP page types use the standard `plp` and `pdp` aspect definitions from `app_storefrontnext_base` instead of duplicating them.

### Component types

| Type ID                                          | Best used for                                                                                          | Data dependency          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| `component.SFNextToolkit.heroBanner`             | Campaign launches with responsive imagery, safe overlays, semantic headings, and two CTAs.             | None                     |
| `component.SFNextToolkit.embeddedVideo`          | Responsive YouTube, Vimeo, or direct video with privacy, playback, caption, and transcript controls.   | None                     |
| `component.SFNextToolkit.promoStrip`             | Delivery, sale, member, or service messages in a compact themed strip.                                 | None                     |
| `component.SFNextToolkit.section`                | Page sections with controlled width, spacing, surface, and a nested content region.                    | None                     |
| `component.SFNextToolkit.responsiveColumns`      | Responsive two- or three-column compositions with controlled ratios and mobile order.                  | None                     |
| `component.SFNextToolkit.richText`               | Headings, merchant-authored rich text, and an optional call to action.                                 | None                     |
| `component.SFNextToolkit.mediaContent`           | Editorial image-and-copy layouts for campaigns, brand stories, and PDP storytelling.                   | None                     |
| `component.SFNextToolkit.promoGrid`              | Equal or featured-first collections of promotional cards.                                              | None                     |
| `component.SFNextToolkit.promoCard`              | Overlay or stacked image, copy, and CTA used inside a Promo Grid.                                      | None                     |
| `component.SFNextToolkit.categoryCarousel`       | A scrollable collection of catalog-backed or manually selected categories.                             | Categories API           |
| `component.SFNextToolkit.categoryCard`           | One catalog-backed category with optional editorial image and copy overrides.                          | Category API             |
| `component.SFNextToolkit.productCard`            | One selected product in a container-responsive card with configurable image type, fields, and actions. | Products API             |
| `component.SFNextToolkit.productCarousel`        | Manually curated products or N category products in catalog, daily-random, or request-random order.    | Product Search API       |
| `component.SFNextToolkit.productRecommendations` | Einstein-powered personalised product carousel with a clear Page Designer authoring state.             | Einstein + Products APIs |
| `component.SFNextToolkit.trustBar`               | A responsive row of service and confidence messages.                                                   | None                     |
| `component.SFNextToolkit.trustItem`              | One delivery, returns, payment, support, store, or gift message inside a Trust Bar.                    | None                     |
| `component.SFNextToolkit.accordion`              | FAQ, delivery, returns, care, and long-form supporting information.                                    | None                     |
| `component.SFNextToolkit.accordionItem`          | One accessible disclosure inside an Accordion.                                                         | None                     |
| `component.SFNextToolkit.categoryHero`           | A PLP hero that defaults to the current category and supports editorial overrides.                     | Current category route   |
| `component.SFNextToolkit.productList`            | PLP image view type, product fields, swatches, actions, and custom catalog attributes.                 | PLP search runtime       |
| `component.SFNextToolkit.blogPostGrid`           | Search, filter, sort, and paginate localized blog Content Assets in editorial cards.                   | Shopper Experience API   |
| `component.SFNextToolkit.contentCollection`      | Manually selected or latest folder content, including blog and generic assets, in a grid or carousel.  | Shopper Experience API   |

Four component types are contextual building blocks rather than root-page blocks: `accordionItem`, `categoryCard`, `promoCard`, and `trustItem`. They appear only inside their compatible parent regions. This keeps the Page Designer palette useful instead of exposing invalid loose fragments.

## Component guide

### Campaign Hero

Use Campaign Hero for the primary visual statement on a campaign or landing page. It supports separate desktop and mobile images, focal points, decorative-image mode, eyebrow, semantic heading choice, controlled visual sizes, nine content positions, token-based overlays, responsive height, and two safe CTAs.

The component intentionally does not accept arbitrary CSS, JavaScript, raw color values, or unsanitised links. Use one `h1` on standalone landing pages and `h2` or `h3` where the route already owns the page title.

### Embedded Video

Use Embedded Video for campaign films, product stories, tutorials, interviews, or editorial content. It accepts supported YouTube and Vimeo page URLs and converts them to fixed privacy-enhanced embed origins; it can also render a direct video URL with native browser controls. Merchants configure an accessible title, responsive ratio and width, optional poster, caption and transcript, plus provider-supported autoplay, mute, loop, and start-time presets.

Click-to-play is the recommended default for third-party providers because the iframe is not loaded until the shopper interacts. Vimeo and direct-video autoplay always force muted playback; YouTube remains click-to-play because its documented embed parameters cannot guarantee muted autoplay. Direct videos can include a WebVTT captions URL and language metadata. In Page Designer edit mode the component renders a safe authoring card instead of starting playback or loading a third-party iframe.

The host Storefront Next application must allow `https://www.youtube-nocookie.com` and `https://player.vimeo.com` in CSP `frame-src`. Direct videos require their delivery origin in `media-src`; the included demo configuration allows same-origin and standard B2C Commerce static hosts. Add an approved CDN origin explicitly rather than broadening CSP to every HTTPS host.

### Promo Strip

Use Promo Strip for concise, high-visibility messages such as free delivery, sale deadlines, loyalty benefits, or store services. Merchants select a safe icon, semantic tone, density, alignment, and optional link. The block is static content and does not announce itself as a live alert to assistive technology.

### Section

Use a Section as the outer building block of a blank page. It gives merchants controlled presets for maximum width, vertical spacing, background surface, alignment, and an optional anchor ID. Add other components to its `content` region.

Use Sections instead of spacer components or merchant-authored CSS. Sections can contain normal content, but recursive Section nesting is intentionally restricted to keep pages predictable and responsive.

### Responsive Columns

Use Responsive Columns to compose two- or three-column editorial layouts without custom grid CSS. Merchants select equal or asymmetric ratios, gap, vertical alignment, and mobile order. Each column is a Page Designer region, so it can contain normal top-level toolkit components while recursive column layouts and loose child fragments remain restricted.

### Rich Text

Use Rich Text for campaign introductions, SEO-supporting copy, delivery information, and editorial content. It supports an optional eyebrow, semantic heading, rich-text body, alignment, width, and CTA.

Use the `h1` option once when Rich Text supplies the primary title of a blank landing page. PLP and PDP routes already provide their own `h1`, so their managed content should start at `h2`. The body comes from the controlled Business Manager markup editor; the component does not expose arbitrary JavaScript or CSS.

### Media Content

Use Media Content when an image and copy belong together. Merchants can choose common image positions and responsive layout presets while the component reuses Storefront Next image optimization, focal points, semantic tokens, links, and buttons.

Typical examples include a brand story, campaign feature, material story, sustainability message, or editorial PDP content.

### Promo Grid and Promo Card

Add a Promo Grid, configure its responsive column preset, and then add up to six Promo Cards to its `items` region. That region accepts only `SFNextToolkit.promoCard`, preventing incompatible layouts.

Use this pair for campaign tiles, gender or age navigation, seasonal stories, or editorial category entry points. Promo Grid supports equal and featured-first compositions. Promo Card supports overlay and stacked treatments, controlled image ratios, focal points, safe CTA variants, and a useful empty authoring state. Mark an image as decorative when it repeats the adjacent card copy; otherwise provide meaningful alternative text.

### Category Carousel and Category Card

Category Carousel can populate itself from the children of a selected parent category or render manually placed Category Cards. Use automatic population for catalog navigation that should stay in sync, and manual cards when the campaign needs editorial ordering or image/copy overrides.

Category Card never invents catalog content or falls back to a demo asset. If a selected category has no usable image, configure an editorial image or correct the category data.

### Product Card

Product Card is the reusable single-product equivalent of the configurable PLP grid. Search for one product with the native Page Designer product attribute and place the card in a page root, Section, Responsive Columns, or a Product Carousel manual region. The card uses a named CSS container, so **Auto** layout responds to the width actually available to the component instead of assuming a viewport breakpoint; narrow containers remain vertical and wider containers become horizontal. Vertical and Horizontal can also be forced.

Merchants can choose the catalog image view type (`hi-res`, `large`, `medium`, `small`, or `swatch`), frame ratio, object fit, radius, elevation, and hover treatment. The same presentation contract as Configurable Product List controls badges, wishlist, quick add, swatches, brand, category, product name, SKU, rating, price, promotions, maximum swatches, and up to five custom product attributes. For example, `material|Material` and `season=Season` map `c_material` and `c_season` while supplying merchant-facing labels.

The loader requests the selected image type and product fields from the Products API, then renders the host storefront's production Product Tile. It therefore preserves PDP links, prices, promotions, variation data, actions, analytics, image optimization, and accessibility behaviour. If the product is missing or offline, Page Designer displays a diagnostic authoring state while the live storefront renders no misleading placeholder product.

### Product Carousel

Product Carousel has three source modes:

- **Auto** uses the selected category when one is configured; otherwise it renders the manually authored `products` region.
- **Manual** renders Product Cards or standard Storefront Next Product Tiles in their authored order. Add up to 12 children and use a Product Card when each item needs a searchable product picker and its own presentation settings.
- **Category** requires a category and loads the configured number of products, from 1 to 12, through Product Search. The carousel owns the image type, visible fields, actions, swatch count, and additional custom attributes for category-loaded cards.

Category mode offers three selection strategies:

- **Catalog order** returns the first N products in the search index's catalog order.
- **Random daily** derives a stable selection from the component, category, and UTC date. All uncached executions for that component/category/day produce the same selection, and it changes the next day.
- **Random per request** creates a new seed on each server loader execution. It does not guarantee a different list on every browser refresh because MRT, Page Designer, CDN, or application response caching can reuse an already rendered result. Configure the host cache policy according to the desired rotation frequency.

Page Designer design and preview modes intentionally keep random selections stable so the authoring canvas does not jump after every property edit. Category randomization reads a bounded circular search window and uses at most two Product Search requests rather than downloading the whole category. The shared carousel and Product Tile implementations preserve storefront pricing, badges, actions, analytics, responsive imagery, and accessibility behaviour.

### Einstein Product Recommendations

Choose an Einstein recommender and a fallback heading. The component enriches recommendations with product data on the server and renders the shared storefront carousel. In Page Designer, an unconfigured component shows a clear configuration card; on the live storefront an empty recommendation result renders nothing.

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

### Blog Post Grid

Blog Post Grid turns the online Content Assets assigned to a configured content folder into responsive article cards. Merchants can select the folder, page size, sort order, category or featured-only filter, column count, image ratio, visible metadata, CTA copy, and pagination. The component reads content through Shopper Experience on the server; it does not expose credentials or call SCAPI from the browser.

The default folder ID is `sfnext-blog`. A host project can use a different folder without changing code. The SLAS client must include the `sfcc.shopper-experience.contents` scope, and posts must be online and assigned to the selected folder before content search can return them.

### Content Collection

Content Collection is a reusable card collection for both **SFNext blog posts** and **generic B2C Content Assets**. It can render a container-responsive grid or carousel with two, three, or four cards per row, configurable image ratio and surface, heading and introduction, field visibility, link label, and safe link behaviour.

Choose one of two data modes:

- **Manual** accepts Content Asset IDs separated by line breaks or commas, keeps the authored order, de-duplicates them, and displays up to the configured limit of 24. Use the Content Asset ID, not its display name, folder ID, or URL. Missing, offline, inaccessible, or locale-unavailable IDs are not replaced with demo content.
- **Latest** searches one Content Library folder, filters to all, blog, or generic assets, sorts by newest, oldest, or title, and displays the first N results. The default folder is `sfnext-blog`, but any valid folder ID can be configured.

Latest mode scans at most five Shopper Experience pages (1,000 assets) before sorting mapped fields. If an authoring notice reports that ceiling, use a more specific folder; this keeps server-render latency and SCAPI traffic bounded even in very large libraries.

Salesforce Page Designer does **not** expose a native B2C Content Asset search/picker attribute. The native `cms_record` attribute selects Salesforce CMS records, which are a different content source. For that reason, the portable manual mode uses a multiline list of Content Asset IDs; use Latest/folder mode when editors should not maintain IDs. A richer search dialog would require a custom Business Manager attribute editor plus its own API permissions and deployment lifecycle.

The component recognizes the toolkit's blog attributes and common standard Content fields. For another content model, set optional attribute-ID overrides for title, summary, image, image alternative text, publication date, author, category, and link. The `c_` prefix may be omitted. **Auto** links explicit toolkit blog assets to `/blog/{id}` and generic assets through the mapped link field; **Blog**, **Template** (for example `/stories/{id}`), and **None** provide explicit alternatives. Unsafe field IDs, media protocols, and destinations are rejected.

Both modes use Shopper Experience on the MRT server. The SLAS client must retain all existing scopes and include `sfcc.shopper-experience.contents`; online/localized visibility and folder search are governed by the B2C content search index. Rebuild the target site's content index after imports, bulk changes, folder reassignment, or when newly online assets are not returned. Runtime/API caching can delay visibility even after indexing, so validate with the same site and locale used by the storefront.

## Blog editorial model

Blog posts are B2C Commerce **Content Assets**, not Custom Objects and not one-off Page Designer pages. This preserves Business Manager's localized rich-content editor, online/offline scheduling, folder assignment, search indexing, and SEO fields while Page Designer remains responsible for the reusable visual layout.

The article body is merchant-authored HTML and follows the storefront's existing trusted Business Manager content boundary. Restrict HTML editing to trusted roles; add an allowlist sanitizer in the host application if less-trusted contributors can author raw markup.

After importing the included metadata extension, editors create a post in **Merchant Tools > Content > Libraries > _your content library_ > Content Assets**. Use the Content Asset ID as the URL slug and complete the standard name, description and page metadata together with the **SFNext Blog** attributes:

- body, hero image and alternative text;
- author, publication date, category and tags;
- reading time and featured status.

Assign the asset to the `sfnext-blog` folder and set it online. The public route is `/blog/{content-asset-id}`. The `/blog` Page Designer page lists posts automatically; the fixed `blog-post-layout` Page Designer page supplies optional regions before and after the article shared by every post. The Blog Post page type also exposes `/blog/preview` so authors can verify the common layout in Business Manager without inventing a real article URL.

The metadata-only import package at `site-imports/sfnext-toolkit-blog` contains the reusable Content system-object attributes. It deliberately excludes site libraries, Page Designer page instances, article copy, images, and locale preferences. Follow its README to create the folder and starter pages in the target site, then rebuild the content search index.

## Build and validate

From the Storefront Next application root:

```bash
pnpm cartridge:generate
pnpm cartridge:validate
pnpm build
```

`cartridge:generate` discovers every decorated component under `src/components/sfnext-toolkit`, generates its metadata into this cartridge, copies the hand-authored page types, removes duplicate toolkit metadata from `app_storefrontnext_base`, and validates the resulting manifest. Validation also enforces the complete 22-type public contract and rejects unresolved TypeScript expressions or enum defaults that are not present in their value lists.

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
3. Drag components from the `SFNextToolkit` group into compatible regions. Root regions expose 18 complete blocks; the 4 contextual child types appear only inside their matching parents.
4. Configure the component attributes and save.
5. Use Preview to verify desktop and mobile behavior.
6. Publish the page or assignment when it is ready.

Page Designer changes must be saved before the Storefront Next preview iframe refreshes. Unsaved property changes are not reflected live.

## Recommended page recipes

### Campaign landing page

1. Campaign Hero
2. Embedded Video or Promo Strip
3. Section containing Rich Text or Media + Content
4. Promo Grid or Category Carousel
5. Product Card in a narrow editorial column for one hero product, or Product Carousel for a curated/category assortment
6. Trust Bar
7. Accordion for supporting information

### Product listing page

1. Category Hero in `plpTopFullWidth`
2. Optional Promo Strip or Rich Text in `plpTopContent`
3. Configurable Product List in `plpProductList`
4. Media + Content, Product Carousel, Content Collection, Trust Bar, or Accordion in `plpBottom`

### Product detail page

1. Promo Strip, Trust Bar, or Media + Content in `promoContent`
2. Embedded Video, Product Carousel, Einstein Product Recommendations, Media + Content, Content Collection, or Accordion in `engagementContent`

### Blog home

1. Campaign Hero or Rich Text in `hero`
2. Optional manual Content Collection for specifically curated stories in `featured`
3. Blog Post Grid for a pageable blog index, or Content Collection in Latest mode for the newest N posts, in `posts`
4. Newsletter, Promo Strip, Trust Bar, or campaign CTA in `afterPosts`

### Blog post

1. Optional Promo Strip or breadcrumb treatment in `beforeArticle`
2. The route-owned article header, hero, metadata, rich body, and structured data
3. Product Carousel, Product Card, Content Collection, Blog Post Grid, newsletter CTA, or related editorial content in `afterArticle`

### Editorial commerce module

1. Responsive Columns with Rich Text or Media + Content in the wide column
2. One Product Card in the narrow column, using Auto layout and only the fields needed by the story
3. Product Carousel in Manual mode for an exact authored sequence, or Category mode with Random daily for a rotating but visually stable assortment
4. Content Collection in Manual mode for related stories, or Latest mode for an automatically refreshed folder feed

## Install in another Storefront Next project

Copy or merge these paths:

```text
cartridges/plugin_sfnext_page_designer
scripts/sync-page-designer-toolkit-cartridge.mjs
src/components/sfnext-toolkit
src/extensions/page-designer-toolkit
src/components/product-carousel
src/components/product-list
src/components/product-tile
src/lib/product/product-conversion.ts
site-imports/sfnext-toolkit-blog
```

Then:

1. Register `SFDC_EXT_PAGE_DESIGNER_TOOLKIT` in `src/extensions/config.json`.
2. Add the `cartridge:generate`, `cartridge:validate`, and `cartridge:deploy:page-designer` scripts from this project to `package.json`.
3. Merge the shared Product Carousel, Product List, Product Tile, and product-conversion adapters rather than replacing newer host implementations blindly. Product Card and category-loaded Product Carousel rely on those shared contracts for requested image types, fields, prices, promotions, and custom attributes. Run their tests after resolving any Storefront Next release differences.
4. Extend the host CSP `frame-src` and `media-src` directives with the approved video origins described under Embedded Video.
5. Run `pnpm cartridge:generate` and `pnpm cartridge:validate`. Do not copy a stale generated registry or edit it manually.
6. Deploy the generated cartridge, activate its code version, and place `plugin_sfnext_page_designer` before `app_storefrontnext_base` in the target site's cartridge path.
7. If Blog Post Grid, Content Collection, or the blog routes are required, import `site-imports/sfnext-toolkit-blog`, create the desired library folder (the default is `sfnext-blog`), and create online assets in the locales the storefront serves. Generic Content Collection use does not require the SFNext Blog custom fields, but its mapped attributes must exist on `Content`.
8. Preserve the SLAS client's existing scopes and add `sfcc.shopper-experience.contents`. Also confirm that the instance API configuration allows the Shopper Experience content and content-search resources used by the runtime.
9. Rebuild the target site's content search index after importing metadata/assets or assigning folders. Latest mode and Blog Post Grid cannot discover an asset until the index exposes its online, localized folder membership; Manual mode still requires the requested IDs to be readable through Shopper Experience.
10. Build and deploy the MRT application from the same commit as the cartridge. Configure the MRT environment for the target organization, short code, site, locale, currency, and SLAS client.
11. Give authoring users Page Designer permission plus access to the target content library and catalog, then create or assign the toolkit page types in Business Manager.

The easiest reusable path is to fork this repository at a tagged toolkit release and apply project branding on top. When integrating into a different Storefront Next template release, treat the cartridge metadata and React implementation as one versioned unit, port the small shared-adapter changes, regenerate the registry, and validate the full build before deployment. The toolkit uses standard Storefront Next primitives and semantic theme tokens and contains no brand-specific assets or IDs.

## Authoring and accessibility rules

- Component and attribute IDs are public contracts. Do not rename them after pages have been authored; add a versioned type for incompatible changes.
- Use enum presets backed by semantic tokens instead of arbitrary colors, CSS classes, or inline scripts.
- Use the content library image picker, meaningful alternative text, and decorative-image mode only when the image conveys no information.
- Keep one page-level `h1`. Use Rich Text's `h1` only on a blank page that does not already render one; start managed PLP and PDP content at `h2`.
- Parent component regions restrict their allowed child types.
- Interactive controls use native links, buttons, or accessible disclosure primitives.
- Embedded videos require a descriptive title; direct videos should provide WebVTT captions and all videos should offer a transcript for meaningful spoken content.
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
- For Product Card, select an online product available to the target site and verify that the chosen catalog image view type exists for that product. The component deliberately does not substitute a different demo product or image type.
- For Product Carousel Manual mode, add Product Cards or `Content.productTile` children to the `products` region. In Category mode, select a category assigned to the site and containing searchable online products.
- For Category Hero, verify that the page is previewed with a category aspect or configure editorial overrides.
- Check MRT logs for component loader errors.

### Content Assets or blog posts do not appear

- In Content Collection Manual mode, enter exact Content Asset IDs, not names, URLs, or folder IDs. Page Designer has no native B2C Content Asset picker.
- Confirm that the Content Asset is online, assigned to the exact folder configured on Blog Post Grid or Content Collection Latest mode, and available in the requested locale.
- Confirm that the custom Content metadata was imported before creating or importing posts.
- Confirm that the SLAS client has `sfcc.shopper-experience.contents` and that `/content-search` is allowed by the instance API configuration.
- Rebuild the content search index after bulk imports or metadata changes.
- Use the Content Asset ID—not its display name—as the `/blog/{slug}` URL segment.

### Random category products do not change on every refresh

- Page Designer design and preview intentionally use a stable seed.
- Random daily stays stable for the component/category during the current UTC day.
- Random per request changes on a new server loader execution, but MRT, application, or CDN caches can serve a previous render. Review the host cache policy if the business requires a shorter rotation window.

### A video is blank or blocked

- Confirm that the URL resolves to a supported YouTube, Vimeo, or safe direct-video source.
- Check the browser console for CSP violations and add only the required provider or CDN origin to `frame-src` or `media-src`.
- Keep provider controls enabled. Vimeo and direct-video autoplay are forced to muted playback; YouTube stays manual and uses click-to-play.
- For consent-managed sites, connect third-party video loading to the site's CMP policy. Click-to-play reduces eager requests but does not by itself replace legal consent requirements.

## Removal

Take pages and aspect assignments that use `SFNextToolkit` types offline or migrate them before removing the cartridge. Removing the cartridge metadata does not remove the React code from an already-deployed MRT bundle, and deploying another MRT bundle still replaces the entire application bundle.

## License

The toolkit follows the license of the Storefront Next project in which it is distributed.
