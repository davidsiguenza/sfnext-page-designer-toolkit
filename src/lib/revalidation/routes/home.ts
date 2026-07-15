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
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { getActionPath, isAmbientMutation } from './shared';

/**
 * `shouldRevalidate` policy for the home page. The loader fetches only catalog and content data, so it opts out of
 * the post-action revalidation React Router runs by default — every non-navigating mutation submitted while the home
 * page is active (notably add-to-cart from the quick view modal) would otherwise re-issue its four fetches for no
 * observable change. The basket badge stays current on its own: the cart action returns the updated basket and sets
 * the `__sfdc_basket` cookie the basket provider reads client-side.
 *
 * The exceptions are the shared {@link isAmbientMutation} dimensions: a currency switch genuinely changes the
 * loader's output (per-currency SCAPI prices), shopper-context updates change every SCAPI response, and an auth
 * identity transition re-scopes the auth-dependent wishlist seed (below) — so they must be allowed through.
 * Navigations and explicit `useRevalidator().revalidate()` calls carry no `formMethod` and are suppressed too — a
 * fresh navigation to the route is a new match that runs the loader regardless of this gate, and the basket badge
 * stays current via its provider rather than this loader.
 *
 * Auth note: the loader's `fetchWishlistInitialState` is auth-dependent (a registered session seeds the
 * `WishlistProvider` with the shopper's saved items; a guest session seeds it empty). Login and logout from any
 * other page redirect to `/`, which re-matches the home route fresh and re-runs the loader. The one path that would
 * otherwise slip through is a logout submitted while already on `/`: the header posts to `/logout` and redirects back
 * to `/`, so the home route stays matched and React Router consults this gate. The shared identity dimension returns
 * `true` for it so the loader re-runs and re-seeds the wishlist for the now-guest session.
 * @see https://reactrouter.com/start/framework/route-module#shouldrevalidate
 */
export function shouldRevalidate({ currentUrl, formMethod, formAction }: ShouldRevalidateFunctionArgs): boolean {
    if (formMethod && formMethod !== 'GET') {
        const actionPath = getActionPath(formAction, currentUrl.origin);
        if (actionPath && isAmbientMutation(actionPath)) {
            return true;
        }
    }

    return false;
}
