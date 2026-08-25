# SFRA Page Designer components

This directory contains standalone Page Designer components for the Salesforce B2C Commerce SFRA runtime. They are deliberately isolated from the Storefront Next toolkit at the repository root:

- Storefront Next components require matching React/MRT implementations.
- SFRA components render with B2C server-side JavaScript, ISML, and storefront static assets.
- The root Storefront Next cartridge generation and deployment commands do not include this directory.

## Available components

- [Two-column image, text, and CTA](./two-column-image-cta/README.md) — equal-size cropped images with focal points, optional title bands, merchant-selectable theme/custom colors, and bottom-aligned CTA buttons.

Run, deploy, and version each package from its own directory.
