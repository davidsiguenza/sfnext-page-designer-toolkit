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
import { Sparkles } from 'lucide-react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import ProductRecommendations, { type ProductRecommendationsProps } from '@/components/product-recommendations';
import { ProductRecommendationSkeleton } from '@/components/product/skeletons';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';

// Reuse the server-side Einstein loader and avoid a second recommendation implementation.
// eslint-disable-next-line react-refresh/only-export-components
export { loader } from '@/components/product-recommendations/loader';

/* v8 ignore start - decorators are covered by metadata integration tests. */
@Component('productRecommendations', {
    name: 'Einstein Product Recommendations',
    description:
        'A responsive product carousel powered by an Einstein recommender, with a useful authoring state in Page Designer.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitProductRecommendationsMetadata {
    @AttributeDefinition({
        name: 'Recommender',
        description: 'Einstein recommender configured for this placement.',
        type: 'enum',
        values: [
            'pdp-similar-items',
            'viewed-recently-einstein',
            'product-to-product-einstein',
            'complete-the-set',
            'home-top-revenue-for-category',
            'products-in-all-categories',
        ],
        defaultValue: 'products-in-all-categories',
        required: true,
    })
    recommenderName?: string;

    @AttributeDefinition({
        name: 'Heading',
        description: 'Fallback heading when Einstein does not return a display message.',
        defaultValue: 'Recommended for you',
        required: true,
    })
    recommenderTitle?: string;

    @AttributeDefinition({
        name: 'Recommendation type',
        description: 'Use zone only for a zone-based Einstein configuration.',
        type: 'enum',
        values: ['recommender', 'zone'],
        defaultValue: 'recommender',
    })
    type?: 'recommender' | 'zone';

    @AttributeDefinition({
        name: 'Supporting text',
        description: 'Optional short line displayed beneath the heading.',
    })
    subtitle?: string;
}
/* v8 ignore stop */

export interface SFNextToolkitProductRecommendationsProps extends ProductRecommendationsProps {
    /** Metadata uses `type` because the shared server loader consumes that public contract. */
    type?: 'recommender' | 'zone';
}

export default function SFNextToolkitProductRecommendations(props: SFNextToolkitProductRecommendationsProps) {
    const { isDesignMode } = usePageDesignerMode();
    const title = props.recommenderTitle?.trim();
    const name = props.recommenderName?.trim();

    if (isDesignMode && (!title || !name)) {
        return (
            <section
                data-slot="sfnext-toolkit-product-recommendations-empty"
                className="section-container py-12"
                aria-label="Einstein recommendations configuration">
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-ui border-ui border-dashed border-border bg-muted/40 px-6 text-center">
                    <span
                        className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"
                        aria-hidden="true">
                        <Sparkles className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Configure Einstein recommendations</h2>
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                            Choose a recommender and heading to preview this personalised product carousel.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const { type, ...recommendationProps } = props;
    return <ProductRecommendations {...recommendationProps} recommenderType={props.recommenderType ?? type} />;
}

export function SFNextToolkitProductRecommendationsFallback({
    recommenderTitle = 'Recommended for you',
}: {
    recommenderTitle?: string;
}) {
    return <ProductRecommendationSkeleton title={recommenderTitle} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { SFNextToolkitProductRecommendationsFallback as fallback };
