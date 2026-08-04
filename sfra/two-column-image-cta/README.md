# Two-column image, text, and CTA for SFRA

A self-contained Salesforce B2C Commerce SFRA Page Designer component. It provides two responsive promotional cards, each with an image, optional title band, rich text, and CTA.

> This package targets **SFRA**, not Storefront Next. It is intentionally isolated under `sfra/` so the Storefront Next cartridge generator and deploy commands at the repository root do not include it.

## Features

- Two equal-size responsive images using a shared aspect ratio and `object-fit: cover`.
- Native Page Designer image focal points applied through `object-position`.
- Optional title bands for cases where the title is already embedded in the image.
- Theme presets based on SFRA `--skin-*` tokens plus unrestricted merchant overrides.
- A self-contained visual color picker with an SFRA quick palette, native picker, and validated CSS color input.
- CTA buttons aligned at the bottom by default, even when card copy has different lengths.
- Accessible markup, visible focus states, and a single-column mobile layout.
- A standalone test page type for validating the component in Page Designer without depending on an SFRA page type from another cartridge.

## Package structure

The component type is `commerce_assets.twoColumnImageCta` and lives in `app_custom_pd_components`. The custom editor `custom_pd.colorpicker` lives in the separate Business Manager cartridge `bm_custom_pd_components`.

```text
cartridges/
├── app_custom_pd_components/cartridge/
│   ├── experience/components/commerce_assets/
│   ├── experience/pages/
│   ├── scripts/experience/
│   ├── templates/default/experience/
│   └── static/default/
└── bm_custom_pd_components/cartridge/
    ├── experience/editors/custom_pd/
    └── static/default/experience/editors/custom_pd/
```

The storefront render and standalone test page do not require another cartridge. The visual color fields require `bm_custom_pd_components` to be deployed to the active code version and present on the Business Manager cartridge path.

## Color configuration

The component provides these SFRA theme presets:

- `theme_primary` / `theme_primary_inverse`
- `theme_heading` / `theme_heading_inverse`
- `theme_banner` / `theme_banner_text`
- `theme_background`
- `theme_text`
- `theme_link`
- `transparent`
- `custom`

When `custom` is selected, the following field supports a native color picker, an SFRA quick palette, and a validated manual value. Accepted values include hex, `rgb(...)`, `hsl(...)`, CSS color names, and safe CSS variables.

The editor stores `{ "value": "#0057B8" }`. Rendering also accepts a legacy string or `{ "color": "..." }` and falls back to the configured theme preset when no valid custom value exists.

## Installation

1. Deploy `app_custom_pd_components` and `bm_custom_pd_components` to the target code version.
2. Add `app_custom_pd_components` before `app_storefront_base` on the SFRA site cartridge path.
3. Add `bm_custom_pd_components` before `bm_app_storefront_base` on the Business Manager cartridge path.
4. In Page Designer, create a page using **Test · Two columns**.
5. Add **Two columns · Image, text and CTA** to its Main region.

Example using an existing B2C CLI configuration stored outside the repository:

```bash
b2c code deploy ./cartridges \
  --config /secure/path/dw.json \
  --code-version <TARGET_VERSION> \
  -c app_custom_pd_components \
  -c bm_custom_pd_components

b2c sites cartridges add app_custom_pd_components \
  --site-id RefArch \
  --position before \
  --target app_storefront_base \
  --config /secure/path/dw.json

b2c sites cartridges add bm_custom_pd_components \
  --bm \
  --position before \
  --target bm_app_storefront_base \
  --config /secure/path/dw.json
```

## Validation

From this directory:

```bash
npm test
```

The suite validates the Page Designer metadata, custom editor binding and resources, enum definitions, color and focal-point helpers, render model, and standalone test page.
