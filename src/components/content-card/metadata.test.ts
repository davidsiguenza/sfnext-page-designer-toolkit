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
import { describe, test, expect } from 'vitest';
import 'reflect-metadata';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { ContentCardMetadata } from './index';

describe('ContentCardMetadata - PD default alignment', () => {
    test('showBackground has defaultValue: true matching React component default', () => {
        const metadata = getAttributeDefinitions(ContentCardMetadata.prototype);
        expect(metadata.fields.showBackground).toBeDefined();
        expect(metadata.fields.showBackground?.defaultValue).toBe(true);
    });

    test('showBorder has defaultValue: true matching React component default', () => {
        const metadata = getAttributeDefinitions(ContentCardMetadata.prototype);
        expect(metadata.fields.showBorder).toBeDefined();
        expect(metadata.fields.showBorder?.defaultValue).toBe(true);
    });
});
