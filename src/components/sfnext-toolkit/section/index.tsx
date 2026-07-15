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
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

const SECTION_SURFACES = ['transparent', 'background', 'muted', 'card', 'primary', 'secondary', 'accent'] as const;
const SECTION_SPACING = ['none', 'sm', 'md', 'lg', 'xl'] as const;
const SECTION_WIDTHS = ['full', 'contained', 'narrow'] as const;
const SECTION_ALIGNMENTS = ['left', 'center', 'right'] as const;

type SectionSurface = (typeof SECTION_SURFACES)[number];
type SectionSpacing = (typeof SECTION_SPACING)[number];
type SectionWidth = (typeof SECTION_WIDTHS)[number];
type SectionAlignment = (typeof SECTION_ALIGNMENTS)[number];

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const sectionVariants = cva('w-full', {
    variants: {
        surface: {
            transparent: 'bg-transparent text-foreground',
            background: 'bg-background text-foreground',
            muted: 'bg-muted text-foreground',
            card: 'bg-card text-card-foreground',
            primary: 'bg-primary text-primary-foreground',
            secondary: 'bg-secondary text-secondary-foreground',
            accent: 'bg-accent text-accent-foreground',
        },
        spacing: {
            none: 'py-0',
            sm: 'py-4 md:py-6',
            md: 'py-8 md:py-12',
            lg: 'py-12 md:py-16',
            xl: 'py-16 md:py-24',
        },
    },
    defaultVariants: {
        surface: 'transparent',
        spacing: 'md',
    },
});

const sectionContentVariants = cva('w-full', {
    variants: {
        width: {
            full: 'max-w-none',
            contained: 'mx-auto max-w-7xl px-4 md:px-8',
            narrow: 'mx-auto max-w-4xl px-4 md:px-8',
        },
        alignment: {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        },
    },
    defaultVariants: {
        width: 'contained',
        alignment: 'left',
    },
});

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

/* v8 ignore start - decorator behavior is covered by the shared decorator tests. */
@Component('section', {
    name: 'Section',
    description:
        'A token-based layout section with configurable width, spacing, surface, alignment, and an inner content region.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'content',
        name: 'Content',
        description: 'Components displayed inside this section.',
        componentTypeExclusions: ['section'],
    },
])
export class SFNextToolkitSectionMetadata {
    @AttributeDefinition({
        id: 'anchorId',
        name: 'Anchor ID',
        description: 'Optional HTML anchor used for links to this section. Do not include the # character.',
        type: 'string',
        required: false,
    })
    anchorId?: string;

    @AttributeDefinition({
        id: 'surface',
        name: 'Surface',
        description: 'Theme-token surface and its matching text color.',
        type: 'enum',
        values: [...SECTION_SURFACES],
        defaultValue: 'transparent',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'spacing',
        name: 'Vertical Spacing',
        description: 'Responsive space above and below the section content.',
        type: 'enum',
        values: [...SECTION_SPACING],
        defaultValue: 'md',
    })
    spacing?: string;

    @AttributeDefinition({
        id: 'contentWidth',
        name: 'Content Width',
        description: 'Maximum width of the inner content region.',
        type: 'enum',
        values: [...SECTION_WIDTHS],
        defaultValue: 'contained',
    })
    contentWidth?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Text Alignment',
        description: 'Default text alignment inherited by content in the section.',
        type: 'enum',
        values: [...SECTION_ALIGNMENTS],
        defaultValue: 'left',
    })
    alignment?: string;
}
/* v8 ignore stop */

export interface SectionProps
    extends Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
        Omit<VariantProps<typeof sectionVariants>, 'surface' | 'spacing'> {
    anchorId?: string;
    surface?: SectionSurface;
    spacing?: SectionSpacing;
    contentWidth?: SectionWidth;
    alignment?: SectionAlignment;
    children?: ReactNode;

    // Page Designer plumbing is consumed here and must not leak onto the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
    (
        {
            anchorId,
            surface,
            spacing,
            contentWidth,
            alignment,
            children,
            className,
            id,
            regionId: _regionId,
            component,
            componentData: _componentData,
            designMetadata: _designMetadata,
            data: _data,
            ...props
        },
        ref
    ) => {
        const resolvedSurface = normalizeValue(surface, SECTION_SURFACES, 'transparent');
        const resolvedSpacing = normalizeValue(spacing, SECTION_SPACING, 'md');
        const resolvedWidth = normalizeValue(contentWidth, SECTION_WIDTHS, 'contained');
        const resolvedAlignment = normalizeValue(alignment, SECTION_ALIGNMENTS, 'left');
        const resolvedId = anchorId?.trim() || id;

        return (
            <section
                {...props}
                ref={ref}
                id={resolvedId}
                data-slot="sfnext-toolkit-section"
                className={cn(sectionVariants({ surface: resolvedSurface, spacing: resolvedSpacing }), className)}>
                <div
                    data-slot="sfnext-toolkit-section-content"
                    className={sectionContentVariants({ width: resolvedWidth, alignment: resolvedAlignment })}>
                    {component ? (
                        <Region component={component} regionId="content" errorElement={children ?? null} />
                    ) : (
                        children
                    )}
                </div>
            </section>
        );
    }
);

Section.displayName = 'Section';

export default Section;

/** Stable loading state registered by the Page Designer component registry. */
export function SectionFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-section-fallback"
            aria-hidden="true"
            className="w-full bg-background py-8 md:py-12">
            <div className="mx-auto max-w-7xl space-y-4 px-4 md:px-8">
                <Skeleton className="h-8 w-2/5" />
                <Skeleton className="h-4 w-full max-w-3xl" />
                <Skeleton className="h-4 w-4/5 max-w-2xl" />
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { SectionFallback as fallback };
