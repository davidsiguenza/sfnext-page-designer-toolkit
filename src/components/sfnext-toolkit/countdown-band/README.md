# Countdown Band

`SFNextToolkit.countdownBand` is a full-container-width countdown band for **Storefront Next Page Designer**. It supports manual deadlines or the current start/end dates of a native B2C Commerce campaign, independent start/end counters, merchant styling, and an optional CTA.

## Add and configure

In Page Designer, drag **SFNextToolkit → Countdown Band · Cuenta atrás** into a compatible content region. The band works in ordinary page content, Section, Responsive Columns, and the Header announcement region where the host allows general toolkit blocks. Its width follows its container; its configured height is a minimum so wrapped text stays readable on mobile.

| Setting                           | Behavior                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Band text                         | Main message, such as “Black Friday”.                                                                                                   |
| Date source                       | `manual` or `campaign`.                                                                                                                 |
| Commerce campaign                 | Select from the current site's campaign list. The saved value contains its ID; dates are fetched again when the component loads. |
| Manual start / end                | Date, time, and IANA timezone, for example `Europe/Madrid`. The editor stores an unambiguous UTC instant.                               |
| Show start / show end             | Independent checkboxes: one counter or both.                                                                                            |
| Show end only after start         | When selected, the end counter appears once the campaign begins. Otherwise both selected counters can appear together.                  |
| Start / end / completed labels    | Editable labels for each phase.                                                                                                         |
| Hide each elapsed counter         | Remove a counter after its deadline. Disable to keep zero and its completed label.                                                      |
| Hide the whole band when complete | Hide after the last selected deadline.                                                                                                  |
| Show seconds                      | Switch between days/hours/minutes and days/hours/minutes/seconds.                                                                       |
| Minimum height                    | 32–480 px; content can increase the rendered height.                                                                                    |
| Text / numeral size               | 12–64 px / 16–72 px.                                                                                                                    |
| Font / weight / alignment         | Site font, sans, serif, or mono; 400–700 weight; left, center, or right.                                                                |
| Colors                            | Background, text, and CTA background/text through visual color editors.                                                                 |
| CTA                               | Optional label, safe destination, and new-tab behavior. Site and locale prefixes use the host's Link component.                         |

Authoring labels are currently Spanish. Timer units cover Spanish, English, Portuguese, French, German, and Italian, with English fallback.

A Commerce campaign does not inherently have a storefront URL. Configure the CTA separately with the campaign landing page or category. Changing a campaign's dates updates the band on its next load. Reopen the component editor to refresh the campaign selector's list.

Disabled, missing, invalid, or unavailable campaigns do not produce public countdowns. Normal editing displays a configuration notice. Manual date entry rejects daylight-saving gaps and ambiguous repeated hours; choose an explicit offset such as `UTC+01:00` to select a repeated hour.

## Native “On Date” preview

Business Manager's **Site Preview Settings → On Date → Apply** sends `__siteDate=YYYYMMDDHHmm`. For example, `202611261200` means 26 November 2026 at 12:00 in the **editor browser's timezone**, matching Business Manager's interpretation.

The loader preserves that local date. Server rendering displays dashes until hydration resolves it in the browser's timezone; the MRT server's timezone is never substituted. A valid preview date freezes the countdown at the selected instant. Changing the date recalculates the component, and resetting it returns to the live clock.

Native full-store preview also uses `mode=EDIT`. With a selected date, the band follows the simulated campaign phase, including switching counters and hiding completed bands, instead of retaining expired counters for editing. This applies to both manual and campaign dates.

The alternate `effectiveDateTime` parameter remains supported for ISO timestamps with an explicit timezone, but it is **not** what this Business Manager panel sends. If `__siteDate` is present, it takes precedence; an empty or invalid value resets to the live clock. This component only consumes the preview time for its own display; it does not configure pricing or shopper-context qualifiers.

After installing a newer MRT bundle, reload the whole Page Designer screen and apply the date again. No component recreation is required.

## Install in another project

The repository already includes the component, generated metadata, custom editors, campaign API, and generated typed client. For an existing Storefront Next project, merge these paths:

