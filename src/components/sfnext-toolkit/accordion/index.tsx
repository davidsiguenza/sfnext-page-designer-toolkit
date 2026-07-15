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
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Region, type ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

/* v8 ignore start - decorator behavior is covered by metadata assertions */
@Component('accordion', {
    name: 'Accordion',
    description: 'Groups merchant-authored accordion items for FAQs, delivery information, or product content.',
    group: 'SFNextToolkit',
})
@RegionDefinition([
    {
        id: 'items',
        name: 'Accordion items',
        description: 'Add up to 12 Accordion Item components.',
        maxComponents: 12,
        componentTypeInclusions: ['accordionItem'],
    },
])
export class SFNextToolkitAccordionMetadata {
    @AttributeDefinition({
        id: 'heading',
        name: 'Heading',
        description: 'Optional heading displayed above the accordion.',
        type: 'string',
    })
    heading?: string;

    @AttributeDefinition({
        id: 'intro',
        name: 'Introductory text',
        description: 'Optional supporting text displayed below the heading.',
        type: 'text',
    })
    intro?: string;

    @AttributeDefinition({
        id: 'maxWidth',
        name: 'Maximum width',
        description: 'Constrains the accordion while keeping it responsive.',
        type: 'enum',
        values: ['full', 'large', 'medium'],
        defaultValue: 'large',
    })
    maxWidth?: string;
}
/* v8 ignore stop */

const MAX_WIDTH_CLASS: Record<string, string> = {
    full: 'max-w-none',
    large: 'max-w-4xl',
    medium: 'max-w-2xl',
};

function resolveMaxWidthClass(value: string): string {
    return Object.prototype.hasOwnProperty.call(MAX_WIDTH_CLASS, value)
        ? MAX_WIDTH_CLASS[value]
        : MAX_WIDTH_CLASS.large;
}

export interface SFNextToolkitAccordionProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
    heading?: string;
    intro?: string;
    maxWidth?: string;
    children?: ReactNode;
    component?: ComponentType;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
    regionId?: string;
}

/**
 * Page Designer accordion container. Its nested region is deliberately limited
 * to SFNextToolkit.accordionItem so authored content remains structurally valid.
 */
export default function SFNextToolkitAccordion({
    heading,
    intro,
    maxWidth = 'large',
    children,
    component,
    designMetadata: _designMetadata,
    data: _data,
    regionId: _regionId,
    className,
    ...props
}: SFNextToolkitAccordionProps) {
    const widthClass = resolveMaxWidthClass(maxWidth);
    const resolvedHeading = heading?.trim();
    const resolvedIntro = intro?.trim();

    return (
        <section
            data-slot="sfnext-accordion"
            className={cn('w-full bg-background text-foreground', widthClass, 'mx-auto', className)}
            {...props}>
            {(resolvedHeading || resolvedIntro) && (
                <header data-slot="sfnext-accordion-header" className="mb-6">
                    {resolvedHeading && (
                        <h2 data-slot="sfnext-accordion-heading" className="text-2xl font-semibold tracking-tight">
                            {resolvedHeading}
                        </h2>
                    )}
                    {resolvedIntro && (
                        <p data-slot="sfnext-accordion-intro" className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            {resolvedIntro}
                        </p>
                    )}
                </header>
            )}

            <div data-slot="sfnext-accordion-items" className="border-t border-border">
                {component ? (
                    <Region component={component} regionId="items" errorElement={null} className="w-full" />
                ) : (
                    children
                )}
            </div>
        </section>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function AccordionFallback() {
    return (
        <section
            data-slot="sfnext-accordion-fallback"
            aria-hidden="true"
            className="mx-auto w-full max-w-4xl space-y-5">
            <Skeleton className="h-8 w-2/5" />
            <div className="divide-y divide-border border-y border-border">
                {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex items-center justify-between py-5">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="size-5" />
                    </div>
                ))}
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { AccordionFallback as fallback };
