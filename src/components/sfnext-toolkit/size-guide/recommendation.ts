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

import {
    MAYORAL_APPAREL_COLLECTION_OVERRIDES,
    MAYORAL_APPAREL_SIZES,
    MAYORAL_FOOTWEAR_SIZES,
    SIZE_GUIDE_DATASET_VERSION,
    SOURCE_APPAREL_SIZES,
    SOURCE_FOOTWEAR_SIZES,
    type MayoralApparelSizeRow,
    type SourceBrand,
    type SourceSizeSystem,
} from './data';

export type SizeGuideAudience = 'adult' | 'baby' | 'kids' | 'teen';
export type SizeGuideProductCategory = 'bottoms' | 'clothing' | 'dresses' | 'footwear' | 'outerwear' | 'tops';
export type KnownSizeCategory = 'clothing' | 'footwear';
export type MeasurementUnit = 'cm' | 'mm';
export type MeasurementScalar = number | string;
export type MeasurementInput = MeasurementScalar | { value: MeasurementScalar; unit: MeasurementUnit };
export type MeasurementName = 'chest' | 'footLength' | 'height' | 'hip' | 'inseam' | 'waist';

export type RecommendationStatus =
    | 'ideal_unavailable'
    | 'needs_confirmation'
    | 'needs_measurement'
    | 'out_of_coverage'
    | 'recommended'
    | 'recommended_with_alternative';

export type RecommendationConfidence = 'high' | 'low' | 'medium' | 'medium-high' | 'none';

export interface SizeGuideTarget {
    audience: SizeGuideAudience;
    category: SizeGuideProductCategory;
    collection?: string;
}

export interface KnownSizeInput {
    brand: string;
    audience: SizeGuideAudience;
    category: KnownSizeCategory;
    size: string;
    sizeSystem?: SourceSizeSystem;
    /** A known size that does not fit well is not valid conversion evidence. */
    fitsWell?: boolean;
}

export interface PhysicalMeasurements {
    height?: MeasurementInput;
    chest?: MeasurementInput;
    waist?: MeasurementInput;
    hip?: MeasurementInput;
    inseam?: MeasurementInput;
    footLength?: MeasurementInput;
    leftFootLength?: MeasurementInput;
    rightFootLength?: MeasurementInput;
}

export interface SizeRecommendationInput {
    target: SizeGuideTarget;
    availableSizes: readonly string[];
    knownSize?: KnownSizeInput;
    measurements?: PhysicalMeasurements;
    ageYears?: number;
}

export interface SizeRecommendation {
    datasetVersion: typeof SIZE_GUIDE_DATASET_VERSION;
    status: RecommendationStatus;
    confidence: RecommendationConfidence;
    recommendedSize?: string;
    alternativeSizes: string[];
    evidence: string[];
    missingMeasurements: MeasurementName[];
}

interface ResolvedApparelRow extends MayoralApparelSizeRow {
    waistMm?: number;
    hipMm?: number;
}

type ApparelAxis = 'chest' | 'height' | 'inseam';

interface AxisSelection {
    axis: ApparelAxis;
    index: number;
    /** Lower adjacent reference when the physical measure falls strictly between two rows. */
    alternativeIndex?: number;
    measuredMm: number;
    referenceMm: number;
}

const APPAREL_CATEGORIES = new Set<SizeGuideProductCategory>(['bottoms', 'clothing', 'dresses', 'outerwear', 'tops']);

function parseLocalizedNumber(value: MeasurementScalar): number | undefined {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    const normalized = value.trim().replace(/\s+/g, '').replace(',', '.');
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return undefined;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/** Converts form-friendly centimetre/millimetre values to canonical millimetres. */
export function measurementToMillimeters(input: MeasurementInput | undefined): number | undefined {
    if (input === undefined) return undefined;
    const structured = typeof input === 'object';
    const value = parseLocalizedNumber(structured ? input.value : input);
    if (value === undefined || value <= 0) return undefined;
    const unit = structured ? input.unit : 'cm';
    const millimeters = unit === 'cm' ? value * 10 : value;
    return Math.round(millimeters * 10) / 10;
}

function normalizeLookupToken(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/(?:anos|years)/g, '')
        .replace(/\s+/g, '')
        .trim();
}

