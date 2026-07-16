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
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageDesignerProvider } from '@salesforce/storefront-next-runtime/design/react/core';
import SiteTheme from '..';
import type { SiteThemeValue } from '../model';

const WARM_EDITORIAL_THEME: SiteThemeValue = {
    version: 1,
    preset: 'warmEditorial',
    autoContrast: true,
    tokens: {
        background: '#FFFDF9',
        foreground: '#211B18',
        card: '#FFFFFF',
        'card-foreground': '#211B18',
        primary: '#8A1538',
        'primary-foreground': '#FFFFFF',
        secondary: '#F4E8E2',
        'secondary-foreground': '#3B2529',
        tertiary: '#285C4D',
        'tertiary-foreground': '#FFFFFF',
        accent: '#F0D6C8',
        'accent-foreground': '#3B2529',
        'header-background': '#26141B',
        'header-foreground': '#FFFFFF',
        'footer-background': '#F4E8E2',
        'footer-foreground': '#211B18',
    },
};

const MIDNIGHT_THEME: SiteThemeValue = {
    version: 1,
    preset: 'midnight',
    autoContrast: true,
    tokens: {
        background: '#0D1321',
        foreground: '#F7F9FC',
        card: '#151E32',
        'card-foreground': '#F7F9FC',
        muted: '#202B43',
        'muted-foreground': '#C4CCDA',
        primary: '#87BFFF',
        'primary-foreground': '#0D1321',
        secondary: '#243653',
        'secondary-foreground': '#F7F9FC',
        tertiary: '#70D6B3',
        'tertiary-foreground': '#0D1321',
        accent: '#334A70',
        'accent-foreground': '#F7F9FC',
        border: '#52617A',
        'border-subtle': '#384760',
        'header-background': '#080D17',
        'header-foreground': '#F7F9FC',
        'footer-background': '#080D17',
        'footer-foreground': '#F7F9FC',
    },
};

function AuthoringMode({ children }: { children: ReactNode }) {
    return (
        <PageDesignerProvider
            clientId="sfnext-toolkit-site-theme-story"
            targetOrigin={globalThis.location?.origin ?? 'http://localhost'}
            clientConnectionTimeout={1}
            clientConnectionInterval={1}
            mode="EDIT">
            {children}
        </PageDesignerProvider>
    );
}

const meta: Meta<typeof SiteTheme> = {
    title: 'SFNextToolkit/Site Theme',
    component: SiteTheme,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof SiteTheme>;

export const WarmEditorial: Story = {
    render: () => (
        <AuthoringMode>
            <SiteTheme theme={WARM_EDITORIAL_THEME} />
        </AuthoringMode>
    ),
};

export const Midnight: Story = {
    render: () => (
        <AuthoringMode>
            <SiteTheme theme={MIDNIGHT_THEME} />
        </AuthoringMode>
    ),
};

export const Disabled: Story = {
    render: () => (
        <AuthoringMode>
            <SiteTheme enabled={false} theme={WARM_EDITORIAL_THEME} />
        </AuthoringMode>
    ),
};

export const Snapshot: Story = {
    name: 'Snapshot',
    render: () => (
        <AuthoringMode>
            <div data-slot="site-theme-story-snapshot" className="grid gap-8 bg-background p-6">
                <SiteTheme theme={WARM_EDITORIAL_THEME} />
                <SiteTheme theme={MIDNIGHT_THEME} />
                <SiteTheme enabled={false} theme={WARM_EDITORIAL_THEME} />
            </div>
        </AuthoringMode>
    ),
};
