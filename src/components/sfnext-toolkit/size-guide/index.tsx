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
import { type ComponentPropsWithoutRef, type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import type { ComponentDesignMetadata } from '@salesforce/storefront-next-runtime/design/react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import {
    ArrowLeft,
    Baby,
    Check,
    ChevronRight,
    Footprints,
    Info,
    RotateCcw,
    Ruler,
    ShieldCheck,
    Shirt,
    Sparkles,
    Tags,
    TriangleAlert,
} from 'lucide-react';
import type { ShopperProducts } from '@/scapi';
import { Link } from '@/components/link';
import type { ComponentType } from '@/components/region';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { useVariationAttributes, type VariationAttribute } from '@/hooks/product/use-variation-attributes';
import { useProduct } from '@/providers/product-context';
import { cn } from '@/lib/utils';
import {
    MAYORAL_APPAREL_SIZES,
    MAYORAL_FOOTWEAR_SIZES,
    SOURCE_APPAREL_SIZES,
    SOURCE_FOOTWEAR_SIZES,
    type SourceBrand,
} from './data';
import {
    recommendMayoralSize,
    type RecommendationConfidence,
    type RecommendationStatus,
    type SizeGuideProductCategory,
    type SizeRecommendation,
} from './recommendation';

const PRODUCT_KINDS = ['auto', 'clothing', 'tops', 'bottoms', 'footwear'] as const;
const AUDIENCES = ['kids', 'teen'] as const;
const SOURCE_BRAND_ORDER = ['adidas', 'nike', 'vans', 'new-balance'] as const satisfies readonly SourceBrand[];
const SOURCE_BRAND_LABELS: Record<SourceBrand, string> = {
    adidas: 'Adidas',
    nike: 'Nike',
    vans: 'Vans',
    'new-balance': 'New Balance',
};
type ProductKind = (typeof PRODUCT_KINDS)[number];
type Method = 'brand' | 'measurements' | 'age';
type Step = 'method' | 'form' | 'result';

/* v8 ignore start - decorators are verified through the generated metadata contract. */
@Component('sizeGuide', {
    name: 'Mayoral Size Guide',
    description:
        'Modern PDP fit finder using reviewed Mayoral measurements and explicit child-size comparisons with other brands.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitSizeGuideMetadata {
    @AttributeDefinition({
        id: 'title',
        name: 'Title',
        type: 'string',
        defaultValue: 'Encuentra su talla ideal',
    })
    title?: string;

    @AttributeDefinition({
        id: 'description',
        name: 'Description',
        type: 'text',
        defaultValue: 'Compara otra marca o usa sus medidas. Tardarás menos de un minuto.',
    })
    description?: string;

    @AttributeDefinition({
        id: 'buttonLabel',
        name: 'Button label',
        type: 'string',
        defaultValue: 'Recomendar talla',
    })
    buttonLabel?: string;

    @AttributeDefinition({
        id: 'productKind',
        name: 'Product kind',
        description:
            'Auto detects common footwear and bottoms terms. Select an explicit kind when catalog naming differs.',
        type: 'enum',
        values: ['auto', 'clothing', 'tops', 'bottoms', 'footwear'],
        defaultValue: 'auto',
    })
    productKind?: string;

    @AttributeDefinition({
        id: 'audience',
        name: 'Audience',
        description: 'The reviewed dataset covers Mayoral children and teen references only.',
        type: 'enum',
        values: ['kids', 'teen'],
        defaultValue: 'kids',
    })
    audience?: string;

    @AttributeDefinition({
        id: 'collection',
        name: 'Collection',
        description: 'Optional collection identifier. Boston x Mayoral has a reviewed size-8 override.',
        type: 'string',
    })
    collection?: string;

    @AttributeDefinition({
        id: 'sizeAttributeId',
        name: 'Size variation attribute ID',
        description: 'Catalog variation attribute used to read availability and select the recommended size.',
        type: 'string',
        defaultValue: 'size',
    })
    sizeAttributeId?: string;

    @AttributeDefinition({
        id: 'enableBrandComparison',
        name: 'Enable other-brand comparison',
        type: 'boolean',
        defaultValue: true,
    })
    enableBrandComparison?: boolean;

    @AttributeDefinition({
        id: 'enableMeasurements',
        name: 'Enable physical measurements',
        type: 'boolean',
        defaultValue: true,
    })
    enableMeasurements?: boolean;

    @AttributeDefinition({
        id: 'enableAge',
        name: 'Enable age estimate',
        description: 'Age-only results are always marked as low confidence.',
        type: 'boolean',
        defaultValue: true,
    })
    enableAge?: boolean;
}
/* v8 ignore stop */

export interface SizeGuideProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
    title?: string;
    description?: string;
    buttonLabel?: string;
    productKind?: string;
    audience?: string;
    collection?: string;
    sizeAttributeId?: string;
    enableBrandComparison?: boolean;
    enableMeasurements?: boolean;
    enableAge?: boolean;
    /** Optional direct product for stories and isolated composition; PDP normally supplies ProductProvider. */
    product?: ShopperProducts.schemas['Product'];

    regionId?: string;
    component?: ComponentType;
    componentData?: Record<string, Promise<unknown>>;
    designMetadata?: ComponentDesignMetadata;
    data?: unknown;
}

