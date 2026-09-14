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
import type { Meta, StoryObj } from '@storybook/react-vite';
import CountdownBand from './index';
const schedule = {
    status: 'ready' as const,
    start: Date.parse('2026-11-27T00:00:00+01:00'),
    end: Date.parse('2026-11-30T23:59:00+01:00'),
    now: Date.parse('2026-11-20T10:00Z'),
    previewNow: Date.parse('2026-11-20T10:00Z'),
};
const meta: Meta<typeof CountdownBand> = {
    title: 'SFNextToolkit/CountdownBand',
    component: CountdownBand,
    args: {
        message: 'BLACK FRIDAY',
        source: 'manual',
        data: schedule,
        showStart: true,
        showEnd: true,
        manualStart: { value: '2026-11-27T00:00:00+01:00' },
        manualEnd: { value: '2026-11-30T23:59:00+01:00' },
        hideWhenComplete: false,
        hideElapsed: false,
        backgroundColor: { value: '#152d28' },
        textColor: { value: '#ffffff' },
        showCta: true,
        ctaLabel: 'Descubre la colección',
        ctaUrl: '/category/root',
        ctaBackground: { value: '#e5f5ae' },
        ctaColor: { value: '#152d28' },
    },
};
export default meta;
type Story = StoryObj<typeof CountdownBand>;
export const BothCounters: Story = {};
export const StartOnly: Story = { args: { showEnd: false, height: 80 } };
export const EndOnly: Story = {
    args: { showStart: false, backgroundColor: { value: '#ece8e2' }, textColor: { value: '#222222' }, showCta: false },
};
export const Campaign: Story = {
    args: {
        source: 'campaign',
        data: schedule,
    },
};
export const NativePreviewBefore: Story = {
    args: { data: { ...schedule, previewLocal: '2026-11-26T12:00:00' }, hideElapsed: true },
};
export const NativePreviewDuring: Story = {
    args: { data: { ...schedule, previewLocal: '2026-11-28T12:00:00' }, hideElapsed: true },
};
export const NativePreviewCompleted: Story = {
    args: {
        data: { ...schedule, previewLocal: '2026-12-01T12:00:00' },
        hideWhenComplete: false,
        hideElapsed: false,
    },
};