- [`src/components/sfnext-toolkit/countdown-band/`](./): React, loader, model, tests, and stories.
- [`src/extensions/page-designer-toolkit/metadata/editors/SFNextToolkit/`](../../../extensions/page-designer-toolkit/metadata/editors/SFNextToolkit/): `campaignPicker`, `countdownDate`, and `countdownColor` source definitions and server scripts.
- [`cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/`](../../../../cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/): matching JavaScript, `countdownColor.css`, and `countdownEditor.css`.
- [`cartridges/plugin_sfnext_page_designer/cartridge/rest-apis/pd-countdown/`](../../../../cartridges/plugin_sfnext_page_designer/cartridge/rest-apis/pd-countdown/): `api.json`, `schema.yaml`, and `script.js`.

The host must provide `@/components/link`, `@/lib/decorators`, `@/lib/utils`, the Page Designer mode provider, the component-data loader, and [`../safe-link-url.ts`](../safe-link-url.ts). Keep the request URL intact when collecting component data so `__siteDate` reaches the loader. Add `countdownBand` and the three editor files to the generator's public metadata contract if merging into an older toolkit.

Generate the typed client in the destination, preserving its other custom clients:

```sh
pnpm exec sfnext scapi add \
  --schema cartridges/plugin_sfnext_page_designer/cartridge/rest-apis/pd-countdown/schema.yaml \
  --name pdCountdown --base-path /custom/pd-countdown/v1
pnpm cartridge:generate
pnpm cartridge:validate
pnpm build
```

The campaign API uses **ShopperToken** with the reusable **`c_pdcountdown`** scope. Add that scope to the target SLAS client while retaining its existing scopes. If the destination deliberately uses another existing custom scope, update the API schema and regenerate the client so the deployed schema and SLAS configuration agree. Manual dates require no campaign API request.

Deploy the `plugin_sfnext_page_designer` cartridge and the matching MRT build. The plugin must be on both the storefront site's and Business Manager's cartridge paths so the runtime endpoint and authoring editors are available. Use the [toolkit installation/deployment guide](../../../../cartridges/plugin_sfnext_page_designer/README.md#install-in-another-storefront-next-project) for the host setup; configure the target instance, code version, site, and MRT project in that project's own ignored configuration.

The endpoint is `GET /custom/pd-countdown/v1/organizations/{organizationId}/schedule?siteId={siteId}&c_campaign_id={campaignId}`. It uses `PromotionMgr.getCampaign` in the request's site context and returns only campaign ID, status, and start/end timestamps. No SFRA controller or storefront ISML template is required.

## Black Friday walkthrough

Create an enabled test campaign for 27 November 2026 00:00 through 30 November 2026 23:59 in Europe/Madrid. Enable both counters on a band and select that campaign. A manual band using those same dates should agree with it.

With the browser in Europe/Madrid:

| On Date                 | Expected result                                         |
| ----------------------- | ------------------------------------------------------- |
| 26 November 2026, 12:00 | 12 hours to start; 4 days, 11 hours, 59 minutes to end. |
| 28 November 2026, 12:00 | Start elapsed; 2 days, 11 hours, 59 minutes to end.     |
| 1 December 2026, 12:00  | Band hidden when “hide when complete” is selected.      |
| Reset                   | Current real time; counters advance each second.        |

Wait several seconds at each simulated date: the figures must stay fixed. Change the preview backward as well as forward. These dates are examples, not installed campaign data; choose future dates for a new demo.

## Development and maintenance

- [React implementation](./index.tsx), [loader](./loaders.ts), [date model](./model.ts).
- [Storybook examples](./index.stories.tsx), including fixed before/during/after preview states that remain useful after the example campaign ends.
- [Generated metadata](../../../../cartridges/plugin_sfnext_page_designer/cartridge/experience/components/SFNextToolkit/countdownBand.json); edit decorators and regenerate rather than editing this JSON directly.

```sh
pnpm exec vitest run src/components/sfnext-toolkit/countdown-band src/lib/page-designer/collect-component-data.server.test.ts
pnpm exec eslint src/components/sfnext-toolkit/countdown-band --max-warnings 0
pnpm cartridge:validate
pnpm storybook
```

Tests cover campaign serialization, date parsing, daylight-saving rules, visibility phases, native `__siteDate`, hydration, date changes without remounting, and return to live time. Live counters update locally each second without repeated Commerce requests. Timer markup avoids announcing every second to screen readers, and there is no animation dependency.

If campaign mode is blank, check campaign status/dates, the API registration, cartridge paths, and SLAS scope; manual mode can isolate an API configuration issue. If preview still shows today's time, confirm the active MRT bundle contains this loader and the request includes `__siteDate`, then reload Page Designer.