interface MethodOption {
    id: Method;
    title: string;
    copy: string;
    icon: ReactNode;
}

interface FormValues {
    brand: string;
    knownSize: string;
    height: string;
    chest: string;
    inseam: string;
    leftFootLength: string;
    rightFootLength: string;
    age: string;
}

const INITIAL_FORM: FormValues = {
    brand: 'adidas',
    knownSize: '',
    height: '',
    chest: '',
    inseam: '',
    leftFootLength: '',
    rightFootLength: '',
    age: '',
};

const STATUS_COPY: Record<RecommendationStatus, { title: string; copy: string }> = {
    recommended: {
        title: 'Tenemos una recomendación',
        copy: 'Las referencias disponibles apuntan de forma consistente a esta talla.',
    },
    recommended_with_alternative: {
        title: 'Esta es la mejor opción',
        copy: 'Hay una talla cercana que también puede encajar según el ajuste que prefieras.',
    },
    needs_measurement: {
        title: 'Necesitamos una medida más',
        copy: 'La equivalencia disponible no es lo bastante precisa para inventar una talla.',
    },
    needs_confirmation: {
        title: 'Conviene confirmar el ajuste',
        copy: 'Las referencias no coinciden del todo. Te mostramos la orientación sin ocultar la duda.',
    },
    ideal_unavailable: {
        title: 'La talla ideal no está disponible',
        copy: 'No sustituimos silenciosamente la talla recomendada por otra que sí tenga stock.',
    },
    out_of_coverage: {
        title: 'Fuera de la cobertura actual',
        copy: 'Estas medidas no están dentro de las tablas verificadas que usa el recomendador.',
    },
};

const CONFIDENCE_COPY: Record<RecommendationConfidence, string> = {
    high: 'Confianza alta',
    'medium-high': 'Confianza media-alta',
    medium: 'Confianza media',
    low: 'Confianza baja',
    none: 'Sin confianza suficiente',
};

const MEASUREMENT_LABELS: Record<string, string> = {
    height: 'altura',
    chest: 'pecho',
    inseam: 'entrepierna',
    footLength: 'longitud del pie',
    waist: 'cintura',
    hip: 'cadera',
};

function normalizeOption<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return value && values.includes(value as T) ? (value as T) : fallback;
}

function resolveProductCategory(
    configuredKind: ProductKind,
    product: ShopperProducts.schemas['Product']
): SizeGuideProductCategory {
    if (configuredKind !== 'auto') return configuredKind;

    const haystack = [product.primaryCategoryId, product.name, product.shortDescription]
        .filter(Boolean)
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (/(shoe|footwear|sneaker|trainer|boot|sandal|zapato|calzado|zapatilla|bota|sandalia)/.test(haystack)) {
        return 'footwear';
    }
    if (/(trouser|pants|jean|shorts|legging|pantalon|vaquero|bermuda)/.test(haystack)) return 'bottoms';
    if (/(shirt|sweater|sweatshirt|camisa|camiseta|jersey|sudadera)/.test(haystack)) return 'tops';
    return 'clothing';
}

function normalizeSizeLabel(value: string): string {
    const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(?:talla|eu)\s*/, '')
        .replace(/\s*(?:anos|years)$/, '')
        .trim();
    return /^0+\d+$/.test(normalized) ? String(Number(normalized)) : normalized;
}

