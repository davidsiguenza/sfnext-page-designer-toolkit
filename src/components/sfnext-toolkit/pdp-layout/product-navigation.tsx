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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/components/link';
import { Button } from '@/components/ui/button';
import { routes, routeHref } from '@/route-paths';
import { cn } from '@/lib/utils';
import type { PdpProductNavigationData, PdpProductNavigationItem } from './navigation.server';

export interface PdpProductNavigationProps extends PdpProductNavigationData {
    className?: string;
}

function ProductNavigationLink({
    direction,
    item,
    label,
}: {
    direction: 'previous' | 'next';
    item: PdpProductNavigationItem;
    label: string;
}) {
    const isPrevious = direction === 'previous';

    return (
        <Button
            asChild
            variant="outline"
            className={cn(
                'h-auto min-w-0 max-w-[calc(50%-0.25rem)] justify-start px-3 py-2 sm:max-w-xs',
                !isPrevious && 'ml-auto text-right'
            )}>
            <Link
                to={routeHref(routes.product, { productId: item.productId })}
                data-slot={`pdp-product-navigation-${direction}`}>
                {isPrevious && <ChevronLeft className="shrink-0" aria-hidden="true" />}
                <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">{label}</span>
                    <span className="block truncate font-medium">{item.productName}</span>
                </span>
                {!isPrevious && <ChevronRight className="shrink-0" aria-hidden="true" />}
            </Link>
        </Button>
    );
}

export function PdpProductNavigation({ previous, next, className }: PdpProductNavigationProps) {
    const { t } = useTranslation('category');
    if (!previous && !next) return null;

    const previousLabel = t('pagination.previous');
    const nextLabel = t('pagination.next');

    return (
        <nav
            aria-label={`${previousLabel} / ${nextLabel}`}
            data-slot="pdp-product-navigation"
            className={cn('flex items-stretch gap-2 border-y border-border py-3', className)}>
            {previous && <ProductNavigationLink direction="previous" item={previous} label={previousLabel} />}
            {next && <ProductNavigationLink direction="next" item={next} label={nextLabel} />}
        </nav>
    );
}
