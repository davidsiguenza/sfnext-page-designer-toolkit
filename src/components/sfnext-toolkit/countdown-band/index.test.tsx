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
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import CountdownBand, { type CountdownBandProps } from './index';

const design = vi.hoisted(() => ({ value: false }));
vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    usePageDesignerMode: () => ({ isDesignMode: design.value }),
}));
function mount(props: CountdownBandProps = {}) {
    return render(
        <MemoryRouter>
            <AllProvidersWrapper>
                <CountdownBand message="Black Friday" manualStart={{ value: '2026-11-27T00:00:00Z' }} {...props} />
            </AllProvidersWrapper>
        </MemoryRouter>
    );
}
describe('countdown band', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-26T23:59:58Z'));
        design.value = false;
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('shows both clocks independently and advances from start to end', () => {
        const { container } = mount({ showEnd: true, manualEnd: { value: '2026-11-28T00:00:00Z' } });
        expect(screen.getAllByRole('timer')).toHaveLength(2);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(container.querySelector('[data-countdown="start"]')).toBeNull();
        expect(container.querySelector('[data-countdown="end"]')).toBeInTheDocument();
    });
    it('supports the automatic start/end sequence', () => {
        const { container } = mount({
            showEnd: true,
            endAfterStart: true,
            manualEnd: { value: '2026-11-28T00:00:00Z' },
        });
        expect(container.querySelector('[data-countdown="end"]')).toBeNull();
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(container.querySelector('[data-countdown="end"]')).toBeInTheDocument();
    });
    it('hides at completion and releases its interval', () => {
        const { container, unmount } = mount();
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(container.querySelector('[data-slot="sfnext-toolkit-countdown-band"]')).toBeNull();
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
    it('can retain the completed message and zero counter', () => {
        mount({ hideElapsed: false, hideWhenComplete: false });
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.getByText('Ya ha empezado')).toBeInTheDocument();
        expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    });
    it('uses campaign data, never stale manually authored dates', () => {
        mount({
            source: 'campaign',
            showStart: false,
            showEnd: true,
            data: { status: 'ready', start: null, end: Date.parse('2026-12-01T00:00Z'), now: Date.now() },
        });
        expect(screen.getByRole('timer')).toHaveAttribute('datetime', '2026-12-01T00:00:00.000Z');
    });
    it('hides disabled campaigns but keeps them editable', () => {
        const { container, unmount } = mount({
            source: 'campaign',
            data: { status: 'disabled', start: 1, end: 2, now: Date.now() },
        });
        expect(container.querySelector('[data-slot="sfnext-toolkit-countdown-band"]')).toBeNull();
        unmount();
        design.value = true;
        mount({ source: 'campaign', data: { status: 'disabled', start: 1, end: 2, now: Date.now() } });
        expect(screen.getByRole('status')).toHaveTextContent('desactivada');
    });
    it('requires the CTA checkbox and blocks script links', () => {
        mount({ showCta: true, ctaLabel: 'Shop', ctaUrl: 'javascript:alert(1)' });
        expect(screen.queryByRole('link')).toBeNull();
    });
    it('renders a configured CTA with site-aware navigation', () => {
        mount({
            showCta: true,
            ctaLabel: 'Shop',
            ctaUrl: '/page/black-friday',
            ctaNewTab: true,
            height: 120,
            backgroundColor: { value: '#111111' },
        });
        expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('keeps the selected preview instant while the real clock advances', () => {
        const start = Date.parse('2026-11-27T00:00:00Z');
        mount({ data: { status: 'ready', start, end: null, now: Date.now(), previewNow: start - 60000 } });
        const initial = screen.getByRole('timer').textContent;
        act(() => {
            vi.advanceTimersByTime(120000);
        });
        expect(screen.getByRole('timer').textContent).toBe(initial);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('uses preview time for campaign phases and responds to a new preview date', () => {
        const start = Date.parse('2026-11-27T00:00:00Z');
        const end = Date.parse('2026-11-28T00:00:00Z');
        const content = (previewNow: number) => (
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CountdownBand
                        source="campaign"
                        message="Black Friday"
                        showStart
                        showEnd
                        endAfterStart
                        data={{ status: 'ready', start, end, now: Date.now(), previewNow }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        const { container, rerender } = render(content(start - 60000));
        expect(container.querySelector('[data-countdown="start"]')).toBeInTheDocument();
        expect(container.querySelector('[data-countdown="end"]')).toBeNull();
        rerender(content(start + 60000));
        expect(container.querySelector('[data-countdown="start"]')).toBeNull();
        expect(container.querySelector('[data-countdown="end"]')).toBeInTheDocument();
        rerender(content(end));
        expect(container.querySelector('[data-slot="sfnext-toolkit-countdown-band"]')).toBeNull();
        rerender(content(start - 60000));
        expect(container.querySelector('[data-countdown="start"]')).toBeInTheDocument();
    });

    it('resumes the real clock when leaving a dated preview', () => {
        const start = Date.parse('2026-11-27T00:00:00Z');
        const content = (previewNow?: number) => (
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CountdownBand data={{ status: 'ready', start, end: null, now: Date.now(), previewNow }} />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        const { rerender, container } = render(content(start - 60000));
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.getByRole('timer')).toBeInTheDocument();
        rerender(content());
        expect(container.querySelector('[data-slot="sfnext-toolkit-countdown-band"]')).toBeNull();
    });

    it('resolves native BM local dates in the browser and honors campaign phases even in mode EDIT', () => {
        design.value = true;
        const start = Date.parse('2026-11-27T00:00:00Z');
        const end = Date.parse('2026-11-28T00:00:00Z');
        const content = (previewLocal?: string) => (
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CountdownBand
                        showStart
                        showEnd
                        endAfterStart
                        data={{ status: 'ready', start, end, now: Date.now(), previewLocal }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        const { container, rerender } = render(content('2026-11-26T12:00:00'));
        const initial = screen.getByRole('timer').textContent;
        expect(container.querySelector('[data-countdown="end"]')).toBeNull();
        act(() => {
            vi.advanceTimersByTime(3600000);
        });
        expect(screen.getByRole('timer').textContent).toBe(initial);
        rerender(content('2026-11-27T12:00:00'));
        expect(container.querySelector('[data-countdown="start"]')).toBeNull();
        expect(container.querySelector('[data-countdown="end"]')).toBeInTheDocument();
        rerender(content('2026-12-01T12:00:00'));
        expect(container.querySelector('[data-slot="sfnext-toolkit-countdown-band"]')).toBeNull();
        rerender(content('2026-11-26T12:00:00'));
        expect(container.querySelector('[data-countdown="start"]')).toBeInTheDocument();
    });

    it('does not apply the server timezone or real date while rendering a local preview on the server', () => {
        const html = renderToString(
            <MemoryRouter>
                <AllProvidersWrapper>
                    <CountdownBand
                        data={{
                            status: 'ready',
                            start: Date.parse('2026-11-27T00:00:00Z'),
                            end: null,
                            now: Date.parse('2027-01-01T00:00:00Z'),
                            previewLocal: '2026-11-26T12:00:00',
                        }}
                    />
                </AllProvidersWrapper>
            </MemoryRouter>
        );
        expect(html).toContain('––');
        expect(html).toContain('role="timer"');
    });
});
