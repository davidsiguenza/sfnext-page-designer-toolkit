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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */
import type { CSSProperties } from 'react';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { normalizeInteger } from '@/components/product-list/config';
import PromoCard, { PromoCardFallback, type PromoCardProps } from '@/components/sfnext-toolkit/promo-card';
import { cn } from '@/lib/utils';
import type { Image } from '@/types';

const COLUMN_SPAN_CLASSES = {
    '1': 'sm:col-span-1',
    '2': 'sm:col-span-2',
    full: 'sm:col-span-full',
} as const;

const MOBILE_SPAN_CLASSES = {
    '1': 'col-span-1',
    '2': 'col-span-2',
} as const;

const ROW_SPAN_CLASSES = {
    '1': 'row-span-1',
    '2': 'row-span-2',
} as const;

type EditorialColumnSpan = keyof typeof COLUMN_SPAN_CLASSES;
type EditorialMobileSpan = keyof typeof MOBILE_SPAN_CLASSES;
type EditorialRowSpan = keyof typeof ROW_SPAN_CLASSES;

function normalizeOption<T extends string>(value: unknown, options: Record<T, string>, fallback: T): T {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(options, value) ? (value as T) : fallback;
}

// eslint-disable-next-line react-refresh/only-export-components
export function normalizeEditorialCardPosition(position: unknown): number {
    return normalizeInteger(position, 4, 0, 99);
}

/* v8 ignore start - decorators are covered by metadata assertions. */
@Component('editorialCard', {
    name: 'PLP Editorial Card',
    description: 'Shoppable editorial interlink inserted at a deterministic position in a merchandising grid.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class EditorialCardMetadata {
    @AttributeDefinition({
        id: 'position',
        name: 'Position after product',
        description: 'Insert after this many products. Use 0 to place the card before the first product.',
        type: 'integer',
        defaultValue: 4,
    })
    position?: number;

    @AttributeDefinition({
        id: 'columnSpan',
        name: 'Desktop column span',
        description: 'Number of desktop grid columns occupied by the editorial card.',
        type: 'enum',
        values: ['1', '2', 'full'],
        defaultValue: '2',
    })
    columnSpan?: string;

    @AttributeDefinition({
        id: 'mobileColumnSpan',
        name: 'Mobile column span',
        description: 'Occupy one or both columns in the mobile product grid.',
        type: 'enum',
        values: ['1', '2'],
        defaultValue: '2',
    })
    mobileColumnSpan?: string;

    @AttributeDefinition({
        id: 'rowSpan',
        name: 'Row span',
        description: 'Use two rows for a taller editorial treatment.',
        type: 'enum',
        values: ['1', '2'],
        defaultValue: '1',
    })
    rowSpan?: string;

    @AttributeDefinition({ name: 'Eyebrow', description: 'Optional short label displayed above the title.' })
    eyebrow?: string;

    @AttributeDefinition({ name: 'Title', description: 'Editorial card heading.' })
    title?: string;

    @AttributeDefinition({
        name: 'Description',
        description: 'Supporting editorial copy.',
        type: 'text',
    })
    description?: string;

    @AttributeDefinition({
        id: 'imageUrl',
        name: 'Image',
        description: 'Editorial image selected from the content library.',
        type: 'image',
    })
    imageUrl?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image alternative text',
        description: 'Describe informative imagery. If empty, the title is used.',
    })
    imageAlt?: string;

    @AttributeDefinition({
        id: 'decorativeImage',
        name: 'Decorative image',
        description: 'Enable when the image adds no information beyond the text.',
        type: 'boolean',
        defaultValue: false,
    })
    decorativeImage?: boolean;

    @AttributeDefinition({
        id: 'buttonText',
        name: 'Link label',
        description: 'Accessible label for the editorial interlink.',
    })
    buttonText?: string;

    @AttributeDefinition({
        id: 'buttonLink',
        name: 'Link destination',
        description: 'Product, category, landing page or other safe destination.',
        type: 'url',
    })
    buttonLink?: string;

    @AttributeDefinition({
        id: 'layout',
        name: 'Content layout',
        description: 'Place content below the image or over it in a readable panel.',
        type: 'enum',
        values: ['stacked', 'overlay'],
        defaultValue: 'overlay',
    })
    layout?: string;

    @AttributeDefinition({
        id: 'ctaStyle',
        name: 'Link style',
        description: 'Semantic storefront treatment for the link.',
        type: 'enum',
        values: ['primary', 'secondary', 'outline', 'link'],
        defaultValue: 'link',
    })
    ctaStyle?: string;
}
/* v8 ignore stop */

export interface EditorialCardProps
    extends Pick<
        PromoCardProps,
        | 'eyebrow'
        | 'title'
        | 'description'
        | 'imageUrl'
        | 'imageAlt'
        | 'decorativeImage'
        | 'buttonText'
        | 'buttonLink'
        | 'layout'
        | 'ctaStyle'
        | 'className'
    > {
    position?: number | string;
    columnSpan?: EditorialColumnSpan;
    mobileColumnSpan?: EditorialMobileSpan;
    rowSpan?: EditorialRowSpan;
    style?: CSSProperties;
}

export default function EditorialCard({
    position,
    columnSpan,
    mobileColumnSpan,
    rowSpan,
    className,
    style,
    ...cardProps
}: EditorialCardProps) {
    const resolvedColumnSpan = normalizeOption(columnSpan, COLUMN_SPAN_CLASSES, '2');
    const resolvedMobileSpan = normalizeOption(mobileColumnSpan, MOBILE_SPAN_CLASSES, '2');
    const resolvedRowSpan = normalizeOption(rowSpan, ROW_SPAN_CLASSES, '1');
    const normalizedPosition = normalizeEditorialCardPosition(position);

    return (
        <PromoCard
            {...cardProps}
            data-slot="sfnext-toolkit-editorial-card"
            data-editorial-position={normalizedPosition}
            loading="lazy"
            className={cn(
                'min-h-full',
                MOBILE_SPAN_CLASSES[resolvedMobileSpan],
                COLUMN_SPAN_CLASSES[resolvedColumnSpan],
                ROW_SPAN_CLASSES[resolvedRowSpan],
                className
            )}
            style={style}
        />
    );
}

/** Stable loading state used by the component registry. */
export function EditorialCardFallback({
    columnSpan,
    mobileColumnSpan,
    rowSpan,
}: Pick<EditorialCardProps, 'columnSpan' | 'mobileColumnSpan' | 'rowSpan'> = {}) {
    const resolvedColumnSpan = normalizeOption(columnSpan, COLUMN_SPAN_CLASSES, '2');
    const resolvedMobileSpan = normalizeOption(mobileColumnSpan, MOBILE_SPAN_CLASSES, '2');
    const resolvedRowSpan = normalizeOption(rowSpan, ROW_SPAN_CLASSES, '1');

    return (
        <div
            className={cn(
                MOBILE_SPAN_CLASSES[resolvedMobileSpan],
                COLUMN_SPAN_CLASSES[resolvedColumnSpan],
                ROW_SPAN_CLASSES[resolvedRowSpan]
            )}>
            <PromoCardFallback />
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { EditorialCardFallback as fallback };