function findSizeAttribute(attributes: VariationAttribute[], id: string): VariationAttribute | undefined {
    const normalizedId = id.trim().toLowerCase();
    return attributes.find((attribute) => attribute.id.toLowerCase() === normalizedId);
}

function getAvailableSizeLabels(
    attribute: VariationAttribute | undefined,
    category: SizeGuideProductCategory
): string[] {
    if (!attribute) {
        return (category === 'footwear' ? MAYORAL_FOOTWEAR_SIZES : MAYORAL_APPAREL_SIZES).map((row) => row.size);
    }
    return attribute.values
        .filter((value) => value.orderable !== false)
        .flatMap((value) => [value.name, value.value])
        .filter(Boolean);
}

function getSelectableSize(attribute: VariationAttribute | undefined, size: string | undefined) {
    if (!attribute || !size) return undefined;
    const normalizedSize = normalizeSizeLabel(size);
    return attribute.values.find(
        (value) =>
            value.orderable !== false &&
            (normalizeSizeLabel(value.name) === normalizedSize || normalizeSizeLabel(value.value) === normalizedSize)
    );
}

interface VerifiedSourceSizeOption {
    value: string;
    label: string;
}

function getVerifiedSourceBrands(category: SizeGuideProductCategory): SourceBrand[] {
    const rows: readonly { brand: SourceBrand }[] =
        category === 'footwear' ? SOURCE_FOOTWEAR_SIZES : SOURCE_APPAREL_SIZES;
    const availableBrands = new Set(rows.map((row) => row.brand));
    return SOURCE_BRAND_ORDER.filter((brand) => availableBrands.has(brand));
}

function getVerifiedSourceSizeLabel(brand: SourceBrand, size: string, category: SizeGuideProductCategory): string {
    if (category === 'footwear') return `EU ${size} infantil`;
    if (brand === 'adidas' && size === '7-8/128') return '7–8 años / 128 cm';
    if (brand === 'nike' && size === 'S/8-10') return 'S infantil / 8–10 años';
    if (brand === 'vans' && size === 'Boys S/US 8') return 'Niño: S / US 8';
    if (brand === 'vans' && size === 'Girls S/US 7-8') return 'Niña: S / US 7–8';
    return size;
}

function getVerifiedSourceSizes(category: SizeGuideProductCategory, selectedBrand: string): VerifiedSourceSizeOption[] {
    const rows: readonly { brand: SourceBrand; size: string }[] =
        category === 'footwear' ? SOURCE_FOOTWEAR_SIZES : SOURCE_APPAREL_SIZES;
    return rows
        .filter((row) => row.brand === selectedBrand)
        .map((row) => ({
            value: row.size,
            label: getVerifiedSourceSizeLabel(row.brand, row.size, category),
        }));
}

