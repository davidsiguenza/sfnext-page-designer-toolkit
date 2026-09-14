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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { Link } from '@/components/link';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { cn } from '@/lib/utils';
import { normalizeSafeLinkUrl } from '../safe-link-url';
import { bounded, color, manualSchedule, remaining, type CountdownData } from './model';

// eslint-disable-next-line react-refresh/only-export-components
export { loader } from './loaders';

/* v8 ignore start -- metadata is validated by cartridge generation. */
@Component('countdownBand', {
    name: 'Countdown Band · Cuenta atrás',
    description:
        'Banda responsive con fecha manual o campaña Commerce, inicio y fin independientes, colores, tipografía y CTA opcional.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class CountdownBandMetadata {
    @AttributeDefinition({ id: 'message', name: 'Texto de la banda', type: 'string', defaultValue: 'Black Friday' })
    message?: string;

    @AttributeDefinition({
        id: 'source',
        name: 'Origen de las fechas',
        type: 'enum',
        values: ['manual', 'campaign'],
        defaultValue: 'manual',
    })
    source?: string;

    @AttributeDefinition({
        id: 'campaign',
        name: 'Campaña de Commerce',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.campaignPicker' },
    })
    campaign?: unknown;

    @AttributeDefinition({
        id: 'manualStart',
        name: 'Inicio manual: fecha, hora y zona',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownDate' },
    })
    manualStart?: unknown;

    @AttributeDefinition({
        id: 'manualEnd',
        name: 'Fin manual: fecha, hora y zona',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownDate' },
    })
    manualEnd?: unknown;

    @AttributeDefinition({
        id: 'showStart',
        name: 'Mostrar cuenta atrás hasta el inicio',
        type: 'boolean',
        defaultValue: true,
    })
    showStart?: boolean;

    @AttributeDefinition({
        id: 'showEnd',
        name: 'Mostrar cuenta atrás hasta el final',
        type: 'boolean',
        defaultValue: false,
    })
    showEnd?: boolean;

    @AttributeDefinition({
        id: 'startLabel',
        name: 'Texto antes del inicio',
        type: 'string',
        defaultValue: 'Empieza en',
    })
    startLabel?: string;

    @AttributeDefinition({ id: 'endLabel', name: 'Texto antes del final', type: 'string', defaultValue: 'Termina en' })
    endLabel?: string;

    @AttributeDefinition({
        id: 'startedLabel',
        name: 'Texto cuando ha empezado',
        type: 'string',
        defaultValue: 'Ya ha empezado',
    })
    startedLabel?: string;

    @AttributeDefinition({
        id: 'endedLabel',
        name: 'Texto cuando ha terminado',
        type: 'string',
        defaultValue: 'Campaña finalizada',
    })
    endedLabel?: string;

    @AttributeDefinition({
        id: 'endAfterStart',
        name: 'Mostrar el final solo después del inicio',
        type: 'boolean',
        defaultValue: false,
    })
    endAfterStart?: boolean;

    @AttributeDefinition({
        id: 'hideElapsed',
        name: 'Ocultar cada contador al llegar a cero',
        type: 'boolean',
        defaultValue: true,
    })
    hideElapsed?: boolean;

    @AttributeDefinition({
        id: 'hideWhenComplete',
        name: 'Ocultar toda la banda al terminar los contadores',
        type: 'boolean',
        defaultValue: true,
    })
    hideWhenComplete?: boolean;

    @AttributeDefinition({ id: 'showSeconds', name: 'Mostrar segundos', type: 'boolean', defaultValue: true })
    showSeconds?: boolean;

    @AttributeDefinition({
        id: 'height',
        name: 'Alto mínimo de la banda (px)',
        type: 'integer',
        description: 'Entre 32 y 480 px. Crece si el contenido necesita más espacio en móvil.',
        defaultValue: 104,
    })
    height?: number;

    @AttributeDefinition({ id: 'textSize', name: 'Tamaño del texto (px)', type: 'integer', defaultValue: 22 })
    textSize?: number;

    @AttributeDefinition({ id: 'digitSize', name: 'Tamaño de las cifras (px)', type: 'integer', defaultValue: 30 })
    digitSize?: number;

    @AttributeDefinition({
        id: 'fontFamily',
        name: 'Tipografía',
        type: 'enum',
        values: ['inherit', 'sans', 'serif', 'mono'],
        defaultValue: 'inherit',
    })
    fontFamily?: string;

    @AttributeDefinition({
        id: 'fontWeight',
        name: 'Peso del texto',
        type: 'enum',
        values: ['400', '500', '600', '700'],
        defaultValue: '600',
    })
    fontWeight?: string;

    @AttributeDefinition({
        id: 'alignment',
        name: 'Alineación',
        type: 'enum',
        values: ['left', 'center', 'right'],
        defaultValue: 'center',
    })
    alignment?: string;

    @AttributeDefinition({
        id: 'backgroundColor',
        name: 'Color de fondo',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownColor' },
    })
    backgroundColor?: unknown;

    @AttributeDefinition({
        id: 'textColor',
        name: 'Color del texto',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownColor' },
    })
    textColor?: unknown;

    @AttributeDefinition({ id: 'showCta', name: 'Mostrar botón CTA', type: 'boolean', defaultValue: false })
    showCta?: boolean;

    @AttributeDefinition({ id: 'ctaLabel', name: 'Texto del botón', type: 'string', defaultValue: 'Ver la campaña' })
    ctaLabel?: string;

    @AttributeDefinition({
        id: 'ctaUrl',
        name: 'Enlace a la landing de la campaña',
        type: 'url',
        description:
            'Selecciona la página o categoría destino. Una campaña Commerce no tiene una URL de storefront propia.',
    })
    ctaUrl?: string;

    @AttributeDefinition({
        id: 'ctaBackground',
        name: 'Color de fondo del botón',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownColor' },
    })
    ctaBackground?: unknown;

    @AttributeDefinition({
        id: 'ctaColor',
        name: 'Color del texto del botón',
        type: 'custom',
        editorDefinition: { type: 'SFNextToolkit.countdownColor' },
    })
    ctaColor?: unknown;

    @AttributeDefinition({ id: 'ctaNewTab', name: 'Abrir CTA en otra pestaña', type: 'boolean', defaultValue: false })
    ctaNewTab?: boolean;
}
/* v8 ignore stop */

export interface CountdownBandProps extends CountdownBandMetadata {
    data?: CountdownData;
    className?: string;
}

const FONTS: Record<string, string> = {
    inherit: 'inherit',
    sans: 'var(--font-sans, sans-serif)',
    serif: 'var(--font-serif, Georgia, serif)',
    mono: 'var(--font-mono, monospace)',
};
const ALIGNMENTS: Record<string, string> = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
};
const UNITS: Record<string, string[]> = {
    es: ['Días', 'Horas', 'Min', 'Seg'],
    en: ['Days', 'Hours', 'Min', 'Sec'],
    pt: ['Dias', 'Horas', 'Min', 'Seg'],
    fr: ['Jours', 'Heures', 'Min', 'Sec'],
    de: ['Tage', 'Stunden', 'Min', 'Sek'],
    it: ['Giorni', 'Ore', 'Min', 'Sec'],
};

