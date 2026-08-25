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

export const MOTION_OPTIONS = {
    effect: ['none', 'fade', 'fade_up', 'slide_left', 'slide_right', 'scale'],
    duration: ['fast', 'standard', 'slow'],
    easing: ['standard', 'enter', 'exit', 'emphasized'],
    delay: ['none', 'short', 'medium', 'long'],
    sequence: ['together', 'stagger'],
    stagger: ['tight', 'standard', 'relaxed'],
    trigger: ['load', 'viewport'],
} as const;

export type MotionEffect = (typeof MOTION_OPTIONS.effect)[number];
export type MotionDuration = (typeof MOTION_OPTIONS.duration)[number];
export type MotionEasing = (typeof MOTION_OPTIONS.easing)[number];
export type MotionDelay = (typeof MOTION_OPTIONS.delay)[number];
export type MotionSequence = (typeof MOTION_OPTIONS.sequence)[number];
export type MotionStagger = (typeof MOTION_OPTIONS.stagger)[number];
export type MotionTrigger = (typeof MOTION_OPTIONS.trigger)[number];

export interface MotionValue {
    version: 1;
    effect: MotionEffect;
    duration: MotionDuration;
    easing: MotionEasing;
    delay: MotionDelay;
    sequence: MotionSequence;
    stagger: MotionStagger;
    trigger: MotionTrigger;
    replay: boolean;
}

export const DEFAULT_MOTION: MotionValue = {
    version: 1,
    effect: 'fade_up',
    duration: 'standard',
    easing: 'enter',
    delay: 'none',
    sequence: 'stagger',
    stagger: 'standard',
    trigger: 'viewport',
    replay: false,
};

export const MOTION_ITEM_SLOTS = [
    'sfnext-toolkit-media-content-media',
    'sfnext-toolkit-media-content-eyebrow',
    'sfnext-toolkit-media-content-heading',
    'sfnext-toolkit-media-content-copy',
    'sfnext-toolkit-media-content-actions',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

function parseMotionValue(value: unknown): Record<string, unknown> | undefined {
    let parsed = value;

    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value) as unknown;
        } catch {
            return undefined;
        }
    }

    if (!isRecord(parsed)) return undefined;

    if (!('version' in parsed) && 'value' in parsed) {
        return parseMotionValue(parsed.value);
    }

    return parsed;
}

function allowValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
    return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Normalizes untrusted Page Designer custom-editor data into the public v1 motion contract. */
export function normalizeMotion(value: unknown): MotionValue {
    const source = parseMotionValue(value);
    if (!source || Number(source.version) !== 1) return { ...DEFAULT_MOTION };

    const trigger = allowValue(source.trigger, MOTION_OPTIONS.trigger, DEFAULT_MOTION.trigger);

    return {
        version: 1,
        effect: allowValue(source.effect, MOTION_OPTIONS.effect, DEFAULT_MOTION.effect),
        duration: allowValue(source.duration, MOTION_OPTIONS.duration, DEFAULT_MOTION.duration),
        easing: allowValue(source.easing, MOTION_OPTIONS.easing, DEFAULT_MOTION.easing),
        delay: allowValue(source.delay, MOTION_OPTIONS.delay, DEFAULT_MOTION.delay),
        sequence: allowValue(source.sequence, MOTION_OPTIONS.sequence, DEFAULT_MOTION.sequence),
        stagger: allowValue(source.stagger, MOTION_OPTIONS.stagger, DEFAULT_MOTION.stagger),
        trigger,
        replay: source.trigger === 'viewport' && source.replay === true,
    };
}
