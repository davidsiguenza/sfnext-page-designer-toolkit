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
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { DynamicImage } from '@/components/dynamic-image';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { routes, routeHref } from '@/route-paths';
import type { BlogPost } from '@/extensions/page-designer-toolkit/blog/content-model';
import type { BlogPostGridData } from './loaders';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

const GRID_COLUMNS = ['2', '3', '4'] as const;
const IMAGE_RATIOS = ['landscape', 'wide', 'square', 'portrait'] as const;

type GridColumns = (typeof GRID_COLUMNS)[number];
type ImageRatio = (typeof IMAGE_RATIOS)[number];
type SortOption = 'newest' | 'oldest' | 'title';

const GRID_CLASS: Record<GridColumns, string> = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'sm:grid-cols-2 lg:grid-cols-4',
};

const RATIO_CLASS: Record<ImageRatio, string> = {
    landscape: 'aspect-[4/3]',
    wide: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

function normalizeOption<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

function formatPostDate(value: string | undefined, locale: string): string | undefined {
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

function formatReadTime(template: string, minutes: number): string {
    return template.replaceAll('{minutes}', String(minutes));
}

/* v8 ignore start - decorator behavior is covered by metadata contract assertions. */
@Component('blogPostGrid', {
    name: 'Blog Post Grid',
    description:
        'Automatically lists localized, online Content Assets from a blog folder with editorial filters, cards, and pagination.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitBlogPostGridMetadata {
    @AttributeDefinition({
        id: 'folderId',
        name: 'Blog folder ID',
        description: 'Content Library folder searched by Shopper Experience, for example sfnext-blog.',
        type: 'string',
        defaultValue: 'sfnext-blog',
        required: true,
    })
    folderId?: string;

    @AttributeDefinition({ id: 'heading', name: 'Heading', type: 'string', defaultValue: 'Latest stories' })
    heading?: string;

    @AttributeDefinition({ id: 'intro', name: 'Introduction', type: 'text' })
    intro?: string;

    @AttributeDefinition({
        id: 'pageSize',
        name: 'Posts per page',
        description: 'Between 1 and 24.',
        type: 'integer',
        defaultValue: 12,
    })
    pageSize?: number;

    @AttributeDefinition({
        id: 'columns',
        name: 'Desktop columns',
        type: 'enum',
        values: ['2', '3', '4'],
        defaultValue: '3',
    })
    columns?: string;

    @AttributeDefinition({
        id: 'imageRatio',
        name: 'Card image ratio',
        type: 'enum',
        values: ['landscape', 'wide', 'square', 'portrait'],
        defaultValue: 'landscape',
    })
    imageRatio?: string;

    @AttributeDefinition({
        id: 'sort',
        name: 'Sort order',
        type: 'enum',
        values: ['newest', 'oldest', 'title'],
        defaultValue: 'newest',
    })
    sort?: string;

    @AttributeDefinition({ id: 'featuredOnly', name: 'Featured posts only', type: 'boolean', defaultValue: false })
    featuredOnly?: boolean;

    @AttributeDefinition({
        id: 'category',
        name: 'Category filter',
        description: 'Optional exact category value, case-insensitive.',
        type: 'string',
    })
    category?: string;

    @AttributeDefinition({ id: 'showExcerpt', name: 'Show excerpt', type: 'boolean', defaultValue: true })
    showExcerpt?: boolean;

    @AttributeDefinition({ id: 'showCategory', name: 'Show category', type: 'boolean', defaultValue: true })
    showCategory?: boolean;

    @AttributeDefinition({ id: 'showAuthor', name: 'Show author', type: 'boolean', defaultValue: true })
    showAuthor?: boolean;

    @AttributeDefinition({ id: 'showDate', name: 'Show publication date', type: 'boolean', defaultValue: true })
    showDate?: boolean;

    @AttributeDefinition({ id: 'showReadTime', name: 'Show reading time', type: 'boolean', defaultValue: true })
    showReadTime?: boolean;

    @AttributeDefinition({ id: 'showPagination', name: 'Show pagination', type: 'boolean', defaultValue: true })
    showPagination?: boolean;

    @AttributeDefinition({ id: 'ctaLabel', name: 'Card link label', type: 'string', defaultValue: 'Read article' })
    ctaLabel?: string;

    @AttributeDefinition({
        id: 'readTimeTemplate',
        name: 'Reading time format',
        description: 'Use {minutes} where the number should appear.',
        type: 'string',
        defaultValue: '{minutes} min read',
    })
    readTimeTemplate?: string;

    @AttributeDefinition({
        id: 'emptyMessage',
        name: 'Empty message',
        type: 'string',
        defaultValue: 'No articles have been published yet.',
    })
    emptyMessage?: string;
}
/* v8 ignore stop */

export interface BlogPostGridProps extends Omit<ComponentPropsWithoutRef<'section'>, 'data'> {
    folderId?: string;
    heading?: string;
    intro?: string;
    pageSize?: number;
    columns?: GridColumns;
    imageRatio?: ImageRatio;
    sort?: SortOption;
    featuredOnly?: boolean;
    category?: string;
    showExcerpt?: boolean;
    showCategory?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadTime?: boolean;
    showPagination?: boolean;
    ctaLabel?: string;
    readTimeTemplate?: string;
    emptyMessage?: string;
    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: BlogPostGridData;
}

function BlogPostCard({
    post,
    imageRatio,
    showExcerpt,
    showCategory,
    showAuthor,
    showDate,
    showReadTime,
    ctaLabel,
    readTimeTemplate,
    locale,
}: {
    post: BlogPost;
    imageRatio: ImageRatio;
    showExcerpt: boolean;
    showCategory: boolean;
    showAuthor: boolean;
    showDate: boolean;
    showReadTime: boolean;
    ctaLabel: string;
    readTimeTemplate: string;
    locale: string;
}) {
    const destination = routeHref(routes.blogPost, { postId: post.slug });
    const publishedLabel = showDate ? formatPostDate(post.publishedAt, locale) : undefined;
    const showMeta = Boolean(
        (showAuthor && post.author) || publishedLabel || (showReadTime && post.readingTimeMinutes)
    );

    return (
        <article
            data-slot="sfnext-toolkit-blog-post-card"
            className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none">
            <Link to={destination} aria-label={`${ctaLabel}: ${post.title}`} className="block overflow-hidden bg-muted">
                <div className={cn('relative overflow-hidden', RATIO_CLASS[imageRatio])}>
                    {post.heroImageUrl ? (
                        <DynamicImage
                            src={post.heroImageUrl}
                            alt={post.heroImageAlt || ''}
                            widths={['100vw', '50vw', '33vw', '25vw']}
                            loading="lazy"
                            className="h-full w-full"
                            imageProps={{
                                className:
                                    'h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105',
                            }}
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                            <Newspaper aria-hidden="true" className="size-10" />
                        </div>
                    )}
                </div>
            </Link>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
                {showCategory && post.category && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {post.category}
                    </p>
                )}
                <h3 className="text-xl font-semibold leading-tight tracking-tight text-card-foreground">
                    <Link
                        to={destination}
                        className="rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
                        {post.title}
                    </Link>
                </h3>
                {showExcerpt && post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                )}
                {showMeta && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {showAuthor && post.author && <span>{post.author}</span>}
                        {showAuthor && post.author && (publishedLabel || (showReadTime && post.readingTimeMinutes)) && (
                            <span aria-hidden="true">·</span>
                        )}
                        {publishedLabel && <time dateTime={post.publishedAt}>{publishedLabel}</time>}
                        {publishedLabel && showReadTime && post.readingTimeMinutes && <span aria-hidden="true">·</span>}
                        {showReadTime && post.readingTimeMinutes && (
                            <span>{formatReadTime(readTimeTemplate, post.readingTimeMinutes)}</span>
                        )}
                    </div>
                )}
                <Link
                    to={destination}
                    className="mt-auto inline-flex w-fit items-center gap-2 rounded-sm pt-5 text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
                    {ctaLabel}
                    <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </article>
    );
}

