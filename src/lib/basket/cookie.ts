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
import type { BasketSnapshot } from '@/middlewares/basket.server';

// Shared between the basket middleware (server) and BasketProvider (client).
// Kept in a neutral module to avoid a server → client import cycle.
export const BASKET_COOKIE_NAME = '__sfdc_basket';

const basketCookieRegExp = new RegExp(`(?:^|;\\s*)${BASKET_COOKIE_NAME}=([^;]+)`);

// Non-negative safe-integer guard for snapshot counts. `Number.isFinite` alone would let -1 or values past 2^53
// (where double precision starts collapsing adjacent integers) through and surface in the UI; the writer
// (`defaultCreateSnapshot`) only ever emits non-negative safe integers, so anything else is malformed or tampered.
const isNonNegativeSafeInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

// Printable-ASCII guard for the snapshot's string fields (`basketId`, `lastModified`). SFCC `basketId` values are
// UUID-style ASCII and `lastModified` is ISO-8601 ASCII; the writer never emits anything else. A non-ASCII value
// arriving on the read side means either (a) the client decoder misread a non-ASCII payload as Latin-1 Mojibake
// (see ASCII-only pipeline limits below), or (b) cookie tampering. Either way, refuse the value: a corrupted id
// flowing into a downstream basket fetch would target the wrong (or no) basket, and control bytes could become a
// vector for downstream string handling.
const ASCII_PRINTABLE = /^[\x20-\x7E]+$/;

/**
 * Validates that an arbitrary value matches the {@link BasketSnapshot} shape.
 *
 * Returns the value as a `BasketSnapshot` when it has a non-empty string `basketId` and non-negative integer
 * `totalItemCount` and `uniqueProductCount`. Returns `null` for everything else (wrong type, missing required field,
 * `NaN`, `Infinity`, negative count, fractional count, etc.). A missing `lastModified` is tolerated (cookies written
 * before that field existed) and normalized to `''`; a present but non-string or non-ASCII `lastModified` is rejected.
 *
 * Shared between the client cookie reader (`parseBasketCookie`) and the server basket middleware so that
 * a malformed or tampered cookie can never surface in the UI as e.g. `"NaN items"` regardless of which
 * code path read it.
 */
export function validateBasketSnapshot(value: unknown): BasketSnapshot | null {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const candidate = value as Partial<BasketSnapshot>;
    if (
        typeof candidate.basketId !== 'string' ||
        !candidate.basketId ||
        !ASCII_PRINTABLE.test(candidate.basketId) ||
        // Guard the numeric fields: Reject the snapshot rather than serving a corrupt value (malformed cookie,
        // tampering, or future writer regression). Non-negative safe integers only — the writer never emits
        // anything else, and a tampered `-5` would render as "-5 items" / a `1e20` would overflow the badge.
        !isNonNegativeSafeInteger(candidate.totalItemCount) ||
        !isNonNegativeSafeInteger(candidate.uniqueProductCount) ||
        // `lastModified` is tolerated as absent (a cookie written before this field existed) and normalized to ''
        // below — rejecting it would discard otherwise-valid cookies on the first read after a deploy. When present
        // it must be a string, and when non-empty it must be ASCII (the writer only ever emits ASCII ISO-8601);
        // a present non-string or non-ASCII value indicates tampering or an incompatible writer revision.
        (candidate.lastModified !== undefined &&
            (typeof candidate.lastModified !== 'string' ||
                (candidate.lastModified !== '' && !ASCII_PRINTABLE.test(candidate.lastModified))))
    ) {
        return null;
    }
    // Normalize a missing `lastModified` to '' so the returned value satisfies the required-string field.
    return { ...candidate, lastModified: candidate.lastModified ?? '' } as BasketSnapshot;
}

/**
 * Extracts the basket snapshot from a raw `Cookie` header string.
 *
 * Decodes the format produced by the basket middleware (`basket.server.ts`) via React Router's `createCookie`:
 * `decodeURIComponent → atob → JSON.parse`. Returns `null` when the cookie is absent, decoding fails, or the
 * parsed value fails the {@link validateBasketSnapshot} shape check.
 *
 * # ASCII-only snapshot assumption
 *
 * The current BasketSnapshot payload — `basketId` (SFCC UUID-style), `totalItemCount`, `uniqueProductCount` — is
 * guaranteed ASCII. For an ASCII payload, React Router's `createCookie` pipeline
 *   JSON.stringify → encodeURIComponent → myUnescape → btoa → encodeURIComponent
 * collapses to a plain `btoa(JSON.stringify(...))` post-decode: `myUnescape` round-trips ASCII to itself, so after
 * `atob` the bytes are already the original JSON. The decoder below therefore only inverts the outer wrapping and
 * the base64 layer — no Latin-1-to-Unicode bridge step.
 *
 * If the snapshot is ever extended with a field that may contain non-ASCII content (display names, product titles,
 * custom attributes, localized strings, emoji, non-breaking spaces, currency symbols, …) the shortcut stops being
 * correct: `btoa` on the writer side will throw `InvalidCharacterError` for raw non-ASCII, and any writer that uses
 * the full RR pipeline will produce bytes this decoder mis-reads as Mojibake. In that case the reader must invert the
 * full pipeline (`decodeURIComponent → atob → myEscape → decodeURIComponent → JSON.parse`) using React Router's
 * `myEscape`/`myUnescape` helpers.
 *
 * @see {@link https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/cookies.ts}
 */
export function parseBasketCookie(cookieHeader: string): BasketSnapshot | null {
    const match = cookieHeader.match(basketCookieRegExp);
    if (!match) {
        return null;
    }
    try {
        const decoded = decodeURIComponent(match[1]);
        return validateBasketSnapshot(JSON.parse(atob(decoded)));
    } catch {
        return null;
    }
}
