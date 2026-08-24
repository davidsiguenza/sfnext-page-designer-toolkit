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
import type { LoaderFunctionArgs } from 'react-router';
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
import type { ShopperSearch } from '@/scapi';
import { fetchSearchProducts } from '@/lib/api/search.server';

const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 8;
const AUTHORING_ORIGIN = /^https:\/\/[a-z0-9-]+(?:\.dx)?\.commercecloud\.salesforce\.com$/i;

type ProductHit = ShopperSearch.schemas['ProductSearchHit'];

const imageUrl = (product: ProductHit): string | undefined =>
    product.image?.disBaseLink ||
    product.image?.link ||
    product.imageGroups?.[0]?.images?.[0]?.disBaseLink ||
    product.imageGroups?.[0]?.images?.[0]?.link;

function responseHeaders(origin: string | null): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        Vary: 'Origin',
    };
}

/** Public catalog lookup used only by the isolated Page Designer custom-editor iframe. */
export async function loader({ request, context }: LoaderFunctionArgs): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (origin && !AUTHORING_ORIGIN.test(origin) && origin !== new URL(request.url).origin) {
        return Response.json({ products: [], error: 'Origin not allowed.' }, { status: 403 });
    }

    const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, MAX_QUERY_LENGTH) ?? '';
    if (query.length < 2) {
        return Response.json(
            { products: [], error: 'Enter at least two characters.' },
            { status: 400, headers: responseHeaders(origin) }
        );
    }

    try {
        const currency = context.get(siteContext)?.currency ?? undefined;
        const result = await fetchSearchProducts(context, {
            q: query,
            limit: RESULT_LIMIT,
            offset: 0,
            ...(currency ? { currency } : {}),
        });
        const products = (result.hits ?? []).slice(0, RESULT_LIMIT).flatMap((product) => {
            const productId = product.productId?.trim();
            if (!productId) return [];
            const image = imageUrl(product);
            return [
                {
                    productId,
                    productName: product.productName?.trim() || productId,
                    ...(image ? { image } : {}),
                },
            ];
        });

        return Response.json({ products }, { headers: responseHeaders(origin) });
    } catch {
        return Response.json(
            { products: [], error: 'The catalog search failed. Use the standard product picker.' },
            { status: 502, headers: responseHeaders(origin) }
        );
    }
}
