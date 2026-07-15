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

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AccountOrdersLayout from './_app.account.orders';

describe('Orders section layout', () => {
    test('shows the order list when a shopper navigates to orders', () => {
        const router = createMemoryRouter(
            [
                {
                    path: '/account/orders',
                    element: <AccountOrdersLayout />,
                    children: [
                        {
                            index: true,
                            element: <div data-testid="order-list">Order List</div>,
                        },
                    ],
                },
            ],
            { initialEntries: ['/account/orders'] }
        );

        render(<RouterProvider router={router} />);

        expect(screen.getByTestId('order-list')).toBeInTheDocument();
        expect(screen.getByText('Order List')).toBeInTheDocument();
    });

    test('shows order details when a shopper clicks into a specific order', () => {
        const router = createMemoryRouter(
            [
                {
                    path: '/account/orders',
                    element: <AccountOrdersLayout />,
                    children: [
                        {
                            path: ':orderNo',
                            element: <div data-testid="order-detail">Order Detail</div>,
                        },
                    ],
                },
            ],
            { initialEntries: ['/account/orders/ORD-001'] }
        );

        render(<RouterProvider router={router} />);

        expect(screen.getByTestId('order-detail')).toBeInTheDocument();
    });
});
