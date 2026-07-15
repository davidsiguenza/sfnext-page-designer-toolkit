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
import { forwardRef, type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import HtmlFragment from '@/components/html-fragment';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const RICH_TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const;
const RICH_TEXT_WIDTHS = ['full', 'wide', 'narrow'] as const;
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4'] as const;
const CTA_STYLES = ['primary', 'secondary', 'outline', 'link'] as const;

type RichTextAlignment = (typeof RICH_TEXT_ALIGNMENTS)[number];
type RichTextWidth = (typeof RICH_TEXT_WIDTHS)[number];
type HeadingLevel = (typeof HEADING_LEVELS)[number];
type CtaStyle = (typeof CTA_STYLES)[number];
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

// eslint-disable-next-line react-refresh/only-export-components -- exported for consistent toolkit composition.
export const richTextVariants = cva('mx-auto flex w-full flex-col gap-4 text-foreground', {
    variants: {
        alignment: {
            left: 'items-start text-left',
            center: 'items-center text-center',
            right: 'items-end text-right',
        },
        width: {
            full: 'max-w-none',
            wide: 'max-w-5xl',
            narrow: 'max-w-3xl',
        },
    },
    defaultVariants: {
        alignment: 'left',
        width: 'wide',
    },
});

const CTA_VARIANT: Record<CtaStyle, ButtonVariant> = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline',
    link: 'link',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function hasAuthoredValue(value: string | undefined): value is string {
    return Boolean(value?.trim());
}

function getCtaLabel(label: string | undefined): string {
    return label?.trim() || 'Learn more';
}

/* v8 ignore start - decorator behavior is covered by the shared decorator tests. */
@Component('richText', {
    name: 'Rich Text',
    description: 'Editorial eyebrow, semantic heading, rich text, and optional call to action.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitRichTextMetadata {
    @AttributeDefinition({
        id: 'eyebrow',
        name: 'Eyebrow',
        description: 'Short label displayed above the heading.',
        type: 'string',
        required: false,
    })
    eyebrow?: string;

    @AttributeDefinition({
        id: 'heading',
        name: 'Heading',
        type: 'string',
        required: false,
    })
    heading?: string;

    @AttributeDefinition({
        id: 'headingLevel',
        name: 'Heading Level',
        description:
            'Semantic heading level. Use h1 once for a blank landing page; PLP and PDP templates already provide h1.',
        type: 'enum',
        values: [...HEADING_LEVELS],
        defaultValue: 'h2',
    })
    headingLevel?: string;

    @AttributeDefinition({
        id: 'content',
        name: 'Content',
        description: 'Formatted editorial copy managed with the Page Designer rich-text editor.',
        type: 'markup',
        required: false,
    })
    content?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Alignment',
        type: 'enum',
        values: [...RICH_TEXT_ALIGNMENTS],
        defaultValue: 'left',
    })
    alignment?: string;

    @AttributeDefinition({
        id: 'contentWidth',
        name: 'Content Width',
        type: 'enum',
        values: [...RICH_TEXT_WIDTHS],
        defaultValue: 'wide',
    })
    contentWidth?: string;

    @AttributeDefinition({
        id: 'ctaLabel',
        name: 'CTA Label',
        type: 'string',
        required: false,
    })
    ctaLabel?: string;

    @AttributeDefinition({
        id: 'ctaUrl',
        name: 'CTA URL',
        type: 'url',
        required: false,
    })
    ctaUrl?: string;

    @AttributeDefinition({
        id: 'ctaStyle',
        name: 'CTA Style',
        type: 'enum',
        values: [...CTA_STYLES],
        defaultValue: 'primary',
    })
    ctaStyle?: string;
}
/* v8 ignore stop */

export interface RichTextProps extends Omit<ComponentPropsWithoutRef<'div'>, 'content'> {
    eyebrow?: string;
    heading?: string;
    headingLevel?: HeadingLevel;
    content?: string;
    alignment?: RichTextAlignment;
    contentWidth?: RichTextWidth;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaStyle?: CtaStyle;

    // Page Designer plumbing is consumed here and must not leak onto the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export const RichText = forwardRef<HTMLDivElement, RichTextProps>(
    (
        {
            eyebrow,
            heading,
            headingLevel,
            content,
            alignment,
            contentWidth,
            ctaLabel,
            ctaUrl,
            ctaStyle,
            className,
            regionId: _regionId,
            component: _component,
            componentData: _componentData,
            designMetadata: _designMetadata,
            data: _data,
            ...props
        },
        ref
    ) => {
        const hasEyebrow = hasAuthoredValue(eyebrow);
        const hasHeading = hasAuthoredValue(heading);
        const hasContent = hasAuthoredValue(content);
        const safeCtaUrl = normalizeSafeLinkUrl(ctaUrl);
        const hasCta = Boolean(safeCtaUrl);

        if (!hasEyebrow && !hasHeading && !hasContent && !hasCta) return null;

        const resolvedAlignment = normalizeValue(alignment, RICH_TEXT_ALIGNMENTS, 'left');
        const resolvedWidth = normalizeValue(contentWidth, RICH_TEXT_WIDTHS, 'wide');
        const HeadingTag = normalizeValue(headingLevel, HEADING_LEVELS, 'h2') as ElementType;
        const resolvedCtaStyle = normalizeValue(ctaStyle, CTA_STYLES, 'primary');

        return (
            <div
                {...props}
                ref={ref}
                data-slot="sfnext-toolkit-rich-text"
                className={cn(richTextVariants({ alignment: resolvedAlignment, width: resolvedWidth }), className)}>
                {hasEyebrow && (
                    <p
                        data-slot="sfnext-toolkit-rich-text-eyebrow"
                        className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {eyebrow.trim()}
                    </p>
                )}
                {hasHeading && (
                    <HeadingTag
                        data-slot="sfnext-toolkit-rich-text-heading"
                        className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {heading.trim()}
                    </HeadingTag>
                )}
                {hasContent && (
                    <div data-slot="sfnext-toolkit-rich-text-content" className="w-full text-foreground">
                        <HtmlFragment
                            content={content}
                            className="text-base leading-7 text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-4 [&_ul]:list-disc"
                        />
                    </div>
                )}
                {hasCta && safeCtaUrl && (
                    <div data-slot="sfnext-toolkit-rich-text-actions" className="pt-1">
                        <Button asChild variant={CTA_VARIANT[resolvedCtaStyle]}>
                            <Link to={safeCtaUrl}>{getCtaLabel(ctaLabel)}</Link>
                        </Button>
                    </div>
                )}
            </div>
        );
    }
);

RichText.displayName = 'RichText';

export default RichText;

/** Stable loading state registered by the Page Designer component registry. */
export function RichTextFallback() {
    return (
        <div
            data-slot="sfnext-toolkit-rich-text-fallback"
            aria-hidden="true"
            className="mx-auto w-full max-w-5xl space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/5" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { RichTextFallback as fallback };