function Field({
    id,
    label,
    suffix,
    ...props
}: ComponentPropsWithoutRef<typeof Input> & { label: string; suffix?: string }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input id={id} inputMode="decimal" {...props} className={cn(suffix && 'pr-12', props.className)} />
                {suffix && (
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

function MethodCard({ option, onSelect }: { option: MethodOption; onSelect: (method: Method) => void }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(option.id)}
            className="group flex w-full items-center gap-4 rounded-ui border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                {option.icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-semibold text-card-foreground">{option.title}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{option.copy}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
    );
}

function SizeGuideDialog({
    product,
    title,
    description,
    buttonLabel,
    productKind,
    audience,
    collection,
    sizeAttributeId,
    enableBrandComparison,
    enableMeasurements,
    enableAge,
}: Required<
    Pick<
        SizeGuideProps,
        | 'title'
        | 'description'
        | 'buttonLabel'
        | 'productKind'
        | 'audience'
        | 'sizeAttributeId'
        | 'enableBrandComparison'
        | 'enableMeasurements'
        | 'enableAge'
    >
> & {
    product: ShopperProducts.schemas['Product'];
    collection?: string;
}) {
    const formId = useId();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('method');
    const [method, setMethod] = useState<Method>('brand');
    const [form, setForm] = useState<FormValues>(INITIAL_FORM);
    const [result, setResult] = useState<SizeRecommendation>();
    const category = resolveProductCategory(normalizeOption(productKind, PRODUCT_KINDS, 'auto'), product);
    const variationAttributes = useVariationAttributes({ product });
    const sizeAttribute = findSizeAttribute(variationAttributes, sizeAttributeId || 'size');
    const availableSizes = useMemo(() => getAvailableSizeLabels(sizeAttribute, category), [category, sizeAttribute]);
    const selectableSize = getSelectableSize(sizeAttribute, result?.recommendedSize);
    const isFootwear = category === 'footwear';
    const verifiedBrands = useMemo(() => getVerifiedSourceBrands(category), [category]);
    const verifiedSourceSizes = useMemo(() => getVerifiedSourceSizes(category, form.brand), [category, form.brand]);

    const methods = useMemo<MethodOption[]>(() => {
        const options: MethodOption[] = [];
        if (enableBrandComparison) {
            options.push({
                id: 'brand',
                title: 'Sé qué talla usa en otra marca',
                copy: 'Compara solo equivalencias infantiles revisadas; nunca copiamos el número sin más.',
                icon: <Tags className="size-5" />,
            });
        }
        if (enableMeasurements) {
            options.push({
                id: 'measurements',
                title: isFootwear ? 'Puedo medir sus pies' : 'Puedo tomar sus medidas',
                copy: isFootwear
                    ? 'Mide ambos pies en centímetros y usaremos el más largo.'
                    : 'La altura es la referencia principal; pecho o entrepierna afinan el resultado.',
                icon: isFootwear ? <Footprints className="size-5" /> : <Ruler className="size-5" />,
            });
        }
        if (enableAge && !isFootwear) {
            options.push({
                id: 'age',
                title: 'Solo conozco su edad',
                copy: 'Obtén una orientación rápida, siempre marcada como confianza baja.',
                icon: <Baby className="size-5" />,
            });
        }
        return options;
    }, [enableAge, enableBrandComparison, enableMeasurements, isFootwear]);

    const update = (key: keyof FormValues, value: string) => setForm((current) => ({ ...current, [key]: value }));
    const reset = () => {
        setStep('method');
        setMethod(methods[0]?.id ?? 'measurements');
        setForm(INITIAL_FORM);
        setResult(undefined);
    };
    const changeOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
    };
    const chooseMethod = (selectedMethod: Method) => {
        setMethod(selectedMethod);
        setStep('form');
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const measurements = isFootwear
            ? {
                  leftFootLength: form.leftFootLength || undefined,
                  rightFootLength: form.rightFootLength || undefined,
              }
            : category === 'bottoms'
              ? {
                    height: form.height || undefined,
                    inseam: form.inseam || undefined,
                }
              : {
                    height: form.height || undefined,
                    chest: form.chest || undefined,
                };
        const hasVisibleMeasurements = Object.values(measurements).some(Boolean);
        const nextResult = recommendMayoralSize({
            target: {
                audience: normalizeOption(audience, AUDIENCES, 'kids'),
                category,
                collection: collection?.trim() || undefined,
            },
            availableSizes,
            knownSize:
                method === 'brand'
                    ? {
                          brand: form.brand,
                          audience: 'kids',
                          category: isFootwear ? 'footwear' : 'clothing',
                          size: form.knownSize,
                          sizeSystem: isFootwear ? 'eu' : 'brand',
                          fitsWell: true,
                      }
                    : undefined,
            measurements:
                method === 'measurements' || (method === 'brand' && hasVisibleMeasurements) ? measurements : undefined,
            ageYears: method === 'age' && form.age ? Number.parseFloat(form.age.replace(',', '.')) : undefined,
        });
        setResult(nextResult);
        setStep('result');
    };

    const status = result ? STATUS_COPY[result.status] : undefined;
    const canSelect =
        result &&
        (result.status === 'recommended' || result.status === 'recommended_with_alternative') &&
        selectableSize;

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/30 py-0 shadow-none">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-ui">
                        <Ruler className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold tracking-tight text-card-foreground">{title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                    </div>
                    <DialogTrigger asChild>
                        <Button type="button" className="w-full sm:w-auto">
                            <Sparkles />
                            {buttonLabel}
                        </Button>
                    </DialogTrigger>
                </CardContent>
            </Card>

            <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20 px-6 pb-5 pt-6">
                    <div className="mb-5 flex items-center gap-3 pr-8">
                        {step !== 'method' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Volver"
                                onClick={() => setStep(step === 'result' ? 'form' : 'method')}>
                                <ArrowLeft />
                            </Button>
                        )}
                        <div className="flex gap-1.5" aria-label="Progreso">
                            {(['method', 'form', 'result'] as const).map((item, index) => {
                                const currentIndex = ['method', 'form', 'result'].indexOf(step);
                                return (
                                    <span
                                        key={item}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all',
                                            index <= currentIndex ? 'w-8 bg-primary' : 'w-5 bg-border'
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-2xl tracking-tight">
                            {step === 'method'
                                ? '¿Qué información tienes?'
                                : step === 'form'
                                  ? method === 'brand'
                                      ? 'Compara su talla habitual'
                                      : method === 'measurements'
                                        ? isFootwear
                                            ? 'Mide ambos pies'
                                            : 'Añade sus medidas'
                                        : 'Indica su edad'
                                  : status?.title}
                        </DialogTitle>
                        <DialogDescription className="leading-5">
                            {step === 'method'
                                ? `${product.name || 'Este producto'} · ${isFootwear ? 'calzado infantil' : 'moda infantil'}`
                                : step === 'form'
                                  ? 'Los datos se usan únicamente en tu navegador para calcular esta recomendación.'
                                  : status?.copy}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    {step === 'method' && (
                        <div className="space-y-3">
                            {methods.map((option) => (
                                <MethodCard key={option.id} option={option} onSelect={chooseMethod} />
                            ))}
                            {methods.length === 0 && (
                                <p className="rounded-ui border border-border bg-muted p-4 text-sm text-muted-foreground">
                                    Activa al menos un método en la configuración del componente.
                                </p>
                            )}
                        </div>
                    )}

                    {step === 'form' && (
                        <form id={formId} onSubmit={submit} className="space-y-5">
                            {method === 'brand' && (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor={`${formId}-brand`}>Marca</Label>
                                            <NativeSelect
                                                id={`${formId}-brand`}
                                                value={form.brand}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        brand: event.target.value,
                                                        knownSize: '',
                                                    }))
                                                }
                                                className="w-full">
                                                {verifiedBrands.map((brand) => (
                                                    <NativeSelectOption key={brand} value={brand}>
                                                        {SOURCE_BRAND_LABELS[brand]}
                                                    </NativeSelectOption>
                                                ))}
                                            </NativeSelect>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`${formId}-known-size`}>
                                                Talla infantil que le queda bien
                                            </Label>
                                            <NativeSelect
                                                id={`${formId}-known-size`}
                                                value={form.knownSize}
                                                onChange={(event) => update('knownSize', event.target.value)}
                                                aria-describedby={`${formId}-known-size-help`}
                                                className="w-full"
                                                required>
                                                <NativeSelectOption value="" disabled>
                                                    Selecciona una talla
                                                </NativeSelectOption>
                                                {verifiedSourceSizes.map((option) => (
                                                    <NativeSelectOption key={option.value} value={option.value}>
                                                        {option.label}
                                                    </NativeSelectOption>
                                                ))}
                                            </NativeSelect>
                                            <p
                                                id={`${formId}-known-size-help`}
                                                className="text-xs leading-4 text-muted-foreground">
                                                Solo aparecen equivalencias infantiles verificadas. Si su talla no está
                                                en la lista, usa el método de medidas.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-ui border border-border-subtle bg-muted/60 p-4">
                                        <p className="mb-3 text-sm font-medium">Opcional: afina la comparación</p>
                                        {isFootwear ? (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    id={`${formId}-brand-left-foot`}
                                                    label="Pie izquierdo"
                                                    suffix="cm"
                                                    value={form.leftFootLength}
                                                    onChange={(event) => update('leftFootLength', event.target.value)}
                                                />
                                                <Field
                                                    id={`${formId}-brand-right-foot`}
                                                    label="Pie derecho"
                                                    suffix="cm"
                                                    value={form.rightFootLength}
                                                    onChange={(event) => update('rightFootLength', event.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    id={`${formId}-brand-height`}
                                                    label="Altura"
                                                    suffix="cm"
                                                    value={form.height}
                                                    onChange={(event) => update('height', event.target.value)}
                                                />
                                                {category === 'bottoms' ? (
                                                    <Field
                                                        id={`${formId}-brand-inseam`}
                                                        label="Entrepierna"
                                                        suffix="cm"
                                                        value={form.inseam}
                                                        onChange={(event) => update('inseam', event.target.value)}
                                                    />
                                                ) : (
                                                    <Field
                                                        id={`${formId}-brand-chest`}
                                                        label="Contorno de pecho"
                                                        suffix="cm"
                                                        value={form.chest}
                                                        onChange={(event) => update('chest', event.target.value)}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {method === 'measurements' &&
                                (isFootwear ? (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field
                                                id={`${formId}-left-foot`}
                                                label="Pie izquierdo"
                                                suffix="cm"
                                                value={form.leftFootLength}
                                                onChange={(event) => update('leftFootLength', event.target.value)}
                                                required
                                            />
                                            <Field
                                                id={`${formId}-right-foot`}
                                                label="Pie derecho"
                                                suffix="cm"
                                                value={form.rightFootLength}
                                                onChange={(event) => update('rightFootLength', event.target.value)}
                                                required
                                            />
                                        </div>
                                        <p className="flex gap-2 text-sm leading-5 text-muted-foreground">
                                            <Info className="mt-0.5 size-4 shrink-0" />
                                            Apoya el talón contra una pared y mide hasta el dedo más largo. No añadimos
                                            márgenes inventados: usamos la longitud publicada por Mayoral.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field
                                                id={`${formId}-height`}
                                                label="Altura"
                                                suffix="cm"
                                                value={form.height}
                                                onChange={(event) => update('height', event.target.value)}
                                                required
                                            />
                                            {category === 'bottoms' ? (
                                                <Field
                                                    id={`${formId}-inseam`}
                                                    label="Entrepierna"
                                                    suffix="cm"
                                                    value={form.inseam}
                                                    onChange={(event) => update('inseam', event.target.value)}
                                                />
                                            ) : (
                                                <Field
                                                    id={`${formId}-chest`}
                                                    label="Contorno de pecho"
                                                    suffix="cm"
                                                    value={form.chest}
                                                    onChange={(event) => update('chest', event.target.value)}
                                                />
                                            )}
                                        </div>
                                        <p className="flex gap-2 text-sm leading-5 text-muted-foreground">
                                            <Info className="mt-0.5 size-4 shrink-0" />
                                            La altura decide primero. Cuando otra medida pide más espacio, recomendamos
                                            la opción más restrictiva y te enseñamos la alternativa.
                                        </p>
                                    </>
                                ))}

                            {method === 'age' && (
                                <div className="mx-auto max-w-sm space-y-4">
                                    <Field
                                        id={`${formId}-age`}
                                        label="Edad"
                                        suffix="años"
                                        type="number"
                                        min={2}
                                        max={16}
                                        step="0.5"
                                        value={form.age}
                                        onChange={(event) => update('age', event.target.value)}
                                        required
                                    />
                                    <p className="flex gap-2 text-sm leading-5 text-muted-foreground">
                                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                                        La edad solo orienta. Te pediremos confirmar la altura antes de considerar el
                                        resultado preciso.
                                    </p>
                                </div>
                            )}

                            <Separator />
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="ghost" onClick={() => setStep('method')}>
                                    <ArrowLeft /> Cambiar método
                                </Button>
                                <Button type="submit">
                                    <Sparkles /> Calcular recomendación
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'result' && result && status && (
                        <div className="space-y-5" aria-live="polite">
                            <div
                                className={cn(
                                    'rounded-ui border p-5',
                                    result.recommendedSize
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-warning/40 bg-warning-bg'
                                )}>
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                    <span
                                        className={cn(
                                            'flex size-24 shrink-0 flex-col items-center justify-center rounded-full border-4 shadow-ui',
                                            result.recommendedSize
                                                ? 'border-primary/20 bg-primary text-primary-foreground'
                                                : 'border-warning/30 bg-card text-card-foreground'
                                        )}>
                                        {result.recommendedSize ? (
                                            <>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                                                    Talla
                                                </span>
                                                <span className="text-3xl font-bold leading-none">
                                                    {result.recommendedSize}
                                                </span>
                                            </>
                                        ) : (
                                            <Ruler className="size-8" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant={
                                                    result.confidence === 'low' || result.confidence === 'none'
                                                        ? 'warning'
                                                        : 'success'
                                                }>
                                                {result.confidence !== 'none' && <Check />}
                                                {CONFIDENCE_COPY[result.confidence]}
                                            </Badge>
                                            {result.status === 'ideal_unavailable' && (
                                                <Badge variant="outline">Sin stock</Badge>
                                            )}
                                        </div>
                                        {result.alternativeSizes.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                {result.recommendedSize ? 'Alternativa' : 'Tallas a confirmar'}:{' '}
                                                <strong className="text-foreground">
                                                    {result.alternativeSizes.join(' / ')}
                                                </strong>
                                            </p>
                                        )}
                                        {result.missingMeasurements.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Para afinar: añade{' '}
                                                {result.missingMeasurements
                                                    .map(
                                                        (measurement) => MEASUREMENT_LABELS[measurement] || measurement
                                                    )
                                                    .join(' y ')}
                                                .
                                            </p>
                                        )}
                                        {canSelect && (
                                            <Button asChild>
                                                <Link to={selectableSize.href} onClick={() => setOpen(false)}>
                                                    Usar talla {result.recommendedSize}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <details className="group rounded-ui border border-border bg-card p-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                                    Cómo hemos llegado a esta recomendación
                                    <ChevronRight className="size-4 transition group-open:rotate-90" />
                                </summary>
                                <ul className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-sm leading-5 text-muted-foreground">
                                    {result.evidence.map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </details>

                            {!sizeAttribute && result.recommendedSize && (
                                <p className="flex gap-2 rounded-ui bg-muted p-3 text-xs leading-5 text-muted-foreground">
                                    <Info className="mt-0.5 size-4 shrink-0" />
                                    La recomendación es informativa: no encontramos el atributo de variación “
                                    {sizeAttributeId}” para seleccionar la talla automáticamente.
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                                <Button type="button" variant="ghost" onClick={reset}>
                                    <RotateCcw /> Empezar de nuevo
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setStep('form')}>
                                    Ajustar datos
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                        <ShieldCheck className="size-4" />
                        No guardamos ni enviamos las medidas introducidas.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function SizeGuide({
    title = 'Encuentra su talla ideal',
    description = 'Compara otra marca o usa sus medidas. Tardarás menos de un minuto.',
    buttonLabel = 'Recomendar talla',
    productKind = 'auto',
    audience = 'kids',
    collection,
    sizeAttributeId = 'size',
    enableBrandComparison = true,
    enableMeasurements = true,
    enableAge = true,
    product: productProp,
    className,
    regionId: _regionId,
    component: _component,
    componentData: _componentData,
    designMetadata: _designMetadata,
    data: _data,
    ...props
}: SizeGuideProps) {
    const contextProduct = useProduct();
    const product = productProp || contextProduct;
    const { isDesignMode, isPreviewMode } = usePageDesignerMode();

    if (!product) {
        if (!isDesignMode && !isPreviewMode) return null;
        return (
            <section
                {...props}
                className={cn(
                    'rounded-ui border border-dashed border-border bg-muted p-5 text-muted-foreground',
                    className
                )}>
                <div className="flex items-start gap-3">
                    <Shirt className="mt-0.5 size-5 shrink-0" />
                    <div>
                        <p className="font-medium text-foreground">Mayoral Size Guide</p>
                        <p className="mt-1 text-sm">
                            Previsualiza este componente desde una PDP para conectarlo al producto y a sus tallas.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const normalizedProductKind = normalizeOption(productKind, PRODUCT_KINDS, 'auto');
    const dialogStateKey = JSON.stringify({
        productId: product.id,
        category: resolveProductCategory(normalizedProductKind, product),
        productKind: normalizedProductKind,
        audience: normalizeOption(audience, AUDIENCES, 'kids'),
        collection: collection?.trim() || null,
        sizeAttributeId: (sizeAttributeId || 'size').trim().toLowerCase(),
        enableBrandComparison,
        enableMeasurements,
        enableAge,
    });

    return (
        <section {...props} className={className} data-slot="sfnext-toolkit-size-guide">
            <SizeGuideDialog
                key={dialogStateKey}
                product={product}
                title={title}
                description={description}
                buttonLabel={buttonLabel}
                productKind={productKind}
                audience={audience}
                collection={collection}
                sizeAttributeId={sizeAttributeId}
                enableBrandComparison={enableBrandComparison}
                enableMeasurements={enableMeasurements}
                enableAge={enableAge}
            />
        </section>
    );
}

export function SizeGuideFallback() {
    return <div className="h-28 animate-pulse rounded-ui border border-border bg-muted" aria-hidden="true" />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { SizeGuideFallback as fallback };
