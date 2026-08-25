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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_MOTION, MOTION_ITEM_SLOTS } from './model';
import { activateMotion } from './runtime';

class MockIntersectionObserver {
    static instances: MockIntersectionObserver[] = [];

    readonly observed = new Set<Element>();
    readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        MockIntersectionObserver.instances.push(this);
    }

    observe = vi.fn((element: Element) => this.observed.add(element));
    unobserve = vi.fn((element: Element) => this.observed.delete(element));
    disconnect = vi.fn(() => this.observed.clear());
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = '0px 0px -10% 0px';
    thresholds = [0.18];

    notify(element: Element, isIntersecting: boolean) {
        this.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], this);
    }
}

function createMotionElement(): HTMLElement {
    const root = document.createElement('article');
    for (const slot of MOTION_ITEM_SLOTS) {
        const child = document.createElement('div');
        child.dataset.slot = slot;
        root.appendChild(child);
    }
    document.body.appendChild(root);
    return root;
}

function mockMediaQuery(matches: boolean) {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
        matches,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) =>
            listeners.add(listener)
        ),
        removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) =>
            listeners.delete(listener)
        ),
        addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
        removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
        dispatchEvent: vi.fn(),
    };
    vi.stubGlobal(
        'matchMedia',
        vi.fn(() => mediaQuery)
    );
    return { mediaQuery, listeners };
}

describe('SFNext Toolkit motion runtime', () => {
    beforeEach(() => {
        document.body.replaceChildren();
        MockIntersectionObserver.instances = [];
        vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
        mockMediaQuery(false);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('uses one shared viewport observer and reveals the registered components', () => {
        const first = createMotionElement();
        const second = createMotionElement();
        const cleanFirst = activateMotion(first, DEFAULT_MOTION);
        const cleanSecond = activateMotion(second, { ...DEFAULT_MOTION, replay: true });

        expect(MockIntersectionObserver.instances).toHaveLength(1);
        expect(first).toHaveAttribute('data-motion-ready', 'true');
        expect(first.querySelectorAll('[data-motion-item]')).toHaveLength(MOTION_ITEM_SLOTS.length);

        const observer = MockIntersectionObserver.instances[0];
        observer.notify(first, true);
        observer.notify(second, true);
        expect(first).toHaveAttribute('data-motion-visible', 'true');
        expect(second).toHaveAttribute('data-motion-visible', 'true');

        observer.notify(second, false);
        expect(second).not.toHaveAttribute('data-motion-visible');

        cleanFirst();
        cleanSecond();
        expect(observer.disconnect).toHaveBeenCalled();
    });

    test('reveals focused content and stops replay from hiding it', () => {
        const root = createMotionElement();
        const focusable = document.createElement('button');
        root.appendChild(focusable);
        const cleanup = activateMotion(root, { ...DEFAULT_MOTION, replay: true });
        const observer = MockIntersectionObserver.instances[0];

        focusable.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        observer.notify(root, false);

        expect(root).toHaveAttribute('data-motion-visible', 'true');
        expect(observer.unobserve).toHaveBeenCalledWith(root);
        cleanup();
    });

    test('keeps content visible and observer-free for reduced motion or authoring mode', () => {
        mockMediaQuery(true);
        const reduced = createMotionElement();
        const authoring = createMotionElement();
        const cleanReduced = activateMotion(reduced, DEFAULT_MOTION);
        const cleanAuthoring = activateMotion(authoring, DEFAULT_MOTION, true);

        expect(reduced).toHaveAttribute('data-motion-visible', 'true');
        expect(reduced).toHaveAttribute('data-motion-reduced', 'true');
        expect(reduced).not.toHaveAttribute('data-motion-ready');
        expect(authoring).not.toHaveAttribute('data-motion-ready');
        expect(MockIntersectionObserver.instances).toHaveLength(0);

        cleanReduced();
        cleanAuthoring();
    });

    test('reveals load-triggered motion on the next frame and cancels pending work on cleanup', () => {
        const root = createMotionElement();
        let scheduled: FrameRequestCallback | undefined;
        const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
            scheduled = callback;
            return 42;
        });
        const cancelAnimationFrame = vi.fn();
        vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
        vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

        const cleanup = activateMotion(root, { ...DEFAULT_MOTION, trigger: 'load' });

        expect(root).toHaveAttribute('data-motion-ready', 'true');
        expect(root).not.toHaveAttribute('data-motion-visible');
        expect(requestAnimationFrame).toHaveBeenCalledOnce();

        scheduled?.(0);
        expect(root).toHaveAttribute('data-motion-visible', 'true');

        cleanup();
        expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
        expect(root).not.toHaveAttribute('data-motion-ready');
        expect(root.querySelectorAll('[data-motion-item]')).toHaveLength(0);
    });

    test('fails open without IntersectionObserver and responds to reduced-motion changes', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const fallback = createMotionElement();
        const cleanFallback = activateMotion(fallback, DEFAULT_MOTION);
        expect(fallback).toHaveAttribute('data-motion-visible', 'true');
        cleanFallback();

        vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
        const { listeners } = mockMediaQuery(false);
        const reduced = createMotionElement();
        const cleanReduced = activateMotion(reduced, DEFAULT_MOTION);
        const observer = MockIntersectionObserver.instances.at(-1);

        for (const listener of listeners) listener({ matches: true } as MediaQueryListEvent);

        expect(reduced).toHaveAttribute('data-motion-visible', 'true');
        expect(reduced).toHaveAttribute('data-motion-reduced', 'true');
        expect(observer?.unobserve).toHaveBeenCalledWith(reduced);
        cleanReduced();
    });
});
