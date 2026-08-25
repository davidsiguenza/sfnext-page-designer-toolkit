# Shoppable Image · Shop the Look

Storefront Next Page Designer component with two product-source modes:

- **Free selection (recommended):** every hotspot can reference any product assigned to the site catalog.
- **Product Set:** the merchant selects a Product Set and the runtime validates that each hotspot belongs to it. The editorial panel can also open the set Quick Add or link to its PDP.

## Authoring flow

1. Add `Shoppable Image · Shop the Look` from the `SFNextToolkit` group.
2. Select the desktop image and, only when the mobile crop differs, an optional mobile image.
3. Open `Products and interactive hotspots`.
4. Select free-selection or Product Set mode.
5. Temporarily choose the same image file for positioning. This browser-only preview is neither saved nor published; an absolute image URL from the B2C library or an approved CDN remains available as an advanced option.
6. Select a position on the image, choose the product in Page Designer's native Product Picker, and drag the hotspot if it needs adjustment.
7. Switch to the mobile view to inherit desktop coordinates or define independent mobile coordinates for a different crop.
8. Decide whether to show the integrated editorial panel and, separately, its `View all` action.
9. Optionally enable `Reveal hotspots on interaction` to keep the campaign image clean until hover, keyboard focus, or activation of the corner indicator.

The editor stores normalized coordinates from `0` to `100`, not pixels. The storefront preserves the image aspect ratio, so coordinates stay aligned while the image scales. A different mobile crop requires its own hotspot coordinates.

Page Designer runs custom editors in an isolated iframe and does not expose sibling attribute values. The visual editor therefore cannot read `desktopImage` automatically. The native image field remains the only published image; it selects media from the current B2C Commerce site library, while the file chosen in the Studio is only a temporary local positioning reference.

Salesforce CMS is separate from the B2C Commerce site library. A CMS-backed variant can be built with a `cms_record` attribute and a defined CMS content type, but it would be a distinct source mode and the isolated hotspot editor still could not reuse that sibling value automatically.

## Storefront behavior

- Desktop hover or focus shows the current product name, price, and availability.
- `Reveal hotspots on interaction` hides the markers until the image receives hover/focus. A compact `Shop the look` control in the corner reveals and pins them on touch devices; the option is off by default for backward compatibility.
- Click, Enter, or Space opens the standard Quick Add with variants, size selection, and Add to Cart.
- Mobile hotspots retain a 44 × 44 px touch target and open Quick Add on tap.
- `View all products` opens an accessible modal containing current products and an individual Quick Add action.
- Product Set mode can expose `Shop the set` through standard set Quick Add and `View set` through its PDP.
- Heading, description, and actions sit in a responsive editorial panel visually attached to the image. `Show editorial panel` hides the complete panel; `Show view-all button` preserves the copy while hiding only that CTA.

Free-selection mode deliberately does not provide a blind “add all” action because master products require variant selection. The modal resolves each size or variant without inventing an artificial PDP. Product Set mode reuses the standard set flow.

## Product selection

The editor uses only the prebuilt `sfcc:productPicker` for hotspot products and Product Sets. It needs no Managed Runtime search endpoint, keeps authoring inside the standard B2C Commerce selection flow, and stores only the selected product ID as catalog truth.

## Markets and accessibility

Product data is not frozen into content. On each render, the loader calls SCAPI with the active market's currency, price books, and inventory. A product unavailable to that site's catalog is omitted live and flagged in edit mode.

While that request runs, the fallback immediately renders the campaign image and optional editorial panel. Only hotspots, prices, and product actions wait for SCAPI.

Hotspots are semantic buttons reachable by keyboard. In interaction-reveal mode, focusing the corner control reveals the points before they enter the tab order. They announce product and availability, expose a visible focus state, and return focus to their activator after Quick Add closes. Availability and Quick Add labels reuse storefront translations.

## Technical contract

- Component type: `SFNextToolkit.shoppableImage`
- Custom editor: `SFNextToolkit.shoppableHotspots`
- Schema version: `1`
- Maximum hotspots: `12`
- Editor metadata and resources: `plugin_sfnext_page_designer` cartridge
