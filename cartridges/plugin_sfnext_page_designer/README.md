# Storefront Next Page Designer Toolkit

`plugin_sfnext_page_designer` is a reusable Page Designer toolkit for Salesforce B2C Commerce and Storefront Next. It provides 6 merchant-facing page types, 28 component types, and 1 custom editor without brand assets, catalog IDs, credentials, or fixed site configuration. The optional Size Guide intentionally includes a versioned Mayoral sizing dataset; no Mayoral imagery or product data is bundled.

The toolkit has two required parts:

1. This B2C cartridge registers the headless Page Designer metadata used by Business Manager.
2. The companion React implementation in `src/components/sfnext-toolkit` and `src/extensions/page-designer-toolkit` renders that metadata in the Managed Runtime application.

A B2C cartridge cannot execute React by itself. Install and deploy both parts to use the toolkit in another Storefront Next project.

## What is included

### Page types

| Type ID                                | Use case                                                                                      | Route or assignment                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `page.sfnextToolkitBlankPage`          | Build campaign and editorial landing pages from a flexible blank canvas.                      | `/:siteId/:localeId/page/:pageId`                     |
| `page.sfnextToolkitProductListingPage` | Add managed content around the standard category experience and configure the product grid.   | PLP aspect, `/:siteId/:localeId/category/:categoryId` |
| `page.sfnextToolkitProductDetailPage`  | Add content around the standard PDP and one contextual fit tool beside its product options.   | PDP aspect, `/:siteId/:localeId/product/:productId`   |
| `page.sfnextToolkitBlogHomePage`       | Compose an editorial blog landing page around an automatically populated post grid.           | `/:siteId/:localeId/blog`                             |
| `page.sfnextToolkitBlogPostPage`       | Define the reusable before/after-article layout shared by every blog post.                    | `/:siteId/:localeId/blog/preview`                     |
| `page.sfnextToolkitBrandingStudioPage` | Stage and preview one visual Site Theme before saving it as a site-wide Header content block. | `/:siteId/:localeId/page/:pageId`                     |

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
| `component.SFNextToolkit.megaMenu`               | `Mega Menu Enhancements` content block assigned to the standard header's site-wide region.             | Standard navigation      |
| `component.SFNextToolkit.megaMenuPanel`          | Editorial additions for one root category, with curated links and at most one graphical feature.       | Target root category     |
| `component.SFNextToolkit.megaMenuLink`           | Safe curated menu destination for a URL, category, product, or B2C Content Asset.                      | Selected destination     |
| `component.SFNextToolkit.megaMenuFeature`        | Graphical menu card driven by category, product, B2C Content, Salesforce CMS, or custom data.          | Source-dependent         |
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
| `component.SFNextToolkit.sizeGuide`              | PDP fit assistant using bounded Mayoral brand, measurement, and age rules plus product availability.   | Current PDP product      |
| `component.SFNextToolkit.siteTheme`              | Visual, allowlisted source-token palette published through the Header's site-wide theme region.        | None                     |

Eighteen component types are general-purpose root-page blocks. Seven are nested contextual building blocks rather than loose page blocks: `accordionItem`, `categoryCard`, `megaMenuPanel`, `megaMenuLink`, `megaMenuFeature`, `promoCard`, and `trustItem`. The three remaining components are deliberately constrained: `sizeGuide` appears only in a PDP's max-one `productTools` region; `megaMenu` is staged as a content block for **Header > Mega Menu Enhancements**; and `siteTheme` is staged in Branding Studio for **Header > Site Theme**. The last two are ordinary content blocks with no fixed component ID and must not be published as ordinary page content. These restrictions keep the Page Designer palette useful and prevent invalid or unexpectedly global compositions.

The included standard Home, About, PLP, Search, and PDP host metadata explicitly excludes those ten contextual/constrained types from every ordinary region; PLP keeps its dedicated Product List inclusion and PDP keeps its dedicated Size Guide inclusion. The same boundary is enforced in generic Grid columns, Header Announcement, Section content, and Responsive Columns, so nesting cannot reintroduce an invalid drop target. `componentPreview` remains open for development previews. Site Theme also has a runtime guard that emits live CSS only when its immediate region is the embedded Header's exact `siteTheme` region. When porting the toolkit to a Storefront Next project with additional page types or container components, apply the same exclusions to every non-contextual region: a plugin component type cannot restrict a third-party host region by itself.

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

### Mega Menu Enhancements, Mega Menu Panel, Mega Menu Link, and Mega Menu Feature

The Mega Menu family is an editorial enhancement of the standard Storefront Next navigation—not a second catalog menu. The existing root categories and descendants remain authoritative, and the host `navigation-menu-mega` keeps its normal links, keyboard behavior, focus management, mobile disclosure, category banners, and empty-state behavior. If no Mega Menu Enhancements content block is assigned, the enhancement is disabled, or a root category has no matching panel, shoppers receive the unmodified standard menu.

