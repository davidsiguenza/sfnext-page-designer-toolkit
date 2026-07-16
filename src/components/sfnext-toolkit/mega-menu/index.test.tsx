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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import MegaMenu from './index';

const pageDesignerMode = vi.hoisted(() => ({ isDesignMode: false, isPreviewMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@salesforce/storefront-next-runtime/design/react/core')>();
    return {
        ...actual,
        usePageDesignerMode: () => pageDesignerMode,
    };
});

vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
    };
});

describe('SFNext Toolkit Mega Menu owner', () => {
    beforeEach(() => {
        pageDesignerMode.isDesignMode = false;
        pageDesignerMode.isPreviewMode = false;
    });

    test.each([true, false])('never renders the root authoring canvas on a live page (enabled=%s)', (enabled) => {
        const { container } = render(
            <MegaMenu enabled={enabled}>
                <div>Preserved panel</div>
            </MegaMenu>
        );

        expect(container).toBeEmptyDOMElement();
    });

    test('keeps disabled panels editable in Page Designer design mode', () => {
        pageDesignerMode.isDesignMode = true;

        render(
            <MegaMenu enabled={false}>
                <div>Preserved panel</div>
            </MegaMenu>
        );

        expect(screen.getByRole('status')).toHaveAttribute('data-authoring-disabled', 'true');
        expect(screen.getByText('Preserved panel')).toBeInTheDocument();
        expect(screen.getByText(/enhancements are disabled/i)).toBeInTheDocument();
    });

    test('renders enabled content in Page Designer design mode', () => {
        pageDesignerMode.isDesignMode = true;

        render(
            <MegaMenu>
                <div>Active panel</div>
            </MegaMenu>
        );

        expect(screen.getByText('Active panel')).toBeInTheDocument();
    });

    test('renders the complete enabled authoring canvas in Page Designer preview mode', () => {
        pageDesignerMode.isPreviewMode = true;

        render(
            <MegaMenu>
                <div>Preview panel</div>
            </MegaMenu>
        );

        expect(screen.getByText('Preview panel')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('mirrors the disabled shopper state in Page Designer preview mode', () => {
        pageDesignerMode.isPreviewMode = true;

        const { container } = render(
            <MegaMenu enabled={false}>
                <div>Disabled preview panel</div>
            </MegaMenu>
        );

        expect(container).toBeEmptyDOMElement();
    });
});
