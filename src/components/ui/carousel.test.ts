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
import { shouldHandleCarouselArrowKey } from './carousel';

describe('carousel keyboard navigation target', () => {
    test('does not steal arrow keys from native media and interactive controls', () => {
        const carousel = document.createElement('div');
        const video = document.createElement('video');
        const button = document.createElement('button');
        const buttonIcon = document.createElement('span');
        button.append(buttonIcon);
        carousel.append(video, button);

        expect(shouldHandleCarouselArrowKey(video, carousel)).toBe(false);
        expect(shouldHandleCarouselArrowKey(buttonIcon, carousel)).toBe(false);
    });

    test('keeps carousel arrow navigation for its own surface', () => {
        const carousel = document.createElement('div');
        const nonInteractiveSlide = document.createElement('div');
        carousel.append(nonInteractiveSlide);

        expect(shouldHandleCarouselArrowKey(carousel, carousel)).toBe(true);
        expect(shouldHandleCarouselArrowKey(nonInteractiveSlide, carousel)).toBe(true);
    });
});
