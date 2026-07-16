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
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ShopperProducts } from '@/scapi';
import { getAttributeDefinitions } from '@/lib/decorators';
import { TYPE_ID_KEY } from '@/lib/decorators/component';
import SizeGuide, { SFNextToolkitSizeGuideMetadata, SizeGuideFallback } from './index';

const mocks = vi.hoisted(() => ({
    mode: vi.fn(() => ({ isDesignMode: false, isPreviewMode: false })),
    product: vi.fn(),
    variationAttributes: vi.fn(),
}));

vi.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mocks.mode(),
}));

vi.mock('@/providers/product-context', () => ({
    useProduct: () => mocks.product(),
}));

vi.mock('@/hooks/product/use-variation-attributes', () => ({
    useVariationAttributes: () => mocks.variationAttributes(),
}));

vi.mock('@/components/link', () => ({
    Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

const product = {
    id: 'mayoral-dress-1',
    name: 'Vestido infantil de ceremonia',
    primaryCategoryId: 'girls-dresses',
} as ShopperProducts.schemas['Product'];

const sizeAttribute = {
    id: 'size',
    name: 'Talla',
    selectedValue: {},
    values: [
        { name: '8', value: '008', href: '/product/mayoral-dress-1?size=008', selected: false, orderable: true },
        { name: '10', value: '010', href: '/product/mayoral-dress-1?size=010', selected: false, orderable: true },
        { name: '12', value: '012', href: '/product/mayoral-dress-1?size=012', selected: false, orderable: false },
    ],
};

describe('SFNext Toolkit Mayoral Size Guide', () => {
    beforeEach(() => {
        mocks.mode.mockReturnValue({ isDesignMode: false, isPreviewMode: false });
        mocks.product.mockReturnValue(product);
        mocks.variationAttributes.mockReturnValue([sizeAttribute]);
    });

    test('publishes the PDP authoring contract', () => {
        expect(Reflect.getMetadata(TYPE_ID_KEY, SFNextToolkitSizeGuideMetadata)).toBe('SFNextToolkit.sizeGuide');
        const { fields } = getAttributeDefinitions(SFNextToolkitSizeGuideMetadata.prototype);

        expect(fields.productKind).toMatchObject({
            id: 'productKind',
            type: 'enum',
            values: ['auto', 'clothing', 'tops', 'bottoms', 'footwear'],
            defaultValue: 'auto',
        });
        expect(fields.sizeAttributeId).toMatchObject({ id: 'sizeAttributeId', defaultValue: 'size' });
        expect(fields.enableBrandComparison).toMatchObject({ type: 'boolean', defaultValue: true });
        expect(fields.enableMeasurements).toMatchObject({ type: 'boolean', defaultValue: true });
        expect(fields.enableAge).toMatchObject({ type: 'boolean', defaultValue: true });
    });

    test('converts a reviewed adidas size and links to the orderable PDP variant', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /sé qué talla usa en otra marca/i }));
        await user.type(screen.getByLabelText(/talla que le queda bien/i), '7-8/128');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('Tenemos una recomendación')).toBeInTheDocument();
        expect(screen.getByText('8', { selector: 'span.text-3xl' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /usar talla 8/i })).toHaveAttribute(
            'href',
            '/product/mayoral-dress-1?size=008'
        );
        expect(screen.getByText(/no guardamos ni enviamos/i)).toBeInTheDocument();
    });

    test('uses the optional measurements visible in the brand comparison', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /sé qué talla usa en otra marca/i }));
        await user.type(screen.getByLabelText(/talla que le queda bien/i), '7-8/128');
        await user.type(screen.getByLabelText('Altura'), '152');
        await user.type(screen.getByLabelText('Contorno de pecho'), '73');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('Conviene confirmar el ajuste')).toBeInTheDocument();
        expect(screen.getByText('12', { selector: 'span.text-3xl' })).toBeInTheDocument();
        expect(screen.getByText(/prevalece la medida física/i)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usar talla/i })).not.toBeInTheDocument();
    });

    test('shows inseam rather than a non-applicable chest field for bottoms comparison', async () => {
        const user = userEvent.setup();
        render(<SizeGuide productKind="bottoms" />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /sé qué talla usa en otra marca/i }));

        expect(screen.getByLabelText('Entrepierna')).toBeInTheDocument();
        expect(screen.queryByLabelText('Contorno de pecho')).not.toBeInTheDocument();
    });

    test('uses physical measurements and reports an unavailable ideal size honestly', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /puedo tomar sus medidas/i }));
        await user.type(screen.getByLabelText('Altura'), '152');
        await user.type(screen.getByLabelText('Contorno de pecho'), '73');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('La talla ideal no está disponible')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usar talla 12/i })).not.toBeInTheDocument();
        expect(screen.getByText('Sin stock')).toBeInTheDocument();
    });

    test('keeps a between-reference apparel result non-actionable until the fit is confirmed', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /puedo tomar sus medidas/i }));
        await user.type(screen.getByLabelText('Altura'), '122');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('Conviene confirmar el ajuste')).toBeInTheDocument();
        expect(screen.getByText('8', { selector: 'span.text-3xl' })).toBeInTheDocument();
        expect(screen.getByText('6', { selector: 'strong' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usar talla/i })).not.toBeInTheDocument();
    });

    test('keeps an age-only estimate orientative until height is confirmed', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /solo conozco su edad/i }));
        await user.type(screen.getByLabelText('Edad'), '8');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('Conviene confirmar el ajuste')).toBeInTheDocument();
        expect(screen.getByText(/añade altura/i)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usar talla 8/i })).not.toBeInTheDocument();
    });

    test('does not reuse hidden measurements after switching to the age method', async () => {
        const user = userEvent.setup();
        render(<SizeGuide />);

        await user.click(screen.getByRole('button', { name: /recomendar talla/i }));
        await user.click(screen.getByRole('button', { name: /puedo tomar sus medidas/i }));
        await user.type(screen.getByLabelText('Altura'), '152');
        await user.type(screen.getByLabelText('Contorno de pecho'), '73');
        await user.click(screen.getByRole('button', { name: 'Volver' }));
        await user.click(screen.getByRole('button', { name: /solo conozco su edad/i }));
        await user.type(screen.getByLabelText('Edad'), '8');
        await user.click(screen.getByRole('button', { name: /calcular recomendación/i }));

        expect(screen.getByText('Conviene confirmar el ajuste')).toBeInTheDocument();
        expect(screen.getByText('8', { selector: 'span.text-3xl' })).toBeInTheDocument();
        expect(screen.queryByText('12', { selector: 'span.text-3xl' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /usar talla/i })).not.toBeInTheDocument();
    });

    test('renders nothing without a product in live mode and an actionable placeholder while authoring', () => {
        mocks.product.mockReturnValue(null);
        const { container, rerender } = render(<SizeGuide />);
        expect(container).toBeEmptyDOMElement();

        mocks.mode.mockReturnValue({ isDesignMode: true, isPreviewMode: false });
        rerender(<SizeGuide />);
        expect(screen.getByText(/previsualiza este componente desde una PDP/i)).toBeInTheDocument();
    });

    test('uses a stable layout fallback', () => {
        const { container } = render(<SizeGuideFallback />);
        expect(container.firstElementChild).toHaveClass('h-28', 'animate-pulse');
    });
});