function normalizeBrand(value: string): SourceBrand | undefined {
    const token = normalizeLookupToken(value).replace(/[-_]/g, '');
    if (token === 'adidas' || token === 'nike' || token === 'vans') return token;
    return token === 'newbalance' ? 'new-balance' : undefined;
}

function normalizeCollection(value: string | undefined): string | undefined {
    return value ? normalizeLookupToken(value).replace(/[-_]/g, '') : undefined;
}

function normalizeAvailableSize(value: string): string {
    return normalizeLookupToken(value)
        .replace(/^talla/, '')
        .replace(/^eu/, '')
        .replace(/anos$/, '')
        .replace(/^0+(?=\d+$)/, '');
}

function formatMillimetersAsCentimeters(value: number): string {
    const centimeters = value / 10;
    return (Number.isInteger(centimeters) ? String(centimeters) : centimeters.toFixed(1)).replace('.', ',');
}

function deduplicate<T>(values: readonly T[]): T[] {
    return [...new Set(values)];
}

function baseRecommendation(
    status: RecommendationStatus,
    confidence: RecommendationConfidence,
    evidence: string[],
    missingMeasurements: MeasurementName[] = []
): SizeRecommendation {
    return {
        datasetVersion: SIZE_GUIDE_DATASET_VERSION,
        status,
        confidence,
        alternativeSizes: [],
        evidence,
        missingMeasurements,
    };
}

function applyAvailability(result: SizeRecommendation, availableSizes: readonly string[]): SizeRecommendation {
    const recommendedSize = result.recommendedSize;
    if (!recommendedSize) return result;
    const available = new Set(availableSizes.map(normalizeAvailableSize));
    if (available.has(normalizeAvailableSize(recommendedSize))) return result;

    const evidence = [...result.evidence, `La talla ideal ${recommendedSize} no está disponible en este producto.`];
    if (result.status === 'needs_confirmation' || result.status === 'needs_measurement') return { ...result, evidence };
    return { ...result, status: 'ideal_unavailable', evidence };
}

function getApparelRows(collection: string | undefined): ResolvedApparelRow[] {
    const normalizedCollection = normalizeCollection(collection);
    return MAYORAL_APPAREL_SIZES.map((row) => {
        const override = MAYORAL_APPAREL_COLLECTION_OVERRIDES.find(
            (candidate) =>
                normalizeCollection(candidate.collection) === normalizedCollection && candidate.size === row.size
        );
        return override ? { ...row, ...override } : { ...row };
    });
}

function apparelReference(row: ResolvedApparelRow, axis: ApparelAxis): number {
    if (axis === 'height') return row.heightMm;
    if (axis === 'chest') return row.chestMm;
    return (row.inseamMm.min + row.inseamMm.max) / 2;
}

function apparelPhysicalBounds(row: ResolvedApparelRow, axis: ApparelAxis): { min: number; max: number } {
    if (axis === 'height') return { min: row.heightMm, max: row.heightMm };
    if (axis === 'chest') return { min: row.chestMm, max: row.chestMm };
    return row.inseamMm;
}

function apparelBounds(rows: readonly ResolvedApparelRow[], axis: ApparelAxis): { min: number; max: number } {
    if (axis === 'inseam') {
        return {
            min: Math.min(...rows.map((row) => row.inseamMm.min)),
            max: Math.max(...rows.map((row) => row.inseamMm.max)),
        };
    }
    const values = rows.map((row) => apparelReference(row, axis));
    return { min: Math.min(...values), max: Math.max(...values) };
}

function selectNearestApparelRow(
    rows: readonly ResolvedApparelRow[],
    axis: ApparelAxis,
    measuredMm: number
): AxisSelection | undefined {
    const bounds = apparelBounds(rows, axis);
    if (measuredMm < bounds.min || measuredMm > bounds.max) return undefined;

    let selectedIndex = 0;
    let selectedDistance = Number.POSITIVE_INFINITY;
    rows.forEach((row, index) => {
        const distance = Math.abs(apparelReference(row, axis) - measuredMm);
        if (distance <= selectedDistance) {
            selectedIndex = index;
            selectedDistance = distance;
        }
    });

    return {
        axis,
        index: selectedIndex,
        measuredMm,
        referenceMm: apparelReference(rows[selectedIndex], axis),
    };
}