const subscribeToPreview = () => () => undefined;
const serverPreviewTime = () => null;

export default function CountdownBand(props: CountdownBandProps) {
    const { isDesignMode } = usePageDesignerMode();
    const { i18n } = useTranslation();
    const [liveClock, setClock] = useState<number | null>(props.data?.now ?? null);
    const previewLocal = props.data?.previewLocal;
    // BM itself derives the merchant timezone from the browser. SSR cannot
    // know it: render dashes until hydration, then resolve in that same zone.
    const localPreviewClock = useSyncExternalStore(
        subscribeToPreview,
        () => (previewLocal ? Date.parse(previewLocal) : null),
        serverPreviewTime
    );
    const previewClock = props.data?.previewNow;
    const datedPreview = !!previewLocal || previewClock !== undefined;
    const clock = previewLocal ? localPreviewClock : (previewClock ?? liveClock);
    // The native full-store Preview uses mode=EDIT too. A dated preview must
    // follow the simulated campaign phase instead of keeping expired editors.
    const preserveForEditing = isDesignMode && !datedPreview;
    const schedule =
        props.data ??
        (props.source === 'campaign'
            ? { status: 'unavailable', start: null, end: null }
            : manualSchedule(props.manualStart, props.manualEnd));
    const showStart = props.showStart !== false;
    const showEnd = props.showEnd === true;
    const hideElapsed = props.hideElapsed !== false;
    const selected = [showStart ? schedule.start : null, showEnd ? schedule.end : null].filter(
        (value): value is number => typeof value === 'number' && Number.isFinite(value)
    );
    const lastDeadline = selected.length ? Math.max(...selected) : null;
    const complete = clock !== null && lastDeadline !== null && clock >= lastDeadline;

    useEffect(() => {
        // Preview is a snapshot at the merchant's selected instant, including
        // when a new preview date arrives without remounting this component.
        if (datedPreview) return;
        const tick = () => setClock(Date.now());
        tick();
        if (complete || !selected.length) return;
        const timer = window.setInterval(tick, 1000);
        document.addEventListener('visibilitychange', tick);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', tick);
        };
    }, [complete, lastDeadline, selected.length, datedPreview]);

    const invalid = schedule.status !== 'ready' || !selected.length;
    if (!preserveForEditing && (invalid || (complete && props.hideWhenComplete !== false))) return null;

    const style: CSSProperties = {
        minHeight: bounded(props.height, 104, 32, 480),
        backgroundColor: color(props.backgroundColor, 'var(--primary)'),
        color: color(props.textColor, 'var(--primary-foreground)'),
        fontFamily: FONTS[props.fontFamily ?? 'inherit'] ?? 'inherit',
        fontWeight: ['400', '500', '600', '700'].includes(props.fontWeight ?? '') ? Number(props.fontWeight) : 600,
    };
    const unitLabels = UNITS[i18n.language?.split('-')[0]] ?? UNITS.en;
    const ctaUrl = normalizeSafeLinkUrl(props.ctaUrl);
    const timers = [
        {
            key: 'start',
            target: schedule.start,
            enabled: showStart,
            label: props.startLabel ?? 'Empieza en',
            done: props.startedLabel ?? 'Ya ha empezado',
        },
        {
            key: 'end',
            target: schedule.end,
            enabled: showEnd,
            label: props.endLabel ?? 'Termina en',
            done: props.endedLabel ?? 'Campaña finalizada',
        },
    ];
    return (
        <div className={props.className} data-slot="sfnext-toolkit-countdown-band">
            {isDesignMode && invalid && (
                <p className="border border-dashed border-border bg-muted p-3 text-sm text-foreground" role="status">
                    {schedule.status === 'disabled'
                        ? 'La campaña está desactivada.'
                        : schedule.status === 'invalid'
                          ? 'El final debe ser posterior al inicio.'
                          : props.source === 'campaign'
                            ? 'Selecciona una campaña con fechas válidas y un contador activo.'
                            : 'Configura una fecha y activa el contador de inicio, de final o ambos.'}
                </p>
            )}
            <div
                style={style}
                className={cn(
                    'flex w-full min-w-0 flex-wrap items-center gap-x-8 gap-y-5 px-5 py-4',
                    ALIGNMENTS[props.alignment ?? 'center'] ?? ALIGNMENTS.center
                )}>
                {props.message && (
                    <p
                        className="m-0 max-w-full break-words leading-tight"
                        style={{ fontSize: bounded(props.textSize, 22, 12, 64) }}>
                        {props.message}
                    </p>
                )}
                {timers.map(({ key, target, enabled, label, done }) => {
                    if (!enabled || target === null || !Number.isFinite(target)) return null;
                    if (
                        key === 'end' &&
                        props.endAfterStart &&
                        schedule.start !== null &&
                        (clock === null || clock < schedule.start) &&
                        !preserveForEditing
                    )
                        return null;
                    const parts = remaining(target, clock ?? target - 1000);
                    if (parts.expired && hideElapsed && !preserveForEditing) return null;
                    return (
                        <div key={key} data-countdown={key} className="flex min-w-0 flex-col gap-1.5 text-center">
                            <span className="text-xs font-medium tracking-wide">{parts.expired ? done : label}</span>
                            <time
                                dateTime={new Date(target).toISOString()}
                                role="timer"
                                aria-live="off"
                                aria-label={`${label}: ${new Date(target).toISOString()}`}
                                className="flex max-w-full flex-wrap items-start justify-center gap-2 tabular-nums">
                                {[
                                    parts.days,
                                    parts.hours,
                                    parts.minutes,
                                    ...(props.showSeconds !== false ? [parts.seconds] : []),
                                ].map((value, index) => (
                                    <span key={unitLabels[index]} className="flex min-w-[2ch] flex-col items-center">
                                        <span
                                            className="font-semibold leading-none"
                                            style={{ fontSize: bounded(props.digitSize, 30, 16, 72) }}>
                                            {clock === null ? '––' : String(value).padStart(2, '0')}
                                        </span>
                                        <span className="mt-1 text-[10px] font-normal uppercase tracking-wider opacity-80">
                                            {unitLabels[index]}
                                        </span>
                                    </span>
                                ))}
                            </time>
                        </div>
                    );
                })}
                {props.showCta && props.ctaLabel?.trim() && ctaUrl && (
                    <Link
                        to={ctaUrl}
                        target={props.ctaNewTab ? '_blank' : undefined}
                        rel={props.ctaNewTab ? 'noopener noreferrer' : undefined}
                        className="inline-flex min-h-11 max-w-full items-center justify-center rounded-ui px-5 py-2.5 text-center text-sm font-semibold break-words transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                        style={{
                            backgroundColor: color(props.ctaBackground, 'var(--primary-foreground)'),
                            color: color(props.ctaColor, 'var(--primary)'),
                        }}>
                        {props.ctaLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}

export function CountdownBandFallback({ height }: CountdownBandProps) {
    return (
        <div
            aria-hidden="true"
            className="w-full animate-pulse bg-muted"
            style={{ minHeight: bounded(height, 104, 32, 480) }}
        />
    );
}
// eslint-disable-next-line react-refresh/only-export-components
export { CountdownBandFallback as fallback };
