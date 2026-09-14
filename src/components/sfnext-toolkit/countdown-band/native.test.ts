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
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const nativePath = 'cartridges/plugin_sfnext_page_designer/cartridge/rest-apis/pd-countdown/script.js';
const editorPath =
    'cartridges/plugin_sfnext_page_designer/cartridge/static/default/experience/editors/SFNextToolkit/countdownDate.js';
describe('Commerce serialization and authoring timezone', () => {
    it('reads current campaign dates each time, including a disabled or deleted campaign', () => {
        let campaign: object | null = {
            ID: 'BF',
            enabled: true,
            startDate: new Date('2026-11-27T00:00Z'),
            endDate: new Date('2026-11-28T00:00Z'),
        };
        const exports = {} as { getSchedule: () => void };
        let result: { status: string; start: number | null; end: number | null } = {
            status: 'unexecuted',
            start: null,
            end: null,
        };
        const setExpires = vi.fn();
        vm.runInNewContext(readFileSync(nativePath, 'utf8'), {
            exports,
            request: { httpParameterMap: { c_campaign_id: { stringValue: 'BF' } } },
            require: (name: string) =>
                name.includes('PromotionMgr')
                    ? { getCampaign: () => campaign }
                    : {
                          createSuccess: (value: typeof result) => ({
                              render: () => {
                                  result = value;
                              },
                          }),
                      },
            response: { setExpires },
        });
        exports.getSchedule();
        expect(result.start).toBe(Date.parse('2026-11-27T00:00Z'));
        campaign = { ID: 'BF', enabled: false, startDate: new Date(), endDate: new Date() };
        exports.getSchedule();
        expect(result).toMatchObject({ status: 'disabled', start: null, end: null });
        campaign = null;
        exports.getSchedule();
        expect(result.status).toBe('missing');
        expect(setExpires).toHaveBeenCalledWith(0);
    });
    it('applies winter/summer offsets and rejects DST gaps and repeated times', () => {
        const module = { exports: {} as { resolve: (local: string, zone: string) => string } };
        vm.runInNewContext(readFileSync(editorPath, 'utf8'), { module, Intl, Date });
        const resolve = module.exports.resolve;
        expect(resolve('2026-11-27T00:00', 'Europe/Madrid')).toBe('2026-11-26T23:00:00Z');
        expect(resolve('2026-08-27T00:00', 'Europe/Madrid')).toBe('2026-08-26T22:00:00Z');
        expect(() => resolve('2026-03-29T02:30', 'Europe/Madrid')).toThrow('no existe');
        expect(() => resolve('2026-10-25T02:30', 'Europe/Madrid')).toThrow('repetida');
        expect(resolve('2026-10-25T02:30', 'UTC+01:00')).toBe('2026-10-25T01:30:00Z');
    });
});
