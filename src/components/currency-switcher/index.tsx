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
import { type ReactElement, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';
import { NativeSelect } from '@/components/ui/native-select';
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
import { useToast } from '@/components/toast';
import { resourceRoutes } from '@/route-paths';

/**
 * Currency Switcher Component
 *
 * Allows users to manually select a currency, which takes precedence over locale-based currency.
 * The selected currency is stored in a cookie and persists across sessions.
 *
 */
export default function CurrencySwitcher(): ReactElement {
    const id = useId();
    const { t } = useTranslation('currencySwitcher');
    const fetcher = useFetcher();
    const { site: currentSite, currency: currentCurrency } = useSite();
    const { addToast } = useToast();

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;

        // Validate: Check if currency is in supportedCurrencies
        if (!currentSite.supportedCurrencies.includes(newCurrency)) {
            addToast(t('validation.unsupportedCurrency'), 'error');
            return;
        }

        const formData = new FormData();
        formData.append('type', 'currency');
        formData.append('payload', JSON.stringify({ currency: newCurrency }));

        // Submit to server action - React Router will automatically revalidate loaders
        void fetcher.submit(formData, {
            method: 'POST',
            action: resourceRoutes.setSiteContext,
        });
    };

    return (
        <div>
            <NativeSelect id={id} onChange={handleCurrencyChange} aria-label={t('ariaLabel')} value={currentCurrency}>
                {currentSite.supportedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                        {t(`currencies.${currency}`, { defaultValue: currency })}
                    </option>
                ))}
            </NativeSelect>
        </div>
    );
}
