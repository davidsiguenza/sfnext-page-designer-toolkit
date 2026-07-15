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
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import AuthProvider, { useAuth } from './auth';
import type { PublicSessionData } from '@/lib/api/types';

describe('providers/auth.tsx', () => {
    describe('AuthProvider', () => {
        it('should provide session data to children via useAuth hook', () => {
            const mockSessionData: PublicSessionData = {
                customerId: 'test-customer',
                userType: 'registered',
                usid: 'test-usid',
            };

            const { result } = renderHook(() => useAuth(), {
                wrapper: ({ children }) => <AuthProvider value={mockSessionData}>{children}</AuthProvider>,
            });

            expect(result.current).toEqual(mockSessionData);
            // PublicSessionData doesn't include accessToken - it's server-only
            expect(result.current?.customerId).toBe('test-customer');
            expect(result.current?.userType).toBe('registered');
        });

        it('should provide undefined when no value is passed', () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
            });

            expect(result.current).toBeUndefined();
        });
    });

    describe('useAuth', () => {
        it('should return undefined when used outside AuthProvider', () => {
            const { result } = renderHook(() => useAuth());
            expect(result.current).toBeUndefined();
        });
    });
});