`SFNextToolkit.megaMenu`, displayed as **Mega Menu Enhancements**, is an ordinary content block with no fixed component ID. `Layout.header` is the single embedded owner: it has fixed `component_id: header` and a `megaMenuEnhancements` region that accepts at most one enhancement block. The application shell fetches that header once through Shopper Experience, extracts its optional enhancement child, resolves all graphical feature data as a batch, and passes the result to the existing navigation. This is an editorial overlay on that one standard menu, not another header or navigation tree.

The enhancement component appears only in the Blank Page root palette so it can be staged on a temporary unpublished page, saved as a content block, and assigned through **Set Site-Wide Region > Header > Mega Menu Enhancements**; it is excluded from PLP, PDP, and blog authoring regions. Its root renderer also returns no live page content if the temporary page is published accidentally. When the content block is focused in Page Designer, its component renderer is the authoring canvas and displays the complete `panels` region; on the live storefront, `editorial-slot.tsx` selects only the panel for the currently open root category. The region accepts up to 12 Mega Menu Panels; create **one panel per root navigation category** and select that exact root category in `targetCategory`. Duplicating a target makes author intent ambiguous and should be treated as a configuration error rather than a way to merge panels.

Each Mega Menu Panel preserves the inherited category columns and adds a controlled editorial area. It supports an optional heading, introduction and direct category link, compact or comfortable density, semantic surfaces, links-first or feature-first order, and compact, standard or wide desktop allocation. Its two nested regions deliberately enforce the composition:

- `extraItems` accepts up to eight `SFNextToolkit.megaMenuLink` children for campaigns, services, guides, or deep links.
- `feature` accepts at most one `SFNextToolkit.megaMenuFeature`. Use a single strong visual message rather than competing promotional cards inside one root-category submenu.

Mega Menu Link supports a safe URL, catalog category, catalog product, or exact B2C Content Asset ID. Content destinations use a configurable relative path containing `{id}`; `/blog/{id}` is the default. Merchants can add supporting text, a short badge, a controlled icon, an accessible-label override, and plain, highlighted, or chip presentation. Invalid or incomplete links remain visible as diagnostics in Page Designer but are omitted from the live menu.

Mega Menu Feature has five source modes:

- **Category** loads the selected category and its catalog image.
- **Product** loads the selected product and prefers the chosen catalog image view type (`hi-res`, `large`, `medium`, `small`, or `swatch`). If that type is absent, it falls back deterministically to another configured supported type while exposing the requested and resolved types for diagnostics.
- **Content** loads an exact online B2C Content Asset and can map its editorial image/copy/link data.
- **Salesforce CMS** uses a native `cms_record` as the structured editorial source.
- **Custom** uses merchant-authored image, copy, and destination fields. It can optionally start from a `cms_record`, then apply the same safe overrides to create a bespoke treatment without a separate component type.

Source data provides the default card, while safe editorial overrides let the merchant replace the eyebrow, title, description, image, alternative text, badge, CTA label, or destination without duplicating commerce behavior. The feature supports stacked or overlay composition, landscape/square/portrait ratios, cover or contain image fit, semantic tones, focal points, safe external-link handling, and an optional storefront price for Product sources. B2C Content Assets and Salesforce CMS records are different sources: the former uses Shopper Experience content permissions, while the latter uses the native `cms_record` selector and the host CMS configuration.

The server resolves all feature children as a batch: one bounded request family for selected categories, one for selected products, and one for B2C Content Assets, rather than an API waterfall per panel. CMS records arrive in Page Designer component data and do not trigger Shopper API calls. Only the normalized, navigation-safe projection reaches the renderer.

The global **Catalog banner behavior** and each panel's optional override decide how the inherited category banner and graphical feature interact:

- **Fallback** keeps the standard catalog banner when no usable Page Designer feature exists and avoids two competing graphics.
- **Replace** reserves the graphical position for the Page Designer feature.
- **Alongside** displays the inherited category banner and Page Designer feature together.
- **Inherit**, available on a panel, uses the Mega Menu Enhancements block's global choice.

The enhancement block can include editorial links/features inside expanded mobile categories or keep mobile navigation catalog-only. This is a presentation choice; it does not create a separate mobile information architecture.

Recommended authoring sequence (Site-Wide Regions for Content Blocks is currently **Beta** and subject to Salesforce Beta Services terms):

