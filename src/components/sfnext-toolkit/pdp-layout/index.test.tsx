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
import { describe, expect, test, vi } from 'vitest';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { getAttributeDefinitions, getRegionDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import PdpLayout, { SFNextToolkitPdpLayoutMetadata } from './index';
import { DEFAULT_PDP_LAYOUT_CONFIG, getPdpLayoutConfigFromPage, normalizePdpLayoutConfig } from './config';

const mockPageDesignerMode = vi.hoisted(() => vi.fn(() => ({ isDesignMode: false, isPreviewMode: false })));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: mockPageDesignerMode,
}));

describe('SFNext Toolkit PDP layout', () => {
    test('publishes the merchant layout contract without nested regions', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitPdpLayoutMetadata)).toBe('SFNextToolkit.pdpLayout');

        const { fields } = getAttributeDefinitions(SFNextToolkitPdpLayoutMetadata.prototype);
        expect(fields.desktopColumnRatio).toMatchObject({
            values: ['50-50', '60-40', '65-35', '70-30'],
            defaultValue: '50-50',
        });
        expect(fields.mediaSide).toMatchObject({ values: ['left', 'right'], defaultValue: 'left' });
        expect(fields.galleryPresentation).toMatchObject({
            values: ['grid', 'strip', 'carousel'],
            defaultValue: 'grid',
        });
        expect(fields.stickyProductInfo).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(fields.enableProductNavigation).toMatchObject({ type: 'boolean', defaultValue: false });
        expect(getRegionDefinitions(SFNextToolkitPdpLayoutMetadata)).toEqual([]);
    });

    test('normalizes malformed Page Designer values to the legacy PDP defaults', () => {
        expect(
            normalizePdpLayoutConfig({
                desktopColumnRatio: 'constructor',
                mediaSide: '__proto__',
                galleryPresentation: 'unknown',
                stickyProductInfo: 'not-a-boolean',
                enableProductNavigation: null,
            })
        ).toEqual(DEFAULT_PDP_LAYOUT_CONFIG);
    });

    test('extracts and normalizes the single configuration component from a page', () => {
        const page = {
            id: 'flexible-pdp',
            typeId: 'sfnextToolkitFlexibleProductDetailPage',
            regions: [
                {
                    id: 'pdpLayout',
                    components: [
                        {
                            id: 'layout-1',
                            typeId: 'SFNextToolkit.pdpLayout',
                            data: {
                                desktopColumnRatio: '65-35',
                                mediaSide: 'right',
                                galleryPresentation: 'strip',
                                stickyProductInfo: 'true',
                                enableProductNavigation: 1,
                            },
                        },
                    ],
                },
            ],
        } as unknown as PageWithComponentData;

        expect(getPdpLayoutConfigFromPage(page)).toEqual({
            desktopColumnRatio: '65-35',
            mediaSide: 'right',
            galleryPresentation: 'strip',
            stickyProductInfo: true,
            enableProductNavigation: true,
        });
        expect(getPdpLayoutConfigFromPage(null)).toEqual(DEFAULT_PDP_LAYOUT_CONFIG);
    });

    test('renders an authoring summary in EDIT mode and no storefront markup otherwise', () => {
        const { container, rerender } = render(<PdpLayout desktopColumnRatio="70-30" stickyProductInfo />);
        expect(container).toBeEmptyDOMElement();

        mockPageDesignerMode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        rerender(<PdpLayout desktopColumnRatio="70-30" stickyProductInfo />);

        expect(screen.getByRole('region', { name: 'PDP layout configuration' })).toBeInTheDocument();
        expect(screen.getByText('70-30')).toBeInTheDocument();
        expect(screen.getByText('Sticky')).toBeInTheDocument();
    });
});
