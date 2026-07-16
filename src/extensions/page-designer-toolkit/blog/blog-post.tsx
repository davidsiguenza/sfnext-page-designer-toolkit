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

import { useRouteLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { loader as rootLoader } from '@/root';
import { DynamicImage } from '@/components/dynamic-image';
import HtmlFragment from '@/components/html-fragment';
import { JsonLd } from '@/components/json-ld';
import { Link } from '@/components/link';
import { Region } from '@/components/region';
import { SeoMeta } from '@/components/seo-meta';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import type { BlogPost } from './content-model';

function asAbsoluteHttpUrl(value: string | undefined, pageUrl: string): string | undefined {
    if (!value) return undefined;
    try {
        const url = new URL(value, pageUrl);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
    } catch {
        return undefined;
    }
}

/** Creates the schema.org representation emitted by the Blog Post renderer. */
// eslint-disable-next-line react-refresh/only-export-components -- Pure schema builder is shared with focused unit tests.
export function createBlogPostJsonLd(post: BlogPost, pageUrl: string): Record<string, unknown> {
    const image = asAbsoluteHttpUrl(post.heroImageUrl, pageUrl);
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        ...(post.excerpt ? { description: post.excerpt } : {}),
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
        ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
        ...(image ? { image: [image] } : {}),
        ...(post.category ? { articleSection: post.category } : {}),
        ...(post.tags.length > 0 ? { keywords: post.tags.join(', ') } : {}),
        ...(post.readingTimeMinutes ? { timeRequired: `PT${post.readingTimeMinutes}M` } : {}),
        url: pageUrl,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
        },
    };
}

function formatPublishedDate(value: string | undefined, locale: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return undefined;
    try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
    } catch {
        return value;
    }
}

export interface BlogPostRendererProps {
    post: BlogPost;
    pageUrl: string;
    layoutPage?: PageWithComponentData | null;
    isAuthoring?: boolean;
}

/** Accessible, SEO-complete Content Asset renderer framed by optional Page Designer regions. */
export function BlogPostRenderer({ post, pageUrl, layoutPage, isAuthoring = false }: BlogPostRendererProps) {
    const { t, i18n } = useTranslation('extPageDesignerToolkit');
    const rootData = useRouteLoaderData<typeof rootLoader>('root');
    const titleId = `blog-post-title-${post.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
    const publishedLabel = formatPublishedDate(post.publishedAt, i18n.resolvedLanguage || i18n.language || 'en');
    const imageUrl = asAbsoluteHttpUrl(post.heroImageUrl, pageUrl) || post.heroImageUrl;

    return (
        <div data-slot="sfnext-toolkit-blog-post-page">
            <SeoMeta
                title={post.seoTitle}
                description={post.seoDescription || post.excerpt}
                noIndex={isAuthoring}
                openGraph={{ type: 'article', url: pageUrl, image: asAbsoluteHttpUrl(post.heroImageUrl, pageUrl) }}
            />
            <link rel="canonical" href={pageUrl} />
            <JsonLd
                data={createBlogPostJsonLd(post, pageUrl)}
                id="blog-post-schema"
                nonce={rootData?.nonce ?? undefined}
            />

            {layoutPage && <Region page={layoutPage} regionId="beforeArticle" />}

            <article aria-labelledby={titleId} className="section-container py-10 md:py-14">
                <div className="mx-auto max-w-4xl">
                    <nav aria-label={t('blog.breadcrumbLabel', { defaultValue: 'Breadcrumb' })} className="mb-6">
                        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="/">{t('blog.home', { defaultValue: 'Home' })}</Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li>
                                <Link to="/blog">{t('blog.title', { defaultValue: 'Blog' })}</Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li aria-current="page" className="max-w-full truncate text-foreground">
                                {post.title}
                            </li>
                        </ol>
                    </nav>

                    <header className="space-y-5">
                        {post.category && (
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                                {post.category}
                            </p>
                        )}
                        <h1 id={titleId} className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                            {post.title}
                        </h1>
                        {post.excerpt && (
                            <p className="text-lg leading-8 text-muted-foreground md:text-xl">{post.excerpt}</p>
                        )}

                        {(post.author || publishedLabel || post.readingTimeMinutes) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                                {post.author && (
                                    <span>
                                        {t('blog.by', { defaultValue: 'By' })} {post.author}
                                    </span>
                                )}
                                {publishedLabel && <time dateTime={post.publishedAt}>{publishedLabel}</time>}
                                {post.readingTimeMinutes && (
                                    <span>
                                        {t('blog.readingTime', {
                                            count: post.readingTimeMinutes,
                                            defaultValue: '{{count}} min read',
                                        })}
                                    </span>
                                )}
                            </div>
                        )}
                    </header>

                    {imageUrl && (
                        <figure className="my-10 overflow-hidden rounded-ui bg-muted md:my-12">
                            <DynamicImage
                                src={imageUrl}
                                alt={post.heroImageAlt || ''}
                                widths={['100vw', '80vw', '1024px']}
                                loading="eager"
                                imageProps={{ className: 'h-auto w-full object-cover' }}
                            />
                        </figure>
                    )}

                    {post.bodyHtml ? (
                        <div data-slot="blog-post-body" className="mx-auto max-w-3xl text-foreground">
                            <HtmlFragment
                                content={post.bodyHtml}
                                className="text-base leading-8 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:my-8 [&_li]:ml-6 [&_ol]:my-5 [&_ol]:list-decimal [&_p+p]:mt-5 [&_ul]:my-5 [&_ul]:list-disc"
                            />
                        </div>
                    ) : isAuthoring ? (
                        <p
                            role="status"
                            className="my-10 rounded-ui border border-dashed border-border p-8 text-center text-muted-foreground">
                            {t('blog.emptyBody', {
                                defaultValue: 'Add the article body to the selected Content Asset.',
                            })}
                        </p>
                    ) : null}

                    {post.tags.length > 0 && (
                        <ul
                            aria-label={t('blog.tags', { defaultValue: 'Article tags' })}
                            className="mt-10 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <li key={tag} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </article>

            {layoutPage && <Region page={layoutPage} regionId="afterArticle" />}
        </div>
    );
}

export default BlogPostRenderer;
