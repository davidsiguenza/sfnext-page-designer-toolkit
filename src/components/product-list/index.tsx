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
import DeferredProductGrid from '@/components/product-grid';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { normalizeProductListConfig, type ProductListComponentAttributes } from './config';
import { useProductListRuntime } from './runtime-context';

@Component('productList', {
    name: 'Lista de productos configurable',
    description: 'Configura la imagen y la información que se muestra en cada producto de la PLP.',
    group: 'Layout',
})
@RegionDefinition([])
export class ProductListMetadata {
    @AttributeDefinition({
        id: 'imageViewType',
        name: 'Tipo de imagen',
        description: 'Tipo de imagen de catálogo utilizado como imagen principal de cada producto.',
        type: 'enum',
        values: ['hi-res', 'large', 'medium', 'small', 'swatch'],
        defaultValue: 'medium',
    })
    imageViewType?: string;

    @AttributeDefinition({
        id: 'showBadges',
        name: 'Mostrar distintivos',
        description: 'Muestra distintivos como novedad o rebaja.',
        type: 'boolean',
        defaultValue: true,
    })
    showBadges?: boolean;

    @AttributeDefinition({
        id: 'showWishlist',
        name: 'Mostrar favoritos',
        description: 'Muestra la acción para añadir el producto a favoritos.',
        type: 'boolean',
        defaultValue: true,
    })
    showWishlist?: boolean;

    @AttributeDefinition({
        id: 'showQuickAdd',
        name: 'Mostrar compra rápida',
        description: 'Muestra la acción de compra rápida al interactuar con el producto.',
        type: 'boolean',
        defaultValue: true,
    })
    showQuickAdd?: boolean;

    @AttributeDefinition({
        id: 'showSwatches',
        name: 'Mostrar muestras de color',
        description: 'Muestra las variaciones de color utilizando imágenes de tipo swatch cuando estén disponibles.',
        type: 'boolean',
        defaultValue: true,
    })
    showSwatches?: boolean;

    @AttributeDefinition({
        id: 'showBrand',
        name: 'Mostrar marca',
        description: 'Muestra la marca configurada para el producto o el storefront.',
        type: 'boolean',
        defaultValue: true,
    })
    showBrand?: boolean;

    @AttributeDefinition({
        id: 'showCategory',
        name: 'Mostrar categoría',
        description: 'Muestra la categoría principal sobre el nombre del producto.',
        type: 'boolean',
        defaultValue: true,
    })
    showCategory?: boolean;

    @AttributeDefinition({
        id: 'showProductName',
        name: 'Mostrar nombre',
        description: 'Muestra el nombre y enlace del producto.',
        type: 'boolean',
        defaultValue: true,
    })
    showProductName?: boolean;

    @AttributeDefinition({
        id: 'showSku',
        name: 'Mostrar SKU',
        description: 'Muestra el identificador del producto.',
        type: 'boolean',
        defaultValue: true,
    })
    showSku?: boolean;

    @AttributeDefinition({
        id: 'showRating',
        name: 'Mostrar valoración',
        description: 'Muestra la valoración y el número de reseñas.',
        type: 'boolean',
        defaultValue: true,
    })
    showRating?: boolean;

    @AttributeDefinition({
        id: 'showPrice',
        name: 'Mostrar precio',
        description: 'Muestra el precio actual y, cuando corresponda, el precio anterior.',
        type: 'boolean',
        defaultValue: true,
    })
    showPrice?: boolean;

    @AttributeDefinition({
        id: 'showPromotions',
        name: 'Mostrar promociones',
        description: 'Muestra los mensajes promocionales asociados al precio.',
        type: 'boolean',
        defaultValue: true,
    })
    showPromotions?: boolean;

    @AttributeDefinition({
        id: 'maxSwatches',
        name: 'Máximo de muestras',
        description: 'Número máximo de muestras de color visibles por producto (entre 1 y 12).',
        type: 'integer',
        defaultValue: 3,
    })
    maxSwatches?: number;

    @AttributeDefinition({
        id: 'additionalAttributes',
        name: 'Atributos adicionales',
        description:
            'Hasta 5 atributos personalizados, separados por líneas o comas. Formato: material|Material o season=Temporada. El prefijo c_ es opcional.',
        type: 'text',
        defaultValue: '',
    })
    additionalAttributes?: string;
}

export default function ProductList(attributes: ProductListComponentAttributes) {
    const runtime = useProductListRuntime();
    const tilePresentation = normalizeProductListConfig(attributes);

    if (!runtime) {
        return (
            <section
                data-slot="product-list-preview"
                role="status"
                aria-label="Vista previa de la lista de productos"
                className="rounded-md border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
                La lista utilizará los productos y filtros de la categoría cuando se muestre dentro de una PLP.
            </section>
        );
    }

    return <DeferredProductGrid {...runtime} tilePresentation={tilePresentation} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export * from './config';
// eslint-disable-next-line react-refresh/only-export-components
export { ProductListRuntimeProvider, useProductListRuntime } from './runtime-context';
export { ProductListSlot } from './slot';
