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
import type { PublicSessionData } from '@/lib/api/types';

/* eslint-disable react-refresh/only-export-components */

export const AuthContext = createContext<PublicSessionData | undefined>(undefined);

/**
 * Provider for public (non-sensitive) auth/session data.
 *
 * In a server-only auth architecture:
 * - Server middleware reads cookies and populates full session data
 * - Root loader extracts only non-sensitive fields (userType, customerId, usid, etc.)
 * - These non-sensitive fields are serialized and sent to the client
 * - AuthProvider makes this data available to components via useAuth()
 *
 * This provider does NOT have access to sensitive data like accessToken or refreshToken.
 * Server actions should use getAuth(context) from auth.server.ts for authenticated operations.
 */
const AuthProvider = ({ children, value }: PropsWithChildren<{ value?: PublicSessionData }>) => {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access public (non-sensitive) session data.
 *
 * Returns non-sensitive user info: userType, customerId, usid, encUserId, trackingConsent.
 * Does NOT include tokens - those are server-only.
 *
 * @returns PublicSessionData or undefined if not available
 */
export const useAuth = (): PublicSessionData | undefined => {
    return useContext(AuthContext);
};

export default AuthProvider;
