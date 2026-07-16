/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Route } from './+types/_empty.preview.component';
import { isDesignModeActive, isPreviewModeActive } from '@salesforce/storefront-next-runtime/design/mode';
import { injectIntoPreviewRegion } from '@/lib/page-designer/preview-page.server';
import { PREVIEW_REGION_ID } from '@/lib/page-designer/preview-page';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { Region } from '@/components/region';
import { fetchComponentWithMegaMenuFeatureData } from '@/components/sfnext-toolkit/mega-menu-feature/loaders';

/**
 * Mini-PD component-preview route.
 *
 * Renders a single existing Page Designer component standalone inside the
 * chrome-free `_empty` layout, for the mini-PD "Edit in focused visual canvas"
 * iframe. It is NOT a public storefront page:
 *  - It is gated on the Page Designer design param — it renders only when the
 *    request is in EDIT or PREVIEW mode (`?mode=EDIT|PREVIEW`), and 404s otherwise.
 *  - It emits `robots: noindex,nofollow` (see `meta`).
 *
 * The loader fetches the component by `componentId`, synthesizes a Page-shaped
 * object that hosts it in a `preview` region, and renders it via the existing
 * `<Region page={…}>` path — no changes to the render pipeline are required.
 */

// Page Designer metadata for this route. The 26.7 runtime used by the demo sandbox
// does not yet accept the 26.8 `preview` page-type property, so this compatibility
// build intentionally leaves that optional decorator field unset. The route remains
// available to the Storefront Next authoring surface. The region id is written as a
// string literal (not PREVIEW_REGION_ID) because `sfnext generate-cartridge` parses
// this decorator statically and cannot resolve an imported identifier — it must stay
// equal to PREVIEW_REGION_ID, which the loader and component render against.
@PageType({
    name: 'Component Preview',
    description: 'Standalone preview of a single Page Designer component for the focused visual canvas',
    supportedAspectTypes: [],
})
@RegionDefinition([
    {
        id: 'preview',
        name: 'preview',
        description: 'Hosts the single component being previewed',
    },
])
export class PreviewComponentMetadata {}

// Mini-PD preview is an internal authoring surface — never index or follow it.
export const meta: Route.MetaFunction = () => [{ name: 'robots', content: 'noindex,nofollow' }];

export async function loader(args: Route.LoaderArgs) {
    const { request } = args;

    // Gate: only render inside Page Designer EDIT/PREVIEW; otherwise this route does not exist.
    if (!isDesignModeActive(request) && !isPreviewModeActive(request)) {
        throw new Response('Not Found', { status: 404 });
    }

    const componentId = new URL(request.url).searchParams.get('componentId');
    if (!componentId) {
        throw new Response('Not Found', { status: 404 });
    }

    // The shared helper remains a generic component fetch for every other type,
    // but batches any nested Mega Menu Feature children when the focused block is
    // the toolkit owner. Content-block instance IDs are authored by Page Designer,
    // so they cannot be recognized through one hard-coded singleton ID.
    const component = await fetchComponentWithMegaMenuFeatureData(args, componentId);
    if (!component) {
        throw new Response('Not Found', { status: 404 });
    }

    return { page: injectIntoPreviewRegion(component, args) };
}

// A default component export is REQUIRED so React Router treats this as a document
// route and bubbles the thrown 404 Response to root's branded ErrorBoundary, rather
// than emitting a bare resource-route response (same idiom as `_empty.$.tsx`).
export default function PreviewComponentRoute({ loaderData }: Route.ComponentProps) {
    return <Region page={loaderData.page} regionId={PREVIEW_REGION_ID} />;
}
