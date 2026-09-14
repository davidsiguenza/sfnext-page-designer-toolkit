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
import type { ShopperExperience } from '@/scapi';
import { createApiClients } from '@/lib/api-clients.server';
import { manualSchedule, parseDeadline, parseSitePreviewDate, type CountdownData } from './model';

/** Read the native campaign on the server; page manifests never freeze the campaign schedule. */
export async function loader(args: LoaderFunctionArgs & { componentData: unknown }): Promise<CountdownData> {
    const component = args.componentData as ShopperExperience.schemas['Component'];
    const attributes = (component.data ?? {}) as Record<string, unknown>;
    const search = new URL(args.request.url).searchParams;
    // BM sends __siteDate in the merchant browser's timezone. Keep that local
    // wall time for the client, rather than applying MRT's server timezone.
    // An explicit empty __siteDate is Reset and overrides any old ISO qualifier.
    const previewLocal = parseSitePreviewDate(search.get('__siteDate'));
    const previewNow = search.has('__siteDate') ? null : parseDeadline(search.get('effectiveDateTime'));
    const clock = previewLocal
        ? { now: Date.now(), previewLocal }
        : previewNow === null
          ? { now: Date.now() }
          : { now: previewNow, previewNow };
    if (attributes.source !== 'campaign') {
        return { ...manualSchedule(attributes.manualStart, attributes.manualEnd), ...clock };
    }
    const selection = attributes.campaign as { id?: string } | string | undefined;
    const id = typeof selection === 'string' ? selection : selection?.id;
    if (!id) return { status: 'missing', start: null, end: null, ...clock };
    try {
        const { data } = await createApiClients(args.context).pdCountdown.getSchedule({
            params: { query: { c_campaign_id: id } },
        });
        return { ...data, ...clock };
    } catch {
        // Authoring displays the diagnostic; shoppers never see an invented deadline.
        return { status: 'unavailable', start: null, end: null, ...clock };
    }
}