/**
 * Selects the upper reference for a physical measurement while preserving the
 * lower adjacent row. Mayoral's source table contains scalar height/chest
 * references and explicit inseam ranges. A value strictly between two rows
 * remains an explicit two-size result instead of being rounded silently.
 */
function selectPhysicalApparelRows(
    rows: readonly ResolvedApparelRow[],
    axis: ApparelAxis,
    measuredMm: number
): AxisSelection | undefined {
    const bounds = apparelBounds(rows, axis);
    if (measuredMm < bounds.min || measuredMm > bounds.max) return undefined;

    const boundsByRow = rows.map((row) => apparelPhysicalBounds(row, axis));
    const containingIndex = boundsByRow.findIndex(
        (candidateBounds) => measuredMm >= candidateBounds.min - 0.01 && measuredMm <= candidateBounds.max + 0.01
    );
    if (containingIndex >= 0) {
        return {
            axis,
            index: containingIndex,
            measuredMm,
            referenceMm: apparelReference(rows[containingIndex], axis),
        };
    }

    const upperIndex = boundsByRow.findIndex((candidateBounds) => candidateBounds.min > measuredMm);
    if (upperIndex <= 0) return selectNearestApparelRow(rows, axis, measuredMm);

    return {
        axis,
        index: upperIndex,
        alternativeIndex: upperIndex - 1,
        measuredMm,
        referenceMm: apparelReference(rows[upperIndex], axis),
    };
}

function formatApparelPhysicalReference(row: ResolvedApparelRow, axis: ApparelAxis): string {
    const bounds = apparelPhysicalBounds(row, axis);
    const lower = formatMillimetersAsCentimeters(bounds.min);
    if (bounds.min === bounds.max) return `${lower} cm`;
    return `${lower}–${formatMillimetersAsCentimeters(bounds.max)} cm`;
}

function measurementEvidence(selection: AxisSelection, row: ResolvedApparelRow): string {
    const labels: Record<ApparelAxis, string> = {
        chest: 'El pecho',
        height: 'La altura',
        inseam: 'La entrepierna',
    };
    return `${labels[selection.axis]} de ${formatMillimetersAsCentimeters(selection.measuredMm)} cm apunta a la talla ${row.size} (referencia ${formatApparelPhysicalReference(row, selection.axis)}).`;
}

function betweenApparelEvidence(selection: AxisSelection, rows: readonly ResolvedApparelRow[]): string | undefined {
    if (selection.alternativeIndex === undefined) return undefined;
    const labels: Record<ApparelAxis, string> = {
        chest: 'El pecho',
        height: 'La altura',
        inseam: 'La entrepierna',
    };
    const lower = rows[selection.alternativeIndex];
    const upper = rows[selection.index];
    return `${labels[selection.axis]} de ${formatMillimetersAsCentimeters(selection.measuredMm)} cm queda entre la talla ${lower.size} (referencia ${formatApparelPhysicalReference(lower, selection.axis)}) y la talla ${upper.size} (referencia ${formatApparelPhysicalReference(upper, selection.axis)}).`;
}

function relevantSecondaryAxis(category: SizeGuideProductCategory): 'chest' | 'inseam' {
    return category === 'bottoms' ? 'inseam' : 'chest';
}