1. In Business Manager, open **Administration > Feature Switches** and enable **Enable Embedded Content Blocks** under Enable Content Blocks.
2. Open **Merchant Tools > your site > Content > Page Designer**, create a temporary **SFNext Toolkit - Blank Page** for the authoring canvas, and do not publish that page.
3. Drag `Mega Menu Enhancements` from the `SFNextToolkit` group onto the Blank Page root region and leave **Enabled** on. Add Mega Menu Panels only inside its `panels` region; do not drag Panel, Link, or Feature components to the page root.
4. Choose the global banner mode and whether editorial content appears on mobile. Add one Mega Menu Panel for each root category that needs enrichment; categories without panels remain standard.
5. Add only the genuinely useful curated links and no more than one Mega Menu Feature per panel. Verify that every selected category/product is online for the target site and has at least one supported configured image view type.
6. Save the configured component, choose **Save as Content Block**, open its settings, and choose **Set Site-Wide Region > Header > Mega Menu Enhancements**.
7. Keep the temporary page unpublished. Preview keyboard, pointer, narrow desktop, and mobile behavior from the site-wide content block before making the assignment live.

This flow follows Salesforce's official [Manage Content for Site-Wide Regions in Storefront Next with Content Blocks (Beta)](https://developer.salesforce.com/docs/commerce/sfra/guide/sfnext-page-designer-content-blocks.html) guidance.

#### Host integration contract

When porting the toolkit, preserve these behaviors from this repository:

- Keep `Layout.header` as the only embedded owner, with fixed `component_id: header` and a `megaMenuEnhancements` region limited to one `SFNextToolkit.megaMenu` child. Fetch the header once, preserve its fixed ID while forwarding Page Designer `mode` and `pdToken`, extract the optional enhancement child, and resolve that child's features as one batch. Do not add a second fetch for `SFNextToolkit.megaMenu` or assign it a fixed ID.
- Keep the enhancement component as its own authoring canvas: while focused it renders the complete draft `panels` region. Live contextual rendering belongs in `mega-menu/editorial-slot.tsx`, which receives the child extracted from the fetched header.
- Resolve all feature children through the shared batch loader. Adding individual component loaders creates eager requests for every feature even when its submenu is closed.
- Render one navigation-menu state machine. Do not mount separate hidden desktop/mobile copies that duplicate IDs, listeners, or Page Designer content.
- Treat a root category with editorial panel content as expandable even when it has no online catalog children. Categories without a matching panel keep their original behavior.
- Add editorial content beside the standard category links inside the existing Radix panel; never nest a feature/link anchor inside the category trigger anchor.
- Preserve the stock banner contract before applying Fallback, Replace, or Alongside: `c_headerMenuBanner` opts the category into the banner column and `c_slotBannerImage`, when present, remains its image source. A generic category image must not create a new standard banner by itself.

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

### Size Guide

Place at most one `SFNextToolkit.sizeGuide` in the Product Detail template's `productTools` region. The host route renders that region beside the standard product information and inside the existing Product provider, so the guide can compare its result with the current product's size variation values. It does not replace variation selection, price, inventory, or Add to Cart.

The shopper can start with one of three evidence sources:

- **Known brand and size** uses only an exact comparison row included in the versioned dataset. Brand selection exposes a second selector containing only the verified child-size labels for that brand and product category, so shoppers never have to guess an accepted free-text format. The known item must fit well; an ill-fitting label is not conversion evidence.
- **Measurements** is the preferred path. Child clothing uses height as the primary reference and chest for tops/dresses/outerwear or inseam for bottoms. Child footwear uses the longer of the two feet when both are supplied.
- **Age** offers orientation only. It is deliberately low confidence and asks for height before presenting the result as a strong fit recommendation.

Current dataset coverage (`2026-07-16`) is intentionally finite:

| Target                     | Supported reference coverage                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mayoral child clothing     | Sizes `2`, `3`, `4`, `6`, `8`, `10`, `12`, `14`, and `16`; height 92–162 cm, chest 52–81 cm, and inseam 37.5–78 cm.                                                   |
| Mayoral child footwear     | Sizes `18`–`36`; published foot lengths 11.2–22.2 cm. Size `30` retains the source discrepancy between 18.5 and 18.8 cm instead of hiding it.                         |
| Other-brand child clothing | Exact researched rows only: Adidas `7–8/128`, Nike `S/8–10`, Vans Boys `S/US 8`, and Vans Girls `S/US 7–8`.                                                           |
| Other-brand child footwear | Exact Vans, Adidas, or New Balance `EU 25` rows associated with 14.5 cm. The engine compares the published length; it does not assume all EU 25 shoes are equivalent. |

The known-brand selector deliberately mirrors that finite coverage: Adidas clothing offers `7–8 years / 128 cm`, Nike offers `S child / 8–10 years`, Vans offers its reviewed boys and girls `S` rows, and verified footwear brands offer `EU 25 child`. Changing the brand clears the previous size. When the shopper's label is not present, the UI directs them to physical measurements instead of accepting an unsupported string and presenting a misleading conversion.

