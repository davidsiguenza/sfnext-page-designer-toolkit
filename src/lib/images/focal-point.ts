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

/**
 * Convert Page Designer focal-point values to CSS percentages.
 *
 * B2C library image objects use normalized values from 0 to 1, while some
 * runtime payloads expose percentages from 0 to 100. Supporting both keeps
 * imported and interactively selected images aligned the same way.
 */
export function focalPointToCss(value: number | string | undefined): string {
    if (value === undefined) return '50%';

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '50%';

    return `${numericValue >= 0 && numericValue <= 1 ? numericValue * 100 : numericValue}%`;
}
