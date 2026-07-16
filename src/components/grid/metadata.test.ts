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
import { getRegionDefinitions } from '@/lib/decorators/region-definition';
import { TOOLKIT_CONTEXTUAL_COMPONENT_TYPE_EXCLUSIONS } from '@/components/sfnext-toolkit/authoring-constraints';
import { GridMetadata } from './index';

describe('Grid Page Designer metadata', () => {
    test('keeps contextual toolkit components out of every generic column', () => {
        expect(getRegionDefinitions(GridMetadata)).toEqual(
            Array.from({ length: 6 }, (_, index) =>
                expect.objectContaining({
                    id: `column_${index + 1}`,
                    componentTypeExclusions: TOOLKIT_CONTEXTUAL_COMPONENT_TYPE_EXCLUSIONS,
                })
            )
        );
    });
});
