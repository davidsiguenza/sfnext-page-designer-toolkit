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
import { ArrowRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CarouselSection } from '@/components/carousel-section';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { normalizeSafeLinkUrl } from '@/components/sfnext-toolkit/safe-link-url';
import { CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { routes, routeHref } from '@/route-paths';
import type { ContentCollectionItem } from './content-model';
import type { ContentCollectionData, ContentCollectionSourceMode } from './loaders';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const LAYOUTS = ['grid', 'carousel'] as const;
const COLUMNS = ['2', '3', '4'] as const;
const IMAGE_RATIOS = ['landscape', 'wide', 'square', 'portrait'] as const;
const LINK_MODES = ['auto', 'blog', 'template', 'none'] as const;

type Layout = (typeof LAYOUTS)[number];
type Columns = (typeof COLUMNS)[number];
type ImageRatio = (typeof IMAGE_RATIOS)[number];
type LinkMode = (typeof LINK_MODES)[number];

const GRID_CLASSES: Record<Columns, string> = {
    '2': 'grid-cols-1 @3xl/content-collection:grid-cols-2',
    '3': 'grid-cols-1 @xl/content-collection:grid-cols-2 @4xl/content-collection:grid-cols-3',
    '4': 'grid-cols-1 @lg/content-collection:grid-cols-2 @3xl/content-collection:grid-cols-3 @5xl/content-collection:grid-cols-4',
};

const CAROUSEL_ITEM_CLASSES: Record<Columns, string> = {
    '2': 'basis-[88%] @2xl/content-collection:basis-1/2',
    '3': 'basis-[88%] @xl/content-collection:basis-1/2 @4xl/content-collection:basis-1/3',
    '4': 'basis-[88%] @lg/content-collection:basis-1/2 @3xl/content-collection:basis-1/3 @5xl/content-collection:basis-1/4',
};

const IMAGE_RATIO_CLASSES: Record<ImageRatio, string> = {
    landscape: 'aspect-[4/3]',
    wide: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

const TONE_CLASSES = {
    default: 'bg-background text-foreground',
    muted: 'bg-muted text-foreground',
} as const;

function normalizeOption<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function formatDate(value: string | undefined, locale: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    try {
        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(date);
    } catch {
        return value;
    }
}

function blogDestination(id: string): string {
    return routeHref(routes.blogPost, { postId: encodeURIComponent(id) });
}

function resolveDestination(
    item: ContentCollectionItem,
    linkMode: LinkMode,
    linkTemplate?: string
): string | undefined {
    if (linkMode === 'none') return undefined;
    if (linkMode === 'blog') return blogDestination(item.id);
    if (linkMode === 'template') {
        const template = linkTemplate?.trim();
        if (!template?.includes('{id}')) return undefined;
        return normalizeSafeLinkUrl(template.replaceAll('{id}', encodeURIComponent(item.id)));
    }
    return item.kind === 'blog' ? blogDestination(item.id) : normalizeSafeLinkUrl(item.linkUrl);
}

/* v8 ignore start - decorator behavior is covered by metadata assertions. */
@Component('contentCollection', {
    name: 'Content Collection',
    description:
        'Responsive grid or carousel of manually selected Content Assets, or the latest content from a library folder.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitContentCollectionMetadata {
    @AttributeDefinition({
        name: 'Content source',
        description: 'Choose manual IDs or automatically load the latest online assets from a folder.',
        type: 'enum',
        values: ['manual', 'latest'],
        defaultValue: 'latest',
    })
    sourceMode?: string;

    @AttributeDefinition({
        name: 'Selected Content Asset IDs',
        description:
            'Manual mode only. Enter one ID per line or separate IDs with commas; authored order is preserved.',
        type: 'text',
    })
    selectedContentIds?: string;

    @AttributeDefinition({
        name: 'Content folder ID',
        description: 'Latest mode only. The online Content Library folder searched by Shopper Experience.',
        type: 'string',
        defaultValue: 'sfnext-blog',
    })
    folderId?: string;

    @AttributeDefinition({
        name: 'Maximum items',
        description: 'Between 1 and 24. Manual mode uses the first IDs in authored order.',
        type: 'integer',
        defaultValue: 6,
    })
    limit?: number;

    @AttributeDefinition({
        name: 'Content kind',
        description: 'Show all assets, explicit SFNext blog posts, or non-blog Content Assets.',
        type: 'enum',
        values: ['all', 'blog', 'generic'],
        defaultValue: 'all',
    })
    contentType?: string;

    @AttributeDefinition({
        name: 'Latest-mode sort',
        description: 'Manual selections always keep their authored order.',
        type: 'enum',
        values: ['newest', 'oldest', 'title'],
        defaultValue: 'newest',
    })
    sort?: string;

    @AttributeDefinition({
        name: 'Layout',
        description: 'Render the selected assets as a responsive grid or a horizontally scrollable carousel.',
        type: 'enum',
        values: ['grid', 'carousel'],
        defaultValue: 'carousel',
    })
    layout?: string;

    @AttributeDefinition({
        name: 'Maximum cards per row',
        description: 'Cards adapt to the component container, including when placed inside toolkit columns.',
        type: 'enum',
        values: ['2', '3', '4'],
        defaultValue: '3',
    })
    columns?: string;

    @AttributeDefinition({
        name: 'Card image ratio',
        description: 'Aspect ratio used by every card image in the collection.',
        type: 'enum',
        values: ['landscape', 'wide', 'square', 'portrait'],
        defaultValue: 'landscape',
    })
    imageRatio?: string;

    @AttributeDefinition({
        name: 'Surface',
        description: 'Semantic background surface applied to the collection.',
        type: 'enum',
        values: ['default', 'muted'],
        defaultValue: 'default',
    })
    tone?: string;

    @AttributeDefinition({
        name: 'Heading',
        description: 'Optional section heading displayed above the cards.',
        type: 'string',
        defaultValue: 'Featured content',
    })
    heading?: string;

    @AttributeDefinition({
        name: 'Introduction',
        description: 'Optional supporting text displayed below the heading.',
        type: 'text',
    })
    intro?: string;

    @AttributeDefinition({
        name: 'Show image',
        description: 'Show the mapped content image, or a neutral placeholder when an asset has no image.',
        type: 'boolean',
        defaultValue: true,
    })
    showImage?: boolean;

    @AttributeDefinition({
        name: 'Show summary',
        description: 'Show the mapped summary as plain card text.',
        type: 'boolean',
        defaultValue: true,
    })
    showExcerpt?: boolean;

    @AttributeDefinition({
        name: 'Show category',
        description: 'Show the mapped editorial category when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showCategory?: boolean;

    @AttributeDefinition({
        name: 'Show author',
        description: 'Show the mapped author when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showAuthor?: boolean;

    @AttributeDefinition({
        name: 'Show publication date',
        description: 'Show the localized publication date when available.',
        type: 'boolean',
        defaultValue: true,
    })
    showDate?: boolean;

    @AttributeDefinition({
        name: 'Show reading time',
        description: 'Show the configured or calculated reading time for blog assets.',
        type: 'boolean',
        defaultValue: true,
    })
    showReadTime?: boolean;

    @AttributeDefinition({
        name: 'Card link label',
        description: 'Accessible call-to-action label used by linked cards.',
        type: 'string',
        defaultValue: 'View content',
    })
    ctaLabel?: string;

    @AttributeDefinition({
        name: 'Link behavior',
        description:
            'Auto links blog assets to /blog/{id} and uses a configured URL field for generic content. Template substitutes {id}.',
        type: 'enum',
        values: ['auto', 'blog', 'template', 'none'],
        defaultValue: 'auto',
    })
    linkMode?: string;

    @AttributeDefinition({
        name: 'Link template',
        description: 'Template mode only. Example: /stories/{id}. The {id} value is URL encoded.',
        type: 'string',
    })
    linkTemplate?: string;

    @AttributeDefinition({
        name: 'Empty message',
        description: 'Message shown on the live storefront when a configured collection has no matching assets.',
        type: 'string',
        defaultValue: 'No content is available.',
    })
    emptyMessage?: string;

    @AttributeDefinition({
        name: 'Title attribute override',
        description: 'Optional Content attribute ID. The c_ prefix can be omitted.',
        type: 'string',
    })
    titleAttribute?: string;

    @AttributeDefinition({
        name: 'Summary attribute override',
        description: 'Optional Content attribute ID. Markup is converted to plain card text.',
        type: 'string',
    })
    excerptAttribute?: string;

    @AttributeDefinition({
        name: 'Image attribute override',
        description: 'Optional Content image attribute ID. Unsafe media protocols are rejected.',
        type: 'string',
    })
    imageAttribute?: string;

    @AttributeDefinition({
        name: 'Image alt attribute override',
        description: 'Optional Content attribute ID containing meaningful alternative text for the image.',
        type: 'string',
    })
    imageAltAttribute?: string;

    @AttributeDefinition({
        name: 'Publication date attribute override',
        description: 'Optional Content attribute ID containing an ISO-compatible publication date.',
        type: 'string',
    })
    dateAttribute?: string;

    @AttributeDefinition({
        name: 'Author attribute override',
        description: 'Optional Content attribute ID containing the author name.',
        type: 'string',
    })
    authorAttribute?: string;

    @AttributeDefinition({
        name: 'Category attribute override',
        description: 'Optional Content attribute ID containing the editorial category label.',
        type: 'string',
    })
    categoryAttribute?: string;

    @AttributeDefinition({
        name: 'Link attribute override',
        description: 'Optional Content URL attribute used by automatic linking for generic assets.',
        type: 'string',
    })
    linkAttribute?: string;
}
/* v8 ignore stop */

export interface ContentCollectionProps extends Omit<ComponentPropsWithoutRef<'section'>, 'data'> {
    sourceMode?: ContentCollectionSourceMode;
    selectedContentIds?: string;
    folderId?: string;
    limit?: number;
    contentType?: string;
    sort?: string;
    layout?: Layout;
    columns?: Columns;
    imageRatio?: ImageRatio;
    tone?: string;
    heading?: string;
    intro?: string;
    showImage?: boolean;
    showExcerpt?: boolean;
    showCategory?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadTime?: boolean;
    ctaLabel?: string;
    linkMode?: LinkMode;
    linkTemplate?: string;
    emptyMessage?: string;
    titleAttribute?: string;
    excerptAttribute?: string;
    imageAttribute?: string;
    imageAltAttribute?: string;
    dateAttribute?: string;
    authorAttribute?: string;
    categoryAttribute?: string;
    linkAttribute?: string;
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: ContentCollectionData;
}

function ContentAssetCard({
    item,
    imageRatio,
    destination,
    showImage,
    showExcerpt,
    showCategory,
    showAuthor,
    showDate,
    showReadTime,
    ctaLabel,
    locale,
    readTimeLabel,
}: {
    item: ContentCollectionItem;
    imageRatio: ImageRatio;
    destination?: string;
    showImage: boolean;
    showExcerpt: boolean;
    showCategory: boolean;
    showAuthor: boolean;
    showDate: boolean;
    showReadTime: boolean;
    ctaLabel: string;
    locale: string;
    readTimeLabel: (minutes: number) => string;
}) {
    const dateLabel = showDate ? formatDate(item.publishedAt, locale) : undefined;
    const showMeta = Boolean((showAuthor && item.author) || dateLabel || (showReadTime && item.readingTimeMinutes));
    const media = (
        <div className={cn('relative overflow-hidden bg-muted', IMAGE_RATIO_CLASSES[imageRatio])}>
            {item.imageUrl ? (
                <DynamicImage
                    src={item.imageUrl}
                    alt={item.imageAlt || ''}
                    widths={['88vw', '50vw', '33vw', '25vw']}
                    loading="lazy"
                    className="h-full w-full"
                    imageProps={{
                        className:
                            'h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105',
                    }}
                />
            ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <FileText aria-hidden="true" className="size-10" />
                </div>
            )}
        </div>
    );

    const card = (
        <article
            data-slot="sfnext-toolkit-content-card"
            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-ui border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none">
            {showImage && media}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
                {showCategory && item.category && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {item.category}
                    </p>
                )}
                <h3 className="text-xl font-semibold leading-tight tracking-tight text-card-foreground">
                    {item.title}
                </h3>
                {showExcerpt && item.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                )}
                {showMeta && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {showAuthor && item.author && <span>{item.author}</span>}
                        {showAuthor && item.author && (dateLabel || (showReadTime && item.readingTimeMinutes)) && (
                            <span aria-hidden="true">·</span>
                        )}
                        {dateLabel && <time dateTime={item.publishedAt}>{dateLabel}</time>}
                        {dateLabel && showReadTime && item.readingTimeMinutes && <span aria-hidden="true">·</span>}
                        {showReadTime && item.readingTimeMinutes && (
                            <span>{readTimeLabel(item.readingTimeMinutes)}</span>
                        )}
                    </div>
                )}
                {destination && (
                    <span className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-semibold text-foreground underline-offset-4 group-hover:underline">
                        {ctaLabel}
                        <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
                        />
                    </span>
                )}
            </div>
        </article>
    );

    return destination ? (
        <Link
            to={destination}
            aria-label={item.title}
            className="block h-full w-full rounded-ui focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
            {card}
        </Link>
    ) : (
        card
    );
}

function AuthoringNotice({ data }: { data: ContentCollectionData }) {
    const { t } = useTranslation('extPageDesignerToolkit');
    const notices: string[] = [];
    if (data.missingIds.length) {
        notices.push(
            t('contentCollection.missingIds', {
                defaultValue: 'Unavailable Content Asset IDs: {{ids}}',
                ids: data.missingIds.join(', '),
            })
        );
    }
    if (data.invalidIdCount) {
        notices.push(
            t('contentCollection.invalidIds', {
                defaultValue: '{{count}} invalid Content Asset ID was ignored.',
                count: data.invalidIdCount,
            })
        );
    }
    if (data.filteredCount) {
        notices.push(
            t('contentCollection.filteredItems', {
                defaultValue: '{{count}} loaded item did not match the selected content kind.',
                count: data.filteredCount,
            })
        );
    }
    if (data.selectionTruncated) {
        notices.push(
            t('contentCollection.selectionTruncated', {
                defaultValue: 'Additional manual IDs were ignored because the maximum item count was reached.',
            })
        );
    }
    if (data.searchTruncated) {
        notices.push(
            t('contentCollection.searchTruncated', {
                defaultValue: 'The folder exceeded the safe search ceiling. Use a more specific folder.',
            })
        );
    }
    if (!notices.length) return null;

    return (
        <div
            data-slot="content-collection-authoring-notice"
            role="status"
            className="mb-6 rounded-ui border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <ul className="list-disc space-y-1 pl-5">
                {notices.map((notice) => (
                    <li key={notice}>{notice}</li>
                ))}
            </ul>
        </div>
    );
}

function EmptyState({
    data,
    sourceMode,
    emptyMessage,
    isDesignMode,
}: {
    data: ContentCollectionData | undefined;
    sourceMode: ContentCollectionSourceMode;
    emptyMessage: string;
    isDesignMode: boolean;
}) {
    const { t } = useTranslation('extPageDesignerToolkit');
    if (!isDesignMode && (!data || data.status !== 'empty' || !emptyMessage)) return null;

    let title = emptyMessage;
    let help: string | undefined;
    if (isDesignMode) {
        if (data?.status === 'error') {
            title = t('contentCollection.errorAuthoring', {
                defaultValue: 'The content collection could not be loaded',
            });
            help = t('contentCollection.errorAuthoringHelp', {
                defaultValue: 'Verify the Shopper Experience contents scope, folder or IDs, and content search index.',
            });
        } else if (!data || data.status === 'unconfigured') {
            title =
                sourceMode === 'manual'
                    ? t('contentCollection.configureManual', { defaultValue: 'Add Content Asset IDs' })
                    : t('contentCollection.configureLatest', { defaultValue: 'Connect a Content Library folder' });
            help =
                sourceMode === 'manual'
                    ? t('contentCollection.configureManualHelp', {
                          defaultValue: 'Enter one online Content Asset ID per line in the component settings.',
                      })
                    : t('contentCollection.configureLatestHelp', {
                          defaultValue:
                              'Choose an online folder and rebuild the content search index after bulk imports.',
                      });
        } else if (data.status === 'empty') {
            title = t('contentCollection.emptyAuthoring', { defaultValue: 'No matching content was found' });
            help = t('contentCollection.emptyAuthoringHelp', {
                defaultValue:
                    'Check online status, folder assignment, selected IDs, content kind, locale, and search index.',
            });
        }
    }

    return (
        <div
            data-slot="content-collection-empty"
            role="status"
            className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-ui border border-dashed border-border bg-card/70 px-6 text-center">
            <span
                className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"
                aria-hidden="true">
                <FileText className="size-5" />
            </span>
            <div>
                <p className="font-semibold text-foreground">{title}</p>
                {help && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{help}</p>}
            </div>
        </div>
    );
}

function CollectionHeader({ heading, intro }: { heading?: string; intro?: string }) {
    if (!heading && !intro) return null;
    return (
        <header className="mb-8 max-w-3xl">
            {heading && <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>}
            {intro && <p className="mt-3 text-base leading-7 text-muted-foreground">{intro}</p>}
        </header>
    );
}

export default function ContentCollection({
    sourceMode,
    selectedContentIds: _selectedContentIds,
    folderId: _folderId,
    limit: _limit,
    contentType: _contentType,
    sort: _sort,
    layout,
    columns,
    imageRatio,
    tone,
    heading,
    intro,
    showImage = true,
    showExcerpt = true,
    showCategory = true,
    showAuthor = true,
    showDate = true,
    showReadTime = true,
    ctaLabel,
    linkMode,
    linkTemplate,
    emptyMessage,
    titleAttribute: _titleAttribute,
    excerptAttribute: _excerptAttribute,
    imageAttribute: _imageAttribute,
    imageAltAttribute: _imageAltAttribute,
    dateAttribute: _dateAttribute,
    authorAttribute: _authorAttribute,
    categoryAttribute: _categoryAttribute,
    linkAttribute: _linkAttribute,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
    className,
    ...props
}: ContentCollectionProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t, i18n } = useTranslation('extPageDesignerToolkit');
    const resolvedSourceMode = normalizeOption(sourceMode, ['manual', 'latest'] as const, 'latest');
    const resolvedLayout = normalizeOption(layout, LAYOUTS, 'carousel');
    const resolvedColumns = normalizeOption(columns, COLUMNS, '3');
    const resolvedImageRatio = normalizeOption(imageRatio, IMAGE_RATIOS, 'landscape');
    const resolvedLinkMode = normalizeOption(linkMode, LINK_MODES, 'auto');
    const resolvedTone = tone === 'muted' ? 'muted' : 'default';
    const resolvedHeading = heading?.trim();
    const resolvedIntro = intro?.trim();
    const resolvedCtaLabel = ctaLabel?.trim() || t('contentCollection.viewContent', { defaultValue: 'View content' });
    const resolvedEmptyMessage =
        emptyMessage?.trim() || t('contentCollection.emptyLive', { defaultValue: 'No content is available.' });
    const locale = i18n.resolvedLanguage || i18n.language || 'en';
    const items = data?.items ?? [];
    const renderCard = (item: ContentCollectionItem) => (
        <ContentAssetCard
            item={item}
            imageRatio={resolvedImageRatio}
            destination={resolveDestination(item, resolvedLinkMode, linkTemplate)}
            showImage={showImage}
            showExcerpt={showExcerpt}
            showCategory={showCategory}
            showAuthor={showAuthor}
            showDate={showDate}
            showReadTime={showReadTime}
            ctaLabel={resolvedCtaLabel}
            locale={locale}
            readTimeLabel={(minutes) =>
                t('contentCollection.readingTime', { defaultValue: '{{count}} min read', count: minutes })
            }
        />
    );

    if (!items.length && !isDesignMode && (!data || data.status !== 'empty')) return null;

    const diagnostics = isDesignMode && data ? <AuthoringNotice data={data} /> : null;
    const emptyState = (
        <EmptyState
            data={data}
            sourceMode={resolvedSourceMode}
            emptyMessage={resolvedEmptyMessage}
            isDesignMode={isDesignMode}
        />
    );

    return (
        <section
            {...props}
            data-slot="sfnext-toolkit-content-collection"
            className={cn('@container/content-collection w-full', TONE_CLASSES[resolvedTone], className)}>
            {resolvedLayout === 'carousel' && items.length ? (
                <>
                    {diagnostics && <div className="section-container pt-6">{diagnostics}</div>}
                    <CarouselSection
                        title={resolvedHeading}
                        subtitle={resolvedIntro}
                        titleClassName="text-3xl font-semibold tracking-tight md:text-4xl"
                        ariaLabel={
                            resolvedHeading ||
                            t('contentCollection.carouselLabel', { defaultValue: 'Content collection' })
                        }
                        className="py-6 sm:py-8">
                        {items.map((item) => (
                            <CarouselItem
                                key={item.id}
                                className={cn('flex h-auto min-w-0', CAROUSEL_ITEM_CLASSES[resolvedColumns])}>
                                {renderCard(item)}
                            </CarouselItem>
                        ))}
                    </CarouselSection>
                </>
            ) : (
                <div className="section-container py-10 sm:py-14">
                    <CollectionHeader heading={resolvedHeading} intro={resolvedIntro} />
                    {diagnostics}
                    {items.length ? (
                        <div className={cn('grid gap-6 lg:gap-8', GRID_CLASSES[resolvedColumns])}>
                            {items.map((item) => (
                                <div key={item.id} className="min-w-0">
                                    {renderCard(item)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        emptyState
                    )}
                </div>
            )}
        </section>
    );
}

export function ContentCollectionFallback({
    layout,
    columns,
}: Pick<ContentCollectionProps, 'layout' | 'columns'> = {}) {
    const resolvedLayout = normalizeOption(layout, LAYOUTS, 'carousel');
    const resolvedColumns = normalizeOption(columns, COLUMNS, '3');
    const cardIds = ['first', 'second', 'third', 'fourth'].slice(0, Number(resolvedColumns));
    const card = (
        <div className="min-w-0 overflow-hidden rounded-ui border border-border bg-card">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    );

    return (
        <section
            data-slot="sfnext-toolkit-content-collection-fallback"
            aria-hidden="true"
            className="@container/content-collection w-full bg-background">
            <div className="section-container py-10">
                <div className="mb-8 space-y-3">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-full max-w-xl" />
                </div>
                <div
                    className={cn(
                        resolvedLayout === 'grid' ? 'grid gap-6' : 'flex gap-4 overflow-hidden',
                        resolvedLayout === 'grid' && GRID_CLASSES[resolvedColumns]
                    )}>
                    {cardIds.map((cardId) =>
                        resolvedLayout === 'grid' ? (
                            <div key={cardId}>{card}</div>
                        ) : (
                            <div key={cardId} className={cn('shrink-0', CAROUSEL_ITEM_CLASSES[resolvedColumns])}>
                                {card}
                            </div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { ContentCollectionFallback as fallback };
