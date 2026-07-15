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

export const PLP_IMAGE_DEBUG_QUERY_PARAM = 'debugPlpImages';

export function isPlpImageDebugEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get(PLP_IMAGE_DEBUG_QUERY_PARAM) === '1';
}

export function logPlpImageDebug(event: 'resolved' | 'loaded' | 'error', payload: Record<string, unknown>): void {
    if (!isPlpImageDebugEnabled()) return;

    const requestedViewType = String(payload.requestedViewType ?? 'unknown');
    const imageUrl = String(payload.renderedCurrentSrc ?? payload.sourcePassedToDynamicImage ?? 'none');

    // Deliberately bypass the production log-level gate: the merchant explicitly opted in via URL.
    // eslint-disable-next-line no-console
    console.info(`[PLP image debug] ${event} | type=${requestedViewType} | url=${imageUrl}`, payload);
}
