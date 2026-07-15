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
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

const GRID_CLASSES = {
    '2': {
        equal: 'lg:grid-cols-2',
        '2-1': 'lg:grid-cols-[2fr_1fr]',
        '1-2': 'lg:grid-cols-[1fr_2fr]',
    },
    '3': {
        equal: 'lg:grid-cols-3',
        '2-1': 'lg:grid-cols-[2fr_1fr_1fr]',
        '1-2': 'lg:grid-cols-[1fr_2fr_1fr]',
    },
} as const;

const GAP_CLASSES = {
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
} as const;

const VERTICAL_ALIGN_CLASSES = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
} as const;

const NORMAL_ORDER_CLASSES = ['order-1', 'order-2', 'order-3'] as const;
const REVERSE_TWO_COLUMN_ORDER_CLASSES = ['order-2 lg:order-1', 'order-1 lg:order-2', 'order-3'] as const;
const REVERSE_THREE_COLUMN_ORDER_CLASSES = ['order-3 lg:order-1', 'order-2 lg:order-2', 'order-1 lg:order-3'] as const;
const COLUMN_COMPONENT_EXCLUSIONS = [
    'SFNextToolkit.responsiveColumns',
    'SFNextToolkit.section',
    'SFNextToolkit.accordionItem',
    'SFNextToolkit.categoryCard',
    'SFNextToolkit.promoCard',
    'SFNextToolkit.trustItem',
] as const;

type MobileOrder = 'normal' | 'reverse';

function normalizeOption<T extends Record<string, unknown>>(
    value: string | undefined,
    options: T,
    fallback: Extract<keyof T, string>
): Extract<keyof T, string> {
    return value && Object.prototype.hasOwnProperty.call(options, value)
        ? (value as Extract<keyof T, string>)
        : fallback;
}

/* v8 ignore start - decorators are verified through metadata assertions. */
@Component('responsiveColumns', {
    name: 'Responsive Columns',
    description:
        'Two or three responsive content columns with configurable proportions, spacing, alignment, and mobile order.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'column1',
        name: 'Column 1',
        description: 'Content for the first column.',
        componentTypeExclusions: [...COLUMN_COMPONENT_EXCLUSIONS],
    },
    {
        id: 'column2',
        name: 'Column 2',
        description: 'Content for the second column.',
        componentTypeExclusions: [...COLUMN_COMPONENT_EXCLUSIONS],
    },
    {
        id: 'column3',
        name: 'Column 3',
        description: 'Content shown only when the layout is configured for three columns.',
        componentTypeExclusions: [...COLUMN_COMPONENT_EXCLUSIONS],
    },
])
export class ResponsiveColumnsMetadata {
    @AttributeDefinition({
        name: 'Columns',
        description: 'Number of columns shown from the large breakpoint onwards.',
        type: 'enum',
        values: ['2', '3'],
        defaultValue: '2',
    })
    columns?: string;

    @AttributeDefinition({
        name: 'Column ratio',
        description: 'Relative column widths. In a three-column layout the third column remains one fraction wide.',
        type: 'enum',
        values: ['equal', '2-1', '1-2'],
        defaultValue: 'equal',
    })
    ratio?: string;

    @AttributeDefinition({
        name: 'Gap',
        description: 'Responsive spacing between columns.',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'md',
    })
    gap?: string;

    @AttributeDefinition({
        name: 'Vertical alignment',
        description: 'How column content aligns when columns have different heights.',
        type: 'enum',
        values: ['start', 'center', 'end', 'stretch'],
        defaultValue: 'stretch',
    })
    verticalAlign?: string;

    @AttributeDefinition({
        name: 'Mobile order',
        description: 'Keep the authored column order or reverse it on small screens.',
        type: 'enum',
        values: ['normal', 'reverse'],
        defaultValue: 'normal',
    })
    mobileOrder?: string;
}
/* v8 ignore stop */

export interface ResponsiveColumnsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    columns?: string;
    ratio?: string;
    gap?: string;
    verticalAlign?: string;
    mobileOrder?: string;
    column1?: ReactNode;
    column2?: ReactNode;
    column3?: ReactNode;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function ResponsiveColumns({
    columns,
    ratio,
    gap,
    verticalAlign,
    mobileOrder,
    column1,
    column2,
    column3,
    className,
    regionId: _regionId,
    component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: ResponsiveColumnsProps) {
    const resolvedColumns = normalizeOption(columns, GRID_CLASSES, '2');
    const resolvedRatio = normalizeOption(ratio, GRID_CLASSES['2'], 'equal');
    const resolvedGap = normalizeOption(gap, GAP_CLASSES, 'md');
    const resolvedVerticalAlign = normalizeOption(verticalAlign, VERTICAL_ALIGN_CLASSES, 'stretch');
    const resolvedMobileOrder: MobileOrder = mobileOrder === 'reverse' ? 'reverse' : 'normal';
    const authoredContent = [column1, column2, column3];
    const visibleColumnCount = resolvedColumns === '3' ? 3 : 2;
    const orderClasses =
        resolvedMobileOrder === 'normal'
            ? NORMAL_ORDER_CLASSES
            : resolvedColumns === '3'
              ? REVERSE_THREE_COLUMN_ORDER_CLASSES
              : REVERSE_TWO_COLUMN_ORDER_CLASSES;

    return (
        <div
            data-slot="sfnext-toolkit-responsive-columns"
            className={cn(
                'grid w-full grid-cols-1',
                GRID_CLASSES[resolvedColumns][resolvedRatio],
                GAP_CLASSES[resolvedGap],
                VERTICAL_ALIGN_CLASSES[resolvedVerticalAlign],
                className
            )}
            {...props}>
            {Array.from({ length: visibleColumnCount }, (_, index) => {
                const regionId = `column${index + 1}`;
                const regionClassName = cn('min-w-0', orderClasses[index]);

                return component ? (
                    <Region
                        key={regionId}
                        component={component}
                        regionId={regionId}
                        data-slot={`responsive-columns-${regionId}`}
                        className={regionClassName}
                        errorElement={authoredContent[index] ?? null}
                    />
                ) : (
                    <div key={regionId} data-slot={`responsive-columns-${regionId}`} className={regionClassName}>
                        {authoredContent[index]}
                    </div>
                );
            })}
        </div>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function ResponsiveColumnsFallback({ columns }: Pick<ResponsiveColumnsProps, 'columns'>) {
    const columnCount = columns === '3' ? 3 : 2;

    return (
        <div
            data-slot="sfnext-toolkit-responsive-columns-fallback"
            aria-hidden="true"
            className={cn('grid grid-cols-1 gap-4', columnCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
            {Array.from({ length: columnCount }, (_, index) => (
                <Skeleton key={index} className="min-h-48 w-full" />
            ))}
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { ResponsiveColumnsFallback as fallback };
