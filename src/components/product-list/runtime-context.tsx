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
import { createContext, type PropsWithChildren, useContext } from 'react';
import type { DeferredProductGridProps } from '@/components/product-grid/deferred';

const ProductListRuntimeContext = createContext<DeferredProductGridProps | null>(null);

export interface ProductListRuntimeProviderProps extends PropsWithChildren {
    value: DeferredProductGridProps;
}

export function ProductListRuntimeProvider({ value, children }: ProductListRuntimeProviderProps) {
    return <ProductListRuntimeContext.Provider value={value}>{children}</ProductListRuntimeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProductListRuntime(): DeferredProductGridProps | null {
    return useContext(ProductListRuntimeContext);
}
