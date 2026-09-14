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
export interface CountdownSchedule {
    status: 'ready' | 'missing' | 'disabled' | 'unavailable' | 'invalid';
    start: number | null;
    end: number | null;
    campaignId?: string;
}

export interface CountdownData extends CountdownSchedule {
    now: number;
    /** Fixed instant selected in Storefront Preview; absent for the live clock. */
    previewNow?: number;
    /** BM __siteDate, interpreted in the preview browser's timezone after hydration. */
    previewLocal?: string;
}

/** BM's On Date sends YYYYMMDDHHmm in the merchant browser's local timezone. */
export function parseSitePreviewDate(value: string | null): string | null {
    if (!value || !/^\d{12}$/.test(value)) return null;
    const local = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:00`;
    return parseDeadline(`${local}Z`) === null ? null : local;
}

/** Reject ambiguous local times and calendar rollover instead of guessing a timezone. */
export function parseDeadline(value: unknown): number | null {
    const raw = typeof value === 'string' ? value : (value as { value?: unknown } | null)?.value;
    if (typeof raw !== 'string') return null;
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(raw);
    if (!match) return null;
    const [, date, time, seconds = '00', offset] = match;
    const local = `${date}T${time}:${seconds}`;
    const wall = Date.parse(`${local}Z`);
    if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 19) !== local) return null;
    if (offset !== 'Z' && (Number(offset.slice(1, 3)) > 14 || Number(offset.slice(4)) > 59)) return null;
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? timestamp : null;
}

export function manualSchedule(start: unknown, end: unknown): CountdownSchedule {
    const result: CountdownSchedule = { status: 'ready', start: parseDeadline(start), end: parseDeadline(end) };
    if (result.start !== null && result.end !== null && result.end <= result.start) result.status = 'invalid';
    return result;
}

export function remaining(target: number, now: number) {
    let seconds = Math.max(0, Math.ceil((target - now) / 1000));
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    return { days, hours, minutes: Math.floor(seconds / 60), seconds: seconds % 60, expired: now >= target };
}

export function bounded(value: unknown, fallback: number, min: number, max: number): number {
    if (value === undefined || value === null || value === '') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

/** A closed CSS color grammar; no URLs, declarations or arbitrary expressions. */
export function color(value: unknown, fallback: string): string {
    const raw = typeof value === 'string' ? value : (value as { value?: unknown; color?: unknown } | null)?.value;
    if (typeof raw !== 'string') return fallback;
    if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(raw)) return raw;
    if (/^(?:rgb|rgba|hsl|hsla|oklch)\([\d.%,\s/+-]+\)$/i.test(raw)) return raw;
    if (/^(?:transparent|currentColor|black|white)$/i.test(raw)) return raw;
    if (/^var\(--[a-z\d-]+\)$/i.test(raw)) return raw;
    return fallback;
}