function Pagination({ data }: { data: BlogPostGridData }) {
    const location = useLocation();
    const { t } = useTranslation('extPageDesignerToolkit');
    if (data.totalPages <= 1) return null;

    const pageTarget = (page: number) => {
        const search = new URLSearchParams(location.search);
        if (page <= 1) search.delete(data.paginationParam);
        else search.set(data.paginationParam, String(page));
        const query = search.toString();
        return { pathname: location.pathname, search: query ? `?${query}` : '' };
    };

    return (
        <nav
            data-slot="blog-post-grid-pagination"
            aria-label={t('blog.paginationLabel', { defaultValue: 'Blog pagination' })}
            className="mt-10 flex items-center justify-center gap-2">
            <Link
                to={pageTarget(data.currentPage - 1)}
                aria-label={t('blog.previousPage', { defaultValue: 'Previous page' })}
                aria-disabled={data.currentPage === 1}
                tabIndex={data.currentPage === 1 ? -1 : undefined}
                className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    data.currentPage === 1 && 'pointer-events-none opacity-50'
                )}>
                <ChevronLeft aria-hidden="true" />
            </Link>
            <span className="min-w-24 text-center text-sm text-muted-foreground" aria-live="polite">
                {data.currentPage} / {data.totalPages}
            </span>
            <Link
                to={pageTarget(data.currentPage + 1)}
                aria-label={t('blog.nextPage', { defaultValue: 'Next page' })}
                aria-disabled={data.currentPage === data.totalPages}
                tabIndex={data.currentPage === data.totalPages ? -1 : undefined}
                className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    data.currentPage === data.totalPages && 'pointer-events-none opacity-50'
                )}>
                <ChevronRight aria-hidden="true" />
            </Link>
        </nav>
    );
}