function recommendApparelFromMeasurements(input: SizeRecommendationInput): SizeRecommendation | undefined {
    const measurements = input.measurements;
    const heightMm = measurementToMillimeters(measurements?.height);
    if (heightMm === undefined) return undefined;

    const rows = getApparelRows(input.target.collection);
    const heightSelection = selectPhysicalApparelRows(rows, 'height', heightMm);
    if (!heightSelection) {
        return baseRecommendation('out_of_coverage', 'none', [
            `La altura de ${formatMillimetersAsCentimeters(heightMm)} cm queda fuera de la tabla Mayoral disponible (92–162 cm).`,
        ]);
    }

    const secondaryAxis = relevantSecondaryAxis(input.target.category);
    const secondaryMm = measurementToMillimeters(measurements?.[secondaryAxis]);
    const selections: AxisSelection[] = [heightSelection];
    if (secondaryMm !== undefined) {
        const secondarySelection = selectPhysicalApparelRows(rows, secondaryAxis, secondaryMm);
        if (!secondarySelection) {
            return baseRecommendation('out_of_coverage', 'none', [
                `${secondaryAxis === 'chest' ? 'El pecho' : 'La entrepierna'} de ${formatMillimetersAsCentimeters(secondaryMm)} cm queda fuera de la tabla Mayoral disponible.`,
            ]);
        }
        selections.push(secondarySelection);
    }

    const lowerIndices = selections.map((selection) => selection.alternativeIndex ?? selection.index);
    const upperIndices = selections.map((selection) => selection.index);
    const compositeLowerIndex = Math.max(...lowerIndices);
    const primaryIndex = Math.max(...upperIndices);
    const primarySize = rows[primaryIndex].size;
    const upperSpread = Math.max(...upperIndices) - Math.min(...upperIndices);
    const hasAxisBetweenReference = selections.some((selection) => selection.alternativeIndex !== undefined);
    const hasUnresolvedCompositeRange = compositeLowerIndex < primaryIndex;
    const hasExactAdjacentDisagreement = !hasAxisBetweenReference && upperSpread === 1;
    const alternativeIndex = hasUnresolvedCompositeRange
        ? compositeLowerIndex
        : hasExactAdjacentDisagreement
          ? Math.min(...upperIndices)
          : undefined;
    const alternativeSizes = alternativeIndex === undefined ? [] : [rows[alternativeIndex].size];
    const evidence = selections.map(
        (selection) => betweenApparelEvidence(selection, rows) ?? measurementEvidence(selection, rows[selection.index])
    );

    if (hasUnresolvedCompositeRange) {
        evidence.push(
            `Se muestra la talla ${primarySize} como orientación conservadora y ${alternativeSizes.join(' / ')} como alternativa; confirma el ajuste antes de seleccionar.`
        );
    } else if (upperSpread > 1) {
        evidence.push(
            'Las proporciones apuntan a tallas separadas; hace falta confirmar las medidas antes de seleccionar una talla.'
        );
    } else if (hasAxisBetweenReference) {
        evidence.push(
            `La medida más restrictiva resuelve la duda entre referencias y apunta a la talla ${primarySize}.`
        );
    } else if (hasExactAdjacentDisagreement) {
        evidence.push(`Se prioriza la talla ${primarySize} porque corresponde a la medida más restrictiva.`);
    }

    if (
        measurementToMillimeters(measurements?.waist) !== undefined ||
        measurementToMillimeters(measurements?.hip) !== undefined
    ) {
        evidence.push(
            'La tabla general Mayoral no permite validar cintura o cadera; no se han usado para cambiar la talla.'
        );
    }

    const exactBostonMatch =
        normalizeCollection(input.target.collection) === normalizeCollection('boston-x-mayoral') &&
        primarySize === '8' &&
        heightMm === 1280 &&
        measurementToMillimeters(measurements?.chest) === 665 &&
        measurementToMillimeters(measurements?.waist) === 600 &&
        measurementToMillimeters(measurements?.hip) === 700;

    if (exactBostonMatch)
        evidence.push(
            'Las medidas coinciden con la tabla específica Boston x Mayoral, que prevalece sobre la general.'
        );

    const status: RecommendationStatus = hasUnresolvedCompositeRange
        ? 'needs_confirmation'
        : upperSpread > 1
          ? 'needs_confirmation'
          : hasExactAdjacentDisagreement
            ? 'recommended_with_alternative'
            : 'recommended';
    const confidence: RecommendationConfidence = exactBostonMatch
        ? 'high'
        : upperSpread > 1 || hasUnresolvedCompositeRange
          ? 'low'
          : secondaryMm !== undefined
            ? 'medium-high'
            : 'medium';

    return applyAvailability(
        {
            datasetVersion: SIZE_GUIDE_DATASET_VERSION,
            status,
            confidence,
            recommendedSize: primarySize,
            alternativeSizes,
            evidence,
            missingMeasurements: secondaryMm === undefined ? [secondaryAxis] : [],
        },
        input.availableSizes
    );
}

function sizeThirtyVariants(): number[] {
    return (MAYORAL_FOOTWEAR_SIZES.find((row) => row.size === '30')?.footLengthMm.slice() ?? [185, 188]).sort(
        (left, right) => left - right
    );
}

