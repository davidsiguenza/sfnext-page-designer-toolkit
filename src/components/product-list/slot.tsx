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
import type { DeferredProductGridProps } from '@/components/product-grid/deferred';
import { Region } from '@/components/region';
import type { PageWithComponentData } from '@/lib/page-designer/page-loader.server';
import { DEFAULT_PRODUCT_LIST_CONFIG } from './config';
import { ProductListRuntimeProvider } from './runtime-context';

export interface ProductListSlotProps {
    page: PageWithComponentData | null;
    runtime: DeferredProductGridProps;
}

/**
 * Hosts the configurable list in Page Designer. An empty region becomes a drop zone in design mode;
 * outside design mode (or on pages created before the region existed), the original product grid is rendered.
 */
export function ProductListSlot({ page, runtime }: ProductListSlotProps) {
    const fallback = <DeferredProductGrid {...runtime} tilePresentation={DEFAULT_PRODUCT_LIST_CONFIG} />;

    return (
        <ProductListRuntimeProvider value={runtime}>
            <Region page={page} regionId="plpProductList" errorElement={fallback} />
        </ProductListRuntimeProvider>
    );
}
