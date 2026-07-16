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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { MegaMenuNavigateProvider, useMegaMenuNavigate } from './context';

function NavigateConsumer() {
    const onNavigate = useMegaMenuNavigate();
    return (
        <button type="button" onClick={onNavigate} data-has-handler={Boolean(onNavigate)}>
            Navigate
        </button>
    );
}

describe('mega menu navigation context', () => {
    test('is optional for standalone toolkit component rendering', async () => {
        const user = userEvent.setup();
        render(<NavigateConsumer />);

        const button = screen.getByRole('button', { name: 'Navigate' });
        expect(button).toHaveAttribute('data-has-handler', 'false');
        await expect(user.click(button)).resolves.toBeUndefined();
    });

    test('forwards navigation to the closest host callback', async () => {
        const user = userEvent.setup();
        const outer = vi.fn();
        const inner = vi.fn();
        render(
            <MegaMenuNavigateProvider onNavigate={outer}>
                <MegaMenuNavigateProvider onNavigate={inner}>
                    <NavigateConsumer />
                </MegaMenuNavigateProvider>
            </MegaMenuNavigateProvider>
        );

        const button = screen.getByRole('button', { name: 'Navigate' });
        expect(button).toHaveAttribute('data-has-handler', 'true');
        await user.click(button);
        expect(inner).toHaveBeenCalledOnce();
        expect(outer).not.toHaveBeenCalled();
    });
});