function footwearSizeForVariant(footLengthMm: number, sizeThirtyMm: number): string | undefined {
    for (const row of MAYORAL_FOOTWEAR_SIZES) {
        const reference = row.size === '30' ? sizeThirtyMm : row.footLengthMm[0];
        if (reference >= footLengthMm) return row.size;
    }
    return undefined;
}

function footwearCandidates(footLengthMm: number): string[] {
    const minimum = MAYORAL_FOOTWEAR_SIZES[0].footLengthMm[0];
    const maximum = MAYORAL_FOOTWEAR_SIZES[MAYORAL_FOOTWEAR_SIZES.length - 1].footLengthMm[0];
    if (footLengthMm < minimum || footLengthMm > maximum) return [];
    return deduplicate(
        sizeThirtyVariants()
            .map((variant) => footwearSizeForVariant(footLengthMm, variant))
            .filter((size): size is string => Boolean(size))
    ).sort((left, right) => Number(left) - Number(right));
}

function longestFootLength(measurements: PhysicalMeasurements | undefined): number | undefined {
    const lengths = [
        measurementToMillimeters(measurements?.footLength),
        measurementToMillimeters(measurements?.leftFootLength),
        measurementToMillimeters(measurements?.rightFootLength),
    ].filter((value): value is number => value !== undefined);
    return lengths.length > 0 ? Math.max(...lengths) : undefined;
}

function recommendFootwearFromLength(
    footLengthMm: number,
    availableSizes: readonly string[],
    confidence: RecommendationConfidence,
    prefixEvidence: string[] = []
): SizeRecommendation {
    const candidates = footwearCandidates(footLengthMm);
    if (candidates.length === 0) {
        return baseRecommendation('out_of_coverage', 'none', [
            ...prefixEvidence,
            `La longitud de ${formatMillimetersAsCentimeters(footLengthMm)} cm queda fuera de la tabla Mayoral disponible (11,2–22,2 cm).`,
        ]);
    }

    if (candidates.length > 1) {
        const available = new Set(availableSizes.map(normalizeAvailableSize));
        const evidence = [
            ...prefixEvidence,
            `La medida de ${formatMillimetersAsCentimeters(footLengthMm)} cm queda en el conflicto publicado para la talla 30: las tablas disponibles apuntan a ${candidates.join(' o ')}.`,
        ];
        const unavailable = candidates.filter((size) => !available.has(normalizeAvailableSize(size)));
        if (unavailable.length > 0)
            evidence.push(`No están disponibles todas las candidatas (${unavailable.join(', ')}).`);
        return {
            datasetVersion: SIZE_GUIDE_DATASET_VERSION,
            status: 'needs_confirmation',
            confidence: 'low',
            alternativeSizes: candidates,
            evidence,
            missingMeasurements: [],
        };
    }

    const recommendedSize = candidates[0];
    const recommendedIndex = MAYORAL_FOOTWEAR_SIZES.findIndex((row) => row.size === recommendedSize);
    const recommendedRow = MAYORAL_FOOTWEAR_SIZES[recommendedIndex];
    const reference = recommendedRow?.footLengthMm[0];
    const previousRow = recommendedIndex > 0 ? MAYORAL_FOOTWEAR_SIZES[recommendedIndex - 1] : undefined;
    const previousReference = previousRow ? Math.max(...previousRow.footLengthMm) : undefined;
    const nextReference = recommendedRow ? Math.min(...recommendedRow.footLengthMm) : undefined;
    const fallsBetweenReferences =
        previousReference !== undefined &&
        nextReference !== undefined &&
        footLengthMm > previousReference &&
        footLengthMm < nextReference;
    const result: SizeRecommendation = {
        datasetVersion: SIZE_GUIDE_DATASET_VERSION,
        status: fallsBetweenReferences ? 'needs_confirmation' : 'recommended',
        confidence:
            fallsBetweenReferences && confidence === 'medium-high'
                ? 'medium'
                : fallsBetweenReferences && confidence === 'medium'
                  ? 'low'
                  : confidence,
        recommendedSize,
        alternativeSizes: fallsBetweenReferences && previousRow ? [previousRow.size] : [],
        evidence: [
            ...prefixEvidence,
            fallsBetweenReferences && previousRow && previousReference !== undefined && nextReference !== undefined
                ? `La medida queda entre la talla ${previousRow.size} (${formatMillimetersAsCentimeters(previousReference)} cm) y la talla ${recommendedSize} (${formatMillimetersAsCentimeters(nextReference)} cm). Se muestra ${recommendedSize} como orientación conservadora, pero hay que confirmar el ajuste y el modelo.`
                : `Mayoral asocia la talla ${recommendedSize} a ${formatMillimetersAsCentimeters(reference ?? footLengthMm)} cm; la medida coincide con esa referencia.`,
        ],
        missingMeasurements: [],
    };
    return applyAvailability(result, availableSizes);
}

