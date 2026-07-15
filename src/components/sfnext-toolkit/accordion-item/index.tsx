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
import type { ComponentPropsWithoutRef } from 'react';
import CollapsibleHtmlSection from '@/components/collapsible-section/collapsible-html-section';
import type { HtmlContentType } from '@/components/html-fragment/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';

/* v8 ignore start - decorator behavior is covered by metadata assertions */
@Component('accordionItem', {
    name: 'Accordion Item',
    description: 'A collapsible title and rich-text body intended for the SFNext Toolkit Accordion.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitAccordionItemMetadata {
    @AttributeDefinition({
        id: 'title',
        name: 'Title',
        description: 'Question or section title shown in the accordion trigger.',
        type: 'string',
        required: true,
    })
    title?: string;

    @AttributeDefinition({
        id: 'content',
        name: 'Content',
        description: 'Rich-text content revealed when the item is opened.',
        type: 'markup',
        required: true,
    })
    content?: string;

    @AttributeDefinition({
        id: 'contentStyle',
        name: 'Content style',
        description: 'Selects a safe presentation for normal text, a bullet list, or a two-column table.',
        type: 'enum',
        values: ['text', 'bulleted-list', 'table-2-column'],
        defaultValue: 'text',
    })
    contentStyle?: string;

    @AttributeDefinition({
        id: 'defaultOpen',
        name: 'Open by default',
        description: 'Displays this item expanded when the page first loads.',
        type: 'boolean',
        defaultValue: false,
    })
    defaultOpen?: boolean;
}
/* v8 ignore stop */

const CONTENT_TYPE: Record<string, HtmlContentType> = {
    text: 'plain-text',
    'bulleted-list': 'bulleted-list',
    'table-2-column': 'table-2-column',
};

function resolveContentType(value: string): HtmlContentType {
    return Object.prototype.hasOwnProperty.call(CONTENT_TYPE, value) ? CONTENT_TYPE[value] : CONTENT_TYPE.text;
}

export interface SFNextToolkitAccordionItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'content'> {
    title?: string;
    content?: string;
    contentStyle?: string;
    defaultOpen?: boolean;
    designMetadata?: unknown;
    component?: unknown;
    data?: unknown;
    regionId?: string;
}

/**
 * Portable accordion item backed by the storefront's existing native details/
 * summary implementation, retaining keyboard and assistive-technology support.
 */
export default function SFNextToolkitAccordionItem({
    title,
    content,
    contentStyle = 'text',
    defaultOpen = false,
    designMetadata: _designMetadata,
    component: _component,
    data: _data,
    regionId: _regionId,
    className,
    ...props
}: SFNextToolkitAccordionItemProps) {
    const resolvedTitle = title?.trim() || 'Accordion item';
    const resolvedContentType = resolveContentType(contentStyle);

    return (
        <div data-slot="sfnext-accordion-item" className={cn('w-full', className)} {...props}>
            <CollapsibleHtmlSection
                label={resolvedTitle}
                content={content ?? ''}
                contentType={resolvedContentType}
                defaultOpen={defaultOpen}
            />
        </div>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function AccordionItemFallback() {
    return (
        <div
            data-slot="sfnext-accordion-item-fallback"
            aria-hidden="true"
            className="flex w-full items-center justify-between border-b border-border py-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="size-5" />
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { AccordionItemFallback as fallback };
