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
import type { ShopperExperience } from '@/scapi';
import type { ComponentWithComponentData } from '@/lib/page-designer/component-loader.server';
import {
    extractMegaMenuFromHeader,
    HEADER_COMPONENT_ID,
    HEADER_MEGA_MENU_REGION_ID,
    MEGA_MENU_TYPE_ID,
} from './header-region';

type Component = ShopperExperience.schemas['Component'];

function headerWith(children: Component[], componentData?: Record<string, Promise<unknown>>, embedded = true) {
    return {
        id: HEADER_COMPONENT_ID,
        typeId: 'Layout.header',
        embedded,
        regions: [
            { id: 'announcement', components: [] },
            { id: HEADER_MEGA_MENU_REGION_ID, components: children },
        ],
        componentData,
    } as unknown as ComponentWithComponentData;
}

describe('standard Header mega-menu region projection', () => {
    test('extracts the toolkit child and forwards the owner component-data map by identity', () => {
        const featureData = Promise.resolve({ status: 'ready' });
        const componentData = { 'feature-1': featureData };
        const megaMenu = {
            id: 'authored-mega-menu-42',
            typeId: MEGA_MENU_TYPE_ID,
            data: { enabled: true },
            regions: [{ id: 'panels', components: [] }],
        } as unknown as Component;
        const header = headerWith(
            [{ id: 'unrelated', typeId: 'Other.component' } as Component, megaMenu],
            componentData
        );

        const extracted = extractMegaMenuFromHeader(header);

        expect(extracted).toEqual({ ...megaMenu, embedded: true, componentData });
        expect(extracted).not.toBe(megaMenu);
        expect(extracted?.componentData).toBe(componentData);
        expect(extracted?.componentData?.['feature-1']).toBe(featureData);
    });

    test('does not force embedded mode when the owner itself is an ordinary authoring subtree', () => {
        const megaMenu = { id: 'temporary-mega-menu', typeId: MEGA_MENU_TYPE_ID } as Component;

        expect(extractMegaMenuFromHeader(headerWith([megaMenu], undefined, false))).toMatchObject({
            id: 'temporary-mega-menu',
            embedded: false,
        });
    });

    test('returns null safely for a missing owner, region, or expected child type', () => {
        expect(extractMegaMenuFromHeader(null)).toBeNull();
        expect(
            extractMegaMenuFromHeader({
                id: HEADER_COMPONENT_ID,
                typeId: 'Layout.header',
            } as ComponentWithComponentData)
        ).toBeNull();
        expect(extractMegaMenuFromHeader(headerWith([]))).toBeNull();
        expect(
            extractMegaMenuFromHeader(
                headerWith([{ id: 'wrong-type', typeId: 'SFNextToolkit.megaMenuPanel' } as Component])
            )
        ).toBeNull();
    });

    test('does not treat a mega-menu child outside the official Header region as configured', () => {
        const header = {
            id: HEADER_COMPONENT_ID,
            typeId: 'Layout.header',
            regions: [
                {
                    id: 'announcement',
                    components: [{ id: 'wrong-region', typeId: MEGA_MENU_TYPE_ID }],
                },
            ],
        } as unknown as ComponentWithComponentData;

        expect(extractMegaMenuFromHeader(header)).toBeNull();
    });
});