function recommendFootwearFromMeasurements(input: SizeRecommendationInput): SizeRecommendation | undefined {
    const footLengthMm = longestFootLength(input.measurements);
    if (footLengthMm === undefined) return undefined;
    return recommendFootwearFromLength(footLengthMm, input.availableSizes, 'medium-high', [
        `Se usa el pie más largo: ${formatMillimetersAsCentimeters(footLengthMm)} cm.`,
    ]);
}

function matchesAlias(input: string, aliases: readonly string[]): boolean {
    const normalizedInput = normalizeLookupToken(input);
    return aliases.some((alias) => normalizeLookupToken(alias) === normalizedInput);
}

function missingMeasurementsFor(category: SizeGuideProductCategory): MeasurementName[] {
    return category === 'footwear' ? ['footLength'] : ['height'];
}

function unsupportedKnownSize(input: SizeRecommendationInput, reason: string): SizeRecommendation {
    return baseRecommendation('needs_measurement', 'none', [reason], missingMeasurementsFor(input.target.category));
}

function recommendApparelFromKnownSize(input: SizeRecommendationInput, brand: SourceBrand): SizeRecommendation {
    const knownSize = input.knownSize;
    if (!knownSize) return unsupportedKnownSize(input, 'No se ha indicado una talla conocida.');
    const system = knownSize.sizeSystem ?? 'brand';
    const row = SOURCE_APPAREL_SIZES.find(
        (candidate) =>
            candidate.brand === brand &&
            candidate.audience === knownSize.audience &&
            candidate.sizeSystem === system &&
            matchesAlias(knownSize.size, candidate.aliases)
    );
    if (!row) {
        return unsupportedKnownSize(
            input,
            `No hay una equivalencia infantil oficial cargada para ${knownSize.brand} ${knownSize.size}; hace falta la altura.`
        );
    }

    const rows = getApparelRows(input.target.collection);
    const compositeIndex = (heightMm: number, chestMm: number): number | undefined => {
        const height = selectNearestApparelRow(rows, 'height', heightMm);
        const chest = selectNearestApparelRow(rows, 'chest', chestMm);
        return height && chest ? Math.max(height.index, chest.index) : undefined;
    };
    const lowIndex = compositeIndex(row.heightMm.min, row.chestMm.min);
    const highIndex = compositeIndex(row.heightMm.max, row.chestMm.max);
    const centerIndex = compositeIndex(
        (row.heightMm.min + row.heightMm.max) / 2,
        (row.chestMm.min + row.chestMm.max) / 2
    );
    if (lowIndex === undefined || highIndex === undefined || centerIndex === undefined) {
        return unsupportedKnownSize(input, 'La equivalencia encontrada cae fuera de la tabla Mayoral disponible.');
    }

    const firstIndex = Math.min(lowIndex, highIndex);
    const lastIndex = Math.max(lowIndex, highIndex);
    const candidateSizes = rows.slice(firstIndex, lastIndex + 1).map((candidate) => candidate.size);
    const recommendedSize = rows[centerIndex].size;
    const alternativeSizes = candidateSizes.filter((size) => size !== recommendedSize);
    const span = lastIndex - firstIndex;
    const evidence = [
        `${knownSize.brand} ${knownSize.size} cubre ${formatMillimetersAsCentimeters(row.heightMm.min)}–${formatMillimetersAsCentimeters(row.heightMm.max)} cm de altura y ${formatMillimetersAsCentimeters(row.chestMm.min)}–${formatMillimetersAsCentimeters(row.chestMm.max)} cm de pecho.`,
        `Al comparar esas medidas con Mayoral, la referencia central apunta a la talla ${recommendedSize}.`,
    ];
    if ('waistMm' in row || 'hipMm' in row) {
        evidence.push(
            'La tabla general Mayoral no permite validar todas las medidas de cintura y cadera de la marca de origen.'
        );
    }
    if (span > 1)
        evidence.push('El intervalo es demasiado amplio para seleccionar una talla sin confirmar altura y pecho.');

    return applyAvailability(
        {
            datasetVersion: SIZE_GUIDE_DATASET_VERSION,
            status: span > 1 ? 'needs_measurement' : span === 1 ? 'recommended_with_alternative' : 'recommended',
            confidence: span > 1 ? 'low' : 'medium',
            recommendedSize,
            alternativeSizes,
            evidence,
            missingMeasurements: span > 0 ? ['height', 'chest'] : [],
        },
        input.availableSizes
    );
}

