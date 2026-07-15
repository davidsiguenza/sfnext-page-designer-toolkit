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
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordRequirement } from '@/components/password-requirements';
import { usePasswordValidation } from '@/hooks/use-password-validation';
import { type SignupFormProps } from './types';
import { useTranslation } from 'react-i18next';
import { UITarget } from '@/targets/ui-target';

export function SignupForm({ error, isPasswordless = false }: SignupFormProps) {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const {
        password,
        confirmPassword,
        showPasswordMismatch,
        handlePasswordChange,
        handleConfirmPasswordChange,
        isFormValid,
    } = usePasswordValidation();
    const { t } = useTranslation('signup');

    // Shows password fields if passwordless is disabled or the user has clicked the "Create account with password" button
    const showPasswordFields = !isPasswordless || showPasswordForm;
    // Only password fields are checked for validity. When passwordless, form is always valid.
    const submitDisabled = showPasswordFields && !isFormValid;

    return (
        <>
            {error && (
                <div className="mb-4 p-3 rounded-ui bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                            {t('form.firstNameLabel')}
                        </label>
                        <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            autoComplete="given-name"
                            required
                            className="mt-1"
                            placeholder={t('form.firstNamePlaceholder')}
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                            {t('form.lastNameLabel')}
                        </label>
                        <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoComplete="family-name"
                            required
                            className="mt-1"
                            placeholder={t('form.lastNamePlaceholder')}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        {t('form.emailLabel')}
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="mt-1"
                        placeholder={t('form.emailPlaceholder')}
                    />
                </div>

                {showPasswordFields && (
                    <>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                {t('form.passwordLabel')}
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={handlePasswordChange}
                                className="mt-1"
                                placeholder={t('form.passwordPlaceholder')}
                            />
                            <PasswordRequirement password={password} />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                                {t('form.confirmPasswordLabel')}
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className="mt-1"
                                aria-invalid={showPasswordMismatch && confirmPassword ? true : undefined}
                                placeholder={t('form.confirmPasswordPlaceholder')}
                            />
                            {showPasswordMismatch && confirmPassword && (
                                <p className="mt-1 text-sm text-destructive">{t('passwordsDoNotMatch')}</p>
                            )}
                        </div>
                    </>
                )}

                {isPasswordless && (
                    <input
                        type="hidden"
                        name="registrationMode"
                        value={showPasswordForm ? 'password' : 'passwordless'}
                    />
                )}

                <UITarget targetId="sfcc.userRegistration.consent.marketing" />
                <UITarget targetId="sfcc.userRegistration.consent.tos" />
                <UITarget targetId="sfcc.userRegistration.loyalty.enrollment" />
                <UITarget targetId="sfcc.userRegistration.identity.verification" />
                <UITarget targetId="sfcc.userRegistration.address.autocomplete" />

                <div>
                    <Button
                        type="submit"
                        disabled={submitDisabled}
                        className="w-full"
                        variant={submitDisabled ? 'secondary' : 'default'}>
                        {showPasswordFields ? t('form.createAccountButton') : t('form.continueButton')}
                    </Button>
                </div>

                {isPasswordless && (
                    <div className="space-y-3">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/60" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {t('form.orSeparator')}
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}>
                            {showPasswordForm ? t('form.continueWithoutPassword') : t('form.createAccountWithPassword')}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