Published Mayoral rows are reference points, not invented continuous intervals. When height, chest, inseam, or foot length falls strictly between two adjacent references, the result shows both sizes, presents the upper size only as a conservative orientation, lowers confidence, and requires confirmation instead of offering an immediate **Use size** action. Exact reference matches can remain actionable. The documented size-30 footwear discrepancy keeps its dedicated conflict result rather than being rounded away.
| Age-only orientation | Child clothing ages 2–16, with low confidence and a request for height. Footwear always requires foot length. |

The guide does **not** extrapolate unknown brand labels, convert other-brand adult/baby/teen labels, assume that the same nominal EU number has the same internal length, or silently choose an in-stock substitute. Unsupported evidence produces `needs_measurement`, conflicting evidence produces `needs_confirmation`, and values outside the table produce `out_of_coverage`. When the calculated ideal is absent from the current product, the result is `ideal_unavailable`; an adjacent size can be shown as context but is not promoted to the ideal.

This is practical fit guidance, not a guarantee or medical advice. Merchants should review the dataset whenever a brand changes its official charts and version the component contract if they introduce incompatible rules. The toolkit keeps height, body, foot, age, and known-size inputs only in transient React state for the open interaction. It does not persist them in cookies or browser storage, submit them to Commerce APIs, or add them to analytics. A host project that adds persistence or tracking must provide its own consent, retention, and privacy controls.

Authoring sequence:

1. Open or assign **SFNext Toolkit - Product Detail** for the target PDP aspect.
2. Drag **Size Guide** into `Product Tools`; the region accepts one and no other component type.
3. Configure its labels, target product category/collection, size variation attribute, and the permitted evidence paths.
4. Preview with representative products whose size values are online, then test a supported result, an unavailable ideal, an unknown label, and an out-of-range measurement before publishing the PDP assignment.

### Site Theme and Branding Studio

`SFNextToolkit.siteTheme` turns the Storefront Next color token layer into a controlled visual Page Designer experience. Its `theme` attribute uses the included `SFNextToolkit.themeEditor` custom editor rather than a long list of free-text attributes. The editor groups color controls into core surfaces/content, actions, header/footer chrome, status/feedback, commerce aliases, agentic colors, and legacy brand primitives; supports versioned presets and automatic or manual foreground contrast; and emits one versioned JSON value through the standard Page Designer custom-editor events.

Only allowlisted Storefront Next **source variables** are written. In addition to core surfaces/actions, chrome, and status/rating pairs, the editor covers the source colors exposed by Tailwind for account sidebars, swatches, filters, verified reviews, promotional product badges, destructive account actions, positive status, the agentic experience, and the black/white/gray brand ramps. The directly consumed `bg-input-30`, `bg-input-50`, and `bg-input-80` helpers are included too. PayPal gold and Venmo blue remain provider-owned and cannot be changed here. Tailwind 4's generated `--color-*` bridge variables also remain untouched, as do fonts, radii, shadows, opacity percentages, layout tokens, and complex CSS values such as filters or multi-part shadows. Runtime validation accepts only complete six-digit hex colors for known token names; arbitrary selectors, declarations, classes, URLs, and scriptable values are discarded. The code defaults for `focus` and `destructive-focus` use RGBA translucency; explicitly configuring either replaces that default with the selected solid six-digit hex color.