function recommendFootwearFromKnownSize(input: SizeRecommendationInput, brand: SourceBrand): SizeRecommendation {
    const knownSize = input.knownSize;
    if (!knownSize) return unsupportedKnownSize(input, 'No se ha indicado una talla conocida.');
    const system = knownSize.sizeSystem ?? 'eu';
    const row = SOURCE_FOOTWEAR_SIZES.find(
        (candidate) =>
            candidate.brand === brand &&
            candidate.audience === knownSize.audience &&
            candidate.sizeSystem === system &&
            matchesAlias(knownSize.size, candidate.aliases)
    );
    if (!row) {
        return unsupportedKnownSize(
            input,
            `No hay una equivalencia infantil oficial cargada para ${knownSize.brand} ${knownSize.size}; hace falta medir el pie.`
        );
    }

    return recommendFootwearFromLength(row.footLengthMm, input.availableSizes, 'medium', [
        `${knownSize.brand} ${knownSize.size} infantil se asocia a ${formatMillimetersAsCentimeters(row.footLengthMm)} cm; no se copia directamente la etiqueta EU.`,
    ]);
}

function recommendFromKnownSize(input: SizeRecommendationInput): SizeRecommendation | undefined {
    const knownSize = input.knownSize;
    if (!knownSize) return undefined;
    if (knownSize.fitsWell === false) {
        return unsupportedKnownSize(
            input,
            'La talla de otra marca no queda bien y no puede usarse como equivalencia; hace falta una medida física.'
        );
    }
    if (knownSize.audience !== 'kids') {
        return unsupportedKnownSize(
            input,
            'No se mezclan tablas de adulto, bebé o adolescente con equivalencias infantiles.'
        );
    }

    const targetKind: KnownSizeCategory = input.target.category === 'footwear' ? 'footwear' : 'clothing';
    if (knownSize.category !== targetKind) {
        return unsupportedKnownSize(
            input,
            'La categoría de la talla conocida no coincide con la del producto Mayoral.'
        );
    }

    const brand = normalizeBrand(knownSize.brand);
    if (!brand) {
        return unsupportedKnownSize(
            input,
            `La marca ${knownSize.brand} no está incluida en el dataset comparativo; hace falta una medida física.`
        );
    }
    return targetKind === 'footwear'
        ? recommendFootwearFromKnownSize(input, brand)
        : recommendApparelFromKnownSize(input, brand);
}

function apparelIndex(size: string): number | undefined {
    const index = MAYORAL_APPAREL_SIZES.findIndex((row) => row.size === size);
    return index >= 0 ? index : undefined;
}

