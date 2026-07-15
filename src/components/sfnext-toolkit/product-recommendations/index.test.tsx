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
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { getAttributeDefinitions } from '@/lib/decorators/attribute-definition';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import SFNextToolkitProductRecommendations, { SFNextToolkitProductRecommendationsMetadata } from './index';

const mockDesignMode = vi.fn(() => ({ isDesignMode: false }));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockDesignMode(),
}));

vi.mock('@/components/product-recommendations', () => ({
    default: ({ recommenderName, recommenderTitle }: { recommenderName?: string; recommenderTitle?: string }) => (
        <div data-testid="recommendations">{`${recommenderName}:${recommenderTitle}`}</div>
    ),
}));

vi.mock('@/components/product/skeletons', () => ({
    ProductRecommendationSkeleton: ({ title }: { title?: string }) => <div>{title} loading</div>,
}));

describe('SFNext Toolkit product recommendations', () => {
    test('registers safe recommender choices', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitProductRecommendationsMetadata)).toBe(
            'SFNextToolkit.productRecommendations'
        );
        const { fields } = getAttributeDefinitions(SFNextToolkitProductRecommendationsMetadata.prototype);
        expect(fields.recommenderName.values).toContain('products-in-all-categories');
        expect(fields.recommenderName.defaultValue).toBe('products-in-all-categories');
        expect(fields.type.values).toEqual(['recommender', 'zone']);
    });

    test('renders a clear Page Designer configuration state', () => {
        mockDesignMode.mockReturnValue({ isDesignMode: true });
        render(<SFNextToolkitProductRecommendations />);
        expect(screen.getByRole('heading', { name: 'Configure Einstein recommendations' })).toBeInTheDocument();
    });

    test('delegates configured recommendations to the shared storefront component', () => {
        mockDesignMode.mockReturnValue({ isDesignMode: false });
        render(
            <SFNextToolkitProductRecommendations
                recommenderName="complete-the-set"
                recommenderTitle="Complete the look"
            />
        );
        expect(screen.getByTestId('recommendations')).toHaveTextContent('complete-the-set:Complete the look');
    });
});
