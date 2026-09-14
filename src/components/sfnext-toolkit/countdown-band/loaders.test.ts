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
import { describe, expect, it, vi } from 'vitest';
import { createApiClients } from '@/lib/api-clients.server';
import { loader } from './loaders';
const getSchedule = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-clients.server', () => ({ createApiClients: vi.fn(() => ({ pdCountdown: { getSchedule } })) }));
const args = (source: string) =>
    ({
        request: new Request('https://example.com/page/test'),
        params: {},
        context: {},
        componentData: {
            id: 'band',
            data: { source, campaign: { id: 'BF' }, manualStart: { value: '2026-11-27T00:00Z' } },
        },
    }) as unknown as LoaderFunctionArgs & { componentData: unknown };
describe('countdown component loader', () => {
    it('loads manual dates without a remote call', async () => {
        vi.mocked(createApiClients).mockClear();
        const data = await loader(args('manual'));
        expect(data.start).toBe(Date.parse('2026-11-27T00:00Z'));
        expect(createApiClients).not.toHaveBeenCalled();
    });
    it('reads native dates using the authenticated typed client', async () => {
        getSchedule.mockResolvedValue({ data: { status: 'ready', start: 123, end: 456 } });
        expect((await loader(args('campaign'))).end).toBe(456);
        expect(getSchedule).toHaveBeenCalledWith({ params: { query: { c_campaign_id: 'BF' } } });
    });
    it('does not invent manual fallback dates on service failures', async () => {
        getSchedule.mockRejectedValue(new Error('unavailable'));
        expect(await loader(args('campaign'))).toMatchObject({ status: 'unavailable', start: null, end: null });
    });

    it.each(['manual', 'campaign'])('uses the selected preview instant for %s dates', async (source) => {
        getSchedule.mockResolvedValue({ data: { status: 'ready', start: 123, end: 456 } });
        const input = args(source);
        input.request = new Request(
            'https://example.com/page/test?mode=PREVIEW&effectiveDateTime=2026-11-27T10%3A15%3A00.123%2B01%3A00'
        );
        const previewNow = Date.parse('2026-11-27T09:15:00.123Z');
        expect(await loader(input)).toMatchObject({ now: previewNow, previewNow });
    });

    it('supports Storefront Preview On Date without a Page Designer mode parameter', async () => {
        const input = args('manual');
        input.request = new Request('https://example.com/page/test?effectiveDateTime=2026-11-27T09:15:00Z');
        expect((await loader(input)).previewNow).toBe(Date.parse('2026-11-27T09:15:00Z'));
    });

    it.each(['manual', 'campaign'])(
        'reads the actual BM __siteDate for %s, preserving its local timezone',
        async (source) => {
            getSchedule.mockResolvedValue({ data: { status: 'ready', start: 123, end: 456 } });
            const input = args(source);
            input.request = new Request('https://example.com/page/test?mode=EDIT&__siteDate=202611261200');
            const data = await loader(input);
            expect(data.previewLocal).toBe('2026-11-26T12:00:00');
            expect(data.previewNow).toBeUndefined();
        }
    );

    it('gives the native BM date precedence over an old ISO qualifier', async () => {
        const input = args('manual');
        input.request = new Request(
            'https://example.com/page/test?__siteDate=202611261200&effectiveDateTime=2027-01-01T00:00Z'
        );
        expect(await loader(input)).toMatchObject({ previewLocal: '2026-11-26T12:00:00' });
    });

    it.each(['', '202602301200', 'not-a-date'])(
        'resets to the live clock for empty/invalid __siteDate: %s',
        async (value) => {
            const input = args('manual');
            input.request = new Request(
                `https://example.com/page/test?__siteDate=${value}&effectiveDateTime=2027-01-01T00:00Z`
            );
            const data = await loader(input);
            expect(data.previewLocal).toBeUndefined();
            expect(data.previewNow).toBeUndefined();
        }
    );

    it.each(['', 'not-a-date', '2026-11-27T10:15', '2026-02-30T10:15:00Z'])(
        'uses the live clock for an absent or invalid preview date: %s',
        async (date) => {
            const input = args('manual');
            input.request = new Request(
                `https://example.com/page/test?mode=PREVIEW&effectiveDateTime=${encodeURIComponent(date)}`
            );
            const before = Date.now();
            const data = await loader(input);
            expect(data.previewNow).toBeUndefined();
            expect(data.now).toBeGreaterThanOrEqual(before);
            expect(data.now).toBeLessThanOrEqual(Date.now());
        }
    );
});