Semantic aliases are one-way defaults, not duplicated authoring work. When their source is present, selected swatches and legacy brand actions derive from `primary`, matching text derives from `primary-foreground`, account-sidebar accents derive from the accent pair, and filter/review/product/status/agentic aliases derive from their corresponding semantic source. An explicit alias color in the editor always wins; resetting it restores derivation (or the storefront's code-defined default when its source is not overridden). Independent brand ramp colors are never synthesized.

The publication boundary is deliberately strict:

- In Page Designer **Edit** or **Preview**, the already-published global projection is suppressed. The staged or focused Site Theme rendered through the normal registry shows one scoped sample card and never writes to `:root`.
- On an ordinary page—including a mistakenly published Branding Studio page—the component is outside the embedded Header subtree and renders no global style.
- A saved but unpublished content block is not a live theme.
- On the live application, root overrides are emitted only for an enabled, visible Site Theme delivered inside the fixed embedded `Layout.header` component's `siteTheme` region. The common shell projects that child before the visible route, so standard storefront, checkout, login, signup, and password-recovery layouts share the published palette. The emitted selector also matches `:root[data-brand]`, so a published Page Designer theme can override a host branding extension with equal specificity while leaving the host `data-brand` and its non-token behavior intact.
- The live projection is cached per MRT instance, site, and locale for a 30-second freshness window. A cold or expired request waits no more than one second for Shopper Experience and otherwise fails closed to the code-defined palette; expired branding is never served as a fallback. A valid response that finishes after that caller budget can still warm the cache in the background. Requests share that generation for up to five seconds before a genuinely stuck generation may be superseded; an older late response can never replace a newer cache value. Publication, unpublication, scheduled status changes, and rollback become eligible on the first request after the current freshness window, and a successful refresh applies the change to that request or a following request when it completes after the one-second budget.
- Site Theme intentionally represents one non-personal global palette. Do not attach customer-group, campaign, personalization, or any other visitor-segment visibility rule to the block or its Header assignment: the safe cache key contains only site and locale, so segmented branding is outside this component's contract.

Safe authoring sequence (Site-Wide Regions for Content Blocks is currently **Beta** and subject to Salesforce Beta Services terms):

1. In **Administration > Feature Switches**, enable **Enable Embedded Content Blocks** under Enable Content Blocks.
2. In Page Designer, create **SFNext Toolkit - Branding Studio**. Keep this staging page unpublished.
3. Drag one **Site Theme** into its `Theme Preview` region, open the visual editor, choose or customise the palette, and verify the scoped component preview.
4. Save the configured component and choose **Save as Content Block**.
5. From the content block settings, choose **Set Site-Wide Region > Header > Site Theme**.
6. Publish the content block/assignment and verify a normal storefront route after the current 30-second freshness window. To roll back without deleting the palette, unpublish or unassign the block, or disable the component and publish that change; the first request after each warm instance's freshness window performs the bounded refresh.

The custom editor consists of one editor metadata definition plus its same-named server module and local JavaScript/CSS resources in the cartridge. Keep all of them together and keep `plugin_sfnext_page_designer` ahead of `app_storefrontnext_base` in the site's cartridge path; otherwise the attribute can exist while its visual controls fail to load.

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

`cartridge:generate` discovers every decorated component under `src/components/sfnext-toolkit`, generates its metadata into this cartridge, copies the hand-authored page types and custom-editor definition/resources, removes duplicate toolkit metadata from `app_storefrontnext_base`, and validates the resulting manifest. Validation also enforces the complete 28-type public component contract and rejects unresolved TypeScript expressions or enum defaults that are not present in their value lists. A complete generated toolkit contains 35 JSON metadata files: 28 component definitions, 6 page definitions, and 1 custom-editor definition. The custom editor's server module and static JavaScript/CSS are additional cartridge resources, not JSON metadata definitions.

`cartridge:validate` validates both the standard Storefront Next metadata and every file in this cartridge with the B2C tooling schema validator.

## Deploy

Deploy the B2C metadata separately from the Managed Runtime application:

```bash
pnpm cartridge:deploy:page-designer:install --reload
pnpm build
pnpm push
```

The install command deploys both `app_storefrontnext_base` and
`plugin_sfnext_page_designer`. The base cartridge carries the required
`Layout.header` regions, while the plugin carries the toolkit components and
custom editor. A plugin-only deployment cannot make **Header > Mega Menu
Enhancements** or **Header > Site Theme** appear on an installation whose base
Header contract predates those regions.
Use `pnpm cartridge:deploy:page-designer` only for subsequent metadata-only
updates that do not change the Header contract.

Add `plugin_sfnext_page_designer` to the storefront site's cartridge path before `app_storefrontnext_base`:

```text
...:plugin_sfnext_page_designer:app_storefrontnext_base:...
```

The MRT environment must be linked to the same B2C Commerce instance and site so Business Manager can load the headless editor and preview URLs.

## Use in Business Manager

1. Open **Merchant Tools > Content > Page Designer** for the target site.
2. Create a page and choose one of the `SFNext Toolkit` page types, or open a PLP/PDP assignment using the matching aspect.
3. Drag components from the `SFNextToolkit` group into compatible regions. General toolkit page regions expose the appropriate subset of 18 root-page blocks; Blank Page exposes `Mega Menu Enhancements` only for staging its Header content block; Branding Studio exposes only `Site Theme`; and PDP `productTools` exposes only `Size Guide`. The 7 nested child types appear only inside their matching parents. Never publish Mega Menu Enhancements or Site Theme as ordinary page content.
4. Configure the component attributes and save.
5. Use Preview to verify desktop and mobile behavior.
6. Publish the page or assignment when it is ready.

Page Designer changes must be saved before the Storefront Next preview iframe refreshes. Unsaved property changes are not reflected live.

## Recommended page recipes

### Global site branding

1. Enable Embedded Content Blocks and create one unpublished **SFNext Toolkit - Branding Studio** page.
2. Configure one Site Theme in `Theme Preview`; use the visual editor's grouped source-token controls and check foreground/background contrast in the scoped sample.
3. Save it as a content block, assign it through **Header > Site Theme**, and publish the block/assignment—not the Branding Studio page.
4. Verify header, menu, product cards, forms, feedback states, and footer on both light and content-heavy routes. Unassign the block for an immediate return to the code-defined Storefront Next theme.

### Global catalog navigation

1. Keep the standard Storefront Next root category hierarchy and submenu depth configured by the host application.
2. Enable Embedded Content Blocks, stage `Mega Menu Enhancements` on a temporary unpublished Blank Page, save it as a content block, and assign it through **Header > Mega Menu Enhancements**. Do not create a parallel page-level navigation.
3. Add one Mega Menu Panel only for each root category that needs editorial enrichment.
4. Add up to eight focused Mega Menu Links and at most one Mega Menu Feature to each panel.
5. Use Fallback for conservative catalog-banner behavior, Replace for a campaign-led visual, or Alongside only when both graphics remain clear at the available width.
6. Verify desktop keyboard/focus behavior and expanded mobile categories in the same locales and catalogs used by shoppers.

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
2. One Size Guide in `productTools`, when the target products use the configured Mayoral child sizing coverage
3. Embedded Video, Product Carousel, Einstein Product Recommendations, Media + Content, Content Collection, or Accordion in `engagementContent`

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
cartridges/app_storefrontnext_base/cartridge/experience/components/Layout/header.json
scripts/sync-page-designer-toolkit-cartridge.mjs
src/components/sfnext-toolkit
src/extensions/page-designer-toolkit
src/components/header/index.tsx
src/components/product-carousel
src/components/product-list
src/components/product-tile
src/components/product-view
src/components/navigation-menu-mega
src/components/navigation-menu/impl.tsx
src/lib/product/product-conversion.ts
src/lib/page-designer/collect-component-data.server.ts
src/lib/page-designer/component-loader.server.ts
src/lib/page-designer/page-loader.server.ts
src/root.tsx
src/routes/_app.tsx
src/routes/_app.product.$productId.tsx
src/routes/_empty.preview.component.tsx
site-imports/sfnext-toolkit-blog
```

Then:

1. Register `SFDC_EXT_PAGE_DESIGNER_TOOLKIT` in `src/extensions/config.json`.
2. Add the `cartridge:generate`, `cartridge:validate`, `cartridge:deploy:page-designer`, and `cartridge:deploy:page-designer:install` scripts from this project to `package.json`. The `:install` command must include both `app_storefrontnext_base` and `plugin_sfnext_page_designer`; the shorter command remains plugin-only for later metadata updates.
3. Merge the shared Product Carousel, Product List, Product Tile, Product View, and product-conversion adapters rather than replacing newer host implementations blindly. Product Card and category-loaded Product Carousel rely on the tile/data contracts; Size Guide relies on the PDP route's max-one `productTools` region being rendered inside the current Product provider and passed into Product View beside the standard options. Run their tests after resolving any Storefront Next release differences.
4. Merge the Header integrations into the target release's root application shell and `navigation-menu-mega` implementation. `Layout.header` must remain the only embedded component, with fixed `component_id: header`, max-one `siteTheme` and `megaMenuEnhancements` regions, and the corresponding type inclusions. Preserve the requested Header ID with Page Designer `mode`/`pdToken`. Project only its Site Theme child into the root `PageDesignerProvider` before the route outlet so checkout and authentication layouts inherit it too; cache only that sanitized published projection per site/locale for 30 seconds, skip the cache entirely in Edit/Preview, and bound both cold and expired refreshes to one second with a fail-closed code-palette fallback. Let `_app` stream the request-scoped raw owner and attach the optional Mega Menu feature batches for the inherited navigation; when root has a cold miss in that same request, the raw owner promise is reused rather than fetched twice. Do not cache the full Header tree, fetch either feature as a second fixed component, or give its ordinary content block a fixed ID. Preserve the host category tree, focus/keyboard behavior, single menu state, mobile menu, category banners, and standard no-enhancement fallback instead of replacing the navigation wholesale.
5. Keep the Site Theme publication guard intact when adapting the application shell: suppress the published global projection in Edit/Preview so the staged/focused registry component owns the scoped sample; live ordinary page content produces no style; and only a child projected from the embedded Header owner may emit allowlisted source variables at `:root`.
6. Extend the host CSP `frame-src` and `media-src` directives with the approved video origins described under Embedded Video.
7. Run `pnpm cartridge:generate` and `pnpm cartridge:validate`. Do not copy a stale generated registry or edit it manually. Validation should report 35 JSON toolkit metadata files (28 components, 6 pages, and 1 custom editor), plus the editor's server/static resources.
8. Deploy both the updated `app_storefrontnext_base` and generated `plugin_sfnext_page_designer` cartridges with `pnpm cartridge:deploy:page-designer:install --reload`, activate the code version, and place `plugin_sfnext_page_designer` before `app_storefrontnext_base` in the target site's cartridge path. Repeat the dual-cartridge deployment whenever the Header host metadata changes; plugin-only deployment is sufficient only for later metadata-only updates that preserve that contract.
9. If Blog Post Grid, Content Collection, blog routes, or Content-backed Mega Menu Features are required, import `site-imports/sfnext-toolkit-blog` when its fields are used, create the desired library folder (the default is `sfnext-blog`), and create online assets in the locales the storefront serves. Generic Content use does not require the SFNext Blog custom fields, but mapped attributes must exist on `Content`.
10. Preserve the SLAS client's existing scopes and add `sfcc.shopper-experience.contents`. Also confirm that the instance API configuration allows the Shopper Experience component, content, and content-search resources used by the runtime. Product/category Mega Menu sources use the target storefront's existing Shopper Products access; Salesforce CMS mode and a Custom feature seeded from `cms_record` use the host Salesforce CMS/Page Designer configuration instead of the B2C Content Asset API. Size Guide performs no extra shopper API call; it consumes the already loaded PDP product.
11. Rebuild the target site's content search index after importing metadata/assets or assigning folders. Latest mode and Blog Post Grid cannot discover an asset until the index exposes its online, localized folder membership; manually selected Content Assets and menu features still require the requested IDs to be readable through Shopper Experience.
12. Build and deploy the MRT application from the same commit as the cartridge. Configure the MRT environment for the target organization, short code, site, locale, currency, and SLAS client.
13. Give authoring users Page Designer permission plus access to the target content library, CMS workspace when applicable, and catalog. Enable **Administration > Feature Switches > Enable Embedded Content Blocks** for both site-wide workflows. Stage Mega Menu Enhancements on an unpublished Blank Page and Site Theme on an unpublished Branding Studio page; save each as its own content block and assign it through the matching **Header** region. This site-wide capability is Beta. Then create or assign the remaining toolkit page types in Business Manager.

The easiest reusable path is to fork this repository at a tagged toolkit release and apply project branding on top. When integrating into a different Storefront Next template release, treat the cartridge metadata and React implementation as one versioned unit, port the small shared-adapter changes, regenerate the registry, and validate the full build before deployment. The toolkit uses standard Storefront Next primitives and semantic theme tokens and contains no brand-specific assets or IDs.

## Authoring and accessibility rules

- Component and attribute IDs are public contracts. Do not rename them after pages have been authored; add a versioned type for incompatible changes.
- Use enum presets backed by semantic tokens instead of arbitrary colors, CSS classes, or inline scripts.
- Site Theme is the controlled exception for merchant-selected colors: keep its strict source-token and six-digit-hex allowlists, check contrast in the visual editor, and never expose arbitrary CSS.
- Use the content library image picker, meaningful alternative text, and decorative-image mode only when the image conveys no information.
- Keep one page-level `h1`. Use Rich Text's `h1` only on a blank page that does not already render one; start managed PLP and PDP content at `h2`.
- Parent component regions restrict their allowed child types.
- Keep one Mega Menu Panel per root category, no more than eight curated links per panel, and no more than one graphical feature. The catalog navigation remains the primary information architecture.
- Verify mega-menu trigger state, focus return, arrow/Tab behavior, escape handling, and mobile category disclosure after porting the integration to another Storefront Next release.
- Interactive controls use native links, buttons, or accessible disclosure primitives.
- Embedded videos require a descriptive title; direct videos should provide WebVTT captions and all videos should offer a transcript for meaningful spoken content.
- Loading fallbacks preserve approximate component dimensions to reduce layout shift.
- Commerce APIs run in MRT loaders, never directly in the browser.
- Treat Size Guide results as bounded guidance, expose uncertainty and unavailable ideals, and never persist or track shopper measurements without an explicit host privacy design.

## Troubleshooting

### Components do not appear

- Confirm that both `app_storefrontnext_base` and `plugin_sfnext_page_designer` were deployed to the active code version. Initial Mega Menu/Site Theme installation requires the dual-cartridge `pnpm cartridge:deploy:page-designer:install` command; the plugin-only command does not add the Header regions.
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

### Size Guide cannot recommend a size

- Confirm that Size Guide is in the PDP template's `productTools` region and that the host Product View actually renders that slot inside the current Product provider.
- If the component is visible in Page Designer but the entire `Product Tools` region is absent from the live PDP, confirm that the host page resolver preserves product-specific precedence and retries Shopper Experience with the PDP category when the product lookup returns no page. Shopper Experience does not apply a category assignment to a `getPages` request that includes only `productId`; the toolkit host integration in this repository implements that product-to-category fallback.
- Confirm that the configured size variation attribute matches the product data and that the product exposes its online size values. An otherwise valid result is deliberately reported as unavailable when its ideal value is absent.
- Use only covered child evidence. Unknown brands/labels, other-brand adult/baby/teen labels, or an ill-fitting known size intentionally request measurements instead of guessing.
- For clothing, supply height and use chest for upper-body categories or inseam for bottoms when the first result needs confirmation. For footwear, measure both feet and use the longer value.
- Keep values within the documented Mayoral tables. Do not reinterpret an `out_of_coverage` result as the nearest size.

### Page Designer rejects Size Guide in `promoContent`

- This is the expected contract: `promoContent` and `engagementContent` explicitly exclude `SFNextToolkit.sizeGuide` because neither slot owns the current Product context.
- Use the PDP slot labelled **Product Tools**. It accepts only `SFNextToolkit.sizeGuide` and has `max_components: 1`.
- If **Product Tools** is absent from an existing PDP, run the full install deployment (`pnpm cartridge:deploy:page-designer:install --reload`) so both `app_storefrontnext_base` and `plugin_sfnext_page_designer` are refreshed, deploy the MRT application from the same commit, and reopen the editing session. Do not recreate the `pdp` content item.

### The Site Theme visual editor does not load

- Confirm that the generated cartridge contains the editor definition for `SFNextToolkit.themeEditor`, its same-named server module, and every JavaScript/CSS resource referenced by the editor metadata.
- Confirm that `plugin_sfnext_page_designer` is ahead of `app_storefrontnext_base` in the site's cartridge path, the new code version is active, and Page Designer was refreshed after deployment.
- Regenerate rather than hand-copying the editor. A custom-attribute definition without its cartridge resources can display an empty or fallback property editor even when the React storefront component exists.

### Site Theme previews but does not change the live storefront

- This is expected on the Branding Studio page and in Page Designer Edit/Preview: those contexts use a scoped sample and never modify `:root`.
- Confirm that Site Theme was saved as a **content block**, assigned through **Set Site-Wide Region > Header > Site Theme**, enabled, visible, and published. Publishing the Branding Studio page is neither required nor sufficient.
- Confirm that the active base Header metadata is embedded with fixed `component_id: header` and a max-one `siteTheme` region including `SFNextToolkit.siteTheme`.
- Confirm that the application shell renders the Header's embedded `siteTheme` region. The component intentionally emits no live style outside that embedded subtree or when its content block is offline.
- After publishing, unpublishing, disabling, or changing the assignment, the first request after each instance's current 30-second freshness window performs a bounded refresh. If Shopper Experience does not answer within one second, that request uses the code palette rather than stale branding. Do not use visitor-segment visibility rules for Site Theme.
- Inspect the rendered document for `data-slot="sfnext-toolkit-site-theme"`. If it exists, verify that the configured values survived the strict source-token and `#RRGGBB` allowlists; unsupported token names and color syntax are discarded.

### The standard menu works but Mega Menu enhancements do not appear

- Confirm that the generated cartridge contains all four `megaMenu*` metadata types and that the MRT registry was built from the same commit.
- Confirm that the updated `app_storefrontnext_base` was deployed alongside `plugin_sfnext_page_designer`; otherwise the existing Header metadata has no `megaMenuEnhancements` region and the site-wide assignment target cannot appear.
- Confirm that **Enable Embedded Content Blocks** is on, `Mega Menu Enhancements` was saved as a content block, and that block is assigned through **Header > Mega Menu Enhancements**. The temporary authoring page itself must remain unpublished.
- Confirm that generated `Layout.header` metadata has `embedded: true`, `component_id: header`, and a max-one `megaMenuEnhancements` region that includes `SFNextToolkit.megaMenu`. The enhancement component itself must not be embedded and must not have a fixed component ID.
- Select the exact root navigation category on each panel. A descendant category does not target its root menu trigger, and duplicate panels for one root category are invalid authoring.
- Check that the application shell fetches `Layout.header` once, extracts the assigned enhancement child, batches its feature data, and passes that child to the standard `navigation-menu-mega` integration. Keep the normal menu visible while diagnosing; the integration must fail open to catalog navigation.
- For a missing feature, verify that its selected category, product, or Content Asset is online for the site/locale and that a supported product image view type exists. The component exposes both requested and resolved product image types for diagnostics. In Custom mode, supply a usable title, copy, or editorial image; CTA-only content is intentionally treated as unconfigured.
- Check the selected Fallback, Replace, or Alongside banner mode before treating the inherited category banner as a rendering defect.

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

Take pages and aspect assignments that use `SFNextToolkit` types offline, and unassign or migrate both `Mega Menu Enhancements` from **Header > Mega Menu Enhancements** and `Site Theme` from **Header > Site Theme**, before removing the cartridge. The integrations are deliberately fail-open: without the optional menu block the inherited catalog navigation continues, and without the optional theme block the code-defined Storefront Next tokens continue. Removing the cartridge metadata does not remove the React code from an already-deployed MRT bundle, and deploying another MRT bundle still replaces the entire application bundle.

## License

The toolkit follows the license of the Storefront Next project in which it is distributed.