export default function BlogPostGrid({
    folderId: _folderId,
    heading,
    intro,
    pageSize: _pageSize,
    columns,
    imageRatio,
    sort: _sort,
    featuredOnly: _featuredOnly,
    category: _category,
    showExcerpt = true,
    showCategory = true,
    showAuthor = true,
    showDate = true,
    showReadTime = true,
    showPagination = true,
    ctaLabel,
    readTimeTemplate,
    emptyMessage,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data,
    ...props
}: BlogPostGridProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { t, i18n } = useTranslation('extPageDesignerToolkit');
    const resolvedColumns = normalizeOption(columns, GRID_COLUMNS, '3');
    const resolvedImageRatio = normalizeOption(imageRatio, IMAGE_RATIOS, 'landscape');
    const resolvedHeading = heading?.trim();
    const resolvedIntro = intro?.trim();
    const resolvedCtaLabel = ctaLabel?.trim() || t('blog.readArticle', { defaultValue: 'Read article' });
    const resolvedReadTimeTemplate =
        readTimeTemplate?.trim() || t('blog.readingTimeTemplate', { defaultValue: '{minutes} min read' });
    const resolvedEmptyMessage =
        emptyMessage?.trim() || t('blog.emptyGrid', { defaultValue: 'No articles have been published yet.' });
    const locale = i18n.resolvedLanguage || i18n.language || 'en';
    const posts = data?.posts ?? [];
    const hasError = data?.error === true;
    const emptyTitle = hasError
        ? isDesignMode
            ? t('blog.errorAuthoring', { defaultValue: 'The blog content could not be loaded' })
            : t('blog.errorLive', { defaultValue: 'Articles are temporarily unavailable.' })
        : isDesignMode && !data
          ? t('blog.connectFolder', { defaultValue: 'Connect the blog content folder' })
          : resolvedEmptyMessage;

    return (
        <section
            {...props}
            data-slot="sfnext-toolkit-blog-post-grid"
            className={cn('section-container py-10 sm:py-14', className)}>
            {(resolvedHeading || resolvedIntro) && (
                <header className="mb-8 max-w-3xl">
                    {resolvedHeading && (
                        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{resolvedHeading}</h2>
                    )}
                    {resolvedIntro && <p className="mt-3 text-base leading-7 text-muted-foreground">{resolvedIntro}</p>}
                </header>
            )}

            {posts.length ? (
                <>
                    <div className={cn('grid gap-6 lg:gap-8', GRID_CLASS[resolvedColumns])}>
                        {posts.map((post) => (
                            <BlogPostCard
                                key={post.id}
                                post={post}
                                imageRatio={resolvedImageRatio}
                                showExcerpt={showExcerpt}
                                showCategory={showCategory}
                                showAuthor={showAuthor}
                                showDate={showDate}
                                showReadTime={showReadTime}
                                ctaLabel={resolvedCtaLabel}
                                readTimeTemplate={resolvedReadTimeTemplate}
                                locale={locale}
                            />
                        ))}
                    </div>
                    {showPagination && data && <Pagination data={data} />}
                </>
            ) : (
                <div
                    role="status"
                    data-slot="blog-post-grid-empty"
                    className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-ui border border-dashed border-border bg-muted/40 px-6 text-center">
                    <span
                        className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"
                        aria-hidden="true">
                        <Newspaper className="size-5" />
                    </span>
                    <div>
                        <p className="font-semibold text-foreground">{emptyTitle}</p>
                        {isDesignMode && (
                            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                                {hasError
                                    ? t('blog.errorAuthoringHelp', {
                                          defaultValue:
                                              'Verify the Shopper Experience contents scope, folder ID, and content search index.',
                                      })
                                    : t('blog.connectFolderHelp', {
                                          defaultValue:
                                              'Publish Content Assets in the configured folder and verify the Shopper Experience contents scope.',
                                      })}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export function BlogPostGridFallback() {
    return (
        <section
            data-slot="sfnext-toolkit-blog-post-grid-fallback"
            aria-hidden="true"
            className="section-container py-12">
            <div className="mb-8 space-y-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-full max-w-xl" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="overflow-hidden rounded-ui border border-border">
                        <Skeleton className="aspect-[4/3] w-full rounded-none" />
                        <div className="space-y-3 p-5">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-4/5" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { BlogPostGridFallback as fallback };