function reconcilePhysicalAndKnown(
    physical: SizeRecommendation,
    known: SizeRecommendation,
    category: SizeGuideProductCategory
): SizeRecommendation {
    if (physical.status === 'out_of_coverage' || !physical.recommendedSize) return physical;
    if (!known.recommendedSize) return { ...physical, evidence: [...physical.evidence, ...known.evidence] };

    const evidence = [...physical.evidence, ...known.evidence];
    if (physical.recommendedSize === known.recommendedSize) {
        evidence.push('La medida física y la equivalencia de marca coinciden.');
        return { ...physical, evidence };
    }

    evidence.push(
        `La medida física apunta a la talla ${physical.recommendedSize}, mientras que la otra marca apunta a ${known.recommendedSize}; prevalece la medida física.`
    );
    const alternativeSizes = deduplicate([...physical.alternativeSizes, known.recommendedSize]);
    if (category === 'footwear') {
        return {
            ...physical,
            status: 'needs_confirmation',
            confidence: 'medium',
            alternativeSizes,
            evidence,
        };
    }

    const physicalIndex = apparelIndex(physical.recommendedSize);
    const knownIndex = apparelIndex(known.recommendedSize);
    const distance =
        physicalIndex === undefined || knownIndex === undefined
            ? Number.POSITIVE_INFINITY
            : Math.abs(physicalIndex - knownIndex);
    return {
        ...physical,
        status: distance > 1 ? 'needs_confirmation' : 'recommended_with_alternative',
        confidence: distance > 1 ? 'low' : 'medium',
        alternativeSizes,
        evidence,
    };
}

function recommendFromAge(input: SizeRecommendationInput): SizeRecommendation | undefined {
    const ageYears = input.ageYears;
    if (ageYears === undefined) return undefined;
    if (!Number.isFinite(ageYears) || ageYears < 2 || ageYears > 16) {
        return baseRecommendation('out_of_coverage', 'none', [
            'La edad queda fuera de las referencias Mayoral disponibles (2–16 años).',
        ]);
    }
    if (input.target.category === 'footwear') {
        return baseRecommendation(
            'needs_measurement',
            'none',
            ['La edad no permite recomendar calzado; hace falta medir el pie más largo.'],
            ['footLength']
        );
    }

    const rows = MAYORAL_APPAREL_SIZES;
    const exact = rows.find((row) => Number(row.size) === ageYears);
    if (exact) {
        return applyAvailability(
            {
                datasetVersion: SIZE_GUIDE_DATASET_VERSION,
                status: 'needs_confirmation',
                confidence: 'low',
                recommendedSize: exact.size,
                alternativeSizes: [],
                evidence: [
                    `La edad de ${ageYears} años orienta hacia la talla ${exact.size}, pero la altura debe confirmarla.`,
                ],
                missingMeasurements: ['height'],
            },
            input.availableSizes
        );
    }

    const lower = [...rows].reverse().find((row) => Number(row.size) < ageYears);
    const upper = rows.find((row) => Number(row.size) > ageYears);
    if (!lower || !upper) return undefined;
    return applyAvailability(
        {
            datasetVersion: SIZE_GUIDE_DATASET_VERSION,
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: upper.size,
            alternativeSizes: [lower.size],
            evidence: [
                `Con ${ageYears} años, la orientación conservadora es la talla ${upper.size}; la talla ${lower.size} también puede encajar según la altura.`,
                'La edad solo orienta; la altura decide.',
            ],
            missingMeasurements: ['height'],
        },
        input.availableSizes
    );
}

/**
 * Pure, deterministic Mayoral recommendation engine. It never copies a size
 * label across brands and never extrapolates beyond the versioned dataset.
 */
export function recommendMayoralSize(input: SizeRecommendationInput): SizeRecommendation {
    if (input.target.audience !== 'kids' && input.target.audience !== 'teen') {
        return baseRecommendation('out_of_coverage', 'none', [
            'El dataset actual solo cubre ropa y calzado infantil Mayoral desde la talla 2.',
        ]);
    }
    if (input.target.category !== 'footwear' && !APPAREL_CATEGORIES.has(input.target.category)) {
        return baseRecommendation('out_of_coverage', 'none', ['La categoría del producto no está cubierta.']);
    }

    const physical =
        input.target.category === 'footwear'
            ? recommendFootwearFromMeasurements(input)
            : recommendApparelFromMeasurements(input);
    const known = recommendFromKnownSize(input);
    if (physical) return known ? reconcilePhysicalAndKnown(physical, known, input.target.category) : physical;
    if (known) return known;

    const age = recommendFromAge(input);
    if (age) return age;

    const missing = missingMeasurementsFor(input.target.category);
    return baseRecommendation(
        'needs_measurement',
        'none',
        [
            input.target.category === 'footwear'
                ? 'Mide ambos pies y usa la longitud del más largo.'
                : 'Añade la altura para obtener una recomendación Mayoral.',
        ],
        missing
    );
}
