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
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { cva } from 'class-variance-authority';
import { Gift, Info, Megaphone, Sparkles, Tag, Truck, type LucideIcon } from 'lucide-react';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';

const PROMO_ICONS = {
    megaphone: Megaphone,
    sparkles: Sparkles,
    tag: Tag,
    delivery: Truck,
    gift: Gift,
    info: Info,
} satisfies Record<string, LucideIcon>;

const PROMO_ICON_NAMES = ['none', 'megaphone', 'sparkles', 'tag', 'delivery', 'gift', 'info'] as const;
const PROMO_TONES = ['primary', 'secondary', 'accent', 'muted'] as const;
const PROMO_SIZES = ['sm', 'md', 'lg'] as const;
const PROMO_ALIGNMENTS = ['left', 'center', 'right'] as const;

type PromoIconName = (typeof PROMO_ICON_NAMES)[number];
type PromoTone = (typeof PROMO_TONES)[number];
type PromoSize = (typeof PROMO_SIZES)[number];
type PromoAlignment = (typeof PROMO_ALIGNMENTS)[number];

const promoStripVariants = cva('w-full px-4', {
    variants: {
        tone: {
            primary: 'bg-primary text-primary-foreground',
            secondary: 'bg-secondary text-secondary-foreground',
            accent: 'bg-accent text-accent-foreground',
            muted: 'bg-muted text-foreground',
        },
        size: {
            sm: 'py-2 text-xs',
            md: 'py-3 text-sm',
            lg: 'py-4 text-base',
        },
    },
    defaultVariants: {
        tone: 'primary',
        size: 'md',
    },
});

const ALIGNMENT_CLASS: Record<PromoAlignment, string> = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
};

function normalizeValue<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function normalizeIcon(value: string | undefined): PromoIconName {
    return normalizeValue(value, PROMO_ICON_NAMES, 'megaphone');
}

/* v8 ignore start - decorator behavior is covered by metadata assertions. */
@Component('promoStrip', {
    name: 'Promo Strip',
    description:
        'A compact, static announcement with a predefined icon and an optional safe link. Ideal for shipping, campaign or service messages.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitPromoStripMetadata {
    @AttributeDefinition({
        id: 'message',
        name: 'Message',
        description: 'Short announcement shown across the strip.',
        type: 'string',
        required: true,
    })
    message?: string;

    @AttributeDefinition({
        id: 'linkLabel',
        name: 'Link label',
        description: 'Optional descriptive link label. It is shown only when a safe destination is also configured.',
        type: 'string',
    })
    linkLabel?: string;

    @AttributeDefinition({
        id: 'linkUrl',
        name: 'Link destination',
        description: 'Optional internal or external destination. Unsafe script and data protocols are rejected.',
        type: 'url',
    })
    linkUrl?: string;

    @AttributeDefinition({
        id: 'icon',
        name: 'Icon',
        description: 'Safe predefined icon. Select None to show text only.',
        type: 'enum',
        values: ['none', 'megaphone', 'sparkles', 'tag', 'delivery', 'gift', 'info'],
        defaultValue: 'megaphone',
    })
    icon?: string;

    @AttributeDefinition({
        id: 'tone',
        name: 'Tone',
        description: 'Semantic storefront color pairing used for the strip background and content.',
        type: 'enum',
        values: ['primary', 'secondary', 'accent', 'muted'],
        defaultValue: 'primary',
    })
    tone?: string;

    @AttributeDefinition({
        id: 'size',
        name: 'Size',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'md',
    })
    size?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Alignment',
        type: 'enum',
        values: ['left', 'center', 'right'],
        defaultValue: 'center',
    })
    alignment?: string;
}
/* v8 ignore stop */

export interface PromoStripProps extends ComponentPropsWithoutRef<'div'> {
    message?: string;
    linkLabel?: string;
    linkUrl?: string;
    icon?: PromoIconName;
    tone?: PromoTone;
    size?: PromoSize;
    alignment?: PromoAlignment;

    // Page Designer runtime props are consumed here and never forwarded to the DOM.
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

export default function PromoStrip({
    message,
    linkLabel,
    linkUrl,
    icon,
    tone,
    size,
    alignment,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: PromoStripProps) {
    const { isDesignMode } = usePageDesignerMode();
    const authoredMessage = message?.trim();
    const isAuthoringEmpty = isDesignMode && !authoredMessage;

    if (!authoredMessage && !isDesignMode) return null;

    const resolvedIcon = normalizeIcon(icon);
    const Icon = resolvedIcon === 'none' ? null : PROMO_ICONS[resolvedIcon];
    const resolvedTone = normalizeValue(tone, PROMO_TONES, 'primary');
    const resolvedSize = normalizeValue(size, PROMO_SIZES, 'md');
    const resolvedAlignment = normalizeValue(alignment, PROMO_ALIGNMENTS, 'center');
    const safeLinkUrl = normalizeSafeLinkUrl(linkUrl);
    const resolvedLinkLabel = linkLabel?.trim();
    const hasLink = Boolean(authoredMessage && safeLinkUrl && resolvedLinkLabel);
    const resolvedMessage = authoredMessage || 'Add an announcement message';

    return (
        <div
            {...props}
            data-slot="sfnext-toolkit-promo-strip"
            data-icon={resolvedIcon}
            data-authoring-empty={isAuthoringEmpty || undefined}
            className={cn(
                promoStripVariants({ tone: resolvedTone, size: resolvedSize }),
                isAuthoringEmpty && 'border border-dashed border-current/40',
                className
            )}>
            <div
                data-slot="promo-strip-content"
                className={cn(
                    'section-container flex flex-wrap items-center gap-x-2 gap-y-1',
                    ALIGNMENT_CLASS[resolvedAlignment]
                )}>
                {Icon && <Icon data-slot="promo-strip-icon" aria-hidden="true" className="size-[1em] shrink-0" />}
                <span data-slot="promo-strip-message" className="font-medium">
                    {resolvedMessage}
                </span>
                {hasLink && safeLinkUrl && (
                    <Link
                        data-slot="promo-strip-link"
                        to={safeLinkUrl}
                        className="rounded-sm font-semibold underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                        {resolvedLinkLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}

/** Stable loading state registered by the Page Designer component registry. */
export function PromoStripFallback() {
    return (
        <div data-slot="sfnext-toolkit-promo-strip-fallback" aria-hidden="true" className="w-full bg-muted px-4 py-3">
            <div className="section-container flex items-center justify-center gap-2">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 w-64 max-w-3/4" />
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { PromoStripFallback as fallback };
