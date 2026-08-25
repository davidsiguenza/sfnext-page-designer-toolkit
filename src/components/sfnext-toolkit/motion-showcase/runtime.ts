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
import { MOTION_ITEM_SLOTS, type MotionValue } from './model';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
type ViewportHandler = (entry: IntersectionObserverEntry) => void;

const viewportHandlers = new Map<Element, ViewportHandler>();
let sharedViewportObserver: IntersectionObserver | undefined;

function getSharedViewportObserver(): IntersectionObserver | undefined {
    if (sharedViewportObserver) return sharedViewportObserver;
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') return undefined;

    sharedViewportObserver = new window.IntersectionObserver(
        (entries) => {
            for (const entry of entries) viewportHandlers.get(entry.target)?.(entry);
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.18 }
    );
    return sharedViewportObserver;
}

function observeViewport(element: HTMLElement, handler: ViewportHandler): (() => void) | undefined {
    try {
        const observer = getSharedViewportObserver();
        if (!observer) return undefined;

        viewportHandlers.set(element, handler);
        observer.observe(element);

        return () => {
            viewportHandlers.delete(element);
            observer.unobserve(element);
            if (viewportHandlers.size === 0) {
                observer.disconnect();
                sharedViewportObserver = undefined;
            }
        };
    } catch {
        return undefined;
    }
}

function collectMotionItems(element: HTMLElement): HTMLElement[] {
    return MOTION_ITEM_SLOTS.flatMap((slot) => {
        const item = element.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
        return item ? [item] : [];
    });
}

/**
 * Progressively enhances one server-rendered component. Without JavaScript the
 * data-motion-ready attribute is never added, so all content stays visible.
 */
export function activateMotion(element: HTMLElement, motion: MotionValue, disabled = false): () => void {
    const items = collectMotionItems(element);
    const mediaQuery =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(REDUCED_MOTION_QUERY)
            : undefined;
    let stopObserving: (() => void) | undefined;
    let animationFrame: number | undefined;

    const show = () => {
        element.dataset.motionVisible = 'true';
    };
    const hide = () => {
        delete element.dataset.motionVisible;
    };
    const stopViewportObservation = () => {
        stopObserving?.();
        stopObserving = undefined;
    };
    const revealOnFocus = () => {
        show();
        stopViewportObservation();
    };
    const revealForReducedMotion = (event: MediaQueryListEvent) => {
        if (!event.matches) return;
        element.dataset.motionReduced = 'true';
        show();
        stopViewportObservation();
    };

    element.dataset.motionInitialized = 'true';

    if (disabled || motion.effect === 'none' || mediaQuery?.matches) {
        if (mediaQuery?.matches) element.dataset.motionReduced = 'true';
        show();
    } else {
        items.forEach((item, index) => {
            item.dataset.motionItem = '';
            item.dataset.motionOrder = String(index);
        });
        element.addEventListener('focusin', revealOnFocus);
        if (mediaQuery) {
            if (typeof mediaQuery.addEventListener === 'function') {
                mediaQuery.addEventListener('change', revealForReducedMotion);
            } else {
                mediaQuery.addListener(revealForReducedMotion);
            }
        }

        element.dataset.motionReady = 'true';
        hide();

        if (motion.trigger === 'load') {
            element.getBoundingClientRect();
            const schedule =
                window.requestAnimationFrame ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
            animationFrame = schedule(show);
        } else {
            stopObserving = observeViewport(element, (entry) => {
                if (entry.isIntersecting) {
                    show();
                    if (!motion.replay) stopViewportObservation();
                } else if (motion.replay && !element.contains(document.activeElement)) {
                    hide();
                }
            });
            if (!stopObserving) show();
        }
    }

    return () => {
        if (animationFrame !== undefined) {
            if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(animationFrame);
            else window.clearTimeout(animationFrame);
        }
        stopViewportObservation();
        element.removeEventListener('focusin', revealOnFocus);
        if (mediaQuery) {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', revealForReducedMotion);
            } else {
                mediaQuery.removeListener(revealForReducedMotion);
            }
        }
        delete element.dataset.motionInitialized;
        delete element.dataset.motionReady;
        delete element.dataset.motionVisible;
        delete element.dataset.motionReduced;
        for (const item of items) {
            delete item.dataset.motionItem;
            delete item.dataset.motionOrder;
        }
    };
}
