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
import { describe, expect, test } from 'vitest';
import { DEFAULT_MOTION, normalizeMotion } from './model';

describe('SFNext Toolkit motion model', () => {
    test('preserves one complete versioned motion contract', () => {
        expect(
            normalizeMotion({
                version: 1,
                effect: 'slide_right',
                duration: 'fast',
                easing: 'standard',
                delay: 'long',
                sequence: 'together',
                stagger: 'tight',
                trigger: 'viewport',
                replay: true,
                injected: 'discarded',
            })
        ).toEqual({
            version: 1,
            effect: 'slide_right',
            duration: 'fast',
            easing: 'standard',
            delay: 'long',
            sequence: 'together',
            stagger: 'tight',
            trigger: 'viewport',
            replay: true,
        });
    });

    test('accepts serialized and legacy wrapped values', () => {
        const value = { ...DEFAULT_MOTION, effect: 'scale' as const };
        expect(normalizeMotion(JSON.stringify(value))).toEqual(value);
        expect(normalizeMotion({ value })).toEqual(value);
    });

    test('falls back safely for unknown versions and injection-shaped values', () => {
        expect(normalizeMotion(null)).toEqual(DEFAULT_MOTION);
        expect(normalizeMotion({ version: 99, effect: 'fade' })).toEqual(DEFAULT_MOTION);
        expect(
            normalizeMotion({
                version: 1,
                effect: 'fade; color:red',
                duration: '10000ms',
                easing: 'steps(99)',
                delay: '4s',
                sequence: 'random',
                stagger: 'calc(1s)',
                trigger: 'hover',
                replay: 'true',
            })
        ).toEqual(DEFAULT_MOTION);
    });

    test('allows replay only for an explicitly authored viewport trigger', () => {
        expect(normalizeMotion({ ...DEFAULT_MOTION, trigger: 'load', replay: true }).replay).toBe(false);
        expect(normalizeMotion({ ...DEFAULT_MOTION, trigger: undefined, replay: true }).replay).toBe(false);
    });
});
