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
import { describe, expect, it } from 'vitest';
import { color, manualSchedule, parseDeadline, remaining } from './model';

describe('countdown schedule', () => {
    it('represents the same instant across offsets', () => {
        expect(parseDeadline({ value: '2026-11-27T00:00:00+01:00' })).toBe(Date.parse('2026-11-26T23:00:00Z'));
        expect(parseDeadline('2026-11-27T01:00:00+02:00')).toBe(Date.parse('2026-11-26T23:00:00Z'));
    });
    it.each([
        '2026-11-27T00:00',
        '2026-02-30T00:00:00Z',
        '2026-01-01T25:00:00Z',
        '',
        'invalid',
        '2026-01-01T00:00:00+20:00',
    ])('rejects invalid or ambiguous date %s', (value) => {
        expect(parseDeadline(value)).toBeNull();
    });
    it('validates start and end order and permits one-sided countdowns', () => {
        expect(manualSchedule('2026-11-28T00:00Z', '2026-11-27T00:00Z').status).toBe('invalid');
        expect(manualSchedule(null, '2026-11-27T00:00Z').status).toBe('ready');
    });
    it('uses absolute time after a suspended tab and clamps at zero', () => {
        expect(remaining(90061000, 0)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, expired: false });
        expect(remaining(90061000, 90060999).seconds).toBe(1);
        expect(remaining(90061000, 90061000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        expect(remaining(1, 100000).seconds).toBe(0);
    });
    it('rejects style injection while retaining authored colors', () => {
        expect(color({ value: '#103c33' }, 'fallback')).toBe('#103c33');
        expect(color('red; background:url(https://example.com)', 'fallback')).toBe('fallback');
        expect(color('var(--primary)', 'fallback')).toBe('var(--primary)');
    });
});
